import { useMemo, useState } from 'react';
import { ArrowUpRight, Building2 } from 'lucide-react';
import { CasoHanseniase } from '../types';

export function UnitPriorities({ cases, onSelect }: { cases: CasoHanseniase[]; onSelect: (unit: string, city: string, state: string) => void }) {
  const [order, setOrder] = useState('volume');
  const [showAll, setShowAll] = useState(false);
  const units = useMemo(() => {
    const grouped = new Map<string, { name: string; city: string; state: string; cases: number; children: boolean; grade2: boolean }>();
    cases.forEach(row => {
      if (!row.unidade?.trim()) return;
      const key = JSON.stringify([row.unidade, row.municipio, row.estado]);
      const unit = grouped.get(key) ?? { name: row.unidade, city: row.municipio, state: row.estado, cases: 0, children: false, grade2: false };
      unit.cases += row.casos_novos;
      unit.children ||= row.tem_menor_15 === true || (row.menores_de_15 ?? 0) > 0;
      unit.grade2 ||= row.tem_grau_2 === true || (row.grau_incapacidade_2 ?? 0) > 0 || row.grau_incapacidade === 2;
      grouped.set(key, unit);
    });
    return [...grouped.values()].sort((a, b) => (order === 'signals' ? Number(b.children) + Number(b.grade2) - Number(a.children) - Number(a.grade2) : 0) || b.cases - a.cases || a.name.localeCompare(b.name));
  }, [cases, order]);
  const missing = cases.filter(row => !row.unidade?.trim()).reduce((sum, row) => sum + row.casos_novos, 0);
  const visible = showAll ? units : units.slice(0, 5);
  return <section className="panel overflow-hidden" aria-labelledby="unit-priorities-title">
    <div className="flex flex-wrap items-start justify-between gap-4 p-5 sm:p-6">
      <div className="max-w-2xl"><p className="eyebrow mb-1">Apoio à decisão municipal</p><h2 id="unit-priorities-title" className="section-title flex items-center gap-2"><Building2 size={21} className="text-teal-700" />Quais UBS analisar primeiro?</h2><p className="mt-2 text-sm leading-relaxed text-slate-500">Uma fila de análise para a gestão: compare o volume, confira os sinais informados e abra o recorte da unidade para discutir a distribuição de recursos.</p></div>
      <label className="text-xs font-medium text-slate-500">Ordenar unidades por<select aria-label="Ordenar unidades por" value={order} onChange={event => setOrder(event.target.value)} className="mt-1 block rounded-lg border border-slate-200 bg-white p-2 text-sm text-slate-700"><option value="volume">Maior volume de casos novos</option><option value="signals">Mais tipos de sinais registrados</option></select></label>
    </div>
    <div className="mx-5 mb-4 rounded-xl bg-teal-50 px-4 py-3 text-xs leading-relaxed text-teal-900 sm:mx-6">Critério transparente: {order === 'volume' ? 'casos novos em ordem decrescente.' : 'presença de menores de 15 anos e de grau 2 (até dois tipos); desempate por casos novos.'} Esta ordem organiza a revisão da equipe; não é uma classificação validada de risco ou uma indicação automática de recursos.</div>
    <div className="divide-y divide-slate-100">{visible.map((unit, index) => <article key={JSON.stringify([unit.name, unit.city, unit.state])} className="grid items-start gap-4 px-5 py-5 sm:px-6 lg:grid-cols-[1fr_1fr_auto]">
      <div className="flex gap-3"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-xs font-bold text-slate-500">{index + 1}</span><div><h3 className="font-semibold text-slate-800">{unit.name}</h3><p className="mt-1 text-xs text-slate-500">{unit.city} · {unit.state || 'UF ausente'}</p><p className="mt-2 text-sm text-slate-600"><strong className="text-slate-900">{unit.cases.toLocaleString('pt-BR')}</strong> casos novos</p></div></div>
      <div><div className="flex flex-wrap gap-2">{unit.children && <span className="rounded-full bg-amber-50 px-2 py-1 text-xs text-amber-900">Menores de 15: presença</span>}{unit.grade2 && <span className="rounded-full bg-orange-50 px-2 py-1 text-xs text-orange-900">Grau 2: presença</span>}{!unit.children && !unit.grade2 && <span className="text-xs text-slate-500">Sem esses sinais informados no recorte</span>}</div><p className="mt-2 text-xs leading-relaxed text-slate-500">Pauta para revisão: conferir registros, distribuição temporal e capacidade de atendimento da unidade.</p></div>
      <button className="button-secondary justify-self-start" onClick={() => onSelect(unit.name, unit.city, unit.state)}>Analisar UBS <ArrowUpRight size={14} /></button>
    </article>)}</div>
    {!units.length && <p className="px-6 py-5 text-sm text-slate-500">A base deste recorte não identifica UBS. Importe uma planilha com a coluna unidade para habilitar a comparação.</p>}
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-6 py-4 text-xs leading-relaxed text-slate-500"><p>{units.length} unidades por nome + localidade + UF. {missing > 0 && `${missing.toLocaleString('pt-BR')} casos novos sem unidade informada.`} Sinais indicam presença, não contagem de pessoas; ausência de informação não confirma ausência de casos.</p>{units.length > 5 && <button className="button-secondary" aria-expanded={showAll} onClick={() => setShowAll(!showAll)}>{showAll ? 'Mostrar menos UBS' : 'Ver todas as UBS'}</button>}</div>
  </section>;
}
