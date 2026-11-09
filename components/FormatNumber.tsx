export const formatNumber = (num: number): string => {
    if (num >= 1_000_000_000_000) {
      return `${Math.round(num / 1_000_000_000_000)}t`; // Trillion
    } else if (num >= 1_000_000_000) {
      return `${(num / 1_000_000_000).toFixed(1)}b`; // Billion
    } else if (num >= 1_000_000) {
      return `${(num / 1_000_000).toFixed(1)}m`; // Million
    } else if (num >= 1_000) {
      return `${Math.round(num / 1_000)}k`; // Thousand
    } else {
      return num.toString(); // Less than a thousand
    }
  };

  export const numberComma = (num: number): string => {
    return num.toLocaleString(); // Converts the number to a string with commas
  };