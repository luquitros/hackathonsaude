import { CircleMarker, LayerGroup } from 'react-leaflet';

interface Props {
  points: [number, number, number][];
  radius?: number;
  blur?: number;
  max?: number;
}

export const HeatmapLayer = ({ points, radius = 25, blur = 15, max = 1.0 }: Props) => {
  return (
    <LayerGroup>
      {points.map(([latitude, longitude, intensity], index) => {
        const ratio = Math.max(0, Math.min(intensity / Math.max(max, 1), 1));
        const color = ratio > 0.75 ? '#c2410c' : ratio > 0.5 ? '#f97316' : ratio > 0.25 ? '#fbbf24' : '#2dd4bf';
        return (
          <CircleMarker
            key={`${latitude}-${longitude}-${index}`}
            center={[latitude, longitude]}
            radius={Math.max(12, radius * (0.55 + ratio * 0.65))}
            pathOptions={{
              color,
              fillColor: color,
              fillOpacity: 0.12 + ratio * 0.18,
              opacity: 0.18,
              weight: Math.max(3, blur / 5),
              className: 'heatmap-halo',
              interactive: false,
            }}
          />
        );
      })}
    </LayerGroup>
  );
};
