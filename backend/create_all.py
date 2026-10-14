import os
import json

base_dir = r"C:\Users\mathe\.gemini\antigravity\scratch\hanseniase-painel\backend"
os.makedirs(os.path.join(base_dir, "data"), exist_ok=True)
os.makedirs(os.path.join(base_dir, "services"), exist_ok=True)

# 2. data/municipios.json
municipios = [
    {"codigo_ibge": "1100205", "nome": "Porto Velho", "uf": "RO", "latitude": -8.76116, "longitude": -63.9004},
    {"codigo_ibge": "1200401", "nome": "Rio Branco", "uf": "AC", "latitude": -9.97499, "longitude": -67.8243},
    {"codigo_ibge": "1302603", "nome": "Manaus", "uf": "AM", "latitude": -3.10194, "longitude": -60.025},
    {"codigo_ibge": "1400100", "nome": "Boa Vista", "uf": "RR", "latitude": 2.81972, "longitude": -60.6733},
    {"codigo_ibge": "1400100", "nome": "Boa Vista", "uf": "RR", "latitude": 2.81972, "longitude": -60.6733},
    {"codigo_ibge": "1501402", "nome": "Belém", "uf": "PA", "latitude": -1.45583, "longitude": -48.5044},
    {"codigo_ibge": "1600303", "nome": "Macapá", "uf": "AP", "latitude": 0.034722, "longitude": -51.0664},
    {"codigo_ibge": "1721000", "nome": "Palmas", "uf": "TO", "latitude": -10.1689, "longitude": -48.3317},
    {"codigo_ibge": "2111300", "nome": "São Luís", "uf": "MA", "latitude": -2.52972, "longitude": -44.3028},
    {"codigo_ibge": "2211001", "nome": "Teresina", "uf": "PI", "latitude": -5.08917, "longitude": -42.8019},
    {"codigo_ibge": "2304400", "nome": "Fortaleza", "uf": "CE", "latitude": -3.71722, "longitude": -38.5431},
    {"codigo_ibge": "2408102", "nome": "Natal", "uf": "RN", "latitude": -5.79448, "longitude": -35.211},
    {"codigo_ibge": "2507507", "nome": "João Pessoa", "uf": "PB", "latitude": -7.115, "longitude": -34.8631},
    {"codigo_ibge": "2611606", "nome": "Recife", "uf": "PE", "latitude": -8.05783, "longitude": -34.8829},
    {"codigo_ibge": "2704302", "nome": "Maceió", "uf": "AL", "latitude": -9.66583, "longitude": -35.7353},
    {"codigo_ibge": "2800308", "nome": "Aracaju", "uf": "SE", "latitude": -10.9111, "longitude": -37.0717},
    {"codigo_ibge": "2927408", "nome": "Salvador", "uf": "BA", "latitude": -12.9714, "longitude": -38.5104},
    {"codigo_ibge": "3106200", "nome": "Belo Horizonte", "uf": "MG", "latitude": -19.9208, "longitude": -43.9378},
    {"codigo_ibge": "3205309", "nome": "Vitória", "uf": "ES", "latitude": -20.3155, "longitude": -40.3128},
    {"codigo_ibge": "3304557", "nome": "Rio de Janeiro", "uf": "RJ", "latitude": -22.9028, "longitude": -43.2075},
    {"codigo_ibge": "3550308", "nome": "São Paulo", "uf": "SP", "latitude": -23.5475, "longitude": -46.6361},
    {"codigo_ibge": "4106902", "nome": "Curitiba", "uf": "PR", "latitude": -25.4278, "longitude": -49.2731},
    {"codigo_ibge": "4205407", "nome": "Florianópolis", "uf": "SC", "latitude": -27.5969, "longitude": -48.5495},
    {"codigo_ibge": "4314902", "nome": "Porto Alegre", "uf": "RS", "latitude": -30.0277, "longitude": -51.2287},
    {"codigo_ibge": "5002704", "nome": "Campo Grande", "uf": "MS", "latitude": -20.4428, "longitude": -54.6464},
    {"codigo_ibge": "5103403", "nome": "Cuiabá", "uf": "MT", "latitude": -15.5961, "longitude": -56.0967},
    {"codigo_ibge": "5208707", "nome": "Goiânia", "uf": "GO", "latitude": -16.6799, "longitude": -49.255},
    {"codigo_ibge": "5300108", "nome": "Brasília", "uf": "DF", "latitude": -15.7801, "longitude": -47.9292}
]

