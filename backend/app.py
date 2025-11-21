import pandas as pd
import json
import difflib
import os
import unicodedata
import requests
import xml.etree.ElementTree as ET
from flask import Flask, jsonify, request
from flask_cors import CORS
from dataclasses import dataclass, asdict, field
from collections import defaultdict

app = Flask(__name__)
CORS(app)

# --- CONFIGURACIÓN EXISTENTE (SIMULACIÓN) ---
CSV_FILE = "https://www.emol.com/especiales/2025/nacional/elecciones/data/dip.csv"
DB_FILE = 'db.json'
POLL_API_URL = "https://dhondt.azurewebsites.net/api/encuestas"

# URL Base para las imágenes
IMG_BASE_URL = "https://static.emol.cl/emol50/especiales/img/2025/elecciones/dip/"

# --- CONFIGURACIÓN NUEVA (REAL - EMOL) ---
URL_METADATA_JSON = "https://static.emol.cl/emol50/especiales/js/2025/elecciones/dbres.json"


@dataclass
class Candidate:
    _id: str
    name: str
    party_id: str
    votes: float = 0.0
    gender: str = "N/A"
    percentage: float = 0.0
    photo_url: str = ""  # Campo para la foto


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


# --- CARGA INICIAL DE DATOS ESTÁTICOS ---
try:
    with open(DB_FILE, 'r', encoding='utf-8') as f:
        db_data = json.load(f)
    DB_ZONAS = db_data.get("dbzonas", {})
    PACTO_NOMBRES = db_data.get("dbpactos", {})
    PARTIDO_NOMBRES = db_data.get("dbpartidos", {})
    print(f"INFO: '{DB_FILE}' cargado exitosamente.")
except Exception as e:
    print(f"ERROR FATAL: No se pudo cargar '{DB_FILE}': {e}")
    DB_ZONAS, PACTO_NOMBRES, PARTIDO_NOMBRES = {}, {}, {}

try:
    response = requests.get(POLL_API_URL)
    response.raise_for_status()
    POLL_DATA_ALL = response.json()
    print(f"INFO: Datos de encuestas cargados exitosamente.")
except Exception as e:
    print(f"ERROR FATAL: Fallo al cargar API encuestas: {e}")
    POLL_DATA_ALL = {}

# ==========================================
#  LOGICA 1: SIMULACIÓN
# ==========================================


def normalize_string_aggressive(s):
    if not isinstance(s, str):
        return ""
    s_no_accents = ''.join(c for c in unicodedata.normalize(
        'NFD', s) if unicodedata.category(c) != 'Mn')
    s_lower = s_no_accents.lower().strip()
    parts = s_lower.split()
    if len(parts) == 0:
        return ""
    if len(parts) > 1 and len(parts[0]) <= 2 and parts[0].endswith('.'):
        parts = [parts[0] + parts[1]] + parts[2:]
    first_name = parts[0]
    first_last_name = parts[1] if len(parts) >= 2 else ""
    if len(parts) >= 3:
        first_last_name = parts[1]
    return first_name + first_last_name


