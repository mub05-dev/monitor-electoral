import pandas as pd
import json
import difflib
import os
import unicodedata
import requests
import xml.etree.ElementTree as ET
import concurrent.futures
import jwt
import datetime
from functools import wraps
from flask import Flask, jsonify, request
from flask_cors import CORS
from dataclasses import dataclass, asdict
from collections import defaultdict

app = Flask(__name__)
CORS(app)
app.config['SECRET_KEY'] = 'tu_clave_secreta_super_segura_2025'


CSV_FILE = "https://www.emol.com/especiales/2025/nacional/elecciones/data/dip.csv"
DB_FILE = 'db.json'
POLL_API_URL = "https://dhondt.azurewebsites.net/api/encuestas"


IMG_BASE_URL = "https://static.emol.cl/emol50/especiales/img/2025/elecciones/dip/"
URL_METADATA_JSON = "https://static.emol.cl/emol50/especiales/js/2025/elecciones/dbres.json"

INCENTIVE_PER_WOMAN = 500

MAIN_PACTS_IDS = ['C', 'B', 'I', 'J', 'K']


PACTO_ORDER = ['C', 'B', 'X', 'Y', 'A', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K']

USERS_DB = {
    "admin": "admin123",
    "analista": "datos2025"
}


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


DB_ZONAS, PACTO_NOMBRES_LOCAL, PARTIDO_NOMBRES_LOCAL = {}, {}, {}
try:
    if os.path.exists(DB_FILE):
        with open(DB_FILE, 'r', encoding='utf-8') as f:
            db_data = json.load(f)
        DB_ZONAS = db_data.get("dbzonas", {})
        PACTO_NOMBRES_LOCAL = db_data.get("dbpactos", {})
        PARTIDO_NOMBRES_LOCAL = db_data.get("dbpartidos", {})
except:
    pass

POLL_DATA_ALL = {}
try:
    r = requests.get(POLL_API_URL, timeout=3)
    if r.status_code == 200:
        POLL_DATA_ALL = r.json()
except:
    pass


def normalize_string_aggressive(s):
    if not isinstance(s, str):
        return ""
    s = ''.join(c for c in unicodedata.normalize(
        'NFD', s) if unicodedata.category(c) != 'Mn')
    return s.lower().strip()

SCENARIOS = {
    "derecha_unida": {
        "new_id": "SC_DER",
        "new_name": "Gran Pacto Derecha",
        "merge_ids": ["J", "K"],
        "color_ref": "K"
    },
    "izquierda_unida": {
        "new_id": "SC_IZQ",
        "new_name": "Gran Pacto Izquierda",
       
       
        "merge_ids": ["A", "B", "C", "D", "F", "G", "H"],
        "color_ref": "C" 
    }
}


def apply_scenario_logic(data, scenario_key):
    """
    Recibe la data cruda de un distrito y fusiona pactos según el escenario.
    Retorna la data modificada lista para el cálculo D'Hondt.
    """
    if not scenario_key or scenario_key not in SCENARIOS:
        return data

    sc = SCENARIOS[scenario_key]
    target_ids = set(sc['merge_ids'])
    new_pact_id = sc['new_id']

    # 1. Crear el "Super Pacto" acumulador
    super_pact = Pact(new_pact_id, sc['new_name'], 0.0)

    clean_pacts = []

    # 2. Sumar votos de los pactos a fusionar
    for p in data['pacts']:
        if p['_id'] in target_ids:
            super_pact.votes += p['votes']
        else:
            clean_pacts.append(p)  # Los que no se fusionan pasan igual

    # Solo agregamos el super pacto si tiene votos
    if super_pact.votes > 0:
        clean_pacts.append(asdict(super_pact))

    # 3. Mover Partidos al nuevo Pacto (Vital para D'Hondt)
    for party in data['parties']:
        if party['list_id'] in target_ids:
            party['list_id'] = new_pact_id

    # 4. Mover Candidatos al nuevo Pacto
    for cand in data['candidates']:
        if cand['pact_id'] in target_ids:
            cand['pact_id'] = new_pact_id

    # Actualizamos la estructura de datos
    data['pacts'] = clean_pacts
    return data



@app.route('/login', methods=['POST'])
def login():
    auth_data = request.get_json()

    if not auth_data or not auth_data.get('username') or not auth_data.get('password'):
        return jsonify({'error': 'Faltan credenciales'}), 401

    username = auth_data.get('username')
    password = auth_data.get('password')

    
    if username in USERS_DB and USERS_DB[username] == password:
       
        token = jwt.encode({
            'user': username,
            'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=24)
        }, app.config['SECRET_KEY'], algorithm="HS256")

        return jsonify({'token': token, 'username': username})

    return jsonify({'error': 'Usuario o contraseña incorrectos'}), 401


def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None

       
        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            if "Bearer " in auth_header:
                token = auth_header.split(" ")[1]

        if not token:
            return jsonify({'message': 'Token de acceso faltante'}), 401

        try:
            
            jwt.decode(token, app.config['SECRET_KEY'], algorithms=["HS256"])
        except jwt.ExpiredSignatureError:
            return jsonify({'message': 'El token ha expirado'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'message': 'Token inválido'}), 401

        return f(*args, **kwargs)
    return decorated



def calculate_dhondt(candidates_list, parties_list, pacts_list, num_seats):
   
    pact_votes = {p['_id']: p['votes'] for p in pacts_list}
    party_votes = {p['_id']: p['votes'] for p in parties_list}
    party_to_pact = {p['_id']: p['list_id'] for p in parties_list}

    party_candidates = defaultdict(list)
    for c in candidates_list:
        party_candidates[c['party_id']].append(c)

    for pid in party_candidates:
        party_candidates[pid].sort(key=lambda x: x['votes'], reverse=True)

    
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
    for pact_id, seats_won in seats_per_pact.items():
        parties_in_pact = [pid for pid,
                           lid in party_to_pact.items() if lid == pact_id]
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
            if seats_assigned >= seats_won:
                break
            cands = party_candidates.get(party_id, [])
            if cand_idx < len(cands):
                candidate = cands[cand_idx]
                if candidate not in elected:
                    elected.append(candidate)
                    seats_assigned += 1

    final = [asdict(c) if not isinstance(c, dict) else c for c in elected]
    final.sort(key=lambda x: x['votes'], reverse=True)
    return final



def get_real_data_emol(distrito_num, preloaded_json=None):
    d_id = f"60{int(distrito_num):02d}"

  
    votos_map = {}
    total_votos_xml = 0
    try:
        url_xml = f"https://www.emol.com/nacional/especiales/2025/presidenciales/dip_{d_id}.xml"
        r = requests.get(url_xml, headers={
                         'User-Agent': 'Mozilla/5.0'}, timeout=4)
        if r.status_code == 200:
            raw = r.content.decode('utf-8-sig', errors='ignore').strip()
            if not raw.startswith('<'):
                raw = r.content.decode('latin-1', errors='ignore').strip()
            root = ET.fromstring(raw)
            for row in root.findall(".//ROW"):
                a, v = row.find('AMBITO'), row.find('VOTOS')
                if a is not None and v is not None:
                    k = a.text.strip()
                    val = int(v.text.replace('.', '')) if v.text else 0
                    if k == 'V':
                        total_votos_xml = val
                    elif k.isdigit():
                        votos_map[k] = val
    except:
        pass

    
    try:
        data = preloaded_json if preloaded_json else requests.get(
            URL_METADATA_JSON, timeout=5).json()
        pactos_ref = data.get('dbg', {})
        dist_data = data.get('dbdp', {}).get(d_id, {})

        
        real_seats = int(dist_data.get('q', 3))
        candidatos_raw = dist_data.get('c', {})

        cands, parties, pacts = [], {}, {}
        total_calc = 0

        for c_id_raw, val in candidatos_raw.items():
            c_id = str(c_id_raw).strip()

            
            votos = float(votos_map.get(c_id, 0))
            total_calc += votos

            p_letra = val.get('g', '?')
            p_nombre = pactos_ref.get(p_letra, f"Lista {p_letra}")

            
            if p_letra not in pacts:
                pacts[p_letra] = Pact(p_letra, p_nombre, 0.0)
            pacts[p_letra].votes += votos

            
            p_sigla = val.get('p', 'IND')
            c_cupo = val.get('c')
            sigla_math = c_cupo if c_cupo else (
                f"IND_{c_id}" if p_sigla == "IND" else p_sigla)
            pid = f"{p_letra}-{sigla_math}"

            if pid not in parties:
                parties[pid] = Party(pid, sigla_math.replace(
                    f"IND_{c_id}", "IND"), p_letra, 0.0)
            parties[pid].votes += votos

            id_foto = val.get('t')
            foto = f"{IMG_BASE_URL}{id_foto}.jpg" if id_foto else ""

            cands.append(Candidate(
                c_id, val.get('n', ''), pid, votos,
                val.get(
                    's', 'N/A'), 0.0, foto, p_sigla, p_letra, str(int(distrito_num))
            ))

        base = total_votos_xml if total_votos_xml > 0 else total_calc
        for c in cands:
            c.percentage = round((c.votes/base)*100, 2) if base > 0 else 0

        
        return {
            "candidates": [asdict(c) for c in cands],
            "parties": [asdict(p) for p in parties.values()],
            "pacts": [asdict(p) for p in pacts.values()],
            "seats": real_seats
        }
    except:
        return {"candidates": [], "parties": [], "pacts": [], "seats": 3}


def get_simulation_data(distrito_num):
    try:
        df = pd.read_csv(CSV_FILE, encoding="utf-8")
    except:
        df = pd.read_csv(CSV_FILE, encoding="latin-1")
    d_code = int(f"60{int(distrito_num):02d}")
    df = df[pd.to_numeric(df['zona'], errors='coerce') == d_code].copy()
    if df.empty:
        return {"candidates": [], "parties": [], "pacts": [], "seats": 5}

    seats = int(DB_ZONAS.get(f"60{int(distrito_num):02d}", {}).get(
        'q', 5)) if DB_ZONAS else 5
    poll = POLL_DATA_ALL.get(f"D{distrito_num}", [])
    poll_map = {normalize_string_aggressive(
        p['nombre']): p['votos'] for p in poll}
    s_keys = list(poll_map.keys())
    cands, parties, pacts = [], {}, {}
    df['nombre_norm'] = df['nombre'].apply(normalize_string_aggressive)

    for _, row in df.iterrows():
        matches = difflib.get_close_matches(
            row['nombre_norm'], s_keys, n=1, cutoff=0.8)
        votos = float(poll_map.get(matches[0], 0.0)) if matches else 0.0
        pid, partid = str(row['pacto']), str(row['partido'])
        photo = f"{IMG_BASE_URL}{int(row['id_foto'])}.jpg" if pd.notna(
            row.get('id_foto')) else ""

        if pid not in pacts:
            pacts[pid] = Pact(pid, PACTO_NOMBRES_LOCAL.get(pid, pid))
        pacts[pid].votes += votos

        pkey = f"{pid}-{partid}"
        if pkey not in parties:
            parties[pkey] = Party(
                pkey, PARTIDO_NOMBRES_LOCAL.get(partid, partid), pid)
        parties[pkey].votes += votos

        cands.append(Candidate(str(row['nombre_full']), row['nombre_full'], pkey, votos, row.get(
            'sexo', 'N/A'), 0.0, photo, partid, pid, str(distrito_num)))

    return {"candidates": [asdict(c) for c in cands], "parties": [asdict(p) for p in parties.values()], "pacts": [asdict(p) for p in pacts.values()], "seats": seats}



@app.route("/nacional")
# @token_required
def get_nacional_results():
   
    tipo = request.args.get('tipo', 'real')
    escenario = request.args.get('escenario', '')

    all_elected = []

    national_summary = defaultdict(
        lambda: {'votes': 0, 'seats': 0, 'name': '', 'is_scenario': False})

    json_data = None
    try:
        json_data = requests.get(URL_METADATA_JSON, headers={
                                 'User-Agent': 'Mozilla/5.0'}, timeout=5).json()
    except:
        pass

    def process(i):
        d = str(i)
        
        if tipo == 'real':
            res = get_real_data_emol(d, preloaded_json=json_data)
        else:
            res = get_simulation_data(d)

       
        if escenario:
            res = apply_scenario_logic(res, escenario)

        
        candidates = res['candidates']
        seats = res['seats']
        pacts_data = res['pacts']

        dist_elected = []
        if candidates:
            dist_elected = calculate_dhondt(
                candidates, res['parties'], pacts_data, seats)

        return dist_elected, pacts_data

    
    with concurrent.futures.ThreadPoolExecutor(max_workers=14) as executor:
        results = executor.map(process, range(1, 29))

        for elected_list, pacts_list in results:
            all_elected.extend(elected_list)

            
            for p in pacts_list:
                pid = p['_id']
                national_summary[pid]['votes'] += p['votes']
                if not national_summary[pid]['name']:
                    national_summary[pid]['name'] = p['name']

                
                if pid.startswith("SC_"):
                    national_summary[pid]['is_scenario'] = True

   
    for c in all_elected:
        national_summary[c['pact_id']]['seats'] += 1

    TEMP_ORDER = PACTO_ORDER + ["SC_IZQ", "SC_DER"]
    all_elected.sort(key=lambda c: TEMP_ORDER.index(
        c['pact_id']) if c['pact_id'] in TEMP_ORDER else 99)

    
    final_summary = []

    otros_acc = {'id': 'others', 'name': 'Otros Partidos',
                 'votes': 0, 'seats': 0, 'color_key': 'default'}

    for pid, stats in national_summary.items():
        if stats['votes'] > 0:
            should_show = False

           
            if stats['is_scenario']:
                should_show = True
            
            elif pid in MAIN_PACTS_IDS:
                if escenario and pid in SCENARIOS.get(escenario, {}).get('merge_ids', []):
                    should_show = False
                else:
                    should_show = True

            if should_show:
               
                color_key = pid
                
                if pid == "SC_DER":
                    color_key = SCENARIOS['derecha_unida']['color_ref']
                if pid == "SC_IZQ":
                    color_key = SCENARIOS['izquierda_unida']['color_ref']

                final_summary.append({
                    "id": pid,
                    "name": stats['name'],
                    "votes": stats['votes'],
                    "seats": stats['seats'],
                    "color_key": color_key
                })
            elif not stats['is_scenario']:
               
                is_absorbed = False
                if escenario and pid in SCENARIOS.get(escenario, {}).get('merge_ids', []):
                    is_absorbed = True

                if not is_absorbed:
                    otros_acc['votes'] += stats['votes']
                    otros_acc['seats'] += stats['seats']

    if otros_acc['votes'] > 0:
        final_summary.append(otros_acc)

    final_summary.sort(key=lambda x: x['seats'], reverse=True)

    return jsonify({
        "total": len(all_elected),
        "diputados": all_elected,
        "resumen": final_summary,
        "escenario_activo": escenario
    })


@app.route("/candidatos")
def route_candidatos():
    d = request.args.get('distrito')
    t = request.args.get('tipo', 'simulacion')
    if not d:
        return jsonify({"error": "Falta distrito"}), 400
   
    data = get_real_data_emol(d) if t == 'real' else get_simulation_data(d)
    return jsonify(data)


@app.route("/dhondt")
def route_dhondt():
    d = request.args.get('distrito')
    t = request.args.get('tipo', 'simulacion')

    
    data = get_real_data_emol(d) if t == 'real' else get_simulation_data(d)
    seats = data.get('seats', 5)

    if not data['candidates']:
        return jsonify({"elected": [], "cupos_distrito": seats})

    elected = calculate_dhondt(
        data['candidates'], data['parties'], data['pacts'], seats)
    return jsonify({"elected": elected, "cupos_distrito": seats, "fuente": t})


@app.route("/stats/genero")
@token_required
def stats_genero():
    """
    Retorna totales nacionales y un desglose por distrito de 
    Hombres/Mujeres (Candidatos y Electos).
    """
    
    response_data = {
        "nacional": {
            "candidatos": {"hombres": 0, "mujeres": 0, "total": 0},
            "electos":    {"hombres": 0, "mujeres": 0, "total": 0}
        },
        
        "distritos": []
    }

    
    json_data = None
    try:
        json_data = requests.get(URL_METADATA_JSON, headers={
                                 'User-Agent': 'Mozilla/5.0'}, timeout=5).json()
    except Exception as e:
        return jsonify({"error": "No se pudo cargar metadata externa", "details": str(e)}), 500

    
    def process_gender_district(i):
        distrito_id = str(i)

       
        res = get_real_data_emol(distrito_id, preloaded_json=json_data)
        candidates = res['candidates']
        seats = res['seats']

        
        c_h, c_m = 0, 0  
        e_h, e_m = 0, 0  

        
        for c in candidates:
            if c['gender'] == 'H':
                c_h += 1
            elif c['gender'] == 'M':
                c_m += 1

       
        elected_list = []
        if candidates:
            elected_list = calculate_dhondt(
                candidates, res['parties'], res['pacts'], seats)

        for e in elected_list:
            if e['gender'] == 'H':
                e_h += 1
            elif e['gender'] == 'M':
                e_m += 1

       
        return {
            "id": distrito_id,
            "candidatos": {"h": c_h, "m": c_m, "t": c_h + c_m},
            "electos":    {"h": e_h, "m": e_m, "t": e_h + e_m}
        }

    
    with concurrent.futures.ThreadPoolExecutor(max_workers=14) as executor:
        results = executor.map(process_gender_district, range(1, 29))

        for res in results:
            
            response_data["nacional"]["candidatos"]["hombres"] += res["candidatos"]["h"]
            response_data["nacional"]["candidatos"]["mujeres"] += res["candidatos"]["m"]

            response_data["nacional"]["electos"]["hombres"] += res["electos"]["h"]
            response_data["nacional"]["electos"]["mujeres"] += res["electos"]["m"]

            
            response_data["distritos"].append({
                "distrito": res["id"],
                "electos": {
                    "hombres": res["electos"]["h"],
                    "mujeres": res["electos"]["m"],
                    "total": res["electos"]["t"]
                },
                
                "candidatos": {
                    "hombres": res["candidatos"]["h"],
                    "mujeres": res["candidatos"]["m"],
                    "total": res["candidatos"]["t"]
                }
            })

    
    response_data["nacional"]["candidatos"]["total"] = (
        response_data["nacional"]["candidatos"]["hombres"] +
        response_data["nacional"]["candidatos"]["mujeres"]
    )
    response_data["nacional"]["electos"]["total"] = (
        response_data["nacional"]["electos"]["hombres"] +
        response_data["nacional"]["electos"]["mujeres"]
    )

   
    response_data["distritos"].sort(key=lambda x: int(x["distrito"]))

    return jsonify(response_data)


@app.route("/stats/fenomenos")
def stats_fenomenos():
    """
    Identifica:
    1. Arrastrados: Electos con MENOS votos.
    2. Cortados: NO Electos con MÁS votos.
    """
    tipo = request.args.get('tipo', 'real')
    escenario = request.args.get('escenario', '') 
    limit = int(request.args.get('limit', 10))  

    all_processed_candidates = []

    
    json_data = None
    try:
        json_data = requests.get(URL_METADATA_JSON, headers={
                                 'User-Agent': 'Mozilla/5.0'}, timeout=5).json()
    except:
        pass

    def process_district_stats(i):
        d_id = str(i)

        
        if tipo == 'real':
            res = get_real_data_emol(d_id, preloaded_json=json_data)
        else:
            res = get_simulation_data(d_id)

        
        if escenario:
            res = apply_scenario_logic(res, escenario)

       
        elected_list = calculate_dhondt(
            res['candidates'], res['parties'], res['pacts'], res['seats'])

        
        elected_ids = set(e['_id'] for e in elected_list)

        local_results = []
        for cand in res['candidates']:

            c_copy = cand.copy()
            c_copy['is_elected'] = c_copy['_id'] in elected_ids

            c_copy['distrito'] = d_id

            pact_obj = next(
                (p for p in res['pacts'] if p['_id'] == c_copy['pact_id']), None)
            c_copy['pact_name'] = pact_obj['name'] if pact_obj else c_copy['pact_id']

            local_results.append(c_copy)

        return local_results

    with concurrent.futures.ThreadPoolExecutor(max_workers=14) as executor:
        results = executor.map(process_district_stats, range(1, 29))
        for dist_cands in results:
            all_processed_candidates.extend(dist_cands)

    electos = [c for c in all_processed_candidates if c['is_elected']]
    
    arrastrados = sorted(electos, key=lambda x: x['votes'])[:limit]
    no_electos = [c for c in all_processed_candidates if not c['is_elected']]
    cortados = sorted(
        no_electos, key=lambda x: x['votes'], reverse=True)[:limit]

    return jsonify({
        "meta": {
            "total_electos": len(electos),
            "tipo": tipo,
            "escenario": escenario
        },
        "arrastrados": arrastrados, 
        "cortados": cortados
    })


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
