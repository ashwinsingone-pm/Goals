/** Maps progress percentage to color classes for bar + text + label. */
export function progressColor(pct: number) {
  if (pct >= 100) return { bar: "bg-blue-500", text: "text-blue-600", label: "On Track" };
  if (pct >= 80)  return { bar: "bg-green-500", text: "text-green-600", label: "Good" };
  if (pct >= 50)  return { bar: "bg-yellow-400", text: "text-yellow-600", label: "Behind" };
  return { bar: "bg-red-500", text: "text-red-600", label: "Critical" };
}

/** Returns bg + text classes to fill a week cell with color based on value vs target. */
export function weekCellColors(val: number | null | undefined, target: number | null | undefined) {
  if (val === null || val === undefined) return { bg: "", text: "text-gray-300" };
  const weeklyTarget = (target ?? 0) / 13;
  if (val === 0) return { bg: "bg-red-500", text: "text-white" };
  if (weeklyTarget > 0 && val >= weeklyTarget) return { bg: "bg-blue-500", text: "text-white" };
  return { bg: "bg-green-500", text: "text-white" };
}