def get_simulation_data(distrito_num):
    try:
        df_dip = pd.read_csv(CSV_FILE, encoding="utf-8")
    except UnicodeDecodeError:
        df_dip = pd.read_csv(CSV_FILE, encoding="latin-1")

    distrito_code_int = int(f"60{int(distrito_num):02d}")
    df_dip['zona'] = pd.to_numeric(df_dip['zona'], errors='coerce')
    df_distrito = df_dip[df_dip['zona'] == distrito_code_int].copy()

    if df_distrito.empty:
        return {"candidates": [], "parties": [], "pacts": []}

    distrito_poll_key = f"D{distrito_num}"
    poll_list = POLL_DATA_ALL.get(distrito_poll_key)

    if not poll_list:
        df_encuesta = pd.DataFrame(columns=['nombre', 'votos_encuesta'])
    else:
        df_encuesta = pd.DataFrame(poll_list)
        df_encuesta = df_encuesta.rename(columns={'votos': 'votos_encuesta'})

    df_distrito['nombre_norm'] = df_distrito['nombre'].apply(
        normalize_string_aggressive)
    df_encuesta['nombre_norm'] = df_encuesta['nombre'].apply(
        normalize_string_aggressive)

    encuesta_votos_map = df_encuesta.set_index(
        'nombre_norm')['votos_encuesta'].to_dict()
    encuesta_names_normalized = list(encuesta_votos_map.keys())

    candidates_list = []
    parties_map = {}
    pacts_map = {}

    for _, row in df_distrito.iterrows():
        candidato_nombre_norm = row['nombre_norm']
        best_match_list = difflib.get_close_matches(
            candidato_nombre_norm, encuesta_names_normalized, n=1, cutoff=0.8)

        votos_candidato = 0.0
        if best_match_list:
            votos_candidato = float(
                encuesta_votos_map.get(best_match_list[0], 0.0))

        pacto_id = str(row["pacto"])
        partido_id = str(row["partido"])

        # --- LÓGICA DE FOTO ---
        foto_url = ""
        id_foto_val = row.get("id_foto")
        
        if pd.notna(id_foto_val):
            try:
                # Convertir a int para quitar decimales (ej: 5023.0 -> 5023)
                clean_id = str(int(id_foto_val))
                foto_url = f"{IMG_BASE_URL}{clean_id}.jpg"
            except ValueError:
                if str(id_foto_val).strip():
                     foto_url = f"{IMG_BASE_URL}{str(id_foto_val).strip()}.jpg"

        if pacto_id not in pacts_map:
            pacto_nombre = PACTO_NOMBRES.get(pacto_id, pacto_id)
            pacts_map[pacto_id] = Pact(
                _id=pacto_id, name=pacto_nombre, votes=0.0)
        pacts_map[pacto_id].votes += votos_candidato

        if partido_id not in parties_map:
            partido_nombre = PARTIDO_NOMBRES.get(partido_id, partido_id)
            parties_map[partido_id] = Party(
                _id=partido_id, name=partido_nombre, list_id=pacto_id, votes=0.0)
        parties_map[partido_id].votes += votos_candidato

        candidato_obj = Candidate(
            _id=str(row["nombre_full"]),
            name=row["nombre_full"],
            party_id=partido_id,
            votes=votos_candidato,
            gender=row.get("sexo", "N/A"),
            photo_url=foto_url
        )
        candidates_list.append(candidato_obj)

    return {
        "candidates": [asdict(c) for c in candidates_list],
        "parties": [asdict(p) for p in parties_map.values()],
        "pacts": [asdict(p) for p in pacts_map.values()]
    }

# ==========================================
#  LOGICA 2: REALIDAD (EMOL XML + JSON)
# ==========================================


