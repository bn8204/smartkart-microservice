require('dotenv').config();
const express    = require('express');
const cors       = require('cors');
const morgan     = require('morgan');
const rateLimit  = require('express-rate-limit');
const proxy      = require('express-http-proxy');
const jwt        = require('jsonwebtoken');
const axios      = require('axios');
const swaggerUi  = require('swagger-ui-express');
const helmet     = require('helmet');
const compression = require('compression');
const promClient = require('prom-client');
const config     = require('./config');
const logger     = require('./utils/logger');
const requestId  = require('./middleware/requestId');
const errorHandler = require('./middleware/errorHandler');
const swaggerSpec  = require('./swagger/spec');

const app  = express();
const PORT = config.service.port;

const JWT_SECRET    = config.jwt.secret;
const USER_SVC      = config.upstream.userService;
const PRODUCT_SVC   = config.upstream.productService;
const ORDER_SVC     = config.upstream.orderService;
const PAYMENT_SVC   = config.upstream.paymentService;

// ── Security headers ───────────────────────────────────────────────────────────────
app.use(helmet({ contentSecurityPolicy: false }));

// ── CORS ──────────────────────────────────────────────────────────────────────
const CORS_ORIGINS = new Set(config.cors.origins);
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (CORS_ORIGINS.has(origin)) return callback(null, true);
    callback(new Error(`Origin ${origin} not allowed by CORS`));
  },
  credentials: true
}));
app.use(compression());
app.use(express.json({ limit: '100kb' }));

// ── Correlation ID ────────────────────────────────────────────────────────────
app.use(requestId);

// ── HTTP request logging ──────────────────────────────────────────────────────
app.use(morgan('[:date[iso]] :method :url :status :response-time ms', {
  stream: { write: msg => logger.info(msg.trim()) }
}));

// ── Rate limiting ─────────────────────────────────────────────────────────────
const globalLimiter = rateLimit({ windowMs: 15*60*1000, max: 200, message: { success: false, message: 'Too many requests, please try again later.' } });
const authLimiter   = rateLimit({ windowMs: 15*60*1000, max: 10,  message: { success: false, message: 'Too many auth attempts, please try again later.' } });
app.use(globalLimiter);

// ── JWT middleware ────────────────────────────────────────────────────────────
function verifyToken(req, res, next) {
  const header = req.headers['authorization'];
  if (!header) return res.status(401).json({ success: false, message: 'Authorization header required', requestId: req.requestId });
  const token = header.split(' ')[1];
  if (!token) return res.status(401).json({ success: false, message: 'Bearer token required', requestId: req.requestId });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.headers['x-user-id']    = String(decoded.id);
    req.headers['x-user-role']  = decoded.role;
    req.headers['x-user-email'] = decoded.email;
    next();
  } catch {
    return res.status(401).json({ success: false, message: 'Invalid or expired token', requestId: req.requestId });
  }
}

function requireAdmin(req, res, next) {
  if (req.headers['x-user-role'] !== 'admin')
    return res.status(403).json({ success: false, message: 'Admin access required', requestId: req.requestId });
  next();
}

// Helper: add X-Request-ID when proxying to downstream services
const withRequestId = (opts, srcReq) => {
  opts.headers = opts.headers || {};
  opts.headers['X-Request-ID'] = srcReq.requestId;
  return opts;
};

// ── Prometheus metrics ──────────────────────────────────────────────────────
const metricsReg = new promClient.Registry();
metricsReg.setDefaultLabels({ service: config.service.name });
promClient.collectDefaultMetrics({ register: metricsReg });
const httpDuration = new promClient.Histogram({
  name: 'http_request_duration_ms', help: 'HTTP request duration (ms)',
  labelNames: ['method', 'route', 'status'],
  buckets: [5, 10, 25, 50, 100, 250, 500, 1000],
  registers: [metricsReg]
});
app.use((req, res, next) => {
  const end = httpDuration.startTimer();
  res.on('finish', () => end({ method: req.method, route: req.route ? req.route.path : req.path, status: res.statusCode }));
  next();
});
app.get('/metrics', async (_req, res) => {
  try { res.set('Content-Type', metricsReg.contentType); res.end(await metricsReg.metrics()); }
  catch (e) { res.status(500).end(e.message); }
});

