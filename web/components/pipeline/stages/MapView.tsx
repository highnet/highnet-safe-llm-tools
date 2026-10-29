import type { MapData } from '@/lib/stage-data';

import { Facts } from './Facts';

type MapViewProps = { data: MapData };

// The map step's details: where the question landed, how much spread the map keeps, and its
// nearest dots. A failed projection says so in the step's lead instead.
const MapView = ({ data }: MapViewProps) => {
  if (data.error) return null;
  const [pc1, pc2] = data.explained_variance;
  const kept = ((pc1 + pc2) * 100).toFixed(1);
  return (
    <Facts
      facts={[
        { term: 'Position', value: `x ${data.x.toFixed(3)}, y ${data.y.toFixed(3)}` },
        {
          term: 'Spread kept',
          value: `${kept}% (PC1 ${(pc1 * 100).toFixed(1)}%, PC2 ${(pc2 * 100).toFixed(1)}%)`,
        },
        { term: 'Nearest on map', value: data.neighbours_2d.map((id) => `#${id}`).join(' ') },
      ]}
    />
  );
};

export { MapView };
