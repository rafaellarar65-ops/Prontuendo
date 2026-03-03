export const parseBrNumber = (rawValue: string): number | undefined => {
  const withoutSpaces = rawValue.replace(/\s+/g, '');
  if (!withoutSpaces) return undefined;

  if (!/^-?[\d.,]+$/.test(withoutSpaces)) return undefined;

  const signal = withoutSpaces.startsWith('-') ? '-' : '';
  const absoluteValue = withoutSpaces.replace(/^-/, '');
  const parts = absoluteValue.split(',');
  if (parts.length > 2) return undefined;

  const integerRaw = parts[0] ?? '';
  const decimalRaw = parts[1];
  const integerPart = integerRaw.replace(/\./g, '');
  const decimalPart = decimalRaw ?? '';
  if (!/^\d+$/.test(integerPart) || !/^\d*$/.test(decimalPart)) return undefined;

  const normalized = decimalPart ? `${signal}${integerPart}.${decimalPart}` : `${signal}${integerPart}`;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : undefined;
};