# Adding some endemic state cities
endemic_cities = [
    {"codigo_ibge": "2105302", "nome": "Imperatriz", "uf": "MA", "latitude": -5.51833, "longitude": -47.4775},
    {"codigo_ibge": "1506807", "nome": "Santarém", "uf": "PA", "latitude": -2.44306, "longitude": -54.7083},
    {"codigo_ibge": "5107602", "nome": "Rondonópolis", "uf": "MT", "latitude": -16.4708, "longitude": -54.6356},
    {"codigo_ibge": "1702109", "nome": "Araguaína", "uf": "TO", "latitude": -7.19111, "longitude": -48.2072},
    {"codigo_ibge": "2910800", "nome": "Feira de Santana", "uf": "BA", "latitude": -12.2667, "longitude": -38.9667},
    {"codigo_ibge": "2207702", "nome": "Parnaíba", "uf": "PI", "latitude": -2.90472, "longitude": -41.7772},
    {"codigo_ibge": "2602902", "nome": "Cabo de Santo Agostinho", "uf": "PE", "latitude": -8.28333, "longitude": -35.0333},
    {"codigo_ibge": "5201108", "nome": "Anápolis", "uf": "GO", "latitude": -16.3267, "longitude": -48.9528}
]
municipios.extend(endemic_cities)

with open(os.path.join(base_dir, "data", "municipios.json"), "w", encoding="utf-8") as f:
    json.dump(municipios, f, ensure_ascii=False, indent=2)

# 3. models.py
models_code = '''from pydantic import BaseModel
from typing import List, Optional, Dict
from datetime import date

class CasoHanseniase(BaseModel):
    municipio: str
    estado: str
    data_notificacao: date
    faixa_etaria: Optional[str] = None
    sexo: Optional[str] = None
    classificacao_operacional: str
    casos_novos: int
    casos_acompanhamento: Optional[int] = 0
    grau_incapacidade: Optional[int] = None

class UploadResponse(BaseModel):
    success: bool
    message: str
    total_registros: int
    registros_validos: int
    colunas_encontradas: List[str]
    preview: List[dict]

class ResumoAnalytics(BaseModel):
    total_casos: int
    casos_novos: int
    municipios_afetados: int
    variacao_percentual: float
    evolucao_mensal: List[dict]
    distribuicao_classificacao: Dict[str, int]
    distribuicao_faixa_etaria: Dict[str, int]
    top_estados: List[dict]

class MapaPoint(BaseModel):
    municipio: str
    estado: str
    latitude: float
    longitude: float
    total_casos: int
    casos_novos: int

class FilterParams(BaseModel):
    estado: Optional[str] = None
    municipio: Optional[str] = None
    data_inicio: Optional[date] = None
    data_fim: Optional[date] = None
    classificacao: Optional[str] = None
'''
with open(os.path.join(base_dir, "models.py"), "w", encoding="utf-8") as f:
    f.write(models_code)

# 4. services/__init__.py
with open(os.path.join(base_dir, "services", "__init__.py"), "w", encoding="utf-8") as f:
    f.write("")

