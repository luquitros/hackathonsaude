import pandas as pd
from threading import Lock

class DataStore:
    _instance = None
    _lock = Lock()
    
    def __new__(cls):
        with cls._lock:
            if cls._instance is None:
                cls._instance = super(DataStore, cls).__new__(cls)
                cls._instance._data = None
                cls._instance._metadata = {}
        return cls._instance
    
    def set_data(self, df: pd.DataFrame, metadata=None):
        with self._lock:
            self._data = df.copy()
            self._metadata = dict(metadata or {})

    def get_metadata(self) -> dict:
        with self._lock:
            return dict(self._metadata)
            
    def get_data(self) -> pd.DataFrame:
        with self._lock:
            if self._data is not None:
                return self._data.copy()
            return pd.DataFrame()
            
    def has_data(self) -> bool:
        with self._lock:
            return self._data is not None
            
    def filter_data(
        self,
        estado=None,
        municipio=None,
        data_inicio=None,
        data_fim=None,
        classificacao=None,
        bairro=None,
        id_unidade=None,
        unidade=None,
        bimestre=None,
        forma_predominante=None,
        tem_menor_15=None,
        tem_grau_2=None,
    ) -> pd.DataFrame:
        with self._lock:
            if self._data is None:
                return pd.DataFrame()
            
            df = self._data.copy()
            
            if estado:
                df = df[df['estado'] == estado]
            if municipio:
                df = df[df['municipio'] == municipio]
            if bairro and 'bairro' in df.columns:
                df = df[df['bairro'] == bairro]
            if id_unidade and 'id_unidade' in df.columns:
                df = df[df['id_unidade'].astype(str) == str(id_unidade)]
            if unidade and 'unidade' in df.columns:
                df = df[df['unidade'] == unidade]
            if bimestre and 'bimestre' in df.columns:
                df = df[df['bimestre'] == bimestre]
            if forma_predominante and 'forma_predominante' in df.columns:
                df = df[df['forma_predominante'] == forma_predominante]
            if tem_menor_15 and 'tem_menor_15' in df.columns:
                if str(tem_menor_15).lower() in ('true', '1', 'sim'):
                    df = df[df['tem_menor_15'] == True]
            if tem_grau_2 and 'tem_grau_2' in df.columns:
                if str(tem_grau_2).lower() in ('true', '1', 'sim'):
                    df = df[df['tem_grau_2'] == True]
            if data_inicio:
                df = df[df['data_notificacao'] >= pd.to_datetime(data_inicio)]
            if data_fim:
                df = df[df['data_notificacao'] <= pd.to_datetime(data_fim)]
            if classificacao:
                df = df[df['classificacao_operacional'] == classificacao]
                
            return df
            
data_store = DataStore()
