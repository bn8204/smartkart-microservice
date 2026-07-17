/**
 * RabbitMQ publisher — order-service
 *
 * Publishes events to the 'order.placed' queue.
 * payment-service consumes this to begin the payment Saga.
 *
 * Reliability:
 *   - Exponential backoff reconnect (max 10 retries, cap 30 s)
 *   - DLQ: order.placed.dlq via smartcart.dlx exchange
 *   - Service starts even if RabbitMQ is unavailable (graceful degradation)
 *   - Graceful close() for SIGTERM/SIGINT handling
 *
 * Communication type  : Asynchronous, one-to-one
 * Pattern             : Choreography Saga — step 1
 */
const amqp = require('amqplib');

const RABBITMQ_URL  = process.env.RABBITMQ_URL || 'amqp://localhost:5672';
const QUEUE         = 'order.placed';
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

    // Dead Letter Exchange — unprocessable messages routed to order.placed.dlq
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
    console.log(`[order-service] RabbitMQ connected ✓  queue: ${QUEUE}`);

    // Auto-reconnect on unexpected close
    conn.on('close', () => {
      console.warn('[order-service] RabbitMQ connection closed — reconnecting…');
      channel    = null;
      connection = null;
      scheduleReconnect();
    });
    conn.on('error', (err) => {
      console.warn('[order-service] RabbitMQ connection error:', err.message);
      channel = null;
    });
  } catch (err) {
    channel = null;
    scheduleReconnect();
  }
}

function scheduleReconnect() {
  if (retryCount >= MAX_RETRIES) {
    console.warn('[order-service] RabbitMQ max retries reached. Running without messaging.');
    return;
  }
  const delay = Math.min(BASE_DELAY_MS * Math.pow(2, retryCount), 30000);
  retryCount++;
  console.log(`[order-service] RabbitMQ retry ${retryCount}/${MAX_RETRIES} in ${delay}ms…`);
  retryTimer = setTimeout(connect, delay);
}

async function publishOrderPlaced(orderPayload) {
  if (!channel) {
    console.warn(`[order-service] RabbitMQ unavailable — order ${orderPayload.orderId} event NOT published. Service continues.`);
    return;
  }
  const msg = Buffer.from(JSON.stringify(orderPayload));
  channel.sendToQueue(QUEUE, msg, { persistent: true });
  console.log(`[order-service] Published order.placed for orderId=${orderPayload.orderId}`);
}

async function close() {
  if (connection) {
    try { await connection.close(); } catch {}
    connection = null;
    channel    = null;
  }
}

module.exports = { connect, publishOrderPlaced, close };

