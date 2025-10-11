import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import {
  createReservation,
  getReservationById,
  updateReservation,
  deleteReservation,
  listReservations,
} from '../repositories/reservationRepository';
import { jsonResponse, errorResponse } from '../utils/response';
import { isValidDdmmyyyy } from '../utils/dateUtils';

export async function handleReservations(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> {
  const method = event.requestContext.http.method;
  const pathParams = event.pathParameters || {};
  const id = pathParams.id;

  try {
    switch (method) {
      case 'GET':
        if (id) {
          const reservation = await getReservationById(id);
          if (!reservation) {
            return errorResponse(404, 'Reservation not found');
          }
          return jsonResponse(200, reservation);
        } else {
          const reservations = await listReservations();
          return jsonResponse(200, reservations);
        }

      case 'POST':
        if (!event.body) {
          return errorResponse(400, 'Request body is required');
        }
        const createData = JSON.parse(event.body);
        
        // Validate date formats
        if (!isValidDdmmyyyy(createData.checkin_date)) {
          return errorResponse(400, 'Invalid checkin_date format. Expected DDMMYYYY');
        }
        if (!isValidDdmmyyyy(createData.checkout_date)) {
          return errorResponse(400, 'Invalid checkout_date format. Expected DDMMYYYY');
        }
        
        const newReservation = await createReservation(createData);
        return jsonResponse(201, newReservation);

      case 'PUT':
        if (!id) {
          return errorResponse(400, 'Reservation ID is required');
        }
        if (!event.body) {
          return errorResponse(400, 'Request body is required');
        }
        const updateData = JSON.parse(event.body);
        
        // Validate date formats if provided
        if (updateData.checkin_date && !isValidDdmmyyyy(updateData.checkin_date)) {
          return errorResponse(400, 'Invalid checkin_date format. Expected DDMMYYYY');
        }
        if (updateData.checkout_date && !isValidDdmmyyyy(updateData.checkout_date)) {
          return errorResponse(400, 'Invalid checkout_date format. Expected DDMMYYYY');
        }
        
        const updatedReservation = await updateReservation(id, updateData);
        return jsonResponse(200, updatedReservation);

      case 'DELETE':
        if (!id) {
          return errorResponse(400, 'Reservation ID is required');
        }
        await deleteReservation(id);
        return jsonResponse(204, null);

      default:
        return errorResponse(405, 'Method not allowed');
    }
  } catch (error) {
    console.error('Error in reservations handler:', error);
    return errorResponse(500, error instanceof Error ? error.message : 'Internal server error');
  }
}
