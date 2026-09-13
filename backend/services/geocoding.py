import json
import os
import math
import pandas as pd
from unidecode import unidecode

MUNICIPIOS_FILE = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "municipios.json")
municipios_db = []

try:
    with open(MUNICIPIOS_FILE, "r", encoding="utf-8") as f:
        municipios_db = json.load(f)
except FileNotFoundError:
    municipios_db = []

def normalize_string(s: str) -> str:
    if not isinstance(s, str):
        return ""
    return unidecode(s).lower().strip()

def geocode_municipio(nome: str, uf: str) -> tuple:
    municipio = find_municipio(nome, uf)
    return (municipio['latitude'], municipio['longitude']) if municipio else None


def find_municipio(nome: str, uf: str = '') -> dict | None:
    nome_norm = normalize_string(nome)
    uf_norm = normalize_string(uf)
    if not nome_norm:
        return None
    matches = [municipio for municipio in municipios_db
               if normalize_string(municipio['nome']) == nome_norm
               and (not uf_norm or normalize_string(municipio['uf']) == uf_norm)]
    return matches[0] if len(matches) == 1 else None


def valid_coordinates(latitude, longitude) -> bool:
    try:
        latitude, longitude = float(latitude), float(longitude)
        return (math.isfinite(latitude) and math.isfinite(longitude)
                and -90 <= latitude <= 90 and -180 <= longitude <= 180
                and (latitude, longitude) != (0, 0))
    except (ValueError, TypeError):
        return False

def enrich_dataframe(df: pd.DataFrame) -> pd.DataFrame:
    lats = []
    lngs = []
    estados = []
    for _, row in df.iterrows():
        source_latitude = row.get('latitude')
        source_longitude = row.get('longitude')
        municipio = find_municipio(row.get('municipio', ''), row.get('estado', ''))
        if valid_coordinates(source_latitude, source_longitude):
            lats.append(float(source_latitude))
            lngs.append(float(source_longitude))
            estados.append(row.get('estado', '') or (municipio['uf'] if municipio else ''))
            continue

        municipio = find_municipio(row.get('municipio', ''), row.get('estado', ''))
        coords = geocode_municipio(row.get('municipio', ''), row.get('estado', ''))
        if coords:
            lats.append(coords[0])
            lngs.append(coords[1])
        else:
            lats.append(None)
            lngs.append(None)
        estados.append(row.get('estado', '') or (municipio['uf'] if municipio else ''))
    
    df['latitude'] = lats
    df['longitude'] = lngs
    df['estado'] = estados
    return df
