export function arraysEqual(a: string[] = [], b: string[] = []) {
  if (a.length !== b.length) return false;
  // Ordena para garantir que a ordem não afete a comparação
  const sortedA = [...a].sort();
  const sortedB = [...b].sort();
  return sortedA.every((value, index) => value === sortedB[index]);
}