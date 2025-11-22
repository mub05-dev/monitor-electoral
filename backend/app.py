import pandas as pd
import json
import difflib
import os
import unicodedata
import requests
import xml.etree.ElementTree as ET
import concurrent.futures
from flask import Flask, jsonify, request
from flask_cors import CORS
from dataclasses import dataclass, asdict
from collections import defaultdict

app = Flask(__name__)
CORS(app)

# --- CONFIGURACIÓN ---
CSV_FILE = "https://www.emol.com/especiales/2025/nacional/elecciones/data/dip.csv"
DB_FILE = 'db.json'
POLL_API_URL = "https://dhondt.azurewebsites.net/api/encuestas"
IMG_BASE_URL = "https://static.emol.cl/emol50/especiales/img/2025/elecciones/dip/"
URL_METADATA_JSON = "https://static.emol.cl/emol50/especiales/js/2025/elecciones/dbres.json"

INCENTIVE_PER_WOMAN = 500

# --- ORDEN DEL HEMICICLO (AJUSTADO A TU IMAGEN) ---
# Izquierda -> Derecha
# C: Unidad por Chile
# B: Verdes y Regionalistas
# A, D, E, F, G, H, X, Y: Independientes y Otros partidos chicos (Al centro-izquierda)
# I: Partido de la Gente (Centro-Derecha)
# J: Chile Grande y Unido
# K: Cambio por Chile
PACTO_ORDER = ['C', 'B', 'A', 'D', 'E', 'F', 'G', 'H', 'X', 'Y', 'I', 'J', 'K']

@dataclass
class Candidate:
    _id: str
    name: str
    party_id: str       
    votes: float = 0.0
    gender: str = "N/A"
    percentage: float = 0.0
    photo_url: str = ""
    display_party: str = "" 
    pact_id: str = ""
    distrito_num: str = ""

@dataclass
class Party:
    _id: str
    name: str
    list_id: str
    votes: float = 0.0

@dataclass
class Pact:
    _id: str
    name: str
    votes: float = 0.0

# --- CARGA DATOS LOCALES ---
DB_ZONAS, PACTO_NOMBRES_LOCAL, PARTIDO_NOMBRES_LOCAL = {}, {}, {}
try:
    if os.path.exists(DB_FILE):
        with open(DB_FILE, 'r', encoding='utf-8') as f:
            db_data = json.load(f)
        DB_ZONAS = db_data.get("dbzonas", {})
        PACTO_NOMBRES_LOCAL = db_data.get("dbpactos", {})
        PARTIDO_NOMBRES_LOCAL = db_data.get("dbpartidos", {})
except Exception as e:
    print(f"WARN: No se cargó DB local: {e}")

# --- CACHE ENCUESTAS ---
POLL_DATA_ALL = {}
try:
    r = requests.get(POLL_API_URL, timeout=3)
    if r.status_code == 200: POLL_DATA_ALL = r.json()
except: pass

# --- UTILIDADES ---
def normalize_string_aggressive(s):
    if not isinstance(s, str): return ""
    s = ''.join(c for c in unicodedata.normalize('NFD', s) if unicodedata.category(c) != 'Mn')
    return s.lower().strip()

# ==========================================
#  ALGORITMO D'HONDT
# ==========================================
def calculate_dhondt(candidates_list, parties_list, pacts_list, num_seats):
    pact_votes = {p['_id']: p['votes'] for p in pacts_list}
    party_votes = {p['_id']: p['votes'] for p in parties_list}
    party_to_pact = {p['_id']: p['list_id'] for p in parties_list}
    
    party_candidates = defaultdict(list)
    for c in candidates_list:
        party_candidates[c['party_id']].append(c)
    
    for pid in party_candidates:
        party_candidates[pid].sort(key=lambda x: x['votes'], reverse=True)

    # 1. Pactos
    quotients_pacts = []
    for pid, votes in pact_votes.items():
        if votes > 0:
            for i in range(1, num_seats + 1):
                quotients_pacts.append((votes/i, pid))
    
    quotients_pacts.sort(key=lambda x: x[0], reverse=True)
    winning_pacts = quotients_pacts[:num_seats]
    
    seats_per_pact = defaultdict(int)
    for _, pid in winning_pacts:
        seats_per_pact[pid] += 1

    elected = []

    # 2. Partidos
    for pact_id, seats_won in seats_per_pact.items():
        parties_in_pact = [pid for pid, lid in party_to_pact.items() if lid == pact_id]
        quotients_parties = []
        for party_id in parties_in_pact:
            pvotes = party_votes.get(party_id, 0)
            if pvotes > 0:
                c_count = len(party_candidates.get(party_id, []))
                limit = max(seats_won, c_count) 
                for i in range(1, limit + 1):
                    quotients_parties.append((pvotes/i, party_id, i-1))
        
        quotients_parties.sort(key=lambda x: x[0], reverse=True)
        seats_assigned = 0
        for _, party_id, cand_idx in quotients_parties:
            if seats_assigned >= seats_won: break
            cands = party_candidates.get(party_id, [])
            if cand_idx < len(cands):
                candidate = cands[cand_idx]
                if candidate not in elected:
                    elected.append(candidate)
                    seats_assigned += 1

    final = [asdict(c) if not isinstance(c, dict) else c for c in elected]
    final.sort(key=lambda x: x['votes'], reverse=True)
    return final

