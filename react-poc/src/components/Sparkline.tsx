// A tiny trend line with no axes. Colour follows whether the last value is
// above the first. Props (the inputs) are typed, so misuse is caught early.
interface Props { values: number[]; width?: number; height?: number }

export function Sparkline({ values, width = 110, height = 28 }: Props) {
  if (values.length < 2) return null;
  const min = Math.min(...values);
  const span = Math.max(...values) - min || 1;
  const step = width / (values.length - 1);
  const pts = values.map((v, i) => `${i ? "L" : "M"}${(i * step).toFixed(1)},${(height - 2 - ((v - min) / span) * (height - 4)).toFixed(1)}`).join(" ");
  const color = values[values.length - 1] >= values[0] ? "var(--positive)" : "var(--negative)";
  return (
    <svg className="spark" viewBox={`0 0 ${width} ${height}`} width={width} height={height} preserveAspectRatio="none" aria-hidden="true">
      <path d={`${pts} L${width},${height} L0,${height} Z`} fill={color} opacity={0.12} />
      <path d={pts} fill="none" stroke={color} strokeWidth={1.6} strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}
