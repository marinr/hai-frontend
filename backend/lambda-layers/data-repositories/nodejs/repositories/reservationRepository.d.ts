import { Reservation, CreateReservationRequest } from '../types';
/**
 * Create a new reservation
 */
export declare function createReservation(data: CreateReservationRequest): Promise<Reservation>;
/**
 * Get a reservation by ID
 */
export declare function getReservationById(id: string): Promise<Reservation | null>;
/**
 * Get a reservation by property (room) and stay dates
 */
export declare function getReservationByPropertyAndDates(propertyId: string, checkinDate: string, checkoutDate: string): Promise<Reservation | null>;
/**
 * Update a reservation
 */
export declare function updateReservation(id: string, data: Partial<CreateReservationRequest>): Promise<Reservation>;
/**
 * Delete a reservation
 */
export declare function deleteReservation(id: string): Promise<void>;
/**
 * List all reservations
 */
export declare function listReservations(): Promise<Reservation[]>;
//# sourceMappingURL=reservationRepository.d.ts.map