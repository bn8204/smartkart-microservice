/**
 * RabbitMQ consumer — order-service
 *
 * Consumes 'payment.processed' events published by payment-service.
 * Saga step 3: updates order.status to CONFIRMED (SUCCESS) or FAILED.
 *
 * Reliability:
 *   - Exponential backoff reconnect (max 10 retries, cap 30 s)
 *   - DLQ: payment.processed.dlq via smartcart.dlx exchange
 *   - prefetch(1): one message processed at a time
 *   - nack without requeue on unrecoverable errors → routed to DLQ
 *   - Graceful close() for SIGTERM/SIGINT handling
 */
const amqp = require('amqplib');
const db   = require('./db');

const RABBITMQ_URL  = process.env.RABBITMQ_URL || 'amqp://localhost:5672';
const QUEUE         = 'payment.processed';
const DLX           = 'smartcart.dlx';
const DLQ           = `${QUEUE}.dlq`;
const MAX_RETRIES   = 10;
const BASE_DELAY_MS = 2000;

let retryCount = 0;
let retryTimer = null;
let connection = null;

async function startConsumer() {
  if (retryTimer) { clearTimeout(retryTimer); retryTimer = null; }
  try {
    const conn    = await amqp.connect(RABBITMQ_URL);
    connection    = conn;
    const channel = await conn.createChannel();

    // Dead Letter Exchange setup — must match payment-service publisher declaration
    await channel.assertExchange(DLX, 'direct', { durable: true });
    await channel.assertQueue(DLQ, { durable: true });
    await channel.bindQueue(DLQ, DLX, QUEUE);

    await channel.assertQueue(QUEUE, {
      durable: true,
      arguments: {
        'x-dead-letter-exchange':    DLX,
        'x-dead-letter-routing-key': QUEUE
      }
    });

    channel.prefetch(1);
    retryCount = 0;
    console.log(`[order-service] Consumer RabbitMQ connected ✓  listening on: ${QUEUE}`);

    conn.on('close', () => {
      console.warn('[order-service] Consumer RabbitMQ connection closed — reconnecting…');
      connection = null;
      scheduleReconnect();
    });
    conn.on('error', (err) => {
      console.warn('[order-service] Consumer RabbitMQ error:', err.message);
    });

    channel.consume(QUEUE, async (msg) => {
      if (!msg) return;

      // ── Parse message ──────────────────────────────────────────────────────
      let payload;
      try {
        payload = JSON.parse(msg.content.toString());
      } catch {
        // Malformed JSON — send to DLQ immediately
        console.warn('[order-service] Malformed payment.processed message — dead lettering');
        channel.nack(msg, false, false);
        return;
      }

      const { orderId, status } = payload;

      if (!orderId || !status) {
        console.warn(`[order-service] Invalid payment.processed payload — dead lettering`, payload);
        channel.nack(msg, false, false);
        return;
      }

      const orderStatus = status === 'SUCCESS' ? 'CONFIRMED' : 'FAILED';
      console.log(`[order-service] Received payment.processed — orderId=${orderId}, status=${status} → order ${orderStatus}`);

      try {
        const result = await db.query(
          'UPDATE orders SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING id',
          [orderStatus, orderId]
        );
        if (result.rowCount === 0) {
          console.warn(`[order-service] Order ${orderId} not found — dead lettering payment.processed`);
          channel.nack(msg, false, false);
          return;
        }
        console.log(`[order-service] Order ${orderId} status updated to ${orderStatus}`);
        channel.ack(msg);
      } catch (err) {
        // DB error — dead letter (no infinite requeue loop)
        console.error('[order-service] Failed to update order status:', err.message);
        channel.nack(msg, false, false);
      }
    });
  } catch (err) {
    console.warn('[order-service] Consumer RabbitMQ connect failed:', err.message);
    scheduleReconnect();
  }
}

function scheduleReconnect() {
  if (retryCount >= MAX_RETRIES) {
    console.warn('[order-service] Consumer RabbitMQ max retries reached.');
    return;
  }
  const delay = Math.min(BASE_DELAY_MS * Math.pow(2, retryCount), 30000);
  retryCount++;
  console.log(`[order-service] Consumer retry ${retryCount}/${MAX_RETRIES} in ${delay}ms…`);
  retryTimer = setTimeout(startConsumer, delay);
}

async function close() {
  if (connection) {
    try { await connection.close(); } catch {}
    connection = null;
  }
}

module.exports = { startConsumer, close };
