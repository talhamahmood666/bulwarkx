import axios, { AxiosInstance } from 'axios';
import { query, queryOne } from '../db/pool';
import { WebSocketServer } from './websocket';

const MAX_RETRIES = 5;
const RETRY_DELAYS = [1000, 5000, 30000, 120000, 300000];

interface WebhookConfig {
  id: string;
  url: string;
  event_type: string;
  secret_hash: string;
  active: boolean;
}

interface WebhookDelivery {
  id: string;
  webhook_id: string;
  event_id: string;
  payload: any;
  status_code: number | null;
  attempt: number;
  next_retry_at: Date | null;
}

export class WebhookService {
  private ws: WebSocketServer;
  private circuitBreakers: Map<string, CircuitBreaker> = new Map();
  private retryQueue: NodeJS.Timeout[] = [];

  constructor(ws: WebSocketServer) {
    this.ws = ws;
  }

  async enqueueWebhook(webhookId: string, eventId: string, payload: any): Promise<void> {
    const [delivery] = await query<WebhookDelivery>(
      `INSERT INTO webhook_deliveries (webhook_id, event_id, payload, attempt)
       VALUES ($1, $2, $3, 1)
       ON CONFLICT (webhook_id, event_id, attempt) DO NOTHING
       RETURNING *`,
      [webhookId, eventId, JSON.stringify(payload)]
    );
    if (delivery) {
      await this.deliver(delivery.id as string, webhookId, eventId, payload, 1);
    }
  }

  private async deliver(
    deliveryId: string, 
    webhookId: string, 
    eventId: string, 
    payload: any, 
    attempt: number
  ): Promise<void> {
    const webhook = await queryOne<WebhookConfig>(
      'SELECT * FROM webhooks WHERE id = $1 AND active = true',
      [webhookId]
    );

    if (!webhook) {
      console.log(`Webhook ${webhookId} not active, skipping`);
      return;
    }

    const breaker = this.getCircuitBreaker(webhook.url);
    if (!breaker.canRequest()) {
      await this.scheduleRetry(deliveryId, webhookId, eventId, payload, attempt);
      return;
    }

    try {
      const httpClient = this.createHttpClient(webhook.url);
      const response = await httpClient.post('/', payload, {
        timeout: 30000,
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Secret': webhook.secret_hash,
          'X-Event-Id': eventId,
        },
      });

      await query(
        `UPDATE webhook_deliveries SET status_code = $2, response_body = $3, delivered_at = NOW() WHERE id = $1`,
        [deliveryId, response.status, JSON.stringify(response.data)]
      );
      
      await query('UPDATE webhooks SET last_triggered_at = NOW(), failure_count = 0 WHERE id = $1', [webhookId]);
      breaker.recordSuccess();
    } catch (err: any) {
      await query(
        `UPDATE webhook_deliveries SET status_code = $2, response_body = $3 WHERE id = $1`,
        [deliveryId, err.response?.status || 0, err.message]
      );
      breaker.recordFailure();

      if (attempt < MAX_RETRIES) {
        await this.scheduleRetry(deliveryId, webhookId, eventId, payload, attempt + 1);
      } else {
        await query('UPDATE webhooks SET failure_count = failure_count + 1 WHERE id = $1', [webhookId]);
        console.error(`Webhook ${webhookId} failed after ${MAX_RETRIES} attempts`);
      }
    }
  }

  private async scheduleRetry(
    deliveryId: string,
    webhookId: string,
    eventId: string,
    payload: any,
    attempt: number
  ): Promise<void> {
    const delay = RETRY_DELAYS[attempt - 1] || RETRY_DELAYS[RETRY_DELAYS.length - 1];
    const nextRetry = new Date(Date.now() + delay);

    await query(
      'UPDATE webhook_deliveries SET next_retry_at = $2, attempt = $3 WHERE id = $1',
      [deliveryId, nextRetry, attempt]
    );

    const timeout = setTimeout(() => {
      this.deliver(deliveryId, webhookId, eventId, payload, attempt).catch(console.error);
    }, delay);

    this.retryQueue.push(timeout);
  }

  private getCircuitBreaker(url: string): CircuitBreaker {
    if (!this.circuitBreakers.has(url)) {
      this.circuitBreakers.set(url, new CircuitBreaker());
    }
    return this.circuitBreakers.get(url)!;
  }

  private createHttpClient(url: string): AxiosInstance {
    return axios.create({ baseURL: url });
  }

  async processPendingWebhooks(): Promise<void> {
    const pending = await query<{ id: string; webhook_id: string; event_id: string; payload: any; attempt: number }>(
      `SELECT wd.id, wd.webhook_id, wd.event_id, wd.payload, wd.attempt 
       FROM webhook_deliveries wd
       WHERE wd.next_retry_at IS NOT NULL AND wd.next_retry_at <= NOW()`
    );

    for (const p of pending) {
      await this.deliver(p.id, p.webhook_id, p.event_id, p.payload, p.attempt);
    }
  }

  stop(): void {
    for (const t of this.retryQueue) {
      clearTimeout(t);
    }
  }
}

class CircuitBreaker {
  private failures = 0;
  private lastFailure = 0;
  private state: 'closed' | 'open' | 'half-open' = 'closed';

  private readonly threshold = 5;
  private readonly resetTimeout = 60000;

  canRequest(): boolean {
    if (this.state === 'closed') return true;
    if (this.state === 'open' && Date.now() - this.lastFailure > this.resetTimeout) {
      this.state = 'half-open';
      return true;
    }
    return this.state === 'half-open';
  }

  recordSuccess(): void {
    this.failures = 0;
    this.state = 'closed';
  }

  recordFailure(): void {
    this.failures++;
    this.lastFailure = Date.now();
    if (this.failures >= this.threshold) {
      this.state = 'open';
    }
  }
}