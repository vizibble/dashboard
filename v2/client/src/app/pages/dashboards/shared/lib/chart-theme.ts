/**
 * ECharts draws on canvas and can't read CSS variables, so theme tokens are resolved to
 * rgb() strings at render time. Re-resolved whenever the theme class changes.
 */

const SERIES_TOKENS = ['--chart-1', '--chart-2', '--chart-3', '--chart-4', '--chart-5'];

let probe: CanvasRenderingContext2D | null = null;

function toRgb(color: string) {
  probe ??= document.createElement('canvas').getContext('2d', { willReadFrequently: true });
  if (!probe || !color) return color;
  probe.clearRect(0, 0, 1, 1);
  probe.fillStyle = '#000';
  probe.fillStyle = color;
  probe.fillRect(0, 0, 1, 1);
  const [r, g, b, a] = probe.getImageData(0, 0, 1, 1).data;
  return `rgba(${r}, ${g}, ${b}, ${((a ?? 255) / 255).toFixed(3)})`;
}

function token(name: string) {
  return toRgb(getComputedStyle(document.documentElement).getPropertyValue(name).trim());
}

export type ChartTheme = {
  series: string[];
  text: string;
  muted: string;
  border: string;
  background: string;
};

export function readChartTheme(): ChartTheme {
  return {
    series: SERIES_TOKENS.map(token),
    text: token('--foreground'),
    muted: token('--muted-foreground'),
    border: token('--border'),
    background: token('--card'),
  };
}

export function withAlpha(rgba: string, alpha: number) {
  return rgba.replace(/rgba\(([^,]+),([^,]+),([^,]+),[^)]+\)/, `rgba($1,$2,$3, ${alpha})`);
}
