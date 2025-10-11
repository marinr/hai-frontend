import { v4 as uuidv4 } from 'uuid';
import { Message, CreateMessageRequest } from '../types';
import { getItem, putItem, updateItem, deleteItem, queryItems } from '../utils/dynamodb';
import { ddmmyyyyToYyyymmdd } from '../utils/dateUtils';

const ENTITY_TYPE = 'MESSAGE';

/**
 * Create a new message
 */
export async function createMessage(data: CreateMessageRequest): Promise<Message> {
  const id = uuidv4();
  const now = new Date().toISOString();
  
  // Convert date to YYYYMMDD for storage
  const dateYyyymmdd = ddmmyyyyToYyyymmdd(data.date);

  const message: Message = {
    PK: `${ENTITY_TYPE}#${id}`,
    SK: 'METADATA',
    GSI1PK: ENTITY_TYPE,
    GSI1SK: dateYyyymmdd,
    GSI2PK: `RESERVATION#${data.reservation_id}`,
    GSI2SK: `${ENTITY_TYPE}#${id}`,
    id,
    ...data,
    createdAt: now,
    updatedAt: now,
  };

  await putItem(message);
  return message;
}

/**
 * Get a message by ID
 */
export async function getMessageById(id: string): Promise<Message | null> {
  const item = await getItem(`${ENTITY_TYPE}#${id}`, 'METADATA');
  return item || null;
}

/**
 * Update a message
 */
export async function updateMessage(id: string, data: Partial<CreateMessageRequest>): Promise<Message> {
  const updateExpressions: string[] = [];
  const expressionAttributeNames: Record<string, string> = {};
  const expressionAttributeValues: Record<string, any> = {};

  let index = 0;
  for (const [key, value] of Object.entries(data)) {
    if (key === 'date') {
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

  return updated as Message;
}

/**
 * Delete a message
 */
export async function deleteMessage(id: string): Promise<void> {
  await deleteItem(`${ENTITY_TYPE}#${id}`, 'METADATA');
}

/**
 * List all messages
 */
export async function listMessages(): Promise<Message[]> {
  const items = await queryItems({
    IndexName: 'GSI1',
    KeyConditionExpression: 'GSI1PK = :pk',
    ExpressionAttributeValues: {
      ':pk': ENTITY_TYPE,
    },
  });

  return items as Message[];
}

/**
 * Get messages by reservation ID
 */
export async function getMessagesByReservationId(reservationId: string): Promise<Message[]> {
  const items = await queryItems({
    IndexName: 'GSI2',
    KeyConditionExpression: 'GSI2PK = :pk AND begins_with(GSI2SK, :sk)',
    ExpressionAttributeValues: {
      ':pk': `RESERVATION#${reservationId}`,
      ':sk': ENTITY_TYPE,
    },
  });

  return items as Message[];
}

/**
 * Get messages by date (DDMMYYYY format)
 */
export async function getMessagesByDate(dateDdmmyyyy: string): Promise<Message[]> {
  const dateYyyymmdd = ddmmyyyyToYyyymmdd(dateDdmmyyyy);
  
  const items = await queryItems({
    IndexName: 'GSI1',
    KeyConditionExpression: 'GSI1PK = :pk AND GSI1SK = :sk',
    ExpressionAttributeValues: {
      ':pk': ENTITY_TYPE,
      ':sk': dateYyyymmdd,
    },
  });

  return items as Message[];
}
