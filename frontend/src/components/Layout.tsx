import { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Activity, Upload, BarChart3, HeartPulse } from 'lucide-react';

export const Layout = ({ children }: { children: ReactNode }) => {
  const { pathname } = useLocation();
  const navItems = [
    { path: '/', label: 'Importar dados', icon: Upload },
    { path: '/dashboard', label: 'Visão geral', icon: BarChart3 },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#f4f7f9]">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:p-4">Pular para o conteúdo</a>
      <header className="bg-[#102d35] text-white">
        <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-4 px-5 py-5 sm:px-8">
          <Link to="/" className="flex items-center gap-3" aria-label="Vigia Saúde, início">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-teal-300/20 bg-teal-300/10"><Activity className="text-teal-300" size={25} /></span>
            <span><span className="block text-lg font-semibold tracking-tight">Vigia<span className="font-normal text-teal-200"> Saúde</span></span><span className="block text-[10px] uppercase tracking-[0.18em] text-slate-300">Vigilância da hanseníase</span></span>
          </Link>
          <nav aria-label="Navegação principal" className="flex gap-1 rounded-xl bg-black/10 p-1">
            {navItems.map(({ path, label, icon: Icon }) => (
              <Link key={path} to={path} aria-current={pathname === path ? 'page' : undefined}
                className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${pathname === path ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-300 hover:bg-white/10 hover:text-white'}`}>
                <Icon size={16} />{label}
              </Link>
            ))}
          </nav>
          <span className="hidden items-center gap-2 text-xs text-teal-100 lg:flex"><HeartPulse size={16} /> Tecnologia a serviço do cuidado</span>
        </div>
      </header>
      <main id="main-content" className="mx-auto w-full max-w-[1440px] flex-1 px-4 py-7 sm:px-8 sm:py-9">{children}</main>
      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-3 px-5 py-5 text-xs text-slate-500 sm:px-8">
          <p>Vigia Saúde · Apoio à análise territorial</p>
          <p>Protótipo para hackathon · Dados mantidos em memória no servidor</p>
        </div>
      </footer>
    </div>
  );
};
