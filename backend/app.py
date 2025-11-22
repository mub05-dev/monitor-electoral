import pandas as pd
import json
import difflib
import os
import unicodedata
import requests
import xml.etree.ElementTree as ET
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

    elected = []

    # 3. Asignación Partidos
    for pact_id, seats_won in seats_per_pact.items():
        parties_in_pact = [pid for pid, lid in party_to_pact.items() if lid == pact_id]
        quotients_parties = []
        
        for party_id in parties_in_pact:
            pvotes = party_votes.get(party_id, 0)
            if pvotes > 0:
                cands_count = len(party_candidates.get(party_id, []))
                limit = max(seats_won, cands_count) 
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

    final_list = [asdict(c) if not isinstance(c, dict) else c for c in elected]
    final_list.sort(key=lambda x: x['votes'], reverse=True)
    return final_list

# ==========================================
#  LÓGICA DATOS REALES (CORREGIDA XML + JSON)
# ==========================================
def get_real_data_emol(distrito_num):
    distrito_id = f"60{int(distrito_num):02d}"
    url_xml = f"https://www.emol.com/nacional/especiales/2025/presidenciales/dip_{distrito_id}.xml"
    headers = {'User-Agent': 'Mozilla/5.0'}

    # 1. OBTENER VOTOS DEL XML (Fuente real de votos)
    votos_map = {} 
    total_votos_xml = 0
    try:
        r_xml = requests.get(url_xml, headers=headers, timeout=4)
        if r_xml.status_code == 200:
            # Limpiar posibles caracteres raros al inicio del XML
            raw_xml = r_xml.content.decode('utf-8-sig', errors='ignore').strip()
            if not raw_xml.startswith('<'): 
                 raw_xml = r_xml.content.decode('latin-1', errors='ignore').strip()
                 
            root = ET.fromstring(raw_xml)
            for row in root.findall(".//ROW"):
                ambito = row.find('AMBITO')
                votos_tag = row.find('VOTOS')
                
                if ambito is not None and votos_tag is not None:
                    key = ambito.text.strip()
                    if votos_tag.text:
                        val = int(votos_tag.text.replace('.', ''))
                        if key == 'V':
                            total_votos_xml = val
                        elif key.isdigit():
                            votos_map[key] = val
    except Exception as e:
        print(f"Error XML: {e}")

    # 2. OBTENER METADATOS DEL JSON (Nombres, Pactos, IDs Foto)
    try:
        r = requests.get(URL_METADATA_JSON, headers=headers, timeout=5)
        data = r.json()
        
        pactos_ref = data.get('dbg', {}) 
        distrito_data = data.get('dbdp', {}).get(distrito_id, {})
        candidatos_raw = distrito_data.get('c', {})
        
        candidates_list = []
        parties_map = {}
        pacts_map = {}
        
        total_votes_calc = 0

        for c_id_raw, val in candidatos_raw.items():
            c_id = str(c_id_raw).strip() # ID del candidato (Key en JSON)
            
            # Metadatos
            nombre = val.get('n', 'Desconocido')
            partido_sigla = val.get('p', 'IND') 
            cupo_sigla = val.get('c')           
            pacto_letra = val.get('g', '?') 
            genero = val.get('s', 'N/A')
            
            # FOTO: Usamos propiedad 't' del JSON
            id_foto = val.get('t') 
            if id_foto:
                foto_url = f"{IMG_BASE_URL}{id_foto}.jpg"
            else:
                foto_url = "" # O placeholder

            # VOTOS: Usamos el mapa del XML (Si no está, es 0)
            votos = float(votos_map.get(c_id, 0))
            total_votes_calc += votos
            
            pacto_nombre = pactos_ref.get(pacto_letra, f"Lista {pacto_letra}")

            # --- Agrupación Pactos ---
            if pacto_letra not in pacts_map:
                pacts_map[pacto_letra] = Pact(pacto_letra, pacto_nombre, 0.0)
            pacts_map[pacto_letra].votes += votos

            # --- Agrupación Partidos (Lógica Cupos) ---
            sigla_matematica = cupo_sigla if cupo_sigla else partido_sigla
            if partido_sigla == "IND" and not cupo_sigla:
                 sigla_matematica = f"IND_{c_id}" # Independiente puro

            partido_unico_id = f"{pacto_letra}-{sigla_matematica}"
            
            if partido_unico_id not in parties_map:
                parties_map[partido_unico_id] = Party(
                    _id=partido_unico_id, 
                    name=sigla_matematica if "IND_" not in sigla_matematica else "IND",   
                    list_id=pacto_letra, 
                    votes=0.0
                )
            parties_map[partido_unico_id].votes += votos

            candidates_list.append(Candidate(
                _id=c_id,
                name=nombre,
                party_id=partido_unico_id,
                votes=votos,
                gender=genero,
                photo_url=foto_url, # Foto correcta desde 't'
                display_party=partido_sigla
            ))

        # Porcentajes
        base_total = total_votos_xml if total_votos_xml > 0 else total_votes_calc
        for c in candidates_list:
            if base_total > 0:
                c.percentage = round((c.votes / base_total) * 100, 2)
        
        return {
            "candidates": [asdict(c) for c in candidates_list],
            "parties": [asdict(p) for p in parties_map.values()],
            "pacts": [asdict(p) for p in pacts_map.values()]
        }

    except Exception as e:
        print(f"ERROR procesando JSON: {e}")
        return {"candidates": [], "parties": [], "pacts": []}

