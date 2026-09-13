import axios from 'axios';
import { CasoHanseniase, Filters, MapaPoint, ResumoAnalytics, UploadResponse, AlertaEpidemiologico, UnidadeOption } from '../types';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 30000,
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const detail = error.response?.data?.detail;
    const message = typeof detail === 'string' ? detail
      : Array.isArray(detail) ? detail.map((item: { msg: string }) => item.msg).join('; ')
      : 'Não foi possível conectar ao servidor. Verifique se o backend está em execução e tente novamente.';
    return Promise.reject(new Error(message));
  }
);

export const uploadExcel = async (file: File, demonstracao = false): Promise<UploadResponse> => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('demonstracao', String(demonstracao));
  const response = await api.post('/upload', formData);
  return response.data;
};

export const getExample = async (): Promise<File> => {
  const response = await api.get('/exemplo', { responseType: 'blob' });
  return new File([response.data], 'demonstracao-sintetica.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
};

export const getDatasetStatus = async (): Promise<{ has_data: boolean; filename?: string; demonstracao?: boolean; warnings?: string[] }> => {
  const response = await api.get('/status');
  return response.data;
};

export const getCasos = async (filters?: Partial<Filters>): Promise<CasoHanseniase[]> => {
  const response = await api.get('/casos', { params: filters });
  return response.data;
};

export const getResumo = async (filters?: Partial<Filters>): Promise<ResumoAnalytics> => {
  const response = await api.get('/analytics/resumo', { params: filters });
  return response.data;
};

export const getMapaData = async (filters?: Partial<Filters>): Promise<MapaPoint[]> => {
  const response = await api.get('/analytics/mapa', { params: filters });
  return response.data;
};

export const getAlertas = async (filters?: Partial<Filters>): Promise<AlertaEpidemiologico[]> => {
  const response = await api.get('/analytics/alertas', { params: filters });
  return response.data;
};

export const getBairros = async (filters?: { estado?: string; municipio?: string }): Promise<string[]> => {
  const response = await api.get('/bairros', { params: filters });
  return response.data;
};

export const getUnidades = async (filters?: { estado?: string; municipio?: string }): Promise<UnidadeOption[]> => {
  const response = await api.get('/unidades', { params: filters });
  return response.data;
};
