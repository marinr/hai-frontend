"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTask = createTask;
exports.getTaskById = getTaskById;
exports.updateTask = updateTask;
exports.deleteTask = deleteTask;
exports.listTasks = listTasks;
exports.getTasksByReservationId = getTasksByReservationId;
const uuid_1 = require("uuid");
const dynamodb_1 = require("../utils/dynamodb");
const ENTITY_TYPE = 'TASK';
/**
 * Create a new task
 */
async function createTask(data) {
    const id = (0, uuid_1.v4)();
    const now = new Date().toISOString();
    const task = {
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
    await (0, dynamodb_1.putItem)(task);
    return task;
}
/**
 * Get a task by ID
 */
async function getTaskById(id) {
    const item = await (0, dynamodb_1.getItem)(`${ENTITY_TYPE}#${id}`, 'METADATA');
    return item || null;
}
/**
 * Update a task
 */
async function updateTask(id, data) {
    const updateExpressions = [];
    const expressionAttributeNames = {};
    const expressionAttributeValues = {};
    let index = 0;
    for (const [key, value] of Object.entries(data)) {
        if (key === 'reservation_info_id') {
            if (typeof value !== 'string' || value.trim().length === 0) {
                throw new Error('reservation_info_id must be a non-empty string');
            }
            updateExpressions.push(`#attr${index} = :val${index}`);
            expressionAttributeNames[`#attr${index}`] = key;
            expressionAttributeValues[`:val${index}`] = value;
            updateExpressions.push(`#gsi2pk = :gsi2pk`);
            expressionAttributeNames['#gsi2pk'] = 'GSI2PK';
            expressionAttributeValues[':gsi2pk'] = `RESERVATION#${value}`;
            updateExpressions.push(`#gsi2sk = :gsi2sk`);
            expressionAttributeNames['#gsi2sk'] = 'GSI2SK';
            expressionAttributeValues[':gsi2sk'] = `${ENTITY_TYPE}#${id}`;
        }
        else {
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
    const updated = await (0, dynamodb_1.updateItem)(`${ENTITY_TYPE}#${id}`, 'METADATA', updateExpression, expressionAttributeNames, expressionAttributeValues);
    return updated;
}
/**
 * Delete a task
 */
async function deleteTask(id) {
    await (0, dynamodb_1.deleteItem)(`${ENTITY_TYPE}#${id}`, 'METADATA');
}
/**
 * List all tasks
 */
async function listTasks() {
    const items = await (0, dynamodb_1.queryItems)({
        IndexName: 'GSI1',
        KeyConditionExpression: 'GSI1PK = :pk',
        ExpressionAttributeValues: {
            ':pk': ENTITY_TYPE,
        },
    });
    return items;
}
/**
 * Get tasks by reservation ID
 */
async function getTasksByReservationId(reservationId) {
    const items = await (0, dynamodb_1.queryItems)({
        IndexName: 'GSI2',
        KeyConditionExpression: 'GSI2PK = :pk AND begins_with(GSI2SK, :sk)',
        ExpressionAttributeValues: {
            ':pk': `RESERVATION#${reservationId}`,
            ':sk': ENTITY_TYPE,
        },
    });
    return items;
}
