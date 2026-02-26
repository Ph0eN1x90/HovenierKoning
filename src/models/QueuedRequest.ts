export interface QueuedRequest {
  id: string;
  url: string;
  method: 'POST' | 'PUT' | 'DELETE';
  data?: unknown;
  clientId?: number;
  timestamp: number;
  description: string;
}