# ==========================================
#  DATOS REALES
# ==========================================
def get_real_data_emol(distrito_num, preloaded_json=None):
    distrito_id = f"60{int(distrito_num):02d}"
    url_xml = f"https://www.emol.com/nacional/especiales/2025/presidenciales/dip_{distrito_id}.xml"
    headers = {'User-Agent': 'Mozilla/5.0'}

    # 1. XML VOTOS
    votos_map = {} 
    total_votos_xml = 0
    try:
        r_xml = requests.get(url_xml, headers=headers, timeout=4)
        if r_xml.status_code == 200:
            raw = r_xml.content.decode('utf-8-sig', errors='ignore').strip()
            if not raw.startswith('<'): raw = r_xml.content.decode('latin-1', errors='ignore').strip()
            root = ET.fromstring(raw)
            for row in root.findall(".//ROW"):
                amb = row.find('AMBITO')
                vts = row.find('VOTOS')
                if amb is not None and vts is not None:
                    k = amb.text.strip()
                    v = int(vts.text.replace('.', '')) if vts.text else 0
                    if k == 'V': total_votos_xml = v
                    elif k.isdigit(): votos_map[k] = v
    except: pass

    # 2. JSON METADATA
    try:
        data = preloaded_json if preloaded_json else requests.get(URL_METADATA_JSON, headers=headers, timeout=5).json()
        
        pactos_ref = data.get('dbg', {}) 
        dist_data = data.get('dbdp', {}).get(distrito_id, {})
        candidatos_raw = dist_data.get('c', {})
        
        cands, parties, pacts = [], {}, {}
        total_calc = 0

        for c_id_raw, val in candidatos_raw.items():
            c_id = str(c_id_raw).strip()
            
            nombre = val.get('n', 'Desconocido')
            partido_sigla = val.get('p', 'IND') 
            cupo = val.get('c')           
            pacto_letra = val.get('g', '?') 
            genero = val.get('s', 'N/A')
            
            id_foto = val.get('t') 
            foto_url = f"{IMG_BASE_URL}{id_foto}.jpg" if id_foto else ""

            votos = float(votos_map.get(c_id, 0))
            total_calc += votos

            pacto_nombre = pactos_ref.get(pacto_letra, f"Lista {pacto_letra}")

            if pacto_letra not in pacts:
                pacts[pacto_letra] = Pact(pacto_letra, pacto_nombre, 0.0)
            pacts[pacto_letra].votes += votos

            # Lógica Cupo
            sigla_math = cupo if cupo else (f"IND_{c_id}" if partido_sigla == "IND" else partido_sigla)
            pid = f"{pacto_letra}-{sigla_math}"
            
            if pid not in parties:
                parties[pid] = Party(pid, sigla_math if "IND_" not in sigla_math else "IND", pacto_letra, 0.0)
            parties[pid].votes += votos

            cands.append(Candidate(
                _id=c_id,
                name=nombre,
                party_id=pid,
                votes=votos,
                gender=genero,
                photo_url=foto_url,
                display_party=partido_sigla,
                pact_id=pacto_letra,
                distrito_num=str(int(distrito_num))
            ))
        
        base = total_votos_xml if total_votos_xml > 0 else total_calc
        for c in cands:
            c.percentage = round((c.votes/base)*100, 2) if base > 0 else 0

        return {"candidates": [asdict(c) for c in cands], "parties": [asdict(p) for p in parties.values()], "pacts": [asdict(p) for p in pacts.values()]}
    except Exception as e:
        print(f"Error JSON: {e}")
        return {"candidates": [], "parties": [], "pacts": []}

