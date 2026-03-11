export type SeriesStats = { min: number; max: number };

export const getSeriesStats = (data: unknown[]): SeriesStats => {
  if (!Array.isArray(data) || !data.length) return { min: 0, max: 0 };

  let min = Infinity;
  let max = -Infinity;

  for (const point of data) {
    const value = Array.isArray(point) ? Number(point[1]) : Number(point);

    const num = isNaN(value) ? 0 : value;

    if (num < min) min = num;
    if (num > max) max = num;
  }

  return min === Infinity ? { min: 0, max: 0 } : { min, max };
};
