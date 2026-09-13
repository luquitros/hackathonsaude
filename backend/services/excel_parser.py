import pandas as pd
import io
import re
from unidecode import unidecode
import numpy as np

COLUMN_MAPPING = {
    'municipio': ['municipio', 'município', 'mun', 'nome_municipio', 'municipio_residencia'],
    'estado': ['estado', 'uf', 'sigla_uf', 'estado_residencia', 'uf_residencia'],
    'latitude': ['latitude', 'lat'],
    'longitude': ['longitude', 'long', 'lng'],
    'data_notificacao': ['data_notificacao', 'data_notificação', 'dt_notificacao', 'data_diag', 'data_diagnostico', 'data'],
    'bimestre': ['bimestre', 'bi', 'periodo', 'período'],
    'classificacao_operacional': ['classificacao_operacional', 'classificação_operacional', 'classif_op', 'classificacao', 'class_oper', 'tipo'],
    'casos_novos': ['casos_novos', 'casos', 'num_casos', 'qtd_casos', 'quantidade'],
    'pb': ['pb', 'paucibacilar', 'paucibacilares'],
    'mb': ['mb', 'multibacilar', 'multibacilares'],
    'tuberculose': ['tuberculose', 'tuberculoide', 'tuberculoide', 'tb'],
    'dimorfa': ['dimorfa'],
    'virchowiana': ['virchowiana'],
    'indeterminada': ['indeterminada', 'inderterminada', 'inderteminada'],
    'menores_de_15': ['menores_de_15', 'menores_de_15_anos', 'menor_de_15', 'menores_15', 'menores_15_anos', 'menores de 15'],
    'grau_incapacidade_2': ['grau_incapacidade_2', 'grau_de_incap_2', 'grau_de_incapacidade_2', 'grau_incp_2', 'incapacidade_grau_2', 'grau de incp 2'],
    # Novos campos da planilha do hackathon
    'id_unidade': ['id_unidade', 'id_und', 'codigo_unidade', 'cod_unidade'],
    'unidade': ['unidade', 'nome_unidade', 'unidade_saude', 'unidade_de_saude', 'und_saude'],
    'bimestre_ordem': ['bimestre_ordem', 'ordem_bimestre', 'bi_ordem'],
    'total_pb_mb': ['total_pb_mb', 'total_pbmb'],
    'total_formas': ['total_formas', 'total_formas_clinicas'],
    'forma_predominante': ['forma_predominante', 'forma_pred', 'forma_clinica_predominante'],
    'tem_casos': ['tem_casos', 'possui_casos'],
    'tem_menor_15': ['tem_menor_15', 'tem_menores_15', 'possui_menor_15'],
    'tem_grau_2': ['tem_grau_2', 'possui_grau_2', 'tem_grau_incap_2'],
}

OPTIONAL_COLUMNS = {
    'faixa_etaria': ['faixa_etaria', 'faixa_etária', 'idade', 'fx_etaria'],
    'sexo': ['sexo', 'genero', 'gênero'],
    'casos_acompanhamento': ['casos_acompanhamento', 'em_acompanhamento', 'acompanhamento'],
    'grau_incapacidade': ['grau_incapacidade', 'grau_incap', 'incapacidade'],
    'bairro': ['bairro', 'nome_bairro', 'bairro_residencia', 'localidade'],
}

def normalize_col_name(s: str) -> str:
    return unidecode(str(s)).lower().strip().replace(" ", "_")


def find_column(df: pd.DataFrame, variants: list[str]) -> str | None:
    normalized = {normalize_col_name(column): column for column in df.columns}
    for variant in variants:
        normalized_variant = normalize_col_name(variant)
        if normalized_variant in normalized:
            return normalized[normalized_variant]
    return None


def numeric_value(value):
    if pd.isna(value) or str(value).strip() == '':
        return np.nan
    return pd.to_numeric(str(value).strip().replace(',', '.'), errors='coerce')


