from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
import io
import os
from datetime import date
from typing import Optional, List
import pandas as pd

from models import UploadResponse, ResumoAnalytics, MapaPoint, AlertaEpidemiologico
from services.data_store import data_store
from services.excel_parser import parse_excel
from services.geocoding import enrich_dataframe
from services.analytics import get_resumo, get_mapa_data, get_alertas

app = FastAPI(title="Painel Hansen\u00edase API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv('CORS_ORIGINS', 'http://localhost:5173,http://127.0.0.1:5173').split(','),
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


def _build_filter_kwargs(
    estado=None, municipio=None, bairro=None, id_unidade=None, unidade=None,
    bimestre=None, forma_predominante=None, tem_menor_15=None,
    tem_grau_2=None, data_inicio=None, data_fim=None, classificacao=None,
) -> dict:
    """Build keyword args dict for data_store.filter_data, dropping None values."""
    if data_inicio and data_fim and data_inicio > data_fim:
        raise HTTPException(status_code=422, detail='A data inicial deve ser anterior ou igual à data final.')
    if classificacao and 'AGREGADO' in data_store.get_data().get('classificacao_operacional', pd.Series(dtype=str)).values:
        raise HTTPException(status_code=422, detail='Esta base contém contagens PB/MB agregadas. Consulte a distribuição por classificação sem filtrar os registros.')
    return {
        k: v for k, v in dict(
            estado=estado, municipio=municipio, bairro=bairro,
            id_unidade=id_unidade,
            unidade=unidade, bimestre=bimestre,
            forma_predominante=forma_predominante,
            tem_menor_15=tem_menor_15, tem_grau_2=tem_grau_2,
            data_inicio=data_inicio, data_fim=data_fim,
            classificacao=classificacao,
        ).items() if v is not None
    }


@app.post("/upload", response_model=UploadResponse)
async def upload_file(file: UploadFile = File(...), demonstracao: bool = Form(False)):
    if not (file.filename or '').lower().endswith(('.xls', '.xlsx')):
        raise HTTPException(status_code=400, detail="Formato de arquivo inv\u00e1lido. Apenas Excel \u00e9 permitido.")
        
    contents = await file.read(10 * 1024 * 1024 + 1)
    if len(contents) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Arquivo muito grande. Limite \u00e9 10MB.")
        
    try:
        df, metadata = parse_excel(contents)
        df = enrich_dataframe(df)
        warnings = [f"Aba importada: {metadata['aba_importada']}. As demais abas não foram somadas."]
        aggregate = df['classificacao_operacional'].eq('AGREGADO')
        inconsistent = aggregate & ((df['pb'] + df['mb']) != df['casos_novos'])
        if inconsistent.any():
            warnings.append(f'{int(inconsistent.sum())} registros com total PB/MB diferente dos casos novos. O gráfico de classificação usa as contagens PB/MB informadas; o mapa e a evolução usam casos novos.')
        for indicator in ['menores_de_15', 'grau_incapacidade_2']:
            if (df[indicator] > df['casos_novos']).any():
                warnings.append(f'A coluna {indicator} contém contagens maiores que os casos novos. Confira a base antes de interpretar os sinais.')
        unmapped = int(df.loc[df['latitude'].isna() | df['longitude'].isna(), 'casos_novos'].sum())
        if unmapped:
            warnings.append(f'{unmapped} casos novos sem localização. A referência municipal é parcial; informe latitude e longitude para ampliar a cobertura.')
        discarded = metadata['total_registros'] - metadata['registros_validos']
        if discarded:
            warnings.append(f'{discarded} registros descartados por localidade ou data inválida.')
        if df['data_notificacao'].dt.year.eq(2000).any():
            warnings.append('Há períodos sem ano explícito. O ano 2000 é usado apenas como referência interna; informe o ano para comparação temporal.')
        data_store.set_data(df, {'filename': file.filename, 'demonstracao': demonstracao, 'warnings': warnings})
        
        preview = df.head(5).to_dict(orient='records')
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
            preview=preview,
            warnings=warnings,
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Erro ao processar arquivo: {str(e)}")


@app.get('/exemplo')
def example_file():
    cities = [('São Luís', 'MA'), ('Imperatriz', 'MA'), ('Cidelândia', 'MA'), ('Açailândia', 'MA'), ('João Lisboa', 'MA'), ('Davinópolis', 'MA')]
    records = []
    for month in range(1, 7):
        for position, (municipality, state) in enumerate(cities):
            for classification in ['PB', 'MB']:
                cases = 2 + (month * (position + 1)) % 9 + (4 if classification == 'MB' else 0)
                records.append({'municipio': municipality, 'estado': state,
                                'data_notificacao': f'2025-{month:02d}-15',
                                'classificacao_operacional': classification,
                                'casos_novos': cases, 'casos_acompanhamento': position % 3,
                                'menores_de_15': 1 if position % 2 == 0 else 0,
                                'grau_incapacidade_2': 1 if position % 3 == 0 else 0})
    output = io.BytesIO()
    pd.DataFrame(records).to_excel(output, index=False)
    return Response(output.getvalue(), media_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                    headers={'Content-Disposition': 'attachment; filename="demonstracao-sintetica.xlsx"'})


@app.get('/status')
def dataset_status():
    return {'has_data': data_store.has_data(), **data_store.get_metadata()}


@app.get("/bairros")
async def get_bairros(estado: Optional[str] = None, municipio: Optional[str] = None):
    if not data_store.has_data():
        return []
    df = data_store.filter_data(estado=estado, municipio=municipio)
    if 'bairro' not in df.columns:
        return []
    return sorted([b for b in df['bairro'].dropna().unique().tolist() if b])


@app.get("/unidades")
async def get_unidades(estado: Optional[str] = None, municipio: Optional[str] = None):
    """Return distinct unidades de sa\u00fade, optionally filtered by estado/municipio."""
    if not data_store.has_data():
        return []
    df = data_store.filter_data(estado=estado, municipio=municipio)
    if 'unidade' not in df.columns:
        return []
    columns = [column for column in ('id_unidade', 'unidade') if column in df.columns]
    if not columns:
        return []
    options = df[columns].dropna(subset=['unidade'] if 'unidade' in columns else columns).drop_duplicates()
    return options.fillna('').sort_values(columns).to_dict(orient='records')


@app.get("/casos")
async def get_casos(
    estado: Optional[str] = None,
    municipio: Optional[str] = None,
    bairro: Optional[str] = None,
    id_unidade: Optional[str] = None,
    unidade: Optional[str] = None,
    bimestre: Optional[str] = None,
    forma_predominante: Optional[str] = None,
    tem_menor_15: Optional[str] = None,
    tem_grau_2: Optional[str] = None,
    data_inicio: Optional[date] = None,
    data_fim: Optional[date] = None,
    classificacao: Optional[str] = None,
):
    if not data_store.has_data():
        raise HTTPException(status_code=400, detail="Nenhum dado carregado.")
    kwargs = _build_filter_kwargs(
        estado=estado, municipio=municipio, bairro=bairro, id_unidade=id_unidade, unidade=unidade,
        bimestre=bimestre, forma_predominante=forma_predominante,
        tem_menor_15=tem_menor_15, tem_grau_2=tem_grau_2,
        data_inicio=data_inicio, data_fim=data_fim, classificacao=classificacao,
    )
    df = data_store.filter_data(**kwargs)
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
    bairro: Optional[str] = None,
    id_unidade: Optional[str] = None,
    unidade: Optional[str] = None,
    bimestre: Optional[str] = None,
    forma_predominante: Optional[str] = None,
    tem_menor_15: Optional[str] = None,
    tem_grau_2: Optional[str] = None,
    data_inicio: Optional[date] = None,
    data_fim: Optional[date] = None,
    classificacao: Optional[str] = None,
):
    if not data_store.has_data():
        raise HTTPException(status_code=400, detail="Nenhum dado carregado.")
    kwargs = _build_filter_kwargs(
        estado=estado, municipio=municipio, bairro=bairro, id_unidade=id_unidade, unidade=unidade,
        bimestre=bimestre, forma_predominante=forma_predominante,
        tem_menor_15=tem_menor_15, tem_grau_2=tem_grau_2,
        data_inicio=data_inicio, data_fim=data_fim, classificacao=classificacao,
    )
    df = data_store.filter_data(**kwargs)
    return get_resumo(df)


