export function formatCFA(n: number): string {
  return new Intl.NumberFormat('fr-FR').format(Math.round(n)) + ' FCFA';
}

export function formatCFAShort(n: number): string {
  const abs = Math.abs(n);
  if (abs >= 1000000) return (n / 1000000).toFixed(1) + ' M FCFA';
  if (abs >= 1000) return (n / 1000).toFixed(0) + ' k FCFA';
  return Math.round(n) + ' FCFA';
}
