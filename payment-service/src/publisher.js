/**
 * RabbitMQ publisher — payment-service
 *
 * Publishes 'payment.processed' events after a payment is processed.
 * order-service consumes this event and updates order.status to
 * CONFIRMED (on SUCCESS) or FAILED (on FAILED).
 *
 * Saga step:  order.placed → [payment-service] → payment.processed
 * Pattern:    Choreography Saga — reply channel
 *
 * Reliability:
 *   - Exponential backoff reconnect (max 10 retries, cap 30 s)
 *   - DLQ: payment.processed.dlq via smartcart.dlx exchange
 *   - Graceful close() for SIGTERM/SIGINT handling
 */
const amqp = require('amqplib');

const RABBITMQ_URL  = process.env.RABBITMQ_URL || 'amqp://localhost:5672';
const QUEUE         = 'payment.processed';
const DLX           = 'smartcart.dlx';
const DLQ           = `${QUEUE}.dlq`;
const MAX_RETRIES   = 10;
const BASE_DELAY_MS = 2000;

let channel    = null;
let connection = null;
let retryCount = 0;
let retryTimer = null;

async function connect() {
  if (retryTimer) { clearTimeout(retryTimer); retryTimer = null; }
  try {
    const conn = await amqp.connect(RABBITMQ_URL);
    connection  = conn;
    channel     = await conn.createChannel();

    // Dead Letter Exchange — unprocessable messages routed to payment.processed.dlq
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

    retryCount = 0;
    console.log(`[payment-service] Publisher RabbitMQ connected ✓  queue: ${QUEUE}`);

    conn.on('close', () => {
      console.warn('[payment-service] Publisher RabbitMQ connection closed — reconnecting…');
      channel    = null;
      connection = null;
      scheduleReconnect();
    });
    conn.on('error', (err) => {
      console.warn('[payment-service] Publisher RabbitMQ error:', err.message);
      channel = null;
    });
  } catch (err) {
    channel = null;
    scheduleReconnect();
  }
}

function scheduleReconnect() {
  if (retryCount >= MAX_RETRIES) {
    console.warn('[payment-service] Publisher RabbitMQ max retries reached.');
    return;
  }
  const delay = Math.min(BASE_DELAY_MS * Math.pow(2, retryCount), 30000);
  retryCount++;
  console.log(`[payment-service] Publisher retry ${retryCount}/${MAX_RETRIES} in ${delay}ms…`);
  retryTimer = setTimeout(connect, delay);
}

/**
 * Publish a payment.processed event.
 * @param {object} payload - { orderId, userId, amount, paymentId, status, failureReason }
 */
async function publishPaymentProcessed(payload) {
  if (!channel) {
    console.warn(
      `[payment-service] RabbitMQ unavailable — payment.processed NOT published for orderId=${payload.orderId}`
    );
    return;
  }
  const msg = Buffer.from(JSON.stringify(payload));
  channel.sendToQueue(QUEUE, msg, { persistent: true });
  console.log(
    `[payment-service] Published payment.processed — orderId=${payload.orderId}, status=${payload.status}`
  );
}

async function close() {
  if (connection) {
    try { await connection.close(); } catch {}
    connection = null;
    channel    = null;
  }
}

module.exports = { connect, publishPaymentProcessed, close };
