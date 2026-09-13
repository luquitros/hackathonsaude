from pydantic import BaseModel
from typing import List, Optional, Dict
from datetime import date

class CasoHanseniase(BaseModel):
    municipio: str
    estado: str = ''
    data_notificacao: date
    bimestre: Optional[str] = None
    bairro: Optional[str] = None
    faixa_etaria: Optional[str] = None
    sexo: Optional[str] = None
    classificacao_operacional: str
    casos_novos: int
    pb: Optional[int] = 0
    mb: Optional[int] = 0
    total_pb_mb: Optional[int] = 0
    tuberculose: Optional[int] = 0
    dimorfa: Optional[int] = 0
    virchowiana: Optional[int] = 0
    indeterminada: Optional[int] = 0
    total_formas: Optional[int] = 0
    menores_de_15: Optional[int] = 0
    grau_incapacidade_2: Optional[int] = 0
    casos_acompanhamento: Optional[int] = 0
    grau_incapacidade: Optional[int] = None
    id_unidade: Optional[str] = None
    unidade: Optional[str] = None
    bimestre_ordem: Optional[int] = None
    forma_predominante: Optional[str] = None
    tem_casos: Optional[bool] = None
    tem_menor_15: Optional[bool] = None
    tem_grau_2: Optional[bool] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None

class UploadResponse(BaseModel):
    success: bool
    message: str
    total_registros: int
    registros_validos: int
    colunas_encontradas: List[str]
    preview: List[dict]
    warnings: List[str] = []

class ResumoAnalytics(BaseModel):
    total_casos: int
    casos_novos: int
    municipios_afetados: int
    variacao_percentual: Optional[float]
    evolucao_mensal: List[dict]
    distribuicao_classificacao: Dict[str, int]
    distribuicao_faixa_etaria: Dict[str, int]
    top_estados: List[dict]
    top_municipios: List[dict]

class MapaPoint(BaseModel):
    municipio: str
    estado: str
    latitude: float
    longitude: float
    total_casos: int
    casos_novos: int

class AlertaEpidemiologico(BaseModel):
    tipo: str
    severidade: str  # "atencao" | "alerta" | "critico"
    titulo: str
    mensagem: str
    valor_calculado: float
    limiar: float

class FilterParams(BaseModel):
    estado: Optional[str] = None
    municipio: Optional[str] = None
    bairro: Optional[str] = None
    id_unidade: Optional[str] = None
    unidade: Optional[str] = None
    bimestre: Optional[str] = None
    forma_predominante: Optional[str] = None
    tem_menor_15: Optional[str] = None
    tem_grau_2: Optional[str] = None
    data_inicio: Optional[date] = None
    data_fim: Optional[date] = None
    classificacao: Optional[str] = None
