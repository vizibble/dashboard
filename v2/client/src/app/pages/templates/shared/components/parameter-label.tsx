type ParameterLabelProps = { label: string; symbol: string | null | undefined; parameterKey: string };

/** Name (with unit symbol) above the telemetry key. */
export function ParameterLabel({ label, symbol, parameterKey }: ParameterLabelProps) {
  return (
    <span className="min-w-0">
      <span className="block truncate text-sm font-medium">
        {label}
        {symbol && <span className="text-muted-foreground font-normal"> · {symbol}</span>}
      </span>
      <span className="text-muted-foreground block font-mono text-xs">{parameterKey}</span>
    </span>
  );
}
