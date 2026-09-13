import { useMemo, useState } from 'react';
import { ArrowUpRight, Download, MapPin, Search, Target } from 'lucide-react';
import { CasoHanseniase, MapaPoint, ResumoAnalytics } from '../types';

const number = (value: number) => value.toLocaleString('pt-BR');
const percent = (value: number) => `${value.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`;

export function TerritoryOverview({ cases, points, summary, onSelect }: {
  cases: CasoHanseniase[];
  points: MapaPoint[];
  summary: ResumoAnalytics;
  onSelect: (municipio: string, estado: string) => void;
}) {
  const [search, setSearch] = useState('');
  const [showAll, setShowAll] = useState(false);
  const territories = useMemo(() => {
    const grouped = new Map<string, { municipio: string; estado: string; cases: number; mapped: number }>();
    cases.forEach(row => {
      const key = JSON.stringify([row.municipio, row.estado]);
      const item = grouped.get(key) ?? { municipio: row.municipio, estado: row.estado, cases: 0, mapped: 0 };
      item.cases += row.casos_novos;
      grouped.set(key, item);
    });
    points.forEach(point => {
      if (!Number.isFinite(point.latitude) || Math.abs(point.latitude) > 90 || !Number.isFinite(point.longitude) || Math.abs(point.longitude) > 180) return;
      const item = grouped.get(JSON.stringify([point.municipio, point.estado]));
      if (item) item.mapped += point.casos_novos;
    });
    return [...grouped.values()].filter(row => row.cases > 0).sort((a, b) => b.cases - a.cases || a.municipio.localeCompare(b.municipio));
  }, [cases, points]);
  const total = summary.casos_novos;
  const mapped = territories.reduce((sum, row) => sum + row.mapped, 0);
  const leaders = territories.slice(0, 3);
  const concentration = total ? leaders.reduce((sum, row) => sum + row.cases, 0) / total * 100 : 0;
  const normalize = (text: string) => text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const matches = territories.filter(row => normalize(`${row.municipio} ${row.estado}`).includes(normalize(search)));
  const visible = showAll ? matches : matches.slice(0, 5);

  function download() {
    const cell = (value: string | number) => `"${String(value).replace(/^[=+@\-\t\r]/, "'$&").replace(/"/g, '""')}"`;
    const rows = [['Localidade', 'UF', 'Casos novos', 'Participação (%)', 'Casos no mapa'], ...matches.map(row => [row.municipio, row.estado, row.cases, total ? (row.cases / total * 100).toFixed(2) : '0', row.mapped])];
    const url = URL.createObjectURL(new Blob(['\uFEFF' + rows.map(row => row.map(cell).join(';')).join('\r\n')], { type: 'text/csv;charset=utf-8;' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'distribuicao-territorial.csv';
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return <section className="space-y-5" aria-label="Leitura territorial">
    <div className="grid gap-4 md:grid-cols-3">
      <div className="rounded-2xl bg-[#102d35] p-6 text-white">
        <Target size={20} className="mb-4 text-teal-300" />
        <p className="text-xs font-medium text-teal-100">Concentração territorial</p>
        <p className="mt-2 text-3xl font-semibold">{total ? percent(concentration) : '—'}</p>
        <p className="mt-2 text-sm leading-relaxed text-slate-300">{leaders.length ? `dos casos novos nas ${leaders.length} localidades com maior volume do recorte.` : 'Sem casos novos no recorte selecionado.'}</p>
      </div>
      <div className="panel p-6">
        <MapPin size={20} className="mb-4 text-teal-700" />
        <p className="text-xs font-medium text-slate-500">Cobertura dos casos no mapa</p>
        <p className="mt-2 text-3xl font-semibold text-slate-900">{total ? percent(mapped / total * 100) : '—'}</p>
        <p className="mt-2 text-sm text-slate-500">{number(mapped)} de {number(total)} casos novos com localização.</p>
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-teal-600" style={{ width: `${total ? Math.min(100, mapped / total * 100) : 0}%` }} /></div>
      </div>
      <div className="panel p-6">
        <p className="eyebrow mb-3">Leitura para a equipe</p>
        <h2 className="text-lg font-semibold text-slate-900">{leaders[0] ? `${leaders[0].municipio}${leaders[0].estado ? ` / ${leaders[0].estado}` : ''}` : 'Explore outro recorte'}</h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-500">{leaders[0] ? `Maior volume de casos novos: ${number(leaders[0].cases)}. Selecione a localidade na tabela para examinar seus períodos e a distribuição no mapa.` : 'Ajuste os filtros para visualizar a distribuição territorial.'}</p>
        <p className="mt-3 text-xs leading-relaxed text-slate-500">Volume de registros não equivale a risco. A comparação de incidência exige dados populacionais.</p>
      </div>
    </div>
    <div className="panel overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-4 p-5 sm:p-6">
        <div><p className="eyebrow mb-1">Do panorama ao detalhe</p><h2 className="section-title">Explore as localidades</h2><p className="mt-1 text-sm text-slate-500">Ordenadas por casos novos. Clique em uma localidade para filtrar o painel.</p></div>
        <button className="button-secondary" disabled={!matches.length} onClick={download}><Download size={15} /> Exportar tabela CSV</button>
      </div>
      <div className="px-5 pb-4 sm:px-6"><label className="flex max-w-md items-center gap-2 rounded-xl border border-slate-200 px-3 py-2"><Search size={16} className="shrink-0 text-slate-400" /><input aria-label="Buscar localidade ou UF" className="w-full min-w-0 bg-transparent text-sm outline-none" placeholder="Buscar localidade ou UF…" value={search} onChange={event => { setSearch(event.target.value); setShowAll(false); }} /></label></div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs text-slate-500"><tr><th className="px-6 py-3">Localidade / UF</th><th className="px-4 py-3 text-right">Casos novos</th><th className="px-4 py-3">Participação no recorte</th><th className="px-6 py-3 text-right">Cobertura no mapa</th></tr></thead>
          <tbody className="divide-y divide-slate-100">{visible.map(row => <tr key={JSON.stringify([row.municipio, row.estado])} className="hover:bg-teal-50/50">
            <td className="px-6 py-4"><button className="flex items-center gap-2 text-left font-semibold text-teal-800 hover:underline" onClick={() => onSelect(row.municipio, row.estado)}>{row.municipio} <span className="font-normal text-slate-400">{row.estado || 'UF ausente'}</span><ArrowUpRight size={14} className="shrink-0" /></button></td>
            <td className="px-4 py-4 text-right font-semibold tabular-nums text-slate-800">{number(row.cases)}</td>
            <td className="min-w-[160px] px-4 py-4"><div className="flex items-center gap-3"><div className="h-1.5 w-20 rounded-full bg-slate-100"><div className="h-full rounded-full bg-teal-600" style={{ width: `${total ? row.cases / total * 100 : 0}%` }} /></div><span className="tabular-nums text-slate-600">{percent(total ? row.cases / total * 100 : 0)}</span></div></td>
            <td className="px-6 py-4 text-right tabular-nums text-slate-600">{percent(row.mapped / row.cases * 100)}</td>
          </tr>)}</tbody>
        </table>
      </div>
      {!matches.length && <p role="status" className="p-6 text-sm text-slate-500">Nenhuma localidade encontrada. Ajuste a busca ou os filtros.</p>}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-6 py-4 text-xs text-slate-500"><span>{visible.length} de {matches.length} localidades · A exportação inclui todas as linhas da busca.</span>{matches.length > 5 && <button className="button-secondary" aria-expanded={showAll} onClick={() => setShowAll(!showAll)}>{showAll ? 'Mostrar menos' : 'Ver todas as localidades'}</button>}</div>
    </div>
  </section>;
}
