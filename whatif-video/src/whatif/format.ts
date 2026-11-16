// 3 significant digits without exponent notation (1.02, 16.4, 131)
const sig3 = (v: number) => (v < 9.995 ? v.toFixed(2) : v < 99.95 ? v.toFixed(1) : v.toFixed(0));

// Formats a length in metres for the counter, switching mm -> cm -> m -> km
// and using thousands separators for big km values.
export const formatLength = (m: number, mmDecimals = 1): { value: string; unit: string } => {
  if (m < 0.00995) return { value: (m * 1000).toFixed(mmDecimals), unit: "mm" };
  if (m < 0.9995) return { value: sig3(m * 100), unit: "cm" };
  if (m < 999.5) return { value: sig3(m), unit: "m" };
  const km = m / 1000;
  if (km < 999.5) return { value: sig3(km), unit: "km" };
  return { value: Math.round(km).toLocaleString("en-US"), unit: "km" };
};
