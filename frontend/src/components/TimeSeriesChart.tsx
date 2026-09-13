import React, { useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface TimeSeriesChartProps {
  data: { periodo: string; casos: number }[];
}

export const TimeSeriesChart: React.FC<TimeSeriesChartProps> = ({ data }) => {
  const [cumulative, setCumulative] = useState(false);
  let accumulated = 0;
  const chartData = data.map(row => { accumulated += row.casos; return { ...row, casos: cumulative ? accumulated : row.casos }; });
  return (
    <div className="panel p-5 h-full flex flex-col">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3"><div><p className="eyebrow mb-1">Evolução temporal</p><h3 className="text-sm font-semibold text-slate-700">{cumulative ? 'Casos novos acumulados no recorte' : 'Casos novos por período'}</h3></div><div className="flex gap-1" role="group" aria-label="Visualização da série temporal"><button className="button-secondary" aria-pressed={!cumulative} onClick={() => setCumulative(false)}>Por período</button><button className="button-secondary" aria-pressed={cumulative} onClick={() => setCumulative(true)}>Acumulado</button></div></div>
      <p className="mb-4 text-xs text-slate-500">{data.length ? `${data.length} períodos com registros · ${accumulated.toLocaleString('pt-BR')} casos novos no recorte. Intervalos sem registros não são preenchidos com zero.` : 'Sem registros temporais para os filtros selecionados.'}</p>
      <div className="h-[280px] min-w-0">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="gradientCasos" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#0f766e" stopOpacity={0.15} />
                <stop offset="100%" stopColor="#0f766e" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis dataKey="periodo" stroke="#94a3b8" fontSize={11} tickFormatter={value => String(value).split('-').reverse().join('/')} tickMargin={8} axisLine={false} tickLine={false} />
            <YAxis allowDecimals={false} stroke="#94a3b8" fontSize={11} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{ borderRadius: '10px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgb(0 0 0 / 0.05)', fontSize: '13px' }}
              formatter={(value: number) => [value.toLocaleString('pt-BR'), 'Casos']}
              labelStyle={{ color: '#475569', fontWeight: 600, marginBottom: '2px' }}
            />
            <Area type="linear" dataKey="casos" stroke="#0f766e" strokeWidth={2} fill="url(#gradientCasos)" dot={false} activeDot={{ r: 4, strokeWidth: 0 }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