def get_real_data_emol(distrito_num):
    distrito_id = f"60{int(distrito_num):02d}"
    url_xml = f"https://www.emol.com/nacional/especiales/2025/presidenciales/dip_{distrito_id}.xml"

    headers = {'User-Agent': 'Mozilla/5.0 (Backend-Flask-App)'}

    votos_map = {}
    total_votos_oficial = 0

    # 1. XML
    try:
        r_xml = requests.get(url_xml, headers=headers, timeout=4)
        if r_xml.status_code == 200:
            raw_xml = r_xml.content.decode(
                'utf-8-sig', errors='ignore').strip()
            if not raw_xml.startswith('<'):
                raw_xml = r_xml.content.decode(
                    'latin-1', errors='ignore').strip()

            try:
                root = ET.fromstring(raw_xml)
                for row in root.findall(".//ROW"):
                    ambito = row.find('AMBITO')
                    votos = row.find('VOTOS')

                    if ambito is not None and votos is not None:
                        c_id = ambito.text.strip()
                        val_votos_str = votos.text.strip()

                        if c_id and val_votos_str:
                            val_votos = int(val_votos_str.replace('.', ''))
                            if c_id == 'V':
                                total_votos_oficial = val_votos
                            elif c_id.isdigit():
                                votos_map[c_id] = val_votos

            except ET.ParseError:
                print(f"Error parseando XML para distrito {distrito_id}")
    except Exception as e:
        print(f"Error conexión XML: {e}")

    # 2. JSON
    candidates_list = []
    parties_map = {}
    pacts_map = {}

    try:
        r_json = requests.get(URL_METADATA_JSON, headers=headers, timeout=5)
        r_json.encoding = 'utf-8'
        data_json = r_json.json()

        distrito_data = data_json.get('dbdp', {}).get(distrito_id, {})
        candidatos_raw = distrito_data.get('c', {})

        iterable_candidatos = []
        if isinstance(candidatos_raw, dict):
            iterable_candidatos = list(candidatos_raw.items())
        elif isinstance(candidatos_raw, list):
            iterable_candidatos = [(str(x.get('i')), x)
                                   for x in candidatos_raw]

        for c_id_key, cand in iterable_candidatos:
            c_id = str(c_id_key).strip()
            c_nombre = f"{cand.get('n')} {cand.get('a', '')}".strip()
            c_partido = cand.get('p', 'Indep.')
            c_genero = cand.get('s', 'N/A')

            pacto_id = str(cand.get('l', 'Lista-Gral'))
            pacto_nombre = str(cand.get('ln', pacto_id))

            votos_reales = float(votos_map.get(c_id, 0))

            # Foto Real
            foto_url_real = f"{IMG_BASE_URL}{c_id}.jpg"

            if pacto_id not in pacts_map:
                pacts_map[pacto_id] = Pact(
                    _id=pacto_id, name=pacto_nombre, votes=0.0)
            pacts_map[pacto_id].votes += votos_reales

            partido_key = f"{pacto_id}-{c_partido}"
            if partido_key not in parties_map:
                parties_map[partido_key] = Party(
                    _id=c_partido, name=c_partido, list_id=pacto_id, votes=0.0)
            parties_map[partido_key].votes += votos_reales

            candidates_list.append(Candidate(
                _id=c_id,
                name=c_nombre,
                party_id=c_partido,
                votes=votos_reales,
                gender=c_genero,
                photo_url=foto_url_real
            ))

    except Exception as e:
        print(f"Error procesando JSON: {e}")
        return {"candidates": [], "parties": [], "pacts": []}

    universo_votos = total_votos_oficial if total_votos_oficial > 0 else sum(
        c.votes for c in candidates_list)

    for c in candidates_list:
        if universo_votos > 0:
            raw_pct = (c.votes / universo_votos) * 100
            c.percentage = round(raw_pct, 2)
        else:
            c.percentage = 0.0

    return {
        "candidates": [asdict(c) for c in candidates_list],
        "parties": [asdict(p) for p in parties_map.values()],
        "pacts": [asdict(p) for p in pacts_map.values()]
    }


# ==========================================
#  LÓGICA COMÚN (D'Hondt)
# ==========================================


