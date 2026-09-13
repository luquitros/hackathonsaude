export interface CasoHanseniase {
  municipio: string;
  estado: string;
  data_notificacao: string;
  bimestre?: string;
  bairro?: string;
  faixa_etaria?: string;
  sexo?: string;
  classificacao_operacional: string;
  casos_novos: number;
  pb?: number;
  mb?: number;
  total_pb_mb?: number;
  tuberculose?: number;
  dimorfa?: number;
  virchowiana?: number;
  indeterminada?: number;
  total_formas?: number;
  menores_de_15?: number;
  grau_incapacidade_2?: number;
  casos_acompanhamento?: number;
  grau_incapacidade?: number;
  latitude?: number;
  longitude?: number;
  id_unidade?: string;
  unidade?: string;
  bimestre_ordem?: number;
  forma_predominante?: string;
  tem_casos?: boolean;
  tem_menor_15?: boolean;
  tem_grau_2?: boolean;
}

export interface UploadResponse {
  success: boolean;
  message: string;
  total_registros: number;
  registros_validos: number;
  colunas_encontradas: string[];
  preview: Record<string, unknown>[];
  warnings?: string[];
}

export interface ResumoAnalytics {
  total_casos: number;
  casos_novos: number;
  municipios_afetados: number;
  variacao_percentual: number | null;
  evolucao_mensal: { periodo: string; casos: number }[];
  distribuicao_classificacao: Record<string, number>;
  distribuicao_faixa_etaria: Record<string, number>;
  top_estados: { estado: string; casos: number }[];
  top_municipios: { municipio: string; casos: number }[];
}

export interface MapaPoint {
  municipio: string;
  estado: string;
  latitude: number;
  longitude: number;
  total_casos: number;
  casos_novos: number;
}

export interface AlertaEpidemiologico {
  tipo: string;
  severidade: 'atencao' | 'alerta' | 'critico';
  titulo: string;
  mensagem: string;
  valor_calculado: number;
  limiar: number;
}

export interface UnidadeOption {
  id_unidade?: string;
  unidade: string;
}

export interface Filters {
  estado: string;
  municipio: string;
  bairro: string;
  unidade: string;
  bimestre: string;
  forma_predominante: string;
  tem_menor_15: string;
  tem_grau_2: string;
  classificacao: string;
  data_inicio: string;
  data_fim: string;
}
