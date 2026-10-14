import React, { useState } from 'react';
import { AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';
import { AlertaEpidemiologico } from '../types';

interface EpidemicAlertBannerProps {
  alertas: AlertaEpidemiologico[];
}

const severityConfig = {
  critico: {
    bg: 'bg-red-50',
    border: 'border-red-300',
    icon: AlertTriangle,
    iconColor: 'text-red-600',
    titleColor: 'text-red-800',
    textColor: 'text-red-700',
    badge: 'bg-red-600 text-white',
    badgeLabel: 'CR\u00cdTICO',
    barColor: 'bg-red-500',
  },
  alerta: {
    bg: 'bg-orange-50',
    border: 'border-orange-300',
    icon: AlertTriangle,
    iconColor: 'text-orange-600',
    titleColor: 'text-orange-800',
    textColor: 'text-orange-700',
    badge: 'bg-orange-500 text-white',
    badgeLabel: 'ALERTA',
    barColor: 'bg-orange-500',
  },
  atencao: {
    bg: 'bg-amber-50',
    border: 'border-amber-300',
    icon: AlertTriangle,
    iconColor: 'text-amber-600',
    titleColor: 'text-amber-800',
    textColor: 'text-amber-700',
    badge: 'bg-amber-500 text-white',
    badgeLabel: 'ATEN\u00c7\u00c3O',
    barColor: 'bg-amber-500',
  },
} as const;

export const EpidemicAlertBanner: React.FC<EpidemicAlertBannerProps> = ({ alertas }) => {
  const [expanded, setExpanded] = useState(false);

  if (!alertas.length) return null;

  const visibleAlertas = expanded ? alertas : alertas.slice(0, 1);

  return (
    <section aria-label="Sinais exploratórios" className="space-y-2">
      <p className="text-xs leading-relaxed text-slate-500">Sinais exploratórios · Limiares de demonstração, sujeitos à avaliação da equipe de vigilância. Não confirmam surtos ou risco individual.</p>
      {visibleAlertas.map((alerta, idx) => {
        const config = severityConfig[alerta.severidade] || severityConfig.atencao;
        const Icon = config.icon;

        return (
          <div
            key={`${alerta.tipo}-${idx}`}
            className={`relative overflow-hidden rounded-xl border ${config.border} ${config.bg} shadow-sm`}
          >
            {/* Colored left bar */}
            <div className={`absolute left-0 top-0 bottom-0 w-1 ${config.barColor}`} />

            <div className="pl-5 pr-4 py-4 flex gap-3">
              <div className="flex-shrink-0 pt-0.5">
                <Icon className={`h-5 w-5 ${config.iconColor}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${config.badge} uppercase tracking-wider`}>
                    {config.badgeLabel}
                  </span>
                  <h4 className={`text-sm font-semibold ${config.titleColor}`}>
                    {alerta.titulo}
                  </h4>
                </div>
                <p className={`text-sm ${config.textColor} leading-relaxed`}>
                  {alerta.mensagem}
                </p>
                <div className="flex gap-4 mt-2">
                  <span className={`text-xs font-medium ${config.textColor}`}>
                    Valor: <strong>{alerta.valor_calculado}%</strong>
                  </span>
                  <span className={`text-xs ${config.textColor} opacity-75`}>
                    Limiar: {alerta.limiar}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        );
      })}

      {alertas.length > 1 && (
        <button
          aria-expanded={expanded}
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-700 transition-colors mx-auto"
        >
          {expanded ? (
            <><ChevronUp className="h-3 w-3" /> Recolher alertas</>
          ) : (
            <><ChevronDown className="h-3 w-3" /> Ver todos os {alertas.length} alertas</>
          )}
        </button>
      )}
    </section>
  );
};
