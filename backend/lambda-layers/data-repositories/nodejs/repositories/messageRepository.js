"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createMessage = createMessage;
exports.getMessageById = getMessageById;
exports.updateMessage = updateMessage;
exports.deleteMessage = deleteMessage;
exports.listMessages = listMessages;
exports.getMessagesByReservationId = getMessagesByReservationId;
exports.getMessagesByDate = getMessagesByDate;
const uuid_1 = require("uuid");
const dynamodb_1 = require("../utils/dynamodb");
const dateUtils_1 = require("../utils/dateUtils");
const ENTITY_TYPE = 'MESSAGE';
/**
 * Create a new message
 */
async function createMessage(data) {
    const id = (0, uuid_1.v4)();
    const now = new Date().toISOString();
    // Convert date to YYYYMMDD for storage
    const dateYyyymmdd = (0, dateUtils_1.ddmmyyyyToYyyymmdd)(data.date);
    const message = {
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
    await (0, dynamodb_1.putItem)(message);
    return message;
}
/**
 * Get a message by ID
 */
async function getMessageById(id) {
    const item = await (0, dynamodb_1.getItem)(`${ENTITY_TYPE}#${id}`, 'METADATA');
    return item || null;
}
/**
 * Update a message
 */
async function updateMessage(id, data) {
    const updateExpressions = [];
    const expressionAttributeNames = {};
    const expressionAttributeValues = {};
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
            expressionAttributeValues[':gsi1sk'] = (0, dateUtils_1.ddmmyyyyToYyyymmdd)(value);
        }
        else if (key === 'reservation_id') {
            if (typeof value !== 'string' || value.trim().length === 0) {
                throw new Error('reservation_id must be a non-empty string');
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
 * Delete a message
 */
async function deleteMessage(id) {
    await (0, dynamodb_1.deleteItem)(`${ENTITY_TYPE}#${id}`, 'METADATA');
}
/**
 * List all messages
 */
async function listMessages() {
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
 * Get messages by reservation ID
 */
async function getMessagesByReservationId(reservationId) {
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
/**
 * Get messages by date (DDMMYYYY format)
 */
async function getMessagesByDate(dateDdmmyyyy) {
    const dateYyyymmdd = (0, dateUtils_1.ddmmyyyyToYyyymmdd)(dateDdmmyyyy);
    const items = await (0, dynamodb_1.queryItems)({
        IndexName: 'GSI1',
        KeyConditionExpression: 'GSI1PK = :pk AND GSI1SK = :sk',
        ExpressionAttributeValues: {
            ':pk': ENTITY_TYPE,
            ':sk': dateYyyymmdd,
        },
    });
    return items;
}
//# sourceMappingURL=messageRepository.js.map