// Soft light rays shining out from a point (used when parents are "blinded").
// `progress` 0..1 fades them in; `spin` is in degrees.
export const LightRays: React.FC<{
  x: number;
  y: number;
  progress: number;
  spin: number;
}> = ({ x, y, progress, spin }) => {
  const length = 900;
  const count = 12;
  const half = 360 / count / 4;

  return (
    <svg
      width={length * 2}
      height={length * 2}
      viewBox={`${-length} ${-length} ${length * 2} ${length * 2}`}
      style={{ position: "absolute", left: x - length, top: y - length, opacity: progress }}
    >
      <defs>
        <radialGradient id="rays-fade">
          <stop offset="0%" stopColor="#fffbe0" stopOpacity={0.75} />
          <stop offset="100%" stopColor="#fffbe0" stopOpacity={0} />
        </radialGradient>
      </defs>
      <g transform={`rotate(${spin}) scale(${0.6 + 0.4 * progress})`}>
        {Array.from({ length: count }, (_, i) => {
          const a = (i * 360) / count;
          const rad = (d: number) => (d * Math.PI) / 180;
          const p1 = [Math.cos(rad(a - half)) * length, Math.sin(rad(a - half)) * length];
          const p2 = [Math.cos(rad(a + half)) * length, Math.sin(rad(a + half)) * length];
          return <path key={i} d={`M 0 0 L ${p1[0]} ${p1[1]} L ${p2[0]} ${p2[1]} Z`} fill="url(#rays-fade)" />;
        })}
      </g>
    </svg>
  );
};
