import { Guest, CreateGuestRequest } from '../types';
/**
 * Create a new guest
 */
export declare function createGuest(data: CreateGuestRequest): Promise<Guest>;
/**
 * Get a guest by ID
 */
export declare function getGuestById(id: string): Promise<Guest | null>;
/**
 * Update a guest
 */
export declare function updateGuest(id: string, data: Partial<CreateGuestRequest>): Promise<Guest>;
/**
 * Delete a guest
 */
export declare function deleteGuest(id: string): Promise<void>;
/**
 * List all guests
 */
export declare function listGuests(): Promise<Guest[]>;
/**
 * Get guests by reservation ID
 */
//# sourceMappingURL=guestRepository.d.ts.map