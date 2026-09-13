import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Text } from 'recharts';

interface BarChartByMunicipioProps {
  data: { municipio: string; casos: number }[];
}

export const BarChartByState: React.FC<BarChartByMunicipioProps> = ({ data }) => {
  const maxCasos = data.length > 0 ? Math.max(...data.map(d => d.casos)) : 0;
  const longestName = Math.max(0, ...data.map(item => item.municipio.length));
  const rowHeight = Math.max(56, Math.ceil(longestName / 30) * 18 + 24);
  const chartHeight = Math.max(360, data.length * rowHeight + 40);

  const getColor = (casos: number) => {
    if (maxCasos === 0) return '#3b82f6';
    const ratio = casos / maxCasos;
    if (ratio > 0.75) return '#115e59';
    if (ratio > 0.5) return '#0f766e';
    if (ratio > 0.25) return '#0d9488';
    return '#2dd4bf';
  };

  return (
    <div className="panel p-5 h-full min-w-0 flex flex-col">
      <h3 className="text-sm font-semibold text-slate-700 mb-4">Localidades com mais casos novos</h3>
      <div className="overflow-x-auto" role="region" aria-label="Gráfico de localidades com mais casos novos" tabIndex={0}>
      <div className="min-w-[640px]" style={{ height: chartHeight }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 8, right: 24, left: 8, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
            <XAxis type="number" stroke="#94a3b8" fontSize={11} axisLine={false} tickLine={false} />
            <YAxis type="category" dataKey="municipio" width={320} interval={0} axisLine={false} tickLine={false}
              tick={({ x, y, payload }) => <Text x={Number(x) - 12} y={y} width={288} textAnchor="end" verticalAnchor="middle" fontSize={12} fill="#475569" breakAll>{payload.value}</Text>}
            />
            <Tooltip
              contentStyle={{ borderRadius: '10px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgb(0 0 0 / 0.05)', fontSize: '13px' }}
              formatter={(value: number) => [value.toLocaleString('pt-BR'), 'Casos']}
              cursor={{ fill: '#f8fafc' }}
            />
            <Bar dataKey="casos" radius={[0, 4, 4, 0]} barSize={22}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getColor(entry.casos)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      </div>
    </div>
  );
};
