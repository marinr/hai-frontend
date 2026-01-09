import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import {
  createMessage,
  getMessageById,
  updateMessage,
  deleteMessage,
  listMessages,
  getMessagesByReservationId,
  getMessagesByDate,
} from '/opt/nodejs/repositories/messageRepository';
import { jsonResponse, errorResponse, noContentResponse } from '/opt/nodejs/utils/response';
import { isValidDdmmyyyy } from '/opt/nodejs/utils/dateUtils';

export async function handleMessages(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> {
  const method = event.requestContext.http.method;
  const pathParams = event.pathParameters || {};
  const queryParams = event.queryStringParameters || {};
  const id = pathParams.id;

  try {
    switch (method) {
      case 'GET':
        if (id) {
          const message = await getMessageById(id);
          if (!message) {
            return errorResponse(404, 'Message not found');
          }
          return jsonResponse(200, message);
        } else {
          const reservationId = queryParams.reservationId;
          const date = queryParams.date;
          
          if (reservationId) {
            const messages = await getMessagesByReservationId(reservationId);
            return jsonResponse(200, messages);
          } else if (date) {
            if (!isValidDdmmyyyy(date)) {
              return errorResponse(400, 'Invalid date format. Expected DDMMYYYY');
            }
            const messages = await getMessagesByDate(date);
            return jsonResponse(200, messages);
          } else {
            const messages = await listMessages();
            return jsonResponse(200, messages);
          }
        }

      case 'POST':
        if (!event.body) {
          return errorResponse(400, 'Request body is required');
        }
        const createData = JSON.parse(event.body);
        
        if (!isValidDdmmyyyy(createData.date)) {
          return errorResponse(400, 'Invalid date format. Expected DDMMYYYY');
        }
        
        const newMessage = await createMessage(createData);
        return jsonResponse(201, newMessage);

      case 'PUT':
        if (!id) {
          return errorResponse(400, 'Message ID is required');
        }
        if (!event.body) {
          return errorResponse(400, 'Request body is required');
        }
        const updateData = JSON.parse(event.body);
        
        if (updateData.date && !isValidDdmmyyyy(updateData.date)) {
          return errorResponse(400, 'Invalid date format. Expected DDMMYYYY');
        }
        
        const updatedMessage = await updateMessage(id, updateData);
        return jsonResponse(200, updatedMessage);

      case 'DELETE':
        if (!id) {
          return errorResponse(400, 'Message ID is required');
        }
        await deleteMessage(id);
        return noContentResponse(204);

      default:
        return errorResponse(405, 'Method not allowed');
    }
  } catch (error) {
    console.error('Error in messages handler:', error);
    return errorResponse(500, error instanceof Error ? error.message : 'Internal server error');
  }
}
