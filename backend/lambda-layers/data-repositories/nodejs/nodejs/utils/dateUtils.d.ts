/**
 * Convert date from DDMMYYYY to YYYYMMDD format
 * @param ddmmyyyy Date in DDMMYYYY format (e.g., "01102025")
 * @returns Date in YYYYMMDD format (e.g., "20251001")
 */
export declare function ddmmyyyyToYyyymmdd(ddmmyyyy: string): string;
/**
 * Convert date from YYYYMMDD to DDMMYYYY format
 * @param yyyymmdd Date in YYYYMMDD format (e.g., "20251001")
 * @returns Date in DDMMYYYY format (e.g., "01102025")
 */
export declare function yyyymmddToDdmmyyyy(yyyymmdd: string): string;
/**
 * Validate DDMMYYYY date format
 * @param date Date in DDMMYYYY format
 * @returns true if valid, false otherwise
 */
export declare function isValidDdmmyyyy(date: string): boolean;
/**
 * Validate YYYYMMDD date format
 * @param date Date in YYYYMMDD format
 * @returns true if valid, false otherwise
 */
export declare function isValidYyyymmdd(date: string): boolean;
