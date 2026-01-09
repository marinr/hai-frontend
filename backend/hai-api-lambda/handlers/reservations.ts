import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import {
  createReservation,
  getReservationById,
  getReservationByPropertyAndDates,
  updateReservation,
  deleteReservation,
  listReservations,
} from '/opt/nodejs/repositories/reservationRepository';
import { jsonResponse, errorResponse, noContentResponse } from '/opt/nodejs/utils/response';
import { isValidYyyymmdd } from '/opt/nodejs/utils/dateUtils';

export async function handleReservations(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> {
  const method = event.requestContext.http.method;
  const pathParams = event.pathParameters || {};
  const id = pathParams.id;
  const queryParams = event.queryStringParameters || {};

  try {
    switch (method) {
      case 'GET':
        if (id) {
          const reservation = await getReservationById(id);
          if (!reservation) {
            return errorResponse(404, 'Reservation not found');
          }
          return jsonResponse(200, reservation);
        } else if (queryParams.property_id && queryParams.check_in && queryParams.check_out) {
          const { property_id: propertyId, check_in: checkIn, check_out: checkOut } = queryParams;

          if (!isValidYyyymmdd(checkIn)) {
            return errorResponse(400, 'Invalid check_in format. Expected YYYYMMDD');
          }
          if (!isValidYyyymmdd(checkOut)) {
            return errorResponse(400, 'Invalid check_out format. Expected YYYYMMDD');
          }

          const reservation = await getReservationByPropertyAndDates(propertyId, checkIn, checkOut);
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
        if (!isValidYyyymmdd(createData.checkin_date)) {
          return errorResponse(400, 'Invalid checkin_date format. Expected YYYYMMDD');
        }
        if (!isValidYyyymmdd(createData.checkout_date)) {
          return errorResponse(400, 'Invalid checkout_date format. Expected YYYYMMDD');
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
        if (updateData.checkin_date && !isValidYyyymmdd(updateData.checkin_date)) {
          return errorResponse(400, 'Invalid checkin_date format. Expected YYYYMMDD');
        }
        if (updateData.checkout_date && !isValidYyyymmdd(updateData.checkout_date)) {
          return errorResponse(400, 'Invalid checkout_date format. Expected YYYYMMDD');
        }
        
        try {
          const updatedReservation = await updateReservation(id, updateData);
          return jsonResponse(200, updatedReservation);
        } catch (error) {
          if (error instanceof Error && error.message === 'Reservation not found') {
            return errorResponse(404, error.message);
          }
          throw error;
        }

      case 'DELETE':
        if (!id) {
          return errorResponse(400, 'Reservation ID is required');
        }
        await deleteReservation(id);
        return noContentResponse(204);

      default:
        return errorResponse(405, 'Method not allowed');
    }
  } catch (error) {
    console.error('Error in reservations handler:', error);
    return errorResponse(500, error instanceof Error ? error.message : 'Internal server error');
  }
}