def bimestre_to_date(value):
    if pd.isna(value):
        return pd.NaT

    text = unidecode(str(value)).lower()
    month_starts = {
        'jan': 1, 'fev': 1, 'mar': 3, 'abr': 3,
        'mai': 5, 'jun': 5, 'jul': 7, 'ago': 7,
        'set': 9, 'out': 9, 'nov': 11, 'dez': 11,
    }
    for month_name, month in month_starts.items():
        if month_name in text:
            year_match = re.search(r'(20\d{2})', text)
            year = int(year_match.group(1)) if year_match else 2000
            return pd.Timestamp(year=year, month=month, day=1)

    bimestre_match = re.search(r'(?<!\d)([1-6])(?:[º°o.]|\s|$)', text)
    if not bimestre_match:
        return pd.to_datetime(value, errors='coerce') if not isinstance(value, (int, float)) else pd.NaT

    year_match = re.search(r'(20\d{2})', text)
    year = int(year_match.group(1)) if year_match else 2000
    month = (int(bimestre_match.group(1)) - 1) * 2 + 1
    return pd.Timestamp(year=year, month=month, day=1)


def bimestre_order(value):
    parsed = bimestre_to_date(value)
    return (parsed.month - 1) // 2 + 1 if pd.notna(parsed) else 0

def read_data_sheet(contents: bytes) -> tuple[pd.DataFrame, str]:
    with pd.ExcelFile(io.BytesIO(contents)) as workbook:
        candidates = []
        for sheet_name in workbook.sheet_names:
            header = workbook.parse(sheet_name, nrows=0)
            has_location = any(find_column(header, COLUMN_MAPPING[field]) is not None
                               for field in ('municipio', 'unidade'))
            has_cases = any(find_column(header, COLUMN_MAPPING[field]) is not None
                            for field in ('casos_novos', 'pb', 'mb'))
            if not (has_location and has_cases):
                continue
            has_coordinates = all(find_column(header, COLUMN_MAPPING[field]) is not None
                                  for field in ('latitude', 'longitude'))
            candidates.append((sheet_name, has_coordinates))
        if not candidates:
            raise ValueError('Nenhuma aba contém município ou unidade e contagens de casos novos ou PB/MB.')
        selected = max(candidates, key=lambda candidate: candidate[1])[0]
        return workbook.parse(selected), selected


