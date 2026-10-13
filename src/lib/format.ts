const compact = new Intl.NumberFormat('id-ID', { notation: 'compact', maximumFractionDigits: 1 });

export const formatCount = (n: number): string => compact.format(Math.round(n));

export const formatPercent = (n: number | null): string =>
  n === null ? '–' : `${n.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`;