// ── Swagger UI ────────────────────────────────────────────────────────────────
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, { customSiteTitle: 'SmartCart API Gateway' }));

// ── Health (aggregated) ───────────────────────────────────────────────────────
app.get('/health', async (req, res) => {
  const services = { 'user-service': USER_SVC, 'product-service': PRODUCT_SVC, 'order-service': ORDER_SVC, 'payment-service': PAYMENT_SVC };
  const checks   = {};
  await Promise.allSettled(
    Object.entries(services).map(async ([name, url]) => {
      try {
        const r = await axios.get(`${url}/health`, { timeout: 2000 });
        checks[name] = r.data.status || 'UP';
      } catch {
        checks[name] = 'DOWN';
      }
    })
  );
  const vals = Object.values(checks);
  const status = vals.every(s => s==='UP') ? 'UP' : vals.some(s => s==='UP') ? 'DEGRADED' : 'DOWN';
  res.status(status==='DOWN' ? 503 : 200).json({
    status, service: config.service.name, version: config.service.version,
    uptime: Math.floor(process.uptime()), timestamp: new Date().toISOString(), checks
  });
});

app.get('/api/v1', (req, res) =>
  res.json({ message: 'SmartCart API Gateway v1', version: config.service.version, docs: '/api-docs',
    services: { auth: '/api/v1/auth', products: '/api/v1/products', orders: '/api/v1/orders', payments: '/api/v1/payments' } })
);

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/v1/auth/register', authLimiter, proxy(USER_SVC, { proxyReqPathResolver: () => `/v1/auth/register`, proxyReqOptDecorator: withRequestId }));
app.use('/api/v1/auth/login',    authLimiter, proxy(USER_SVC, { proxyReqPathResolver: () => `/v1/auth/login`,    proxyReqOptDecorator: withRequestId }));
app.use('/api/v1/auth', verifyToken, proxy(USER_SVC, { proxyReqPathResolver: (req) => `/v1/auth${req.url}`, proxyReqOptDecorator: withRequestId }));

app.use('/api/v1/products', (req, res, next) => {
  if (req.method === 'GET') return next();
  verifyToken(req, res, () => requireAdmin(req, res, next));
}, proxy(PRODUCT_SVC, { proxyReqPathResolver: (req) => `/v1/products${req.url === '/' ? '' : req.url}`, proxyReqOptDecorator: withRequestId }));

// API composition — order + payments in one call
app.get('/api/v1/orders/:id/details', verifyToken, async (req, res) => {
  try {
    const [orderResp, paymentsResp] = await Promise.all([
      axios.get(`${ORDER_SVC}/v1/orders/${req.params.id}`,   { headers: { 'X-Request-ID': req.requestId } }),
      axios.get(`${PAYMENT_SVC}/v1/payments/order/${req.params.id}`, { headers: { 'X-Request-ID': req.requestId } })
    ]);
    res.json({ order: orderResp.data, payments: paymentsResp.data });
  } catch (err) {
    res.status(err.response?.status || 500).json({ success: false, message: err.message, requestId: req.requestId });
  }
});

app.use('/api/v1/orders',   verifyToken, proxy(ORDER_SVC,   { proxyReqPathResolver: (req) => `/v1/orders${req.url === '/' ? '' : req.url}`,   proxyReqOptDecorator: withRequestId }));
app.use('/api/v1/payments', verifyToken, proxy(PAYMENT_SVC, { proxyReqPathResolver: (req) => `/v1/payments${req.url === '/' ? '' : req.url}`, proxyReqOptDecorator: withRequestId }));

app.use((req, res) => res.status(404).json({ success: false, message: `Route ${req.method} ${req.path} not found`, requestId: req.requestId }));
app.use(errorHandler);

// ── Start server ──────────────────────────────────────────────────────────────
// ── Start server (skipped in test mode) ──────────────────────────────────────
if (process.env.NODE_ENV !== 'test') {
  const server = app.listen(PORT, () =>
    logger.info(`✓ ${config.service.name} v${config.service.version} running on http://localhost:${PORT}  docs: http://localhost:${PORT}/api-docs`)
  );
  function shutdown(signal) {
    logger.info(`${signal} received — shutting down gracefully`);
    server.close(() => { logger.info('Shutdown complete'); process.exit(0); });
  }
  process.on('SIGINT',  () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}
module.exports = app;
