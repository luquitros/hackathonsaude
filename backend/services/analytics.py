import pandas as pd
from services.geocoding import valid_coordinates

LIMIAR_AUMENTO_CASOS = 0.5
LIMIAR_MENORES_15 = 0.10
LIMIAR_GRAU_INCAPACIDADE_2 = 0.10
LIMIAR_ALTA_CARGA_MB = 0.60
LIMIAR_CLUSTER_GEOGRAFICO = 0.40


def get_resumo(df: pd.DataFrame) -> dict:
    if df.empty:
        return {
            "total_casos": 0, "casos_novos": 0, "municipios_afetados": 0,
            "variacao_percentual": None, "evolucao_mensal": [],
            "distribuicao_classificacao": {}, "distribuicao_faixa_etaria": {},
            "top_estados": [], "top_municipios": [],
        }

    cases = int(df['casos_novos'].sum())
    monthly = df.groupby(df['data_notificacao'].dt.to_period('M'))['casos_novos'].sum().sort_index()
    variation = None
    has_bimesters = 'bimestre' in df.columns and df['bimestre'].notna().any()
    if not has_bimesters and len(monthly) >= 2:
        last_period = monthly.index[-1]
        previous = monthly.get(last_period - 1, 0)
        if previous > 0:
            variation = float((monthly.iloc[-1] - previous) / previous * 100)

    detailed = df[df['classificacao_operacional'] != 'AGREGADO']
    distribution = detailed.groupby('classificacao_operacional')['casos_novos'].sum().astype(int).to_dict()
    aggregated = df[df['classificacao_operacional'] == 'AGREGADO']
    if not aggregated.empty:
        for classification in ['PB', 'MB']:
            distribution[classification] = int(distribution.get(classification, 0) + aggregated[classification.lower()].sum())
        unclassified = int(aggregated['casos_novos'].sum() - aggregated[['pb', 'mb']].sum().sum())
        if unclassified > 0:
            distribution['NI'] = int(distribution.get('NI', 0) + unclassified)

    localities = df.groupby(['municipio', 'estado'])['casos_novos'].sum().sort_values(ascending=False)
    states = df.groupby('estado')['casos_novos'].sum().sort_values(ascending=False).head(10)
    return {
        "total_casos": int(cases + df.get('casos_acompanhamento', pd.Series(dtype=float)).sum()),
        "casos_novos": cases,
        "municipios_afetados": int((localities > 0).sum()),
        "variacao_percentual": variation,
        "evolucao_mensal": [
            {"periodo": str(period) if period.year != 2000 else f"{(period.month - 1) // 2 + 1}º bim. (ano NI)", "casos": int(count)}
            for period, count in monthly.items()
        ],
        "distribuicao_classificacao": distribution,
        "distribuicao_faixa_etaria": df.groupby('faixa_etaria')['casos_novos'].sum().astype(int).to_dict() if 'faixa_etaria' in df.columns else {},
        "top_estados": [{"estado": state, "casos": int(count)} for state, count in states.items()],
        "top_municipios": [{"municipio": f"{municipality} · {state}" if state else municipality, "casos": int(count)} for (municipality, state), count in localities.head(10).items()],
    }


def get_mapa_data(df: pd.DataFrame) -> list:
    if df.empty or not {'latitude', 'longitude'}.issubset(df.columns):
        return []
    valid = df.apply(lambda row: valid_coordinates(row['latitude'], row['longitude']), axis=1)
    source = df.loc[valid].copy()
    source['latitude'] = source['latitude'].astype(float)
    source['longitude'] = source['longitude'].astype(float)
    grouped = source.groupby(['municipio', 'estado', 'latitude', 'longitude'])['casos_novos'].sum()
    return [
        {"municipio": municipality, "estado": state, "latitude": latitude, "longitude": longitude,
         "total_casos": int(count), "casos_novos": int(count)}
        for (municipality, state, latitude, longitude), count in grouped.items() if count > 0
    ]


