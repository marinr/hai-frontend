import { Task, CreateTaskRequest } from '../types';
/**
 * Create a new task
 */
export declare function createTask(data: CreateTaskRequest): Promise<Task>;
/**
 * Get a task by ID
 */
export declare function getTaskById(id: string): Promise<Task | null>;
/**
 * Update a task
 */
export declare function updateTask(id: string, data: Partial<CreateTaskRequest>): Promise<Task>;
/**
 * Delete a task
 */
export declare function deleteTask(id: string): Promise<void>;
/**
 * List all tasks
 */
export declare function listTasks(): Promise<Task[]>;
/**
 * Get tasks by reservation ID
 */
export declare function getTasksByReservationId(reservationId: string): Promise<Task[]>;
//# sourceMappingURL=taskRepository.d.ts.map