# ==========================================
#  SIMULACIÓN
# ==========================================
def get_simulation_data(distrito_num):
    try:
        df = pd.read_csv(CSV_FILE, encoding="utf-8")
    except:
        df = pd.read_csv(CSV_FILE, encoding="latin-1")
    
    d_code = int(f"60{int(distrito_num):02d}")
    df = df[pd.to_numeric(df['zona'], errors='coerce') == d_code].copy()
    if df.empty: return {"candidates": [], "parties": [], "pacts": []}

    poll = POLL_DATA_ALL.get(f"D{distrito_num}", [])
    poll_map = {normalize_string_aggressive(p['nombre']): p['votos'] for p in poll}
    survey_keys = list(poll_map.keys())

    cands, parties, pacts = [], {}, {}
    df['nombre_norm'] = df['nombre'].apply(normalize_string_aggressive)

    for _, row in df.iterrows():
        matches = difflib.get_close_matches(row['nombre_norm'], survey_keys, n=1, cutoff=0.8)
        votos = float(poll_map.get(matches[0], 0.0)) if matches else 0.0
        
        pid = str(row['pacto'])
        partid_raw = str(row['partido'])
        
        photo = ""
        if pd.notna(row.get('id_foto')):
             try: photo = f"{IMG_BASE_URL}{int(row['id_foto'])}.jpg"
             except: pass

        if pid not in pacts: pacts[pid] = Pact(pid, PACTO_NOMBRES_LOCAL.get(pid, pid))
        pacts[pid].votes += votos

        pkey = f"{pid}-{partid_raw}"
        if pkey not in parties: parties[pkey] = Party(pkey, PARTIDO_NOMBRES_LOCAL.get(partid_raw, partid_raw), pid)
        parties[pkey].votes += votos

        cands.append(Candidate(
            str(row['nombre_full']), row['nombre_full'], pkey, votos, 
            row.get('sexo', 'N/A'), 0.0, photo, partid_raw, pid,
            distrito_num=str(distrito_num)
        ))

    return {"candidates": [asdict(c) for c in cands], "parties": [asdict(p) for p in parties.values()], "pacts": [asdict(p) for p in pacts.values()]}

# --- ENDPOINTS ---

@app.route("/nacional")
def get_nacional_results():
    # Solo Real para el Hemiciclo
    all_elected = []
    
    json_data = None
    try:
        headers = {'User-Agent': 'Mozilla/5.0'}
        r = requests.get(URL_METADATA_JSON, headers=headers, timeout=5)
        json_data = r.json()
    except: pass

    def process(i):
        d = str(i)
        d_code = f"60{i:02d}"
        seats = 3
        if DB_ZONAS: seats = int(DB_ZONAS.get(d_code, {}).get('q', 3))
        
        data = get_real_data_emol(d, preloaded_json=json_data)
            
        if data['candidates']:
            return calculate_dhondt(data['candidates'], data['parties'], data['pacts'], seats)
        return []

    with concurrent.futures.ThreadPoolExecutor(max_workers=14) as executor:
        results = executor.map(process, range(1, 29))
        for res in results: all_elected.extend(res)

    # Ordenar por espectro (Usando PACTO_ORDER definido arriba)
    all_elected.sort(key=lambda c: PACTO_ORDER.index(c['pact_id']) if c['pact_id'] in PACTO_ORDER else 99)

    return jsonify({"total": len(all_elected), "diputados": all_elected})

@app.route("/candidatos")
def route_candidatos():
    d = request.args.get('distrito')
    t = request.args.get('tipo', 'simulacion')
    if not d: return jsonify({"error": "Falta distrito"}), 400
    return jsonify(get_real_data_emol(d) if t == 'real' else get_simulation_data(d))

@app.route("/dhondt")
def route_dhondt():
    d = request.args.get('distrito')
    t = request.args.get('tipo', 'simulacion')
    if not d: return jsonify({"error": "Falta distrito"}), 400

    seats = 5
    try: seats = int(DB_ZONAS.get(f"60{int(d):02d}", {}).get('q', 5))
    except: pass

    data = get_real_data_emol(d) if t == 'real' else get_simulation_data(d)
    if not data['candidates']: return jsonify({"elected": [], "cupos_distrito": seats})

    elected = calculate_dhondt(data['candidates'], data['parties'], data['pacts'], seats)
    return jsonify({"elected": elected, "cupos_distrito": seats, "fuente": t})

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)