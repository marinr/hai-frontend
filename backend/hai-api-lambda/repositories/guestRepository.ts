import { v4 as uuidv4 } from 'uuid';
import { Guest, CreateGuestRequest } from '../types';
import { getItem, putItem, updateItem, deleteItem, queryItems } from '../utils/dynamodb';

const ENTITY_TYPE = 'GUEST';

/**
 * Create a new guest
 */
export async function createGuest(data: CreateGuestRequest): Promise<Guest> {
  const id = uuidv4();
  const now = new Date().toISOString();

  const guest: Guest = {
    PK: `${ENTITY_TYPE}#${id}`,
    SK: 'METADATA',
    GSI1PK: ENTITY_TYPE,
    GSI1SK: id,
    id,
    ...data,
    createdAt: now,
    updatedAt: now,
  };

  await putItem(guest);
  return guest;
}

/**
 * Get a guest by ID
 */
export async function getGuestById(id: string): Promise<Guest | null> {
  const item = await getItem(`${ENTITY_TYPE}#${id}`, 'METADATA');
  return item || null;
}

/**
 * Update a guest
 */
export async function updateGuest(id: string, data: Partial<CreateGuestRequest>): Promise<Guest> {
  const updateExpressions: string[] = [];
  const expressionAttributeNames: Record<string, string> = {};
  const expressionAttributeValues: Record<string, any> = {};

  let index = 0;
  for (const [key, value] of Object.entries(data)) {
    updateExpressions.push(`#attr${index} = :val${index}`);
    expressionAttributeNames[`#attr${index}`] = key;
    expressionAttributeValues[`:val${index}`] = value;
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

  return updated as Guest;
}

/**
 * Delete a guest
 */
export async function deleteGuest(id: string): Promise<void> {
  await deleteItem(`${ENTITY_TYPE}#${id}`, 'METADATA');
}

/**
 * List all guests
 */
export async function listGuests(): Promise<Guest[]> {
  const items = await queryItems({
    IndexName: 'GSI1',
    KeyConditionExpression: 'GSI1PK = :pk',
    ExpressionAttributeValues: {
      ':pk': ENTITY_TYPE,
    },
  });

  return items as Guest[];
}

/**
 * Get guests by reservation ID
 */