@app.get("/analytics/mapa", response_model=List[MapaPoint])
async def analytics_mapa(
    estado: Optional[str] = None,
    municipio: Optional[str] = None,
    bairro: Optional[str] = None,
    id_unidade: Optional[str] = None,
    unidade: Optional[str] = None,
    bimestre: Optional[str] = None,
    forma_predominante: Optional[str] = None,
    tem_menor_15: Optional[str] = None,
    tem_grau_2: Optional[str] = None,
    data_inicio: Optional[date] = None,
    data_fim: Optional[date] = None,
    classificacao: Optional[str] = None,
):
    if not data_store.has_data():
        raise HTTPException(status_code=400, detail="Nenhum dado carregado.")
    kwargs = _build_filter_kwargs(
        estado=estado, municipio=municipio, bairro=bairro, id_unidade=id_unidade, unidade=unidade,
        bimestre=bimestre, forma_predominante=forma_predominante,
        tem_menor_15=tem_menor_15, tem_grau_2=tem_grau_2,
        data_inicio=data_inicio, data_fim=data_fim, classificacao=classificacao,
    )
    df = data_store.filter_data(**kwargs)
    return get_mapa_data(df)


@app.get("/analytics/alertas", response_model=List[AlertaEpidemiologico])
async def analytics_alertas(
    estado: Optional[str] = None,
    municipio: Optional[str] = None,
    bairro: Optional[str] = None,
    id_unidade: Optional[str] = None,
    unidade: Optional[str] = None,
    bimestre: Optional[str] = None,
    forma_predominante: Optional[str] = None,
    tem_menor_15: Optional[str] = None,
    tem_grau_2: Optional[str] = None,
    data_inicio: Optional[date] = None,
    data_fim: Optional[date] = None,
    classificacao: Optional[str] = None,
):
    if not data_store.has_data():
        return []
    kwargs = _build_filter_kwargs(
        estado=estado, municipio=municipio, bairro=bairro, id_unidade=id_unidade, unidade=unidade,
        bimestre=bimestre, forma_predominante=forma_predominante,
        tem_menor_15=tem_menor_15, tem_grau_2=tem_grau_2,
        data_inicio=data_inicio, data_fim=data_fim, classificacao=classificacao,
    )
    df = data_store.filter_data(**kwargs)
    return get_alertas(df)
