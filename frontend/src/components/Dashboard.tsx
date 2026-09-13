import React, { useState, useEffect, useMemo } from 'react';
import { Filters } from './Filters';
import { SummaryCards } from './SummaryCards';
import { TimeSeriesChart } from './TimeSeriesChart';
import { BarChartByState } from './BarChartByState';
import { ClassificationPie } from './ClassificationPie';
import { HeatMap } from './HeatMap';
import { EpidemicAlertBanner } from './EpidemicAlertBanner';
import { TerritoryOverview } from './TerritoryOverview';
import { UnitPriorities } from './UnitPriorities';
import { getResumo, getMapaData, getCasos, getAlertas, getDatasetStatus } from '../api/client';
import { Filters as FiltersType, ResumoAnalytics, MapaPoint, CasoHanseniase, AlertaEpidemiologico, UnidadeOption } from '../types';
import { AlertCircle, Monitor, SlidersHorizontal, X } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Dashboard: React.FC = () => {
  const [filters, setFilters] = useState<FiltersType>({
    estado: '',
    municipio: '',
    bairro: '',
    unidade: '',
    bimestre: '',
    forma_predominante: '',
    tem_menor_15: '',
    tem_grau_2: '',
    classificacao: '',
    data_inicio: '',
    data_fim: '',
  });

  const [resumo, setResumo] = useState<ResumoAnalytics | null>(null);
  const [mapaData, setMapaData] = useState<MapaPoint[]>([]);
  const [alertas, setAlertas] = useState<AlertaEpidemiologico[]>([]);
  const [loading, setLoading] = useState(true);
  const [filteredCases, setFilteredCases] = useState<CasoHanseniase[]>([]);
  const [presenting, setPresenting] = useState(false);
  const [showFilters, setShowFilters] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retry, setRetry] = useState(0);
  const [dataset, setDataset] = useState<Awaited<ReturnType<typeof getDatasetStatus>> | null>(null);

  // Load all cases once (unfiltered) for filter dropdown options
  const [allCasos, setAllCasos] = useState<CasoHanseniase[]>([]);

  useEffect(() => {
    let active = true;
    Promise.all([getCasos(), getDatasetStatus()]).then(([data, status]) => {
      if (active) { setAllCasos(data); setDataset(status); }
    }).catch(() => {});
    return () => { active = false; };
  }, [retry]);

  // Derive dropdown options from allCasos
  const estados = useMemo(() => {
    const set = new Set(allCasos.map(c => c.estado).filter(Boolean));
    return Array.from(set).sort();
  }, [allCasos]);

  const municipios = useMemo(() => {
    const source = filters.estado ? allCasos.filter(c => c.estado === filters.estado) : allCasos;
    const set = new Set(source.map(c => c.municipio).filter(Boolean));
    return Array.from(set).sort();
  }, [allCasos, filters.estado]);

  const bimestres = useMemo(() => {
    const items = allCasos
      .filter(c => c.bimestre)
      .sort((a, b) => (a.bimestre_ordem ?? 0) - (b.bimestre_ordem ?? 0));
    const seen = new Set<string>();
    const result: string[] = [];
    for (const c of items) {
      if (c.bimestre && !seen.has(c.bimestre)) {
        seen.add(c.bimestre);
        result.push(c.bimestre);
      }
    }
    return result;
  }, [allCasos]);

  const formasPredominantes = useMemo(() => {
    const set = new Set(allCasos.map(c => c.forma_predominante).filter((f): f is string => !!f));
    return Array.from(set).sort();
  }, [allCasos]);

  const unidades = useMemo<UnidadeOption[]>(() => {
    const source = allCasos.filter((caso) => {
      return (!filters.estado || caso.estado === filters.estado)
        && (!filters.municipio || caso.municipio === filters.municipio);
    });
    const unique = new Map<string, UnidadeOption>();
    source.forEach((caso) => {
      if (caso.unidade) {
        const key = `${caso.id_unidade ?? ''}-${caso.unidade}`;
        unique.set(key, { id_unidade: caso.id_unidade, unidade: caso.unidade });
      }
    });
    return Array.from(unique.values()).sort((a, b) => a.unidade.localeCompare(b.unidade));
  }, [allCasos, filters.estado, filters.municipio]);

  // Fetch filtered data whenever filters change
  useEffect(() => {
    let active = true;
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        if (filters.data_inicio && filters.data_fim && filters.data_inicio > filters.data_fim) {
          throw new Error('A data inicial deve ser anterior ou igual à data final.');
        }
        const activeFilters = Object.fromEntries(
          Object.entries(filters).filter(([, v]) => v !== '')
        );

        const [resumoData, mapData, alertasData, casesData] = await Promise.all([
          getResumo(activeFilters),
          getMapaData(activeFilters),
          getAlertas(activeFilters),
          getCasos(activeFilters),
        ]);

        if (!active) return;
        setResumo(resumoData);
        setMapaData(mapData);
        setAlertas(alertasData);
        setFilteredCases(casesData);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Erro ao carregar dados.';
        if (active) setError(message);
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchData();
    return () => { active = false; };
  }, [filters, retry]);

  return (
    <div className={`flex flex-col gap-5 ${presenting ? 'presentation-dashboard' : ''}`}>
      <div className="flex flex-wrap items-end justify-between gap-4 pb-2">
        <div><p className="eyebrow mb-2">Vigilância territorial inteligente</p><h1 className="text-3xl font-semibold tracking-tight text-slate-900">Do dado à leitura do território</h1><p className="mt-2 text-sm text-slate-500">Localize concentrações, acompanhe períodos e explore os sinais do recorte.</p></div>
        <div className="flex flex-wrap gap-2"><button className="button-secondary" aria-pressed={presenting} onClick={() => { setPresenting(!presenting); setShowFilters(presenting); }}><Monitor size={16} />{presenting ? 'Sair da apresentação' : 'Modo apresentação'}</button><Link to="/" className="button-secondary">Importar nova base</Link></div>
      </div>
      <div className="flex flex-wrap items-center gap-2"><button className="button-secondary" aria-expanded={showFilters} aria-controls="dashboard-filters" onClick={() => setShowFilters(!showFilters)}><SlidersHorizontal size={15} />{showFilters ? 'Recolher filtros' : 'Abrir filtros'}</button><span className="text-xs text-slate-500">{Object.values(filters).some(Boolean) ? 'Recorte ativo:' : 'Toda a base · sem filtros aplicados'}</span>{Object.entries(filters).filter(([, value]) => value).map(([key, value]) => <span key={key} className="rounded-full bg-teal-50 px-3 py-1 text-xs font-medium text-teal-800">{({ estado: 'UF', municipio: 'Localidade', bairro: 'Bairro', unidade: 'Unidade', bimestre: 'Bimestre', forma_predominante: 'Forma', tem_menor_15: 'Menores de 15', tem_grau_2: 'Grau 2', classificacao: 'Classificação', data_inicio: 'De', data_fim: 'Até' } as Record<string, string>)[key]}: {value === 'true' ? 'Sim' : value}</span>)}{Object.values(filters).some(Boolean) && <button className="button-secondary" onClick={() => setFilters(Object.fromEntries(Object.keys(filters).map(key => [key, ''])) as unknown as FiltersType)}><X size={14} />Limpar recorte</button>}</div>
      <div id="dashboard-filters" hidden={!showFilters}><Filters
        filters={filters}
        setFilters={setFilters}
        estados={estados}
        municipios={municipios}
        bimestres={bimestres}
        formasPredominantes={formasPredominantes}
        unidades={unidades}
        aggregated={allCasos.some(caso => caso.classificacao_operacional === 'AGREGADO')}
      /></div>

      {dataset && !error && <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500"><span className={`rounded-full px-3 py-1 font-semibold ${dataset.demonstracao ? 'bg-amber-100 text-amber-800' : 'bg-teal-50 text-teal-800'}`}>{dataset.demonstracao ? 'Demonstração · dados sintéticos' : 'Base importada'}</span><span className="break-all">{dataset.filename}</span></div>}
      {!!dataset?.warnings?.length && !error && <details className="panel p-4 text-xs text-slate-600"><summary className="cursor-pointer font-semibold">Qualidade da importação · {dataset.warnings.length} observações</summary><ul className="mt-3 list-disc space-y-2 pl-5">{dataset.warnings.map(warning => <li key={warning}>{warning}</li>)}</ul></details>}

      {error && <div role="alert" className="panel flex flex-wrap items-center gap-3 p-5 text-sm text-slate-600"><AlertCircle className="text-amber-600" size={20} /><span className="flex-1">{error}</span><button className="button-secondary" onClick={() => setRetry(value => value + 1)}>Tentar novamente</button><Link to="/" className="button-primary">Importar dados</Link></div>}

      {/* Epidemic alert banners — above summary cards for visibility */}
      {!loading && !error && <EpidemicAlertBanner alertas={alertas} />}

      {!error && <SummaryCards data={resumo} loading={loading} />}

      {loading ? (
        <div role="status" aria-label="Carregando indicadores" className="w-full flex justify-center py-16">
          <div className="w-8 h-8 border-2 border-slate-200 border-t-teal-600 rounded-full animate-spin" />
        </div>
      ) : !error && (
        <>
          {/* Map full width */}
          {resumo?.casos_novos === 0 && <div role="status" className="panel p-5 text-sm text-slate-500">Nenhum caso novo neste recorte. Ajuste ou limpe os filtros para explorar a base.</div>}
          <UnitPriorities cases={filteredCases} onSelect={(unidade, municipio, estado) => setFilters(previous => ({ ...previous, unidade, municipio, estado, bairro: '' }))} />
          {resumo && <TerritoryOverview cases={filteredCases} points={mapaData} summary={resumo} onSelect={(municipio, estado) => { setFilters(previous => ({ ...previous, municipio, estado, bairro: '', unidade: '' })); }} />}
          <HeatMap data={mapaData} totalCasos={resumo?.casos_novos ?? 0} />

          {/* Charts row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <div className="lg:col-span-2">
              <TimeSeriesChart data={resumo?.evolucao_mensal || []} />
            </div>
            <div>
              <ClassificationPie data={resumo?.distribuicao_classificacao || {}} />
            </div>
          </div>

          {/* Bottom: Top Municipios */}
          <BarChartByState data={resumo?.top_municipios || []} />
        </>
      )}
    </div>
  );
};
