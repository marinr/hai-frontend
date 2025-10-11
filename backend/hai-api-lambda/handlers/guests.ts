import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import {
  createGuest,
  getGuestById,
  updateGuest,
  deleteGuest,
  listGuests,
  getGuestsByReservationId,
} from '../repositories/guestRepository';
import { jsonResponse, errorResponse } from '../utils/response';

export async function handleGuests(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> {
  const method = event.requestContext.http.method;
  const pathParams = event.pathParameters || {};
  const queryParams = event.queryStringParameters || {};
  const id = pathParams.id;

  try {
    switch (method) {
      case 'GET':
        if (id) {
          const guest = await getGuestById(id);
          if (!guest) {
            return errorResponse(404, 'Guest not found');
          }
          return jsonResponse(200, guest);
        } else {
          const reservationId = queryParams.reservationId;
          if (reservationId) {
            const guests = await getGuestsByReservationId(reservationId);
            return jsonResponse(200, guests);
          } else {
            const guests = await listGuests();
            return jsonResponse(200, guests);
          }
        }

      case 'POST':
        if (!event.body) {
          return errorResponse(400, 'Request body is required');
        }
        const createData = JSON.parse(event.body);
        const newGuest = await createGuest(createData);
        return jsonResponse(201, newGuest);

      case 'PUT':
        if (!id) {
          return errorResponse(400, 'Guest ID is required');
        }
        if (!event.body) {
          return errorResponse(400, 'Request body is required');
        }
        const updateData = JSON.parse(event.body);
        const updatedGuest = await updateGuest(id, updateData);
        return jsonResponse(200, updatedGuest);

      case 'DELETE':
        if (!id) {
          return errorResponse(400, 'Guest ID is required');
        }
        await deleteGuest(id);
        return jsonResponse(204, null);

      default:
        return errorResponse(405, 'Method not allowed');
    }
  } catch (error) {
    console.error('Error in guests handler:', error);
    return errorResponse(500, error instanceof Error ? error.message : 'Internal server error');
  }
}
