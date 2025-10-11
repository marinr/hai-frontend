import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { handleProperties } from './handlers/properties';
import { handleReservations } from './handlers/reservations';
import { handleGuests } from './handlers/guests';
import { handleMessages } from './handlers/messages';
import { handleTasks } from './handlers/tasks';
import { handleStaff } from './handlers/staff';
import { noContentResponse, errorResponse } from './utils/response';

export const handler = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
  const method = event.requestContext.http.method;
  const path = event.rawPath;

  // Handle OPTIONS for CORS preflight
  if (method === 'OPTIONS') {
    return noContentResponse(204);
  }

  try {
    // Route to appropriate handler based on path
    if (path.startsWith('/properties')) {
      return await handleProperties(event);
    } else if (path.startsWith('/reservations')) {
      return await handleReservations(event);
    } else if (path.startsWith('/guests')) {
      return await handleGuests(event);
    } else if (path.startsWith('/messages')) {
      return await handleMessages(event);
    } else if (path.startsWith('/tasks')) {
      return await handleTasks(event);
    } else if (path.startsWith('/staff')) {
      return await handleStaff(event);
    }

    return errorResponse(404, 'Not Found');
  } catch (error) {
    console.error('Error handling request:', error);
    return errorResponse(500, error instanceof Error ? error.message : 'Internal Server Error');
  }
};
