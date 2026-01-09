import { Message, CreateMessageRequest } from '../types';
/**
 * Create a new message
 */
export declare function createMessage(data: CreateMessageRequest): Promise<Message>;
/**
 * Get a message by ID
 */
export declare function getMessageById(id: string): Promise<Message | null>;
/**
 * Update a message
 */
export declare function updateMessage(id: string, data: Partial<CreateMessageRequest>): Promise<Message>;
/**
 * Delete a message
 */
export declare function deleteMessage(id: string): Promise<void>;
/**
 * List all messages
 */
export declare function listMessages(): Promise<Message[]>;
/**
 * Get messages by reservation ID
 */
export declare function getMessagesByReservationId(reservationId: string): Promise<Message[]>;
/**
 * Get messages by date (DDMMYYYY format)
 */
export declare function getMessagesByDate(dateDdmmyyyy: string): Promise<Message[]>;
//# sourceMappingURL=messageRepository.d.ts.map