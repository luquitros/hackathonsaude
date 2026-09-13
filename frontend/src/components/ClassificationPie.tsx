import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface ClassificationPieProps {
  data: Record<string, number>;
}

const COLORS: Record<string, string> = {
  PB: '#0f766e',
  MB: '#f59e0b',
};

const LABELS: Record<string, string> = {
  PB: 'Paucibacilar',
  MB: 'Multibacilar',
  NI: 'Não informada',
};

export const ClassificationPie: React.FC<ClassificationPieProps> = ({ data }) => {
  const chartData = Object.entries(data).map(([name, value]) => ({ name, value }));
  const total = chartData.reduce((sum, d) => sum + d.value, 0);

  return (
    <div className="panel p-5 h-full flex flex-col">
      <h3 className="text-sm font-semibold text-slate-700 mb-4">Classificação Operacional</h3>
      {total === 0 && <p className="text-sm text-slate-500">Sem casos classificados neste recorte.</p>}
      <div className="flex-1 flex flex-wrap items-center">
        <div className="w-full xl:w-1/2">
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={75}
                paddingAngle={3}
                dataKey="value"
                strokeWidth={0}
              >
                {chartData.map((entry) => (
                  <Cell key={entry.name} fill={COLORS[entry.name] || '#94a3b8'} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number) => [value.toLocaleString('pt-BR'), 'Casos']}
                contentStyle={{ borderRadius: '10px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgb(0 0 0 / 0.05)', fontSize: '13px' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="w-full space-y-3 pl-2 xl:w-1/2">
          {chartData.map((entry) => {
            const pct = total > 0 ? ((entry.value / total) * 100).toFixed(1) : '0';
            return (
              <div key={entry.name}>
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[entry.name] || '#94a3b8' }} />
                  <span className="text-xs font-medium text-slate-500">{LABELS[entry.name] || entry.name} ({entry.name})</span>
                </div>
                <p className="text-lg font-bold text-slate-800 ml-[18px]">{entry.value.toLocaleString('pt-BR')} <span className="text-xs font-normal text-slate-400">({pct}%)</span></p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
