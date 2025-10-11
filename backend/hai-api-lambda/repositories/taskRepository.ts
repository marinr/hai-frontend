import { v4 as uuidv4 } from 'uuid';
import { Task, CreateTaskRequest } from '../types';
import { getItem, putItem, updateItem, deleteItem, queryItems } from '../utils/dynamodb';

const ENTITY_TYPE = 'TASK';

/**
 * Create a new task
 */
export async function createTask(data: CreateTaskRequest): Promise<Task> {
  const id = uuidv4();
  const now = new Date().toISOString();

  const task: Task = {
    PK: `${ENTITY_TYPE}#${id}`,
    SK: 'METADATA',
    GSI1PK: ENTITY_TYPE,
    GSI1SK: id,
    GSI2PK: `RESERVATION#${data.reservation_info_id}`,
    GSI2SK: `${ENTITY_TYPE}#${id}`,
    id,
    ...data,
    createdAt: now,
    updatedAt: now,
  };

  await putItem(task);
  return task;
}

/**
 * Get a task by ID
 */
export async function getTaskById(id: string): Promise<Task | null> {
  const item = await getItem(`${ENTITY_TYPE}#${id}`, 'METADATA');
  return item || null;
}

/**
 * Update a task
 */
export async function updateTask(id: string, data: Partial<CreateTaskRequest>): Promise<Task> {
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

  return updated as Task;
}

/**
 * Delete a task
 */
export async function deleteTask(id: string): Promise<void> {
  await deleteItem(`${ENTITY_TYPE}#${id}`, 'METADATA');
}

/**
 * List all tasks
 */
export async function listTasks(): Promise<Task[]> {
  const items = await queryItems({
    IndexName: 'GSI1',
    KeyConditionExpression: 'GSI1PK = :pk',
    ExpressionAttributeValues: {
      ':pk': ENTITY_TYPE,
    },
  });

  return items as Task[];
}

/**
 * Get tasks by reservation ID
 */
export async function getTasksByReservationId(reservationId: string): Promise<Task[]> {
  const items = await queryItems({
    IndexName: 'GSI2',
    KeyConditionExpression: 'GSI2PK = :pk AND begins_with(GSI2SK, :sk)',
    ExpressionAttributeValues: {
      ':pk': `RESERVATION#${reservationId}`,
      ':sk': ENTITY_TYPE,
    },
  });

  return items as Task[];
}
