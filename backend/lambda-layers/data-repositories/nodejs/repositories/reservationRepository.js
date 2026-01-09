"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createReservation = createReservation;
exports.getReservationById = getReservationById;
exports.getReservationByPropertyAndDates = getReservationByPropertyAndDates;
exports.updateReservation = updateReservation;
exports.deleteReservation = deleteReservation;
exports.listReservations = listReservations;
const uuid_1 = require("uuid");
const dynamodb_1 = require("../utils/dynamodb");
const dateUtils_1 = require("../utils/dateUtils");
const ENTITY_TYPE = 'RESERVATION';
/**
 * Create a new reservation
 */
async function createReservation(data) {
    const now = new Date().toISOString();
    // Convert dates to YYYYMMDD for storage
    const checkinYyyymmdd = (0, dateUtils_1.ddmmyyyyToYyyymmdd)(data.checkin_date);
    const checkoutYyyymmdd = (0, dateUtils_1.ddmmyyyyToYyyymmdd)(data.checkout_date);
    // Generate a unique identifier for the reservation
    const id = (0, uuid_1.v4)();
    const reservation = {
        PK: `${ENTITY_TYPE}#${id}`,
        SK: 'METADATA',
        GSI1PK: ENTITY_TYPE,
        GSI1SK: checkinYyyymmdd,
        GSI2PK: `GUEST#${data.guest_id}`,
        GSI2SK: `${ENTITY_TYPE}#${id}`,
        GSI3PK: `PROPERTY#${data.room_id}`,
        GSI3SK: `${checkinYyyymmdd}#${checkoutYyyymmdd}`,
        id,
        ...data,
        createdAt: now,
        updatedAt: now,
    };
    await (0, dynamodb_1.putItem)(reservation);
    return reservation;
}
/**
 * Get a reservation by ID
 */
async function getReservationById(id) {
    const item = await (0, dynamodb_1.getItem)(`${ENTITY_TYPE}#${id}`, 'METADATA');
    return item || null;
}
/**
 * Get a reservation by property (room) and stay dates
 */
async function getReservationByPropertyAndDates(propertyId, checkinDate, checkoutDate) {
    const checkinYyyymmdd = (0, dateUtils_1.ddmmyyyyToYyyymmdd)(checkinDate);
    const checkoutYyyymmdd = (0, dateUtils_1.ddmmyyyyToYyyymmdd)(checkoutDate);
    const items = await (0, dynamodb_1.queryItems)({
        IndexName: 'GSI3',
        KeyConditionExpression: 'GSI3PK = :pk AND GSI3SK = :sk',
        ExpressionAttributeValues: {
            ':pk': `PROPERTY#${propertyId}`,
            ':sk': `${checkinYyyymmdd}#${checkoutYyyymmdd}`,
        },
        Limit: 1,
    });
    return items[0] ?? null;
}
/**
 * Update a reservation
 */
async function updateReservation(id, data) {
    const existingReservation = await getReservationById(id);
    if (!existingReservation) {
        throw new Error('Reservation not found');
    }
    const updateExpressions = [];
    const expressionAttributeNames = {};
    const expressionAttributeValues = {};
    let nextRoomId = existingReservation.room_id;
    let nextCheckinDate = existingReservation.checkin_date;
    let nextCheckoutDate = existingReservation.checkout_date;
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
            expressionAttributeValues[':gsi1sk'] = (0, dateUtils_1.ddmmyyyyToYyyymmdd)(value);
            nextCheckinDate = value;
        }
        else if (key === 'guest_id') {
            updateExpressions.push(`#attr${index} = :val${index}`);
            expressionAttributeNames[`#attr${index}`] = key;
            expressionAttributeValues[`:val${index}`] = value;
            updateExpressions.push(`#gsi2pk = :gsi2pk`);
            expressionAttributeNames['#gsi2pk'] = 'GSI2PK';
            expressionAttributeValues[':gsi2pk'] = `GUEST#${value}`;
        }
        else if (key === 'room_id') {
            updateExpressions.push(`#attr${index} = :val${index}`);
            expressionAttributeNames[`#attr${index}`] = key;
            expressionAttributeValues[`:val${index}`] = value;
            nextRoomId = value;
        }
        else if (key === 'checkout_date') {
            updateExpressions.push(`#attr${index} = :val${index}`);
            expressionAttributeNames[`#attr${index}`] = key;
            expressionAttributeValues[`:val${index}`] = value;
            nextCheckoutDate = value;
        }
        else {
            updateExpressions.push(`#attr${index} = :val${index}`);
            expressionAttributeNames[`#attr${index}`] = key;
            expressionAttributeValues[`:val${index}`] = value;
        }
        index++;
    }
    const checkinYyyymmdd = (0, dateUtils_1.ddmmyyyyToYyyymmdd)(nextCheckinDate);
    const checkoutYyyymmdd = (0, dateUtils_1.ddmmyyyyToYyyymmdd)(nextCheckoutDate);
    updateExpressions.push(`#gsi3pk = :gsi3pk`);
    expressionAttributeNames['#gsi3pk'] = 'GSI3PK';
    expressionAttributeValues[':gsi3pk'] = `PROPERTY#${nextRoomId}`;
    updateExpressions.push(`#gsi3sk = :gsi3sk`);
    expressionAttributeNames['#gsi3sk'] = 'GSI3SK';
    expressionAttributeValues[':gsi3sk'] = `${checkinYyyymmdd}#${checkoutYyyymmdd}`;
    updateExpressions.push(`#updatedAt = :updatedAt`);
    expressionAttributeNames['#updatedAt'] = 'updatedAt';
    expressionAttributeValues[':updatedAt'] = new Date().toISOString();
    const updateExpression = `SET ${updateExpressions.join(', ')}`;
    const updated = await (0, dynamodb_1.updateItem)(`${ENTITY_TYPE}#${id}`, 'METADATA', updateExpression, expressionAttributeNames, expressionAttributeValues);
    return updated;
}
/**
 * Delete a reservation
 */
async function deleteReservation(id) {
    await (0, dynamodb_1.deleteItem)(`${ENTITY_TYPE}#${id}`, 'METADATA');
}
/**
 * List all reservations
 */
async function listReservations() {
    const items = await (0, dynamodb_1.queryItems)({
        IndexName: 'GSI1',
        KeyConditionExpression: 'GSI1PK = :pk',
        ExpressionAttributeValues: {
            ':pk': ENTITY_TYPE,
        },
    });
    return items;
}
//# sourceMappingURL=reservationRepository.js.map