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

# ==========================================
#  CONFIGURACIÓN
# ==========================================
CSV_FILE = "https://www.emol.com/especiales/2025/nacional/elecciones/data/dip.csv"
DB_FILE = 'db.json'
POLL_API_URL = "https://dhondt.azurewebsites.net/api/encuestas"

# URLs Datos Reales
IMG_BASE_URL = "https://static.emol.cl/emol50/especiales/img/2025/elecciones/dip/"
URL_METADATA_JSON = "https://static.emol.cl/emol50/especiales/js/2025/elecciones/dbres.json"

INCENTIVE_PER_WOMAN = 500

# PACTOS PRINCIPALES (Se muestran desglosados en tarjetas)
MAIN_PACTS_IDS = ['C', 'B', 'I', 'J', 'K']

# ORDEN VISUAL HEMICICLO (Izquierda -> Derecha)
# C: Unidad, B: Verdes, X/Y: Indep, I: PDG, J: ChileVamos, K: Republicanos
PACTO_ORDER = ['C', 'B', 'X', 'Y', 'A', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K']

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
except: pass

POLL_DATA_ALL = {}
try:
    r = requests.get(POLL_API_URL, timeout=3)
    if r.status_code == 200: POLL_DATA_ALL = r.json()
except: pass

def normalize_string_aggressive(s):
    if not isinstance(s, str): return ""
    s = ''.join(c for c in unicodedata.normalize('NFD', s) if unicodedata.category(c) != 'Mn')
    return s.lower().strip()

# ==========================================
#  MOTOR D'HONDT (Cálculo de Escaños)
# ==========================================
def calculate_dhondt(candidates_list, parties_list, pacts_list, num_seats):
    # 1. Mapeos
    pact_votes = {p['_id']: p['votes'] for p in pacts_list}
    party_votes = {p['_id']: p['votes'] for p in parties_list}
    party_to_pact = {p['_id']: p['list_id'] for p in parties_list}
    
    party_candidates = defaultdict(list)
    for c in candidates_list:
        party_candidates[c['party_id']].append(c)
    
    for pid in party_candidates:
        party_candidates[pid].sort(key=lambda x: x['votes'], reverse=True)

    # 2. Asignación Pactos
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

    # 3. Asignación Partidos
    elected = []
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
#  DATOS REALES (Lógica Test D10 Replicada)
# ==========================================
def get_real_data_emol(distrito_num, preloaded_json=None):
    d_id = f"60{int(distrito_num):02d}"
    
    # 1. Descargar Votos XML (Fuente de la verdad)
    votos_map = {} 
    total_votos_xml = 0
    try:
        url_xml = f"https://www.emol.com/nacional/especiales/2025/presidenciales/dip_{d_id}.xml"
        r = requests.get(url_xml, headers={'User-Agent': 'Mozilla/5.0'}, timeout=4)
        if r.status_code == 200:
            raw = r.content.decode('utf-8-sig', errors='ignore').strip()
            if not raw.startswith('<'): raw = r.content.decode('latin-1', errors='ignore').strip()
            root = ET.fromstring(raw)
            for row in root.findall(".//ROW"):
                a, v = row.find('AMBITO'), row.find('VOTOS')
                if a is not None and v is not None:
                    k = a.text.strip()
                    val = int(v.text.replace('.', '')) if v.text else 0
                    if k == 'V': total_votos_xml = val
                    elif k.isdigit(): votos_map[k] = val
    except: pass

    # 2. Procesar Metadata JSON
    try:
        data = preloaded_json if preloaded_json else requests.get(URL_METADATA_JSON, timeout=5).json()
        pactos_ref = data.get('dbg', {}) 
        dist_data = data.get('dbdp', {}).get(d_id, {})
        
        # Cupos reales (Crítico para D'Hondt)
        real_seats = int(dist_data.get('q', 3)) 
        candidatos_raw = dist_data.get('c', {})
        
        cands, parties, pacts = [], {}, {}
        total_calc = 0

        for c_id_raw, val in candidatos_raw.items():
            c_id = str(c_id_raw).strip()
            
            # VOTOS DESDE XML (Exactamente como en el Test D10)
            votos = float(votos_map.get(c_id, 0))
            total_calc += votos
            
            p_letra = val.get('g', '?')
            p_nombre = pactos_ref.get(p_letra, f"Lista {p_letra}")
            
            # --- ACUMULACIÓN VOTOS PACTO (Ganadores + Perdedores) ---
            if p_letra not in pacts:
                pacts[p_letra] = Pact(p_letra, p_nombre, 0.0)
            pacts[p_letra].votes += votos

            # Datos Partido / Cupo
            p_sigla = val.get('p', 'IND')
            c_cupo = val.get('c')
            sigla_math = c_cupo if c_cupo else (f"IND_{c_id}" if p_sigla == "IND" else p_sigla)
            pid = f"{p_letra}-{sigla_math}"
            
            if pid not in parties:
                parties[pid] = Party(pid, sigla_math.replace(f"IND_{c_id}", "IND"), p_letra, 0.0)
            parties[pid].votes += votos
            
            id_foto = val.get('t')
            foto = f"{IMG_BASE_URL}{id_foto}.jpg" if id_foto else ""
            
            cands.append(Candidate(
                c_id, val.get('n', ''), pid, votos, 
                val.get('s','N/A'), 0.0, foto, p_sigla, p_letra, str(int(distrito_num))
            ))

        base = total_votos_xml if total_votos_xml > 0 else total_calc
        for c in cands: c.percentage = round((c.votes/base)*100, 2) if base > 0 else 0

        # Retornamos pacts (que trae la suma total)
        return {
            "candidates": [asdict(c) for c in cands], 
            "parties": [asdict(p) for p in parties.values()], 
            "pacts": [asdict(p) for p in pacts.values()], 
            "seats": real_seats
        }
    except:
        return {"candidates": [], "parties": [], "pacts": [], "seats": 3}

# --- SIMULACION ---
def get_simulation_data(distrito_num):
    try:
        df = pd.read_csv(CSV_FILE, encoding="utf-8")
    except:
        df = pd.read_csv(CSV_FILE, encoding="latin-1")
    d_code = int(f"60{int(distrito_num):02d}")
    df = df[pd.to_numeric(df['zona'], errors='coerce') == d_code].copy()
    if df.empty: return {"candidates": [], "parties": [], "pacts": [], "seats": 5}
    
    seats = int(DB_ZONAS.get(f"60{int(distrito_num):02d}", {}).get('q', 5)) if DB_ZONAS else 5
    poll = POLL_DATA_ALL.get(f"D{distrito_num}", [])
    poll_map = {normalize_string_aggressive(p['nombre']): p['votos'] for p in poll}
    s_keys = list(poll_map.keys())
    cands, parties, pacts = [], {}, {}
    df['nombre_norm'] = df['nombre'].apply(normalize_string_aggressive)

    for _, row in df.iterrows():
        matches = difflib.get_close_matches(row['nombre_norm'], s_keys, n=1, cutoff=0.8)
        votos = float(poll_map.get(matches[0], 0.0)) if matches else 0.0
        pid, partid = str(row['pacto']), str(row['partido'])
        photo = f"{IMG_BASE_URL}{int(row['id_foto'])}.jpg" if pd.notna(row.get('id_foto')) else ""

        if pid not in pacts: pacts[pid] = Pact(pid, PACTO_NOMBRES_LOCAL.get(pid, pid))
        pacts[pid].votes += votos

        pkey = f"{pid}-{partid}"
        if pkey not in parties: parties[pkey] = Party(pkey, PARTIDO_NOMBRES_LOCAL.get(partid, partid), pid)
        parties[pkey].votes += votos

        cands.append(Candidate(str(row['nombre_full']), row['nombre_full'], pkey, votos, row.get('sexo','N/A'), 0.0, photo, partid, pid, str(distrito_num)))

    return {"candidates": [asdict(c) for c in cands], "parties": [asdict(p) for p in parties.values()], "pacts": [asdict(p) for p in pacts.values()], "seats": seats}

# ==========================================
#  ENDPOINT NACIONAL (CORREGIDO)
# ==========================================
@app.route("/nacional")
def get_nacional_results():
    # Forzamos modo REAL para este endpoint (Hemiciclo Oficial)
    tipo = request.args.get('tipo', 'real') 
    all_elected = []
    
    # Acumulador Global (Votos de TODOS los candidatos)
    national_summary = defaultdict(lambda: {'votes': 0, 'seats': 0, 'name': ''})

    json_data = None
    try: json_data = requests.get(URL_METADATA_JSON, headers={'User-Agent': 'Mozilla/5.0'}, timeout=5).json()
    except: pass

    def process(i):
        d = str(i)
        # 1. Obtener datos completos (Candidatos + Totales de Pacto)
        if tipo == 'real':
            res = get_real_data_emol(d, preloaded_json=json_data)
        else:
            res = get_simulation_data(d)
        
        candidates = res['candidates']
        seats = res['seats']
        pacts_data = res['pacts'] # Aquí vienen los votos totales del distrito
        
        dist_elected = []
        if candidates:
            # Calcular Escaños
            dist_elected = calculate_dhondt(candidates, res['parties'], pacts_data, seats)
            
        return dist_elected, pacts_data

    # Barrido de 28 distritos
    with concurrent.futures.ThreadPoolExecutor(max_workers=14) as executor:
        results = executor.map(process, range(1, 29))
        
        for elected_list, pacts_list in results:
            all_elected.extend(elected_list)
            
            # ACUMULACIÓN VOTOS (Suma bruta real)
            for p in pacts_list:
                pid = p['_id']
                national_summary[pid]['votes'] += p['votes']
                # Guardar nombre si no existe
                if not national_summary[pid]['name']:
                    national_summary[pid]['name'] = p['name']

    # ACUMULACIÓN ESCAÑOS
    for c in all_elected:
        national_summary[c['pact_id']]['seats'] += 1

    # Ordenar Hemiciclo
    all_elected.sort(key=lambda c: PACTO_ORDER.index(c['pact_id']) if c['pact_id'] in PACTO_ORDER else 99)

    # --- GENERAR RESUMEN AGRUPADO ---
    final_summary = []
    # Bolsa para "Independientes" (X, Y)
    # indep_acc = {'id': 'indep', 'name': 'Independientes', 'votes': 0, 'seats': 0, 'color_key': 'X'}
    
    otros_acc = {'id': 'others', 'name': 'Otros Partidos', 'votes': 0, 'seats': 0, 'color_key': 'default'}

    for pid, stats in national_summary.items():
        if stats['votes'] > 0:
            # 1. Pactos Principales (Se muestran)
            if pid in MAIN_PACTS_IDS:
                final_summary.append({
                    "id": pid,
                    "name": stats['name'],
                    "votes": stats['votes'],
                    "seats": stats['seats']
                })
            # 2. Independientes (X, Y)
            # elif pid in ['X', 'Y']:
            #     indep_acc['votes'] += stats['votes']
            #     indep_acc['seats'] += stats['seats']
            # # 3. Resto (A, D, E, etc) -> Otros
            else:
                otros_acc['votes'] += stats['votes']
                otros_acc['seats'] += stats['seats']
    
    # Agregar bolsas si tienen votos
    # if indep_acc['votes'] > 0: final_summary.append(indep_acc)
    if otros_acc['votes'] > 0: final_summary.append(otros_acc)

    # Ordenar Resumen por Escaños
    final_summary.sort(key=lambda x: x['seats'], reverse=True)

    return jsonify({
        "total": len(all_elected),
        "diputados": all_elected,
        "resumen": final_summary
    })

# --- ENDPOINTS DISTRITALES ---
@app.route("/candidatos")
def route_candidatos():
    d = request.args.get('distrito')
    t = request.args.get('tipo', 'simulacion')
    if not d: return jsonify({"error": "Falta distrito"}), 400
    # Retorno plano
    data = get_real_data_emol(d) if t == 'real' else get_simulation_data(d)
    return jsonify(data)

@app.route("/dhondt")
def route_dhondt():
    d = request.args.get('distrito')
    t = request.args.get('tipo', 'simulacion')
    
    # Llamada directa
    data = get_real_data_emol(d) if t == 'real' else get_simulation_data(d)
    seats = data.get('seats', 5)

    if not data['candidates']: return jsonify({"elected": [], "cupos_distrito": seats})

    elected = calculate_dhondt(data['candidates'], data['parties'], data['pacts'], seats)
    return jsonify({"elected": elected, "cupos_distrito": seats, "fuente": t})

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)