# 5. services/data_store.py
data_store_code = '''import pandas as pd
from threading import Lock

class DataStore:
    _instance = None
    _lock = Lock()
    
    def __new__(cls):
        with cls._lock:
            if cls._instance is None:
                cls._instance = super(DataStore, cls).__new__(cls)
                cls._instance._data = None
        return cls._instance
    
    def set_data(self, df: pd.DataFrame):
        with self._lock:
            self._data = df.copy()
            
    def get_data(self) -> pd.DataFrame:
        with self._lock:
            if self._data is not None:
                return self._data.copy()
            return pd.DataFrame()
            
    def has_data(self) -> bool:
        with self._lock:
            return self._data is not None
            
    def filter_data(self, estado=None, municipio=None, data_inicio=None, data_fim=None, classificacao=None) -> pd.DataFrame:
        with self._lock:
            if self._data is None:
                return pd.DataFrame()
            
            df = self._data.copy()
            
            if estado:
                df = df[df['estado'] == estado]
            if municipio:
                df = df[df['municipio'] == municipio]
            if data_inicio:
                df = df[df['data_notificacao'] >= pd.to_datetime(data_inicio)]
            if data_fim:
                df = df[df['data_notificacao'] <= pd.to_datetime(data_fim)]
            if classificacao:
                df = df[df['classificacao_operacional'] == classificacao]
                
            return df
            
data_store = DataStore()
'''
with open(os.path.join(base_dir, "services", "data_store.py"), "w", encoding="utf-8") as f:
    f.write(data_store_code)

# 6. services/geocoding.py
geocoding_code = '''import json
import os
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
    if not nome or not uf:
        return None
    
    nome_norm = normalize_string(nome)
    uf_norm = normalize_string(uf)
    
    # Exact match
    for m in municipios_db:
        if normalize_string(m['nome']) == nome_norm and normalize_string(m['uf']) == uf_norm:
            return (m['latitude'], m['longitude'])
            
    # Fuzzy match
    for m in municipios_db:
        if normalize_string(m['uf']) == uf_norm and nome_norm in normalize_string(m['nome']):
            return (m['latitude'], m['longitude'])
            
    return None

def enrich_dataframe(df: pd.DataFrame) -> pd.DataFrame:
    lats = []
    lngs = []
    for _, row in df.iterrows():
        coords = geocode_municipio(row.get('municipio', ''), row.get('estado', ''))
        if coords:
            lats.append(coords[0])
            lngs.append(coords[1])
        else:
            lats.append(None)
            lngs.append(None)
    
    df['latitude'] = lats
    df['longitude'] = lngs
    return df
'''
with open(os.path.join(base_dir, "services", "geocoding.py"), "w", encoding="utf-8") as f:
    f.write(geocoding_code)

