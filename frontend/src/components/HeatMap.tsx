import { useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import { LatLngBounds } from 'leaflet';
import { LocateFixed, MapPin, Layers } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import { HeatmapLayer } from './HeatmapLayer';
import { MapaPoint } from '../types';

export const HeatMap = ({ data, totalCasos }: { data: MapaPoint[]; totalCasos: number }) => {
  const [showHeat, setShowHeat] = useState(true);
  const [resetView, setResetView] = useState(0);
  const [tileError, setTileError] = useState(false);
  const validData = useMemo(() => data.filter(point =>
    Number.isFinite(point.latitude) && Math.abs(point.latitude) <= 90 &&
    Number.isFinite(point.longitude) && Math.abs(point.longitude) <= 180 &&
    Number.isFinite(point.casos_novos) && point.casos_novos > 0
  ), [data]);
  const points = useMemo<[number, number, number][]>(() => validData.map(point =>
    [point.latitude, point.longitude, point.casos_novos]
  ), [validData]);
  const maxCasos = validData.reduce((maximum, point) => Math.max(maximum, point.casos_novos), 1);
  const mappedCases = validData.reduce((total, point) => total + point.casos_novos, 0);
  const coverage = totalCasos > 0 ? Math.round(mappedCases / totalCasos * 100) : 0;

  return (
    <section className="panel overflow-hidden" aria-labelledby="map-title">
      <div className="flex flex-wrap items-center justify-between gap-4 p-5 sm:p-6">
        <div>
          <p className="eyebrow mb-1">Vigilância no território</p>
          <h2 id="map-title" className="section-title">Distribuição de casos</h2>
          <p className="mt-1 text-sm text-slate-500">Explore os pontos para consultar os registros de cada localidade.</p>
        </div>
        <div className="flex gap-2">
          <button className="button-secondary" aria-pressed={showHeat} onClick={() => setShowHeat(!showHeat)}>
            <Layers size={16} /> Calor {showHeat ? 'ativo' : 'inativo'}
          </button>
          <button className="button-secondary" onClick={() => setResetView(value => value + 1)}>
            <LocateFixed size={16} /> Centralizar
          </button>
        </div>
      </div>
      <div className="relative isolate h-[380px] sm:h-[500px] bg-slate-100" aria-label="Mapa interativo de casos novos">
        <MapContainer center={[-14.2, -51.9]} zoom={4} style={{ height: '100%', width: '100%' }} scrollWheelZoom={false}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            eventHandlers={{ tileerror: () => setTileError(true) }}
          />
          <MapViewport points={points} resetView={resetView} />
          {showHeat && points.length > 0 && <HeatmapLayer points={points} max={maxCasos} radius={32} blur={22} />}
          {validData.map(point => (
            <CircleMarker
              key={`${point.estado}-${point.municipio}-${point.latitude}-${point.longitude}`}
              center={[point.latitude, point.longitude]}
              radius={6 + Math.sqrt(point.casos_novos / maxCasos) * 12}
              fillColor="#0f766e" fillOpacity={0.8} color="#ffffff" weight={2}
            >
              <Popup>
                <div className="min-w-[160px] font-sans">
                  <strong className="text-base text-slate-900">{point.municipio}</strong>
                  <div className="mt-1 text-slate-500">{point.estado || 'UF não informada'}</div>
                  <div className="mt-3 border-t border-slate-100 pt-3 text-sm">
                    <strong className="text-xl text-teal-700">{point.casos_novos.toLocaleString('pt-BR')}</strong> casos novos
                  </div>
                  <div className="mt-2 text-xs text-slate-500">Localização de referência dos registros.</div>
                </div>
              </Popup>
            </CircleMarker>
          ))}
        </MapContainer>
        {points.length === 0 && (
          <div className="absolute inset-0 z-[400] flex items-center justify-center bg-slate-100/75 p-6 pointer-events-none">
            <div className="rounded-2xl bg-white p-6 text-center shadow-sm max-w-sm">
              <MapPin className="mx-auto mb-3 text-teal-700" />
              <h3 className="font-semibold text-slate-800">Nenhum ponto para exibir</h3>
              <p className="mt-2 text-sm text-slate-500">Revise os filtros ou informe município e UF, ou coordenadas válidas, na planilha.</p>
            </div>
          </div>
        )}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 text-xs text-slate-500">
        <span><strong className="text-slate-700">{validData.length}</strong> pontos · <strong className="text-slate-700">{coverage}%</strong> dos casos novos localizados</span>
        <div className="flex items-center gap-2"><span>Menor concentração</span><span className="h-2 w-20 rounded-full bg-gradient-to-r from-teal-300 via-amber-400 to-orange-600" /><span>Maior</span></div>
      </div>
      {(tileError || mappedCases < totalCasos) && <p role="status" className="border-t border-amber-100 bg-amber-50 px-5 py-3 text-xs text-amber-900">
        {tileError ? 'O mapa de fundo não carregou por completo. Verifique a conexão; os pontos continuam disponíveis. ' : ''}
        {mappedCases < totalCasos ? `${(totalCasos - mappedCases).toLocaleString('pt-BR')} casos novos sem coordenadas válidas neste recorte.` : ''}
      </p>}
      <p className="border-t border-slate-100 px-5 py-3 text-xs leading-relaxed text-slate-500">Cores representam concentração relativa de registros, não taxa de incidência ou classificação de risco. Pontos podem representar a sede municipal.</p>
    </section>
  );
};

const MapViewport = ({ points, resetView }: { points: [number, number, number][]; resetView: number }) => {
  const map = useMap();

  useEffect(() => {
    let frame = 0;
    const observer = new ResizeObserver(() => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => map.invalidateSize({ pan: false }));
    });
    observer.observe(map.getContainer());
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [map]);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      map.invalidateSize({ pan: false });
      if (points.length) {
        map.fitBounds(new LatLngBounds(points.map(([latitude, longitude]) => [latitude, longitude])), { padding: [40, 40], maxZoom: 11, animate: false });
      } else {
        map.setView([-14.2, -51.9], 4, { animate: false });
      }
    });
    return () => cancelAnimationFrame(frame);
  }, [map, points, resetView]);

  return null;
};
