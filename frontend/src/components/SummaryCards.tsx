import React from 'react';
import { Activity, TrendingUp, MapPin, ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import { ResumoAnalytics } from '../types';

interface SummaryCardsProps {
  data: ResumoAnalytics | null;
  loading: boolean;
}

export const SummaryCards: React.FC<SummaryCardsProps> = ({ data, loading }) => {
  if (loading || !data) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="panel p-5 animate-pulse">
            <div className="h-4 bg-slate-100 rounded w-24 mb-3" />
            <div className="h-7 bg-slate-100 rounded w-16" />
          </div>
        ))}
      </div>
    );
  }

  const comparable = data.variacao_percentual !== null;
  const variacao = data.variacao_percentual ?? 0;
  const varColor = variacao === 0 ? 'text-slate-400' : variacao < 0 ? 'text-emerald-600' : 'text-red-500';
  const VarIcon = variacao === 0 ? Minus : variacao < 0 ? ArrowDownRight : ArrowUpRight;

  const cards = [
    {
      label: 'Novos + acompanhamento',
      detail: 'Soma das contagens; pode incluir a mesma pessoa',
      value: data.total_casos.toLocaleString('pt-BR'),
      icon: Activity,
      iconBg: 'bg-blue-50',
      iconColor: 'text-blue-600',
    },
    {
      label: 'Casos Novos',
      detail: 'Contagem no recorte selecionado',
      value: data.casos_novos.toLocaleString('pt-BR'),
      icon: TrendingUp,
      iconBg: 'bg-emerald-50',
      iconColor: 'text-emerald-600',
    },
    {
      label: 'Localidades com casos',
      detail: 'Localidade + UF com casos novos',
      value: data.municipios_afetados.toLocaleString('pt-BR'),
      icon: MapPin,
      iconBg: 'bg-amber-50',
      iconColor: 'text-amber-600',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((c) => (
        <div key={c.label} className="panel p-5 hover:shadow-sm transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">{c.label}</span>
            <div className={`w-8 h-8 ${c.iconBg} rounded-lg flex items-center justify-center`}>
              <c.icon className={`h-4 w-4 ${c.iconColor}`} />
            </div>
          </div>
          <p className="text-3xl font-semibold tracking-tight text-slate-800">{c.value}</p>
          <p className="mt-2 text-xs leading-relaxed text-slate-500">{c.detail}</p>
        </div>
      ))}

      <div className="panel p-5 hover:shadow-sm transition-shadow">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Variação Mensal</span>
        </div>
        <div className="flex items-center gap-1.5">
          <p className={`text-2xl font-bold ${varColor}`}>
            {comparable ? `${variacao > 0 ? '+' : ''}${variacao.toFixed(1)}%` : '—'}
          </p>
          <VarIcon className={`h-5 w-5 ${varColor}`} />
        </div>
        <p className="text-[11px] text-slate-400 mt-1">{comparable ? 'Último mês da base vs. anterior' : 'Sem meses comparáveis na base'}</p>
      </div>
    </div>
  );
};