# 7. services/excel_parser.py
excel_parser_code = '''import pandas as pd
import io
from unidecode import unidecode
import numpy as np

COLUMN_MAPPING = {
    'municipio': ['municipio', 'município', 'mun', 'nome_municipio', 'municipio_residencia'],
    'estado': ['estado', 'uf', 'sigla_uf', 'estado_residencia', 'uf_residencia'],
    'data_notificacao': ['data_notificacao', 'data_notificação', 'dt_notificacao', 'data_diag', 'data_diagnostico', 'data'],
    'classificacao_operacional': ['classificacao_operacional', 'classificação_operacional', 'classif_op', 'classificacao', 'class_oper', 'tipo'],
    'casos_novos': ['casos_novos', 'casos', 'num_casos', 'qtd_casos', 'quantidade'],
}

OPTIONAL_COLUMNS = {
    'faixa_etaria': ['faixa_etaria', 'faixa_etária', 'idade', 'fx_etaria'],
    'sexo': ['sexo', 'genero', 'gênero'],
    'casos_acompanhamento': ['casos_acompanhamento', 'em_acompanhamento', 'acompanhamento'],
    'grau_incapacidade': ['grau_incapacidade', 'grau_incap', 'incapacidade'],
}

def normalize_col_name(s: str) -> str:
    return unidecode(s).lower().strip().replace(" ", "_")

def parse_excel(contents: bytes) -> tuple:
    df = pd.read_excel(io.BytesIO(contents))
    
    # Normalize column names in df
    orig_cols = list(df.columns)
    norm_cols = [normalize_col_name(c) for c in orig_cols]
    df.columns = norm_cols
    
    mapped_df = pd.DataFrame()
    colunas_encontradas = []
    
    # Map required
    for std_name, variants in COLUMN_MAPPING.items():
        found = False
        for variant in variants:
            norm_var = normalize_col_name(variant)
            if norm_var in df.columns:
                mapped_df[std_name] = df[norm_var]
                colunas_encontradas.append(std_name)
                found = True
                break
        if not found:
            raise ValueError(f"Coluna obrigatória não encontrada: {std_name}")
            
    # Map optional
    for std_name, variants in OPTIONAL_COLUMNS.items():
        for variant in variants:
            norm_var = normalize_col_name(variant)
            if norm_var in df.columns:
                mapped_df[std_name] = df[norm_var]
                colunas_encontradas.append(std_name)
                break
        if std_name not in mapped_df.columns:
            mapped_df[std_name] = np.nan
            
    # Remove empty rows
    mapped_df.dropna(how='all', inplace=True)
    
    # Normalize classificacao
    def norm_classif(val):
        if pd.isna(val): return 'PB'
        val = str(val).upper().strip()
        if 'MB' in val or 'MULT' in val: return 'MB'
        return 'PB'
        
    mapped_df['classificacao_operacional'] = mapped_df['classificacao_operacional'].apply(norm_classif)
    
    # Parse dates
    mapped_df['data_notificacao'] = pd.to_datetime(mapped_df['data_notificacao'], errors='coerce')
    
    # Fill NaN in numeric
    for num_col in ['casos_novos', 'casos_acompanhamento', 'grau_incapacidade']:
        if num_col in mapped_df.columns:
            mapped_df[num_col] = pd.to_numeric(mapped_df[num_col], errors='coerce').fillna(0).astype(int)
            
    # Remove rows with invalid dates
    mapped_df = mapped_df.dropna(subset=['data_notificacao'])
    
    total_registros = len(df)
    registros_validos = len(mapped_df)
    
    metadata = {
        'total_registros': total_registros,
        'registros_validos': registros_validos,
        'colunas_encontradas': colunas_encontradas
    }
    
    return mapped_df, metadata
'''
with open(os.path.join(base_dir, "services", "excel_parser.py"), "w", encoding="utf-8") as f:
    f.write(excel_parser_code)

# 8. services/analytics.py
analytics_code = '''import pandas as pd
from datetime import timedelta

def get_resumo(df: pd.DataFrame) -> dict:
    if df.empty:
        return {
            "total_casos": 0, "casos_novos": 0, "municipios_afetados": 0,
            "variacao_percentual": 0.0, "evolucao_mensal": [],
            "distribuicao_classificacao": {}, "distribuicao_faixa_etaria": {}, "top_estados": []
        }
        
    total_casos = int(df['casos_novos'].sum() + df.get('casos_acompanhamento', pd.Series([0]*len(df))).sum())
    casos_novos = int(df['casos_novos'].sum())
    municipios_afetados = int(df['municipio'].nunique())
    
    # Variacao percentual
    max_date = df['data_notificacao'].max()
    if pd.isna(max_date):
        variacao_percentual = 0.0
    else:
        last_month_start = (max_date.replace(day=1) - pd.DateOffset(months=1)).replace(day=1)
        this_month_start = max_date.replace(day=1)
        last_month_cases = df[(df['data_notificacao'] >= last_month_start) & (df['data_notificacao'] < this_month_start)]['casos_novos'].sum()
        this_month_cases = df[df['data_notificacao'] >= this_month_start]['casos_novos'].sum()
        if last_month_cases > 0:
            variacao_percentual = ((this_month_cases - last_month_cases) / last_month_cases) * 100
        else:
            variacao_percentual = 0.0
            
    # Evolucao mensal
    df_temp = df.copy()
    df_temp['periodo'] = df_temp['data_notificacao'].dt.strftime('%Y-%m')
    evolucao = df_temp.groupby('periodo')['casos_novos'].sum().reset_index()
    evolucao_mensal = [{"periodo": row['periodo'], "casos": int(row['casos_novos'])} for _, row in evolucao.iterrows()]
    evolucao_mensal = sorted(evolucao_mensal, key=lambda x: x['periodo'])
    
    dist_classif = df.groupby('classificacao_operacional')['casos_novos'].sum().to_dict()
    
    dist_idade = {}
    if 'faixa_etaria' in df.columns:
        dist_idade = df.groupby('faixa_etaria')['casos_novos'].sum().to_dict()
        
    top_estados_df = df.groupby('estado')['casos_novos'].sum().reset_index().sort_values('casos_novos', ascending=False).head(10)
    top_estados = [{"estado": row['estado'], "casos": int(row['casos_novos'])} for _, row in top_estados_df.iterrows()]
    
    return {
        "total_casos": total_casos,
        "casos_novos": casos_novos,
        "municipios_afetados": municipios_afetados,
        "variacao_percentual": float(variacao_percentual),
        "evolucao_mensal": evolucao_mensal,
        "distribuicao_classificacao": dist_classif,
        "distribuicao_faixa_etaria": dist_idade,
        "top_estados": top_estados
    }

def get_mapa_data(df: pd.DataFrame) -> list:
    if df.empty or 'latitude' not in df.columns:
        return []
        
    res = df.groupby(['municipio', 'estado', 'latitude', 'longitude']).agg({
        'casos_novos': 'sum'
    }).reset_index()
    
    mapa_points = []
    for _, row in res.iterrows():
        if pd.notna(row['latitude']) and pd.notna(row['longitude']):
            mapa_points.append({
                "municipio": row['municipio'],
                "estado": row['estado'],
                "latitude": float(row['latitude']),
                "longitude": float(row['longitude']),
                "total_casos": int(row['casos_novos']),
                "casos_novos": int(row['casos_novos'])
            })
    return mapa_points
'''
with open(os.path.join(base_dir, "services", "analytics.py"), "w", encoding="utf-8") as f:
    f.write(analytics_code)

