import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, CheckCircle2, FileSpreadsheet, Loader2, MapPin, Play, ShieldCheck, UploadCloud, XCircle, BarChart3 } from 'lucide-react';
import { getExample, uploadExcel } from '../api/client';
import { UploadResponse } from '../types';

export const Upload = () => {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<UploadResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filename, setFilename] = useState('');
  const fileInput = useRef<HTMLInputElement>(null);
  const busy = useRef(false);
  const navigate = useNavigate();

  const processFile = async (file: File, demonstracao: boolean) => {
    if (!/\.xlsx?$/i.test(file.name)) throw new Error('Selecione uma planilha Excel (.xlsx ou .xls).');
    if (file.size > 10 * 1024 * 1024) throw new Error('O arquivo ultrapassa o limite de 10 MB.');
    setFilename(file.name);
    const response = await uploadExcel(file, demonstracao);
    setResult(response);
  };

  const startUpload = async (file?: File) => {
    if (busy.current) return;
    busy.current = true;
    setUploading(true);
    setError(null);
    setResult(null);
    try {
      await processFile(file ?? await getExample(), !file);
    } catch (failure: unknown) {
      setError(failure instanceof Error ? failure.message : 'Não foi possível importar a planilha.');
    } finally {
      busy.current = false;
      setUploading(false);
      if (fileInput.current) fileInput.current.value = '';
    }
  };

  return (
    <div className="mx-auto max-w-6xl py-3 sm:py-8">
      <div className="grid items-center gap-10 lg:grid-cols-[1.05fr_1fr] lg:gap-16">
        <section>
          <span className="inline-flex items-center gap-2 rounded-full border border-teal-200 bg-teal-50 px-3 py-1.5 text-xs font-semibold text-teal-800"><span className="h-1.5 w-1.5 rounded-full bg-teal-600" /> Inteligência territorial em saúde</span>
          <h1 className="mt-6 text-4xl font-semibold leading-[1.15] tracking-tight text-slate-900 sm:text-5xl">Dados que ajudam a enxergar <span className="text-teal-700">onde cuidar.</span></h1>
          <p className="mt-5 max-w-lg text-base leading-relaxed text-slate-500">Transforme planilhas de hanseníase em uma visão clara do território. Reúna registros, explore padrões e apoie o planejamento da vigilância.</p>
          <div className="mt-8 space-y-5">
            {[
              { icon: MapPin, title: 'O território em evidência', text: 'Visualize a distribuição e a cobertura geográfica dos casos.' },
              { icon: BarChart3, title: 'Do registro à análise', text: 'Cruze localidades, períodos e indicadores em um só painel.' },
              { icon: ShieldCheck, title: 'Transparência para decidir', text: 'Consulte a qualidade dos dados e os limites de cada análise.' },
            ].map(({ icon: Icon, title, text }) => (
              <div key={title} className="flex items-start gap-3">
                <span className="rounded-xl border border-slate-200 bg-white p-2.5 text-teal-700"><Icon size={19} /></span>
                <div><h2 className="text-sm font-semibold text-slate-800">{title}</h2><p className="mt-1 text-sm leading-relaxed text-slate-500">{text}</p></div>
              </div>
            ))}
          </div>
        </section>
        <section className="panel p-6 sm:p-8" aria-labelledby="upload-title" aria-busy={uploading}>
          <div className="mb-6 flex items-center gap-3">
            <span className="rounded-xl bg-teal-50 p-3 text-teal-700"><FileSpreadsheet size={24} /></span>
            <div><h2 id="upload-title" className="section-title">Comece pelos seus dados</h2><p className="mt-1 text-sm text-slate-500">Importe uma planilha de notificações.</p></div>
          </div>
          <input type="file" ref={fileInput} className="hidden" accept=".xlsx,.xls" aria-label="Selecionar planilha Excel" onChange={event => event.target.files?.[0] && startUpload(event.target.files[0])} />
          {!result && !uploading && (
            <button type="button"
              className={`flex w-full flex-col items-center rounded-2xl border-2 border-dashed px-5 py-10 text-center transition-colors ${isDragging ? 'border-teal-500 bg-teal-50' : 'border-slate-200 bg-slate-50/70 hover:border-teal-400 hover:bg-teal-50/50'}`}
              onDragOver={event => { event.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={event => { event.preventDefault(); setIsDragging(false); if (event.dataTransfer.files[0]) void startUpload(event.dataTransfer.files[0]); }}
              onClick={() => fileInput.current?.click()}>
              <span className="mb-4 rounded-full bg-white p-4 text-teal-700 shadow-sm"><UploadCloud size={28} /></span>
              <span className="text-sm font-semibold text-slate-700">Arraste sua planilha até aqui</span>
              <span className="mt-1 text-sm text-teal-700">ou selecione um arquivo</span>
              <span className="mt-4 text-xs text-slate-400">Excel .xlsx ou .xls · até 10 MB</span>
            </button>
          )}
          {uploading && <div role="status" className="flex min-h-[240px] flex-col items-center justify-center gap-4 text-center"><Loader2 className="animate-spin text-teal-700" size={32} /><p className="text-sm text-slate-600">Validando e localizando os registros…</p></div>}
          {error && <div role="alert" className="mt-4 flex gap-2 rounded-xl bg-red-50 p-4 text-sm text-red-700"><XCircle size={18} className="shrink-0" />{error}</div>}
          {result && <div role="status" className="rounded-2xl border border-teal-100 bg-teal-50 p-6 text-center">
            <CheckCircle2 size={36} className="mx-auto mb-3 text-teal-600" />
            <h3 className="font-semibold text-slate-800">Pronto para explorar</h3>
            <p className="mt-2 break-all text-xs text-slate-500">{filename}</p>
            <p className="mt-3 text-sm text-teal-800">{result.registros_validos} de {result.total_registros} registros importados</p>
            {result.warnings?.map(warning => <p key={warning} className="mt-2 text-xs text-amber-900">{warning}</p>)}
            <button className="button-primary mt-5 w-full" onClick={() => navigate('/dashboard')}>Explorar painel <ArrowRight size={16} /></button>
            <button className="mt-4 text-xs font-medium text-teal-800 underline" onClick={() => { setResult(null); setFilename(''); }}>Importar outra planilha</button>
          </div>}
          {!result && <div className="mt-6 border-t border-slate-100 pt-5">
            <p className="mb-3 text-center text-xs text-slate-500">Quer conhecer o painel primeiro?</p>
            <button className="button-secondary w-full py-3" disabled={uploading} onClick={() => startUpload()}><Play size={15} /> Explorar demonstração</button>
            <p className="mt-2 text-center text-[11px] leading-relaxed text-slate-400">Dados sintéticos. A importação substitui a base em memória.</p>
          </div>}
          <p className="mt-5 text-xs leading-relaxed text-slate-500"><ShieldCheck size={13} className="mr-1 inline" /> Use dados agregados, sem nomes ou identificadores de pacientes.</p>
        </section>
      </div>
      <section className="panel mt-10 grid gap-5 p-6 sm:grid-cols-3">
        {[['01', 'Prepare a planilha', 'Município e UF ou coordenadas, período e contagem de casos.'], ['02', 'Explore o território', 'Aplique filtros e consulte os pontos no mapa interativo.'], ['03', 'Apoie o planejamento', 'Compare os registros e leve os achados para avaliação da equipe.']].map(([step, title, text]) => <div key={step} className="flex gap-3"><span className="text-sm font-semibold text-teal-600">{step}</span><div><h3 className="text-sm font-semibold text-slate-700">{title}</h3><p className="mt-1 text-xs leading-relaxed text-slate-500">{text}</p></div></div>)}
      </section>
    </div>
  );
};
