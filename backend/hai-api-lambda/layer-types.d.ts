// Type declarations for Lambda layer modules at /opt/nodejs/
// These modules are provided by the Lambda layer at runtime

declare module '/opt/nodejs/repositories/guestRepository' {
  export function createGuest(data: any): Promise<any>;
  export function getGuestById(id: string): Promise<any>;
  export function updateGuest(id: string, data: any): Promise<any>;
  export function deleteGuest(id: string): Promise<void>;
  export function listGuests(): Promise<any[]>;
}

declare module '/opt/nodejs/repositories/messageRepository' {
  export function createMessage(data: any): Promise<any>;
  export function getMessageById(id: string): Promise<any>;
  export function updateMessage(id: string, data: any): Promise<any>;
  export function deleteMessage(id: string): Promise<void>;
  export function listMessages(guestId?: string): Promise<any[]>;
}

declare module '/opt/nodejs/repositories/propertyRepository' {
  export function createProperty(data: any): Promise<any>;
  export function getPropertyById(id: string): Promise<any>;
  export function updateProperty(id: string, data: any): Promise<any>;
  export function deleteProperty(id: string): Promise<void>;
  export function listProperties(): Promise<any[]>;
}

declare module '/opt/nodejs/repositories/reservationRepository' {
  export function createReservation(data: any): Promise<any>;
  export function getReservationById(id: string): Promise<any>;
  export function updateReservation(id: string, data: any): Promise<any>;
  export function deleteReservation(id: string): Promise<void>;
  export function listReservations(params?: any): Promise<any[]>;
}

declare module '/opt/nodejs/repositories/staffRepository' {
  export function createStaff(data: any): Promise<any>;
  export function getStaffById(id: string): Promise<any>;
  export function updateStaff(id: string, data: any): Promise<any>;
  export function deleteStaff(id: string): Promise<void>;
  export function listStaff(): Promise<any[]>;
}

declare module '/opt/nodejs/repositories/taskRepository' {
  export function createTask(data: any): Promise<any>;
  export function getTaskById(id: string): Promise<any>;
  export function updateTask(id: string, data: any): Promise<any>;
  export function deleteTask(id: string): Promise<void>;
  export function listTasks(staffId?: string): Promise<any[]>;
}

declare module '/opt/nodejs/utils/response' {
  export function jsonResponse(statusCode: number, body: any): any;
  export function errorResponse(statusCode: number, message: string): any;
  export function noContentResponse(statusCode: number): any;
}

declare module '/opt/nodejs/utils/dateUtils' {
  export function ddmmyyyyToYyyymmdd(date: string): string;
  export function yyyymmddToDdmmyyyy(date: string): string;
  export function isValidDdmmyyyy(date: string): boolean;
  export function isValidYyyymmdd(date: string): boolean;
}

declare module '/opt/nodejs/utils/dynamodb' {
  export function getItem(params: any): Promise<any>;
  export function putItem(params: any): Promise<any>;
  export function updateItem(params: any): Promise<any>;
  export function deleteItem(params: any): Promise<any>;
  export function queryItems(params: any): Promise<any[]>;
  export function scanItems(params: any): Promise<any[]>;
}