# 9. main.py
main_code = '''from fastapi import FastAPI, UploadFile, File, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from datetime import date
from typing import Optional, List
import pandas as pd

from models import UploadResponse, ResumoAnalytics, MapaPoint, FilterParams, CasoHanseniase
from services.data_store import data_store
from services.excel_parser import parse_excel
from services.geocoding import enrich_dataframe
from services.analytics import get_resumo, get_mapa_data

app = FastAPI(title="Painel Hanseníase API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/upload", response_model=UploadResponse)
async def upload_file(file: UploadFile = File(...)):
    if not file.filename.endswith(('.xls', '.xlsx')):
        raise HTTPException(status_code=400, detail="Formato de arquivo inválido. Apenas Excel é permitido.")
        
    contents = await file.read()
    if len(contents) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Arquivo muito grande. Limite é 10MB.")
        
    try:
        df, metadata = parse_excel(contents)
        df = enrich_dataframe(df)
        data_store.set_data(df)
        
        preview = df.head(5).to_dict(orient='records')
        # handle dates and na in preview
        for p in preview:
            if pd.notna(p.get('data_notificacao')):
                p['data_notificacao'] = p['data_notificacao'].strftime('%Y-%m-%d')
            for k, v in p.items():
                if pd.isna(v):
                    p[k] = None
                    
        return UploadResponse(
            success=True,
            message="Arquivo processado com sucesso.",
            total_registros=metadata['total_registros'],
            registros_validos=metadata['registros_validos'],
            colunas_encontradas=metadata['colunas_encontradas'],
            preview=preview
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Erro ao processar arquivo: {str(e)}")

@app.get("/casos")
async def get_casos(
    estado: Optional[str] = None,
    municipio: Optional[str] = None,
    data_inicio: Optional[date] = None,
    data_fim: Optional[date] = None,
    classificacao: Optional[str] = None
):
    if not data_store.has_data():
        raise HTTPException(status_code=400, detail="Nenhum dado carregado. Por favor, faça o upload de uma planilha primeiro.")
        
    df = data_store.filter_data(estado, municipio, data_inicio, data_fim, classificacao)
    records = df.to_dict(orient='records')
    for r in records:
        if pd.notna(r.get('data_notificacao')):
            r['data_notificacao'] = r['data_notificacao'].strftime('%Y-%m-%d')
        for k, v in r.items():
            if pd.isna(v):
                r[k] = None
    return records

@app.get("/analytics/resumo", response_model=ResumoAnalytics)
async def analytics_resumo(
    estado: Optional[str] = None,
    municipio: Optional[str] = None,
    data_inicio: Optional[date] = None,
    data_fim: Optional[date] = None,
    classificacao: Optional[str] = None
):
    if not data_store.has_data():
        raise HTTPException(status_code=400, detail="Nenhum dado carregado.")
        
    df = data_store.filter_data(estado, municipio, data_inicio, data_fim, classificacao)
    return get_resumo(df)

@app.get("/analytics/mapa", response_model=List[MapaPoint])
async def analytics_mapa(
    estado: Optional[str] = None,
    municipio: Optional[str] = None,
    data_inicio: Optional[date] = None,
    data_fim: Optional[date] = None,
    classificacao: Optional[str] = None
):
    if not data_store.has_data():
        raise HTTPException(status_code=400, detail="Nenhum dado carregado.")
        
    df = data_store.filter_data(estado, municipio, data_inicio, data_fim, classificacao)
    return get_mapa_data(df)
'''
with open(os.path.join(base_dir, "main.py"), "w", encoding="utf-8") as f:
    f.write(main_code)