def get_alertas(df: pd.DataFrame) -> list:
    if df.empty or df['casos_novos'].sum() <= 0:
        return []
    alerts = []
    total = int(df['casos_novos'].sum())

    def append_signal(kind, title, message, percentage, threshold):
        alerts.append({
            "tipo": kind, "severidade": "atencao", "titulo": title,
            "mensagem": message, "valor_calculado": round(float(percentage), 1),
            "limiar": threshold * 100,
        })

    for column, kind, title, threshold in [
        ('menores_de_15', 'transmissao_infantil', 'Registros em menores de 15 anos', LIMIAR_MENORES_15),
        ('grau_incapacidade_2', 'diagnostico_tardio', 'Registros com grau de incapacidade 2', LIMIAR_GRAU_INCAPACIDADE_2),
    ]:
        if column not in df.columns:
            continue
        count = int(df[column].fillna(0).sum())
        proportion = count / total
        if threshold <= proportion <= 1:
            append_signal(kind, title,
                          f"{count} de {total} casos novos ({proportion * 100:.1f}%) no recorte. "
                          "O percentual usa todos os casos novos como denominador; confira a completude dos registros. "
                          "O limiar é exploratório e deve ser validado pela equipe.",
                          proportion * 100, threshold)

    distribution = get_resumo(df)['distribuicao_classificacao']
    classified = distribution.get('PB', 0) + distribution.get('MB', 0)
    if classified and distribution.get('MB', 0) / classified >= LIMIAR_ALTA_CARGA_MB:
        proportion = distribution['MB'] / classified
        append_signal('alta_carga_mb', 'Predomínio de registros multibacilares',
                      f"{distribution['MB']} de {classified} casos classificados ({proportion * 100:.1f}%) são MB. "
                      "Compare com o histórico local e confira a completude da classificação.",
                      proportion * 100, LIMIAR_ALTA_CARGA_MB)

    if 'bimestre' in df.columns and df['bimestre'].notna().any():
        periods = df.groupby(df['data_notificacao'].dt.to_period('2M'))['casos_novos'].sum().sort_index()
        candidates = []
        for position in range(1, len(periods)):
            previous, current = periods.iloc[position - 1], periods.iloc[position]
            consecutive = periods.index[position].ordinal - periods.index[position - 1].ordinal == 2
            if consecutive and previous > 0 and (current - previous) / previous >= LIMIAR_AUMENTO_CASOS:
                candidates.append(((current - previous) / previous, periods.index[position - 1], periods.index[position], previous, current))
        if candidates:
            increase, previous_period, current_period, previous, current = max(candidates, key=lambda candidate: candidate[0])
            append_signal('aumento_casos', 'Variação entre períodos consecutivos',
                          f"Os registros passaram de {int(previous)} para {int(current)} casos entre os períodos "
                          f"{previous_period} e {current_period} ({increase * 100:.1f}%). "
                          "Confira mudanças na cobertura, no registro e no período de comparação antes de interpretar.",
                          increase * 100, LIMIAR_AUMENTO_CASOS)

    localities = df.groupby(['municipio', 'estado'])['casos_novos'].sum()
    if total >= 5 and len(localities) > 1 and localities.max() / total >= LIMIAR_CLUSTER_GEOGRAFICO:
        municipality, state = localities.idxmax()
        count = int(localities.max())
        append_signal('cluster_geografico', 'Concentração territorial de registros',
                      f"{municipality} {state} reúne {count} de {total} casos novos ({count / total * 100:.1f}%) do recorte. "
                      "Contagens absolutas dependem da população e da cobertura dos serviços; não confirmam um cluster epidemiológico.",
                      count / total * 100, LIMIAR_CLUSTER_GEOGRAFICO)
    return sorted(alerts, key=lambda alert: alert['valor_calculado'] / alert['limiar'], reverse=True)
