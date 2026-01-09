/**
 * Convert date from DDMMYYYY to YYYYMMDD format
 * @param ddmmyyyy Date in DDMMYYYY format (e.g., "01102025")
 * @returns Date in YYYYMMDD format (e.g., "20251001")
 */
export function ddmmyyyyToYyyymmdd(ddmmyyyy: string): string {
  if (!ddmmyyyy || ddmmyyyy.length !== 8) {
    throw new Error(`Invalid date format. Expected DDMMYYYY, got: ${ddmmyyyy}`);
  }

  const day = ddmmyyyy.substring(0, 2);
  const month = ddmmyyyy.substring(2, 4);
  const year = ddmmyyyy.substring(4, 8);

  return `${year}${month}${day}`;
}

/**
 * Convert date from YYYYMMDD to DDMMYYYY format
 * @param yyyymmdd Date in YYYYMMDD format (e.g., "20251001")
 * @returns Date in DDMMYYYY format (e.g., "01102025")
 */
export function yyyymmddToDdmmyyyy(yyyymmdd: string): string {
  if (!yyyymmdd || yyyymmdd.length !== 8) {
    throw new Error(`Invalid date format. Expected YYYYMMDD, got: ${yyyymmdd}`);
  }

  const year = yyyymmdd.substring(0, 4);
  const month = yyyymmdd.substring(4, 6);
  const day = yyyymmdd.substring(6, 8);

  return `${day}${month}${year}`;
}

/**
 * Validate DDMMYYYY date format
 * @param date Date in DDMMYYYY format
 * @returns true if valid, false otherwise
 */
export function isValidDdmmyyyy(date: string): boolean {
  if (!date || date.length !== 8) {
    return false;
  }

  const day = parseInt(date.substring(0, 2), 10);
  const month = parseInt(date.substring(2, 4), 10);
  const year = parseInt(date.substring(4, 8), 10);

  if (isNaN(day) || isNaN(month) || isNaN(year)) {
    return false;
  }

  if (month < 1 || month > 12) {
    return false;
  }

  if (day < 1 || day > 31) {
    return false;
  }

  // Check for valid day in month
  const daysInMonth = new Date(year, month, 0).getDate();
  if (day > daysInMonth) {
    return false;
  }

  return true;
}

/**
 * Validate YYYYMMDD date format
 * @param date Date in YYYYMMDD format
 * @returns true if valid, false otherwise
 */
export function isValidYyyymmdd(date: string): boolean {
  if (!date || date.length !== 8) {
    return false;
  }

  const year = parseInt(date.substring(0, 4), 10);
  const month = parseInt(date.substring(4, 6), 10);
  const day = parseInt(date.substring(6, 8), 10);

  if (isNaN(year) || isNaN(month) || isNaN(day)) {
    return false;
  }

  if (month < 1 || month > 12) {
    return false;
  }

  if (day < 1 || day > 31) {
    return false;
  }

  // Check for valid day in month
  const daysInMonth = new Date(year, month, 0).getDate();
  if (day > daysInMonth) {
    return false;
  }

  return true;
}
