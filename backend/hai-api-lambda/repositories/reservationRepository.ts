import { v4 as uuidv4 } from 'uuid';
import { Reservation, CreateReservationRequest } from '../types';
import { getItem, putItem, updateItem, deleteItem, queryItems } from '../utils/dynamodb';
import { ddmmyyyyToYyyymmdd, yyyymmddToDdmmyyyy } from '../utils/dateUtils';

const ENTITY_TYPE = 'RESERVATION';

/**
 * Create a new reservation
 */
export async function createReservation(data: CreateReservationRequest): Promise<Reservation> {
  const now = new Date().toISOString();
  
  // Convert dates to YYYYMMDD for storage
  const checkinYyyymmdd = ddmmyyyyToYyyymmdd(data.checkin_date);
  const checkoutYyyymmdd = ddmmyyyyToYyyymmdd(data.checkout_date);
  
  // Generate ID in format: room_number-checkin-checkout (e.g., "101-15112025-20112025")
  // We need to get the room_number from the room_id - for now we'll use a simple approach
  // In production, you might want to fetch the property to get the room_number
  const id = `${data.room_id}-${data.checkin_date}-${data.checkout_date}`;

  const reservation: Reservation = {
    PK: `${ENTITY_TYPE}#${id}`,
    SK: 'METADATA',
    GSI1PK: ENTITY_TYPE,
    GSI1SK: checkinYyyymmdd,
    GSI2PK: `GUEST#${data.guest_id}`,
    GSI2SK: `${ENTITY_TYPE}#${id}`,
    id,
    ...data,
    createdAt: now,
    updatedAt: now,
  };

  await putItem(reservation);
  return reservation;
}

/**
 * Get a reservation by ID
 */
export async function getReservationById(id: string): Promise<Reservation | null> {
  const item = await getItem(`${ENTITY_TYPE}#${id}`, 'METADATA');
  return item || null;
}

/**
 * Update a reservation
 */
export async function updateReservation(id: string, data: Partial<CreateReservationRequest>): Promise<Reservation> {
  const updateExpressions: string[] = [];
  const expressionAttributeNames: Record<string, string> = {};
  const expressionAttributeValues: Record<string, any> = {};

  let index = 0;
  for (const [key, value] of Object.entries(data)) {
    if (key === 'checkin_date') {
      // Convert date to YYYYMMDD for storage
      updateExpressions.push(`#attr${index} = :val${index}`);
      expressionAttributeNames[`#attr${index}`] = key;
      expressionAttributeValues[`:val${index}`] = value;
      
      // Also update GSI1SK
      updateExpressions.push(`#gsi1sk = :gsi1sk`);
      expressionAttributeNames['#gsi1sk'] = 'GSI1SK';
      expressionAttributeValues[':gsi1sk'] = ddmmyyyyToYyyymmdd(value as string);
    } else {
      updateExpressions.push(`#attr${index} = :val${index}`);
      expressionAttributeNames[`#attr${index}`] = key;
      expressionAttributeValues[`:val${index}`] = value;
    }
    index++;
  }

  updateExpressions.push(`#updatedAt = :updatedAt`);
  expressionAttributeNames['#updatedAt'] = 'updatedAt';
  expressionAttributeValues[':updatedAt'] = new Date().toISOString();

  const updateExpression = `SET ${updateExpressions.join(', ')}`;

  const updated = await updateItem(
    `${ENTITY_TYPE}#${id}`,
    'METADATA',
    updateExpression,
    expressionAttributeNames,
    expressionAttributeValues
  );

  return updated as Reservation;
}

/**
 * Delete a reservation
 */
export async function deleteReservation(id: string): Promise<void> {
  await deleteItem(`${ENTITY_TYPE}#${id}`, 'METADATA');
}

/**
 * List all reservations
 */
export async function listReservations(): Promise<Reservation[]> {
  const items = await queryItems({
    IndexName: 'GSI1',
    KeyConditionExpression: 'GSI1PK = :pk',
    ExpressionAttributeValues: {
      ':pk': ENTITY_TYPE,
    },
  });

  return items as Reservation[];
}
