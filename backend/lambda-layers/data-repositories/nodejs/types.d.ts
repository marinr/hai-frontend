export interface DynamoDBItem {
    PK: string;
    SK: string;
    GSI1PK?: string;
    GSI1SK?: string;
    GSI2PK?: string;
    GSI2SK?: string;
    GSI3PK?: string;
    GSI3SK?: string;
}
export interface Property extends DynamoDBItem {
    id: string;
    room_number: string;
    room_name: string;
    sea_view: boolean;
    num_of_single_beds: number;
    num_of_double_beds: number;
    num_of_splitable_double_beds: number;
    floor: number;
    room_count: number;
    createdAt: string;
    updatedAt: string;
}
export interface Guest extends DynamoDBItem {
    id: string;
    name: string;
    surname: string;
    country: string;
    city: string;
    region: string;
    date_birth: string;
    language: string;
    nationality: string;
    createdAt: string;
    updatedAt: string;
}
export interface Reservation extends DynamoDBItem {
    id: string;
    room_id: string;
    checkin_date: string;
    checkout_date: string;
    guest_id: string;
    number_of_guests: number;
    origin: string;
    origin_confirmation_id: string;
    required_crib: boolean;
    required_high_chair: boolean;
    required_parking: boolean;
    departure_ET: string;
    arrival_ET: string;
    flight_number: string;
    diatery_requests: string;
    special_requests: string;
    required_taxi: boolean;
    createdAt: string;
    updatedAt: string;
}
export interface Message extends DynamoDBItem {
    id: string;
    guest_id: string;
    reservation_id: string;
    communication_channel: string;
    message: string;
    date: string;
    createdAt: string;
    updatedAt: string;
}
export interface Staff extends DynamoDBItem {
    id: string;
    name: string;
    surname: string;
    type: string;
    contact_details: string;
    efficiency_score: number;
    overall_quality: number;
    createdAt: string;
    updatedAt: string;
}
export interface Task extends DynamoDBItem {
    id: string;
    staff_id: string;
    reservation_info_id: string;
    task_name: string;
    task_description: string;
    task_resolution_description: string;
    createdAt: string;
    updatedAt: string;
}
export interface CreatePropertyRequest {
    room_number: string;
    room_name: string;
    sea_view: boolean;
    num_of_single_beds: number;
    num_of_double_beds: number;
    num_of_splitable_double_beds: number;
    floor: number;
    room_count: number;
}
export interface CreateGuestRequest {
    name: string;
    surname: string;
    country: string;
    city: string;
    region: string;
    date_birth: string;
    language: string;
    nationality: string;
}
export interface CreateReservationRequest {
    room_id: string;
    checkin_date: string;
    checkout_date: string;
    guest_id: string;
    number_of_guests: number;
    origin: string;
    origin_confirmation_id: string;
    required_crib: boolean;
    required_high_chair: boolean;
    required_parking: boolean;
    departure_ET: string;
    arrival_ET: string;
    flight_number: string;
    diatery_requests: string;
    special_requests: string;
    required_taxi: boolean;
}
export interface CreateMessageRequest {
    guest_id: string;
    reservation_id: string;
    communication_channel: string;
    message: string;
    date: string;
}
export interface CreateStaffRequest {
    name: string;
    surname: string;
    type: string;
    contact_details: string;
    efficiency_score: number;
    overall_quality: number;
}
export interface CreateTaskRequest {
    staff_id: string;
    reservation_info_id: string;
    task_name: string;
    task_description: string;
    task_resolution_description: string;
}
//# sourceMappingURL=types.d.ts.map