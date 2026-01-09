import { Staff, CreateStaffRequest } from '../types';
/**
 * Create a new staff member
 */
export declare function createStaff(data: CreateStaffRequest): Promise<Staff>;
/**
 * Get a staff member by ID
 */
export declare function getStaffById(id: string): Promise<Staff | null>;
/**
 * Update a staff member
 */
export declare function updateStaff(id: string, data: Partial<CreateStaffRequest>): Promise<Staff>;
/**
 * Delete a staff member
 */
export declare function deleteStaff(id: string): Promise<void>;
/**
 * List all staff members
 */
export declare function listStaff(): Promise<Staff[]>;
