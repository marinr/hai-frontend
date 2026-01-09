import { Property, CreatePropertyRequest } from '../types';
/**
 * Create a new property
 */
export declare function createProperty(data: CreatePropertyRequest): Promise<Property>;
/**
 * Get a property by ID
 */
export declare function getPropertyById(id: string): Promise<Property | null>;
/**
 * Update a property
 */
export declare function updateProperty(id: string, data: Partial<CreatePropertyRequest>): Promise<Property>;
/**
 * Delete a property
 */
export declare function deleteProperty(id: string): Promise<void>;
/**
 * List all properties
 */
export declare function listProperties(): Promise<Property[]>;
/**
 * Search properties by date range
 * This checks if properties are available during the specified date range
 */
export declare function searchPropertiesByDateRange(fromDdmmyyyy: string, toDdmmyyyy: string): Promise<Property[]>;
//# sourceMappingURL=propertyRepository.d.ts.map