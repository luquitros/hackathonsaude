import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface ClassificationPieProps {
  data: Record<string, number>;
  totalCasosNovos: number;
  totalClassificados: number;
  distributionValid: boolean;
  totalPbMbReported: number;
  aggregateNewCases: number;
  divergentRows: number;
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

export const ClassificationPie: React.FC<ClassificationPieProps> = ({ data, totalCasosNovos, totalClassificados, distributionValid, totalPbMbReported, aggregateNewCases, divergentRows }) => {
  const chartData = Object.entries(data).map(([name, value]) => ({ name, value }));
  const total = chartData.reduce((sum, d) => sum + d.value, 0);

  return (
    <div className="panel p-5 h-full flex flex-col">
      <h3 className="text-sm font-semibold text-slate-700 mb-4">Classificação Operacional</h3>
      {!distributionValid ? (
        <div role="status" className="my-auto rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
          <p className="font-semibold">Distribuição PB/MB ocultada: os totais não fecham.</p>
          <p className="mt-2">A planilha informa {totalPbMbReported.toLocaleString('pt-BR')} em PB + MB contra {aggregateNewCases.toLocaleString('pt-BR')} casos novos — diferença de {(totalPbMbReported - aggregateNewCases).toLocaleString('pt-BR')} em {divergentRows.toLocaleString('pt-BR')} registros. Revise a origem antes de interpretar ou publicar esta classificação.</p>
        </div>
      ) : total === 0 && <p className="text-sm text-slate-500">Sem casos classificados neste recorte.</p>}
      {distributionValid && total > 0 && <div className="flex-1 flex flex-wrap items-center">
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
                formatter={(value: number) => [value.toLocaleString('pt-BR'), 'Casos novos']}
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
      </div>}
      {distributionValid && total > 0 && (
        <p className="mt-3 text-[11px] leading-relaxed text-slate-400">
          Percentuais sobre {total.toLocaleString('pt-BR')} contagens PB/MB informadas.
          {totalClassificados < totalCasosNovos && ` ${(totalCasosNovos - totalClassificados).toLocaleString('pt-BR')} caso(s) novo(s) sem classificação PB/MB informada.`}
          {totalClassificados > totalCasosNovos && ` As contagens PB/MB excedem os casos novos em ${(totalClassificados - totalCasosNovos).toLocaleString('pt-BR')}; os totais são exibidos como informados.`}
        </p>
      )}
    </div>
  );
};
