export const formatNumber = (num: number, isCurrency = false): string => {
  const isNegative = num < 0;
  const absNum = Math.abs(num);
  let result = '';

  // Since input is in thousands, adjust thresholds
  if (absNum >= 1e9) { // 1B (1e12 thousands)
    result = `${(absNum / 1e9).toFixed(2)}T`;
  } else if (absNum >= 1e6) { // 1M (1e9 thousands)
    result = `${(absNum / 1e6).toFixed(2)}B`;
  } else if (absNum >= 1e3) { // 1K (1e6 thousands)
    result = `${(absNum / 1e3).toFixed(2)}M`;
  } else {
    result = `${absNum.toFixed(2)}`;
  }

  return `${isNegative ? '-' : ''}${isCurrency ? '$' : ''}${result}`;
}; 