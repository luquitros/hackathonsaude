import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Upload } from './components/Upload';
const Dashboard = lazy(() => import('./components/Dashboard').then(module => ({ default: module.Dashboard })));

function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Suspense fallback={<p role="status" className="py-20 text-center text-sm text-slate-500">Carregando painel…</p>}>
        <Routes>
          <Route path="/" element={<Upload />} />
          <Route path="/dashboard" element={<Dashboard />} />
        </Routes>
        </Suspense>
      </Layout>
    </BrowserRouter>
  );
}

export default App;
