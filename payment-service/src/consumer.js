/**
 * RabbitMQ consumer — payment-service
 *
 * Consumes 'order.placed' events published by order-service.
 *
 * Saga step 2 (complete flow):
 *   1. Insert payment record as PENDING (Event Sourcing — append only)
 *   2. Simulate payment processing (real gateway would replace this)
 *   3. Update payment record to SUCCESS or FAILED
 *   4. Publish 'payment.processed' event → order-service updates order status
 *
 * Reliability:
 *   - Exponential backoff reconnect (max 10 retries, cap 30 s)
 *   - DLQ: order.placed.dlq via smartcart.dlx exchange
 *   - prefetch(1): one message processed at a time
 *   - nack without requeue on unrecoverable errors → routed to DLQ
 *   - Graceful close() for SIGTERM/SIGINT handling
 */
const amqp      = require('amqplib');
const db        = require('./db');
const publisher = require('./publisher');

const RABBITMQ_URL  = process.env.RABBITMQ_URL || 'amqp://localhost:5672';
const QUEUE         = 'order.placed';
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

    // Dead Letter Exchange setup — must match order-service publisher declaration
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
    console.log(`[payment-service] Consumer RabbitMQ connected ✓  listening on: ${QUEUE}`);

    conn.on('close', () => {
      console.warn('[payment-service] RabbitMQ connection closed — reconnecting…');
      connection = null;
      scheduleReconnect();
    });
    conn.on('error', (err) => {
      console.warn('[payment-service] RabbitMQ error:', err.message);
    });

    channel.consume(QUEUE, async (msg) => {
      if (!msg) return;

      // ── Parse message ──────────────────────────────────────────────────────
      let payload;
      try {
        payload = JSON.parse(msg.content.toString());
      } catch {
        // Malformed JSON — send to DLQ, do not requeue
        console.warn('[payment-service] Malformed order.placed message — dead lettering');
        channel.nack(msg, false, false);
        return;
      }

      const { orderId, userId, amount } = payload;

      if (!orderId || !userId || amount === undefined) {
        console.warn('[payment-service] Invalid order.placed payload — dead lettering', payload);
        channel.nack(msg, false, false);
        return;
      }

      console.log(`[payment-service] Received order.placed — orderId=${orderId}, amount=${amount}`);

      try {
        // ── Step 1: Insert PENDING payment record (append-only / Event Sourcing) ──
        const insertResult = await db.query(
          'INSERT INTO payments (order_id, user_id, amount, status) VALUES ($1,$2,$3,$4) RETURNING id',
          [orderId, userId, amount, 'PENDING']
        );
        const paymentId = insertResult.rows[0].id;
        console.log(`[payment-service] Payment ${paymentId} created as PENDING for orderId=${orderId}`);

        // ── Step 2: Simulate payment processing ───────────────────────────────
        // In a real system, call a payment gateway (Stripe, Razorpay, etc.) here.
        // Rule: any positive amount succeeds; zero/negative fails.
        const paymentStatus = parseFloat(amount) > 0 ? 'SUCCESS' : 'FAILED';
        const failureReason = paymentStatus === 'FAILED' ? 'Invalid payment amount' : null;

        // ── Step 3: Update payment record to final status ─────────────────────
        await db.query('UPDATE payments SET status = $1 WHERE id = $2', [paymentStatus, paymentId]);
        console.log(`[payment-service] Payment ${paymentId} → ${paymentStatus}`);

        // ── Step 4: Publish payment.processed → order-service updates order ───
        await publisher.publishPaymentProcessed({
          orderId,
          userId,
          amount,
          paymentId,
          status:       paymentStatus,
          failureReason
        });

        channel.ack(msg);
      } catch (err) {
        // DB or publish failure — dead letter (no infinite requeue loop)
        console.error('[payment-service] Failed to process payment:', err.message);
        channel.nack(msg, false, false);
      }
    });
  } catch (err) {
    console.warn('[payment-service] Consumer RabbitMQ connect failed:', err.message);
    scheduleReconnect();
  }
}

function scheduleReconnect() {
  if (retryCount >= MAX_RETRIES) {
    console.warn('[payment-service] RabbitMQ max retries reached. REST API still available.');
    return;
  }
  const delay = Math.min(BASE_DELAY_MS * Math.pow(2, retryCount), 30000);
  retryCount++;
  console.log(`[payment-service] RabbitMQ retry ${retryCount}/${MAX_RETRIES} in ${delay}ms…`);
  retryTimer = setTimeout(startConsumer, delay);
}

async function close() {
  if (connection) {
    try { await connection.close(); } catch {}
    connection = null;
  }
}

module.exports = { startConsumer, close };