def parse_excel(contents: bytes) -> tuple:
    df, sheet_name = read_data_sheet(contents)
    df = df.dropna(how='all')
    if df.empty:
        raise ValueError('A planilha não contém registros.')
    
    # Normalize column names in df
    orig_cols = list(df.columns)
    norm_cols = [normalize_col_name(c) for c in orig_cols]
    df.columns = norm_cols
    
    mapped_df = pd.DataFrame()
    colunas_encontradas = []
    
    # Map columns shared by the detailed and bimonthly aggregated layouts.
    for std_name, variants in COLUMN_MAPPING.items():
        source_column = find_column(df, variants)
        if source_column is not None:
            mapped_df[std_name] = df[source_column]
            colunas_encontradas.append(std_name)

    if 'municipio' not in mapped_df.columns:
        # Se tem 'unidade' mas não 'municipio', usar unidade como agrupador
        if 'unidade' in mapped_df.columns:
            mapped_df['municipio'] = mapped_df['unidade']
        else:
            raise ValueError('Coluna obrigatória não encontrada: municipio')

    if 'casos_novos' not in mapped_df.columns:
        if 'pb' in mapped_df.columns or 'mb' in mapped_df.columns:
            pb_values = pd.to_numeric(mapped_df['pb'], errors='coerce').fillna(0) if 'pb' in mapped_df.columns else pd.Series(0, index=mapped_df.index)
            mb_values = pd.to_numeric(mapped_df['mb'], errors='coerce').fillna(0) if 'mb' in mapped_df.columns else pd.Series(0, index=mapped_df.index)
            mapped_df['casos_novos'] = (
                pb_values + mb_values
            )
            colunas_encontradas.append('casos_novos')
        else:
            raise ValueError('Coluna obrigatória não encontrada: casos_novos (ou PB/MB)')

    if 'estado' not in mapped_df.columns:
        mapped_df['estado'] = ''
    if 'classificacao_operacional' not in mapped_df.columns:
        mapped_df['classificacao_operacional'] = 'AGREGADO' if 'pb' in mapped_df.columns or 'mb' in mapped_df.columns else 'NI'
    if 'data_notificacao' not in mapped_df.columns:
        if 'bimestre' in mapped_df.columns:
            mapped_df['data_notificacao'] = mapped_df['bimestre'].apply(bimestre_to_date)
        else:
            mapped_df['data_notificacao'] = pd.Timestamp('2000-01-01')
    if 'bimestre_ordem' not in mapped_df.columns and 'bimestre' in mapped_df.columns:
        mapped_df['bimestre_ordem'] = mapped_df['bimestre'].apply(bimestre_order)
            
    # Map optional
    for std_name, variants in OPTIONAL_COLUMNS.items():
        source_column = find_column(df, variants)
        if source_column is not None:
            mapped_df[std_name] = df[source_column]
            colunas_encontradas.append(std_name)
        if std_name not in mapped_df.columns:
            mapped_df[std_name] = np.nan

    # Ensure all expected numeric/string columns exist
    for std_name in ['pb', 'mb', 'tuberculose', 'dimorfa', 'virchowiana', 'indeterminada',
                     'menores_de_15', 'grau_incapacidade_2', 'id_unidade', 'unidade',
                     'bimestre_ordem', 'total_pb_mb', 'total_formas',
                     'forma_predominante', 'tem_casos', 'tem_menor_15', 'tem_grau_2',
                     'latitude', 'longitude']:
        if std_name not in mapped_df.columns:
            mapped_df[std_name] = np.nan
            
    # Remove empty rows
    mapped_df.dropna(how='all', inplace=True)
    
    # Normalize classificacao
    def norm_classif(val):
        if pd.isna(val): return 'NI'
        val = str(val).upper().strip()
        if val == 'AGREGADO': return val
        if 'MB' in val or 'MULT' in val: return 'MB'
        if 'PB' in val or 'PAUCI' in val: return 'PB'
        return 'NI'
        
    mapped_df['classificacao_operacional'] = mapped_df['classificacao_operacional'].apply(norm_classif)
    
    # Parse dates
    mapped_df['data_notificacao'] = pd.to_datetime(mapped_df['data_notificacao'], errors='coerce')
    
    # Fill NaN in numeric columns
    for num_col in [
        'casos_novos', 'casos_acompanhamento', 'grau_incapacidade', 'pb', 'mb',
        'tuberculose', 'dimorfa', 'virchowiana', 'indeterminada',
        'menores_de_15', 'grau_incapacidade_2', 'bimestre_ordem',
        'total_pb_mb', 'total_formas'
    ]:
        if num_col in mapped_df.columns:
            values = pd.to_numeric(mapped_df[num_col], errors='coerce')
            if ((values.dropna() < 0) | (values.dropna() % 1 != 0) | ~np.isfinite(values.dropna())).any():
                raise ValueError(f'A coluna {num_col} deve conter números inteiros não negativos.')
            if num_col == 'casos_novos' and values.isna().any():
                raise ValueError('A coluna casos_novos contém valores vazios ou inválidos.')
            mapped_df[num_col] = values.fillna(0).astype(int)

    for coordinate in ['latitude', 'longitude']:
        if coordinate in mapped_df.columns:
            mapped_df[coordinate] = mapped_df[coordinate].apply(numeric_value)

    # Normalize boolean-like columns to proper booleans
    for bool_col in ['tem_casos', 'tem_menor_15', 'tem_grau_2']:
        if bool_col in mapped_df.columns:
            mapped_df[bool_col] = mapped_df[bool_col].apply(
                lambda v: True if (not pd.isna(v) and str(v).strip().lower() in ('1', 'true', 'sim', 's', 'yes', 'y')) else False
            )

    # Normalize string columns
    for str_col in ['municipio', 'estado', 'bairro']:
        mapped_df[str_col] = mapped_df[str_col].fillna('').astype(str).str.strip()
    mapped_df['estado'] = mapped_df['estado'].str.upper()
    for flag, count in [('tem_casos', 'casos_novos'), ('tem_menor_15', 'menores_de_15'), ('tem_grau_2', 'grau_incapacidade_2')]:
        mapped_df[flag] = mapped_df[flag] | (mapped_df[count] > 0)
    for str_col in ['id_unidade', 'unidade', 'forma_predominante']:
        if str_col in mapped_df.columns:
            mapped_df[str_col] = mapped_df[str_col].apply(
                lambda v: str(v).strip() if pd.notna(v) and str(v).strip() else None
            )
            
    # Remove rows with invalid dates
    mapped_df = mapped_df.dropna(subset=['data_notificacao'])
    mapped_df = mapped_df[mapped_df['municipio'] != '']
    if mapped_df.empty:
        raise ValueError('Nenhum registro válido. Verifique as localidades e os períodos da planilha.')
    
    total_registros = len(df)
    registros_validos = len(mapped_df)
    
    metadata = {
        'aba_importada': sheet_name,
        'total_registros': total_registros,
        'registros_validos': registros_validos,
        'colunas_encontradas': colunas_encontradas
    }
    
    return mapped_df, metadata
