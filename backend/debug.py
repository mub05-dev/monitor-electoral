import requests
import json

# Configuración
DISTRITO_NUM = "10"
DISTRITO_ID = f"60{int(DISTRITO_NUM):02d}" # 6010

URL_JSON = "https://static.emol.cl/emol50/especiales/js/2025/elecciones/dbres.json"
URL_XML = f"https://www.emol.com/nacional/especiales/2025/presidenciales/dip_{DISTRITO_ID}.xml"

HEADERS = {'User-Agent': 'Mozilla/5.0'}

print("="*50)
print(f" DIAGNOSTICO PARA DISTRITO: {DISTRITO_ID}")
print("="*50)

# 1. PROBAR XML
print(f"\n1. Probando XML: {URL_XML}")
try:
    r_xml = requests.get(URL_XML, headers=HEADERS)
    print(f"   Status Code: {r_xml.status_code}")
    if r_xml.status_code == 200:
        print(f"   Contenido (primeros 100 chars): {r_xml.text[:100]}")
    else:
        print("   ❌ ERROR: No se pudo descargar el XML.")
except Exception as e:
    print(f"   ❌ EXCEPCIÓN: {e}")

# 2. PROBAR JSON
print(f"\n2. Probando JSON Metadata: {URL_JSON}")
try:
    r_json = requests.get(URL_JSON, headers=HEADERS)
    print(f"   Status Code: {r_json.status_code}")
    
    if r_json.status_code == 200:
        data = r_json.json()
        
        # Chequear si existe 'dbdp'
        dbdp = data.get('dbdp')
        if not dbdp:
            print("   ❌ ERROR: No se encontró la llave 'dbdp' en el JSON.")
            # Imprimir llaves raiz para ver qué hay
            print(f"   Llaves encontradas: {list(data.keys())}")
        else:
            print("   ✅ 'dbdp' encontrado.")
            
            # Chequear si existe el distrito
            distrito_data = dbdp.get(DISTRITO_ID) # Intentar con string "6010"
            
            if not distrito_data:
                # Intentar buscarlo visualmente en las primeras 5 llaves
                print(f"   ❌ ERROR: No se encontró la llave '{DISTRITO_ID}' dentro de dbdp.")
                keys_ejemplo = list(dbdp.keys())[:5]
                print(f"   Ejemplos de llaves en dbdp: {keys_ejemplo}")
            else:
                print(f"   ✅ Distrito {DISTRITO_ID} encontrado.")
                print(f"   Estructura interna del distrito: {list(distrito_data.keys())}")
                
                # Verificación profunda de Listas y Candidatos
                listas = distrito_data.get('l')
                candidatos = distrito_data.get('c')
                
                if listas:
                    print(f"   ➡️ Encontrada llave 'l' (Listas). Cantidad: {len(listas)}")
                    # Ver el primer elemento para entender subpactos
                    if len(listas) > 0:
                        print(f"      Ejemplo lista[0] keys: {list(listas[0].keys())}")
                elif candidatos:
                    print(f"   ➡️ Encontrada llave 'c' (Candidatos directos). Cantidad: {len(candidatos)}")
                else:
                    print("   ⚠️ ALERTA: No se ven listas ('l') ni candidatos ('c').")
                    
    else:
        print("   ❌ ERROR: No se pudo descargar el JSON.")

except Exception as e:
    print(f"   ❌ EXCEPCIÓN JSON: {e}")

print("\n" + "="*50)