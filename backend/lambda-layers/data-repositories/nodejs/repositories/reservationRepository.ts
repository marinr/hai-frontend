import { v4 as uuidv4 } from 'uuid';
import { Reservation, CreateReservationRequest } from '../types';
import { getItem, putItem, updateItem, deleteItem, queryItems } from '../utils/dynamodb';

const ENTITY_TYPE = 'RESERVATION';

/**
 * Create a new reservation
 */
export async function createReservation(data: CreateReservationRequest): Promise<Reservation> {
  const now = new Date().toISOString();

  // Dates are already in YYYYMMDD format from API
  const id = uuidv4();

  const reservation: Reservation = {
    PK: `${ENTITY_TYPE}#${id}`,
    SK: 'METADATA',
    GSI1PK: ENTITY_TYPE,
    GSI1SK: data.checkin_date,
    GSI2PK: `GUEST#${data.guest_id}`,
    GSI2SK: `${ENTITY_TYPE}#${id}`,
    GSI3PK: `PROPERTY#${data.room_id}`,
    GSI3SK: `${data.checkin_date}#${data.checkout_date}`,
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
 * Get a reservation by property (room) and stay dates
 */
export async function getReservationByPropertyAndDates(
  propertyId: string,
  checkinDate: string,
  checkoutDate: string
): Promise<Reservation | null> {
  // Dates are already in YYYYMMDD format from API
  const items = await queryItems({
    IndexName: 'GSI3',
    KeyConditionExpression: 'GSI3PK = :pk AND GSI3SK = :sk',
    ExpressionAttributeValues: {
      ':pk': `PROPERTY#${propertyId}`,
      ':sk': `${checkinDate}#${checkoutDate}`,
    },
    Limit: 1,
  });

  return (items[0] as Reservation | undefined) ?? null;
}

/**
 * Update a reservation
 */
export async function updateReservation(id: string, data: Partial<CreateReservationRequest>): Promise<Reservation> {
  const existingReservation = await getReservationById(id);
  if (!existingReservation) {
    throw new Error('Reservation not found');
  }

  const updateExpressions: string[] = [];
  const expressionAttributeNames: Record<string, string> = {};
  const expressionAttributeValues: Record<string, any> = {};

  let nextRoomId = existingReservation.room_id;
  let nextCheckinDate = existingReservation.checkin_date;
  let nextCheckoutDate = existingReservation.checkout_date;

  let index = 0;
  for (const [key, value] of Object.entries(data)) {
    if (key === 'checkin_date') {
      // Dates are already in YYYYMMDD format from API
      updateExpressions.push(`#attr${index} = :val${index}`);
      expressionAttributeNames[`#attr${index}`] = key;
      expressionAttributeValues[`:val${index}`] = value;
      
      // Also update GSI1SK
      updateExpressions.push(`#gsi1sk = :gsi1sk`);
      expressionAttributeNames['#gsi1sk'] = 'GSI1SK';
      expressionAttributeValues[':gsi1sk'] = value;

      nextCheckinDate = value as string;
    } else if (key === 'guest_id') {
      updateExpressions.push(`#attr${index} = :val${index}`);
      expressionAttributeNames[`#attr${index}`] = key;
      expressionAttributeValues[`:val${index}`] = value;

      updateExpressions.push(`#gsi2pk = :gsi2pk`);
      expressionAttributeNames['#gsi2pk'] = 'GSI2PK';
      expressionAttributeValues[':gsi2pk'] = `GUEST#${value as string}`;
    } else if (key === 'room_id') {
      updateExpressions.push(`#attr${index} = :val${index}`);
      expressionAttributeNames[`#attr${index}`] = key;
      expressionAttributeValues[`:val${index}`] = value;

      nextRoomId = value as string;
    } else if (key === 'checkout_date') {
      updateExpressions.push(`#attr${index} = :val${index}`);
      expressionAttributeNames[`#attr${index}`] = key;
      expressionAttributeValues[`:val${index}`] = value;

      nextCheckoutDate = value as string;
    } else {
      updateExpressions.push(`#attr${index} = :val${index}`);
      expressionAttributeNames[`#attr${index}`] = key;
      expressionAttributeValues[`:val${index}`] = value;
    }
    index++;
  }

  updateExpressions.push(`#gsi3pk = :gsi3pk`);
  expressionAttributeNames['#gsi3pk'] = 'GSI3PK';
  expressionAttributeValues[':gsi3pk'] = `PROPERTY#${nextRoomId}`;

  updateExpressions.push(`#gsi3sk = :gsi3sk`);
  expressionAttributeNames['#gsi3sk'] = 'GSI3SK';
  expressionAttributeValues[':gsi3sk'] = `${nextCheckinDate}#${nextCheckoutDate}`;

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
