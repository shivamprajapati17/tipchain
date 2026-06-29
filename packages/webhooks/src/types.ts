export interface WebhookEndpoint {
  url: string;
  secret?: string;
  events: string[];
  retryCount?: number;
  timeout?: number;
}

export interface WebhookDelivery {
  id: string;
  event: string;
  payload: unknown;
  endpoint: string;
  status: "pending" | "delivered" | "failed";
  attempts: number;
  createdAt: string;
}
