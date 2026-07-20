export const CLIENT_UPLOAD_TARGET_BYTES = 8 * 1024 * 1024;

export function totalImageBytes(sizes: number[]) {
  return sizes.reduce((total, size) => total + Math.max(0, size), 0);
}

export function allocateImageByteBudgets(
  sizes: number[],
  targetBytes = CLIENT_UPLOAD_TARGET_BYTES,
) {
  if (totalImageBytes(sizes) <= targetBytes) return [...sizes];

  const budgets = Array.from({ length: sizes.length }, () => 0);
  const sorted = sizes
    .map((size, index) => ({ index, size: Math.max(0, size) }))
    .sort((a, b) => a.size - b.size);
  let remainingBytes = Math.floor(targetBytes * 0.96);

  for (let position = 0; position < sorted.length; position += 1) {
    const item = sorted[position];
    const remainingCount = sorted.length - position;
    const evenShare = Math.floor(remainingBytes / remainingCount);

    if (item.size <= evenShare) {
      budgets[item.index] = item.size;
      remainingBytes -= item.size;
      continue;
    }

    for (let rest = position; rest < sorted.length; rest += 1) {
      budgets[sorted[rest].index] = Math.floor(remainingBytes / remainingCount);
    }
    break;
  }

  return budgets;
}
