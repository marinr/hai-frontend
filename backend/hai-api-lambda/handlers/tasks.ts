import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import {
  createTask,
  getTaskById,
  updateTask,
  deleteTask,
  listTasks,
  getTasksByReservationId,
} from '../repositories/taskRepository';
import { jsonResponse, errorResponse, noContentResponse } from '../utils/response';

export async function handleTasks(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> {
  const method = event.requestContext.http.method;
  const pathParams = event.pathParameters || {};
  const queryParams = event.queryStringParameters || {};
  const id = pathParams.id;

  try {
    switch (method) {
      case 'GET':
        if (id) {
          const task = await getTaskById(id);
          if (!task) {
            return errorResponse(404, 'Task not found');
          }
          return jsonResponse(200, task);
        } else {
          const reservationId = queryParams.reservationId;
          if (reservationId) {
            const tasks = await getTasksByReservationId(reservationId);
            return jsonResponse(200, tasks);
          } else {
            const tasks = await listTasks();
            return jsonResponse(200, tasks);
          }
        }

      case 'POST':
        if (!event.body) {
          return errorResponse(400, 'Request body is required');
        }
        const createData = JSON.parse(event.body);
        const newTask = await createTask(createData);
        return jsonResponse(201, newTask);

      case 'PUT':
        if (!id) {
          return errorResponse(400, 'Task ID is required');
        }
        if (!event.body) {
          return errorResponse(400, 'Request body is required');
        }
        const updateData = JSON.parse(event.body);
        const updatedTask = await updateTask(id, updateData);
        return jsonResponse(200, updatedTask);

      case 'DELETE':
        if (!id) {
          return errorResponse(400, 'Task ID is required');
        }
        await deleteTask(id);
        return noContentResponse(204);

      default:
        return errorResponse(405, 'Method not allowed');
    }
  } catch (error) {
    console.error('Error in tasks handler:', error);
    return errorResponse(500, error instanceof Error ? error.message : 'Internal server error');
  }
}
