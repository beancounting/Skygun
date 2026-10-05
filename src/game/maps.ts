export const MAPS = [
  { id: 'sunpatch', number: '01', name: 'Sunpatch Ridge', description: 'Rolling hills. A good place to find your range.' },
  { id: 'divide', number: '02', name: 'High Divide', description: 'A tall ridge between rivals. Aim high to clear it.' },
  { id: 'basin', number: '03', name: 'The Basin', description: 'Raised banks above a low valley. Try a flatter shot.' },
] as const;

export const ROOFTOP_MAP = { id: 'rooftops', number: '★', name: 'Rooftop Rivals', description: 'A secret skyline. Throw bananas over solid buildings.' } as const;
export const BUILDING_HEIGHTS = [200, 260, 240, 330, 190, 365, 365, 190, 330, 240, 260, 200] as const;
export type MapId = typeof MAPS[number]['id'] | typeof ROOFTOP_MAP.id;

/** Fixed layouts, sampled afresh for every match so craters never leak between games. */
export function terrainHeight(mapId: MapId, x: number): number {
  switch (mapId) {
    case 'rooftops': return BUILDING_HEIGHTS[Math.min(11, Math.max(0, Math.floor(x / 100)))];
    case 'divide': return 155 + 190 * Math.exp(-(((x - 600) / 170) ** 2));
    case 'basin': return 105 + 155 * (1 - Math.exp(-(((x - 600) / 300) ** 2)));
    case 'sunpatch': return 158 + 29 * Math.sin(x / 176 + 0.5)
      + 70 * Math.exp(-(((x - 620) / 180) ** 2)) + 13 * Math.sin(x / 68);
  }
}