# ==========================================
#  LÓGICA SIMULACIÓN
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
        votes = float(poll_map.get(matches[0], 0.0)) if matches else 0.0
        
        pid = str(row['pacto'])
        partid_raw = str(row['partido'])
        
        # Foto Simulación (Desde columna CSV)
        photo_url = ""
        if pd.notna(row.get('id_foto')):
            try:
                photo_url = f"{IMG_BASE_URL}{int(row['id_foto'])}.jpg"
            except: pass

        if pid not in pacts:
            pacts[pid] = Pact(pid, PACTO_NOMBRES_LOCAL.get(pid, pid))
        pacts[pid].votes += votes

        partido_key = f"{pid}-{partid_raw}"
        if partido_key not in parties:
            parties[partido_key] = Party(partido_key, PARTIDO_NOMBRES_LOCAL.get(partid_raw, partid_raw), pid)
        parties[partido_key].votes += votes

        cands.append(Candidate(
            str(row['nombre_full']), row['nombre_full'], partido_key, votes,
            row.get('sexo', 'N/A'), 0.0, photo_url, partid_raw
        ))

    return {
        "candidates": [asdict(c) for c in cands],
        "parties": [asdict(p) for p in parties.values()],
        "pacts": [asdict(p) for p in pacts.values()]
    }

# --- ENDPOINTS ---
@app.route("/candidatos")
def route_candidatos():
    d = request.args.get('distrito')
    t = request.args.get('tipo', 'simulacion')
    if not d: return jsonify({"error": "Falta distrito"}), 400
    data = get_real_data_emol(d) if t == 'real' else get_simulation_data(d)
    return jsonify(data)

@app.route("/dhondt")
def route_dhondt():
    d = request.args.get('distrito')
    t = request.args.get('tipo', 'simulacion')
    if not d: return jsonify({"error": "Falta distrito"}), 400

    seats = 5
    try:
        key = f"60{int(d):02d}"
        seats = int(DB_ZONAS.get(key, {}).get('q', 5))
    except: pass

    data = get_real_data_emol(d) if t == 'real' else get_simulation_data(d)
    
    if not data['candidates']:
        return jsonify({"elected": [], "cupos_distrito": seats})

    # Cálculo Matemático SIEMPRE
    elected_list = calculate_dhondt(data['candidates'], data['parties'], data['pacts'], seats)
    
    return jsonify({
        "elected": elected_list,
        "cupos_distrito": seats,
        "fuente": t
    })

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)