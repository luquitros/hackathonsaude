import React, { useState, useEffect } from 'react';
import { SlidersHorizontal, X, ChevronDown, ChevronUp } from 'lucide-react';
import { Filters as FiltersType } from '../types';
import { getBairros } from '../api/client';
import { UnidadeOption } from '../types';

interface FiltersProps {
  filters: FiltersType;
  setFilters: (filters: FiltersType) => void;
  estados: string[];
  municipios: string[];
  bimestres: string[];
  formasPredominantes: string[];
  unidades: UnidadeOption[];
  aggregated: boolean;
}

const EMPTY_FILTERS: FiltersType = {
  estado: '', municipio: '', bairro: '', unidade: '',
  bimestre: '', forma_predominante: '',
  tem_menor_15: '', tem_grau_2: '',
  classificacao: '', data_inicio: '', data_fim: '',
};

export const Filters: React.FC<FiltersProps> = ({
  filters, setFilters, estados, municipios, bimestres, formasPredominantes, unidades, aggregated,
}) => {
  const [bairros, setBairros] = useState<string[]>([]);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Fetch bairros when estado/municipio change
  useEffect(() => {
    let active = true;
    getBairros({
      estado: filters.estado || undefined,
      municipio: filters.municipio || undefined,
    }).then(data => { if (active) setBairros(data); }).catch(() => { if (active) setBairros([]); });
    return () => { active = false; };
  }, [filters.estado, filters.municipio]);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
    const { name, value } = e.target;
    const updated = { ...filters, [name]: value };
    // Reset dependents in cascade
    if (name === 'estado') {
      updated.municipio = '';
      updated.bairro = '';
      updated.unidade = '';
    }
    if (name === 'municipio') {
      updated.bairro = '';
      updated.unidade = '';
    }
    setFilters(updated);
  };

  const handleClear = () => setFilters({ ...EMPTY_FILTERS });

  const hasActiveFilters = Object.values(filters).some(v => v !== '');
  const advancedActive = !!(filters.unidade || filters.bimestre || filters.forma_predominante || filters.tem_menor_15 || filters.tem_grau_2);

  const selectClass = 'w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-colors';
  const labelClass = 'block text-xs font-medium text-slate-500 mb-1.5 uppercase tracking-wide';

  return (
    <div className="panel">
      {/* Header */}
      <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-slate-400" />
          <span className="text-sm font-medium text-slate-700">Filtros</span>
          {hasActiveFilters && (
            <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full font-semibold">
              {Object.values(filters).filter(v => v !== '').length}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {hasActiveFilters && (
            <button
              onClick={handleClear}
              className="flex items-center gap-1 text-xs font-medium text-slate-400 hover:text-red-500 transition-colors"
            >
              <X className="h-3 w-3" /> Limpar
            </button>
          )}
          <button
            aria-expanded={showAdvanced}
            onClick={() => setShowAdvanced(!showAdvanced)}
            className={`flex items-center gap-1 text-xs font-medium transition-colors ${
              advancedActive ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            {showAdvanced ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            Avançados
          </button>
        </div>
      </div>

      {/* Primary filters row */}
      <div className="px-5 py-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div>
          <label htmlFor="filter-estado" className={labelClass}>Estado</label>
          <select id="filter-estado" name="estado" value={filters.estado} onChange={handleChange} className={selectClass}>
            <option value="">Todos</option>
            {estados.map((uf) => <option key={uf} value={uf}>{uf}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="filter-municipio" className={labelClass}>Localidade</label>
          <select id="filter-municipio" name="municipio" value={filters.municipio} onChange={handleChange} className={selectClass}>
            <option value="">Todos</option>
            {municipios.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="filter-bairro" className={labelClass}>Bairro</label>
          <select id="filter-bairro" name="bairro" value={filters.bairro} onChange={handleChange} className={selectClass}>
            <option value="">Todos</option>
            {bairros.map((b) => <option key={b} value={b}>{b}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="filter-classificacao" className={labelClass}>Classificação</label>
          <select id="filter-classificacao" name="classificacao" disabled={aggregated} title={aggregated ? 'A base contém contagens PB/MB agregadas; consulte o gráfico de classificação.' : undefined} value={filters.classificacao} onChange={handleChange} className={selectClass}>
            <option value="">{aggregated ? 'Base agregada' : 'Todas'}</option>
            <option value="PB">PB — Paucibacilar</option>
            <option value="MB">MB — Multibacilar</option>
          </select>
        </div>
        <div>
          <label htmlFor="filter-data_inicio" className={labelClass}>De</label>
          <input type="date" id="filter-data_inicio" name="data_inicio" max={filters.data_fim || undefined} value={filters.data_inicio} onChange={handleChange} className={selectClass} />
        </div>
        <div>
          <label htmlFor="filter-data_fim" className={labelClass}>Até</label>
          <input type="date" id="filter-data_fim" name="data_fim" min={filters.data_inicio || undefined} value={filters.data_fim} onChange={handleChange} className={selectClass} />
        </div>
      </div>

      {/* Advanced filters (collapsible) */}
      {showAdvanced && (
        <div className="px-5 pb-4 pt-0 border-t border-slate-100">
          <div className="pt-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <div>
              <label htmlFor="filter-unidade" className={labelClass}>Unidade de Saúde</label>
              <select id="filter-unidade" name="unidade" value={filters.unidade} onChange={handleChange} className={selectClass}>
                <option value="">Todas</option>
                {unidades.map((u) => (
                  <option key={`${u.id_unidade ?? ''}-${u.unidade}`} value={u.unidade}>
                    {u.id_unidade ? `${u.id_unidade} — ${u.unidade}` : u.unidade}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="filter-bimestre" className={labelClass}>Bimestre</label>
              <select id="filter-bimestre" name="bimestre" value={filters.bimestre} onChange={handleChange} className={selectClass}>
                <option value="">Todos</option>
                {bimestres.map((b) => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="filter-forma_predominante" className={labelClass}>Forma Clínica</label>
              <select id="filter-forma_predominante" name="forma_predominante" value={filters.forma_predominante} onChange={handleChange} className={selectClass}>
                <option value="">Todas</option>
                {formasPredominantes.map((f) => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="filter-tem_menor_15" className={labelClass}>Menores de 15</label>
              <select id="filter-tem_menor_15" name="tem_menor_15" value={filters.tem_menor_15} onChange={handleChange} className={selectClass}>
                <option value="">Todos</option>
                <option value="true">Somente com casos</option>
              </select>
            </div>
            <div>
              <label htmlFor="filter-tem_grau_2" className={labelClass}>Grau Incap. 2</label>
              <select id="filter-tem_grau_2" name="tem_grau_2" value={filters.tem_grau_2} onChange={handleChange} className={selectClass}>
                <option value="">Todos</option>
                <option value="true">Somente com grau 2</option>
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