# 10. generate_sample_data.py
generate_sample_data_code = '''import pandas as pd
import numpy as np
import random
from datetime import datetime, timedelta

def generate_sample_data():
    num_rows = 500
    
    municipios = [
        ("São Luís", "MA"), ("Imperatriz", "MA"),
        ("Belém", "PA"), ("Santarém", "PA"),
        ("Cuiabá", "MT"), ("Rondonópolis", "MT"),
        ("Palmas", "TO"), ("Araguaína", "TO"),
        ("Salvador", "BA"), ("Feira de Santana", "BA"),
        ("Teresina", "PI"), ("Parnaíba", "PI"),
        ("Recife", "PE"), ("Cabo de Santo Agostinho", "PE"),
        ("Goiânia", "GO"), ("Anápolis", "GO")
    ]
    
    start_date = datetime(2022, 1, 1)
    end_date = datetime(2024, 12, 31)
    
    faixas = ['0-14', '15-29', '30-44', '45-59', '60+']
    sexos = ['M', 'F']
    classificacoes = ['MB', 'PB']
    
    data = []
    
    for _ in range(num_rows):
        mun_uf = random.choice(municipios)
        
        # Random date
        days_between = (end_date - start_date).days
        random_number_of_days = random.randrange(days_between)
        date = start_date + timedelta(days=random_number_of_days)
        
        row = {
            'município': mun_uf[0],
            'estado': mun_uf[1],
            'data_notificação': date.strftime('%Y-%m-%d'),
            'faixa_etária': random.choice(faixas) if random.random() > 0.1 else None, # 10% missing
            'sexo': random.choices(sexos, weights=[0.55, 0.45])[0] if random.random() > 0.1 else None,
            'classificação_operacional': random.choices(classificacoes, weights=[0.6, 0.4])[0],
            'casos_novos': random.choices(range(1, 16), weights=[15, 10, 8, 5, 5, 3, 3, 2, 2, 1, 1, 1, 1, 1, 1])[0],
            'casos_acompanhamento': random.randint(0, 5),
            'grau_incapacidade': random.choices([0, 1, 2], weights=[0.6, 0.3, 0.1])[0] if random.random() > 0.2 else None
        }
        data.append(row)
        
    df = pd.DataFrame(data)
    df.to_excel("sample_data.xlsx", index=False)
    print("sample_data.xlsx gerado com sucesso!")

if __name__ == "__main__":
    generate_sample_data()
'''
with open(os.path.join(base_dir, "generate_sample_data.py"), "w", encoding="utf-8") as f:
    f.write(generate_sample_data_code)