def calculate_dhondt(candidates_dict_list, parties_dict_list, pacts_dict_list, num_seats):
    pact_votes_map = {p['_id']: p['votes'] for p in pacts_dict_list}
    party_votes_map = {p['_id']: p['votes'] for p in parties_dict_list}
    party_to_pact_map = {p['_id']: p['list_id'] for p in parties_dict_list}
    party_candidates = defaultdict(list)

    for c in candidates_dict_list:
        party_candidates[c['party_id']].append(c)

    for party_id in party_candidates:
        party_candidates[party_id].sort(key=lambda c: c['votes'], reverse=True)

    dhondt_table_pacts = []
    for pact_id, total_votes in pact_votes_map.items():
        if total_votes > 0:
            for i in range(1, num_seats + 1):
                quotient = total_votes / i
                dhondt_table_pacts.append((quotient, pact_id))

    dhondt_table_pacts.sort(key=lambda x: x[0], reverse=True)
    winning_pacts_quotients = dhondt_table_pacts[:num_seats]

    pact_seat_counts = defaultdict(int)
    for _, pact_id in winning_pacts_quotients:
        pact_seat_counts[pact_id] += 1

    elected_candidates = []

    for pact_id, seats_won_by_pact in pact_seat_counts.items():
        parties_in_this_pact = [
            p_id for p_id, p_pact_id in party_to_pact_map.items() if p_pact_id == pact_id]
        dhondt_table_parties_internal = []
        for party_id in parties_in_this_pact:
            party_total_votes = party_votes_map.get(party_id, 0)
            if party_total_votes > 0:
                num_candidates_in_party = len(
                    party_candidates.get(party_id, []))
                num_quotients_to_gen = max(
                    seats_won_by_pact, num_candidates_in_party)
                for i in range(1, num_quotients_to_gen + 1):
                    quotient = party_total_votes / i
                    dhondt_table_parties_internal.append(
                        (quotient, party_id, i - 1))

        dhondt_table_parties_internal.sort(key=lambda x: x[0], reverse=True)
        elected_count_for_this_pact = 0

        for quotient, party_id, candidate_index in dhondt_table_parties_internal:
            if elected_count_for_this_pact >= seats_won_by_pact:
                break
            if candidate_index < len(party_candidates[party_id]):
                candidate_to_elect = party_candidates[party_id][candidate_index]
                if candidate_to_elect not in elected_candidates:
                    elected_candidates.append(candidate_to_elect)
                    elected_count_for_this_pact += 1

    final_elected_list = []
    for c in elected_candidates:
        if not isinstance(c, dict):
            final_elected_list.append(asdict(c))
        else:
            final_elected_list.append(c)
    final_elected_list.sort(key=lambda c: c['votes'], reverse=True)
    return final_elected_list

# ==========================================
#  ENDPOINTS
# ==========================================


@app.route("/candidatos")
def get_all_candidates_endpoint():
    distrito_num = request.args.get('distrito')
    tipo_dato = request.args.get('tipo', 'simulacion')

    if not distrito_num:
        return jsonify({"error": "Falta 'distrito'"}), 400

    try:
        if tipo_dato == 'real':
            data = get_real_data_emol(distrito_num)
        else:
            data = get_simulation_data(distrito_num)

        return jsonify(data)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/dhondt")
def get_dhondt_results():
    distrito_num = request.args.get('distrito')
    tipo_dato = request.args.get('tipo', 'simulacion')

    if not distrito_num:
        return jsonify({"error": "Falta 'distrito'"}), 400

    # Obtener escaños
    try:
        distrito_zona_key = f"60{int(distrito_num):02d}"
        distrito_info = DB_ZONAS.get(distrito_zona_key)
        num_seats = int(distrito_info.get('q', 0)) if distrito_info else 0
        if num_seats <= 0:
            return jsonify({"error": "Distrito no válido o sin escaños"}), 400
    except:
        return jsonify({"error": "Error obteniendo escaños"}), 500

    try:
        if tipo_dato == 'real':
            data = get_real_data_emol(distrito_num)
        else:
            data = get_simulation_data(distrito_num)

        if not data["candidates"]:
            return jsonify({"elected": [], "message": "Sin datos", "cupos_distrito": num_seats})

        # Calcular D'Hondt (LLAMADA CORREGIDA)
        elected_list = calculate_dhondt(
            data['candidates'],
            data['parties'],
            data['pacts'],
            num_seats
        )

        return jsonify({
            "elected": elected_list,
            "cupos_distrito": num_seats,
            "fuente": tipo_dato
        })

    except Exception as e:
        return jsonify({"error": f"Error interno: {str(e)}"}), 500


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)