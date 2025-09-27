// Example backend metrics collection for your existing API
// This can be integrated into your existing Node.js/Python/Go backend

const express = require('express');
const promClient = require('prom-client');

// Create a Registry to register the metrics
const register = new promClient.Registry();

// Add a default label which is added to all metrics
register.setDefaultLabels({
  app: 'blog-api'
});

// Enable the collection of default metrics
promClient.collectDefaultMetrics({ register });

// Create custom metrics for your blog
const httpRequestDuration = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10]
});

const httpRequestsTotal = new promClient.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code']
});

const blogPageViews = new promClient.Counter({
  name: 'blog_page_views_total',
  help: 'Total number of page views',
  labelNames: ['page', 'user_type']
});

const blogComments = new promClient.Counter({
  name: 'blog_comments_total',
  help: 'Total number of comments',
  labelNames: ['post_id', 'status']
});

const blogFeedback = new promClient.Counter({
  name: 'blog_feedback_total',
  help: 'Total number of feedback submissions',
  labelNames: ['rating', 'has_text']
});

const blogLikes = new promClient.Counter({
  name: 'blog_likes_total',
  help: 'Total number of likes/claps',
  labelNames: ['post_id', 'action']
});

const blogNewsletterSignups = new promClient.Counter({
  name: 'blog_newsletter_signups_total',
  help: 'Total number of newsletter signups',
  labelNames: ['source']
});

const activeUsers = new promClient.Gauge({
  name: 'blog_active_users',
  help: 'Number of active users',
  labelNames: ['time_window']
});

// Register all metrics
register.registerMetric(httpRequestDuration);
register.registerMetric(httpRequestsTotal);
register.registerMetric(blogPageViews);
register.registerMetric(blogComments);
register.registerMetric(blogFeedback);
register.registerMetric(blogLikes);
register.registerMetric(blogNewsletterSignups);
register.registerMetric(activeUsers);

// Middleware to track HTTP requests
function metricsMiddleware(req, res, next) {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    const route = req.route ? req.route.path : req.path;
    
    httpRequestDuration
      .labels(req.method, route, res.statusCode)
      .observe(duration);
      
    httpRequestsTotal
      .labels(req.method, route, res.statusCode)
      .inc();
  });
  
  next();
}

// API endpoints for metrics collection
function setupMetricsRoutes(app) {
  // Metrics endpoint for Prometheus scraping
  app.get('/metrics', async (req, res) => {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  });

  // Custom metrics endpoints for frontend to push data
  app.post('/api/metrics/page-view', (req, res) => {
    const { page, userType = 'anonymous' } = req.body;
    
    blogPageViews
      .labels(page, userType)
      .inc();
      
    res.json({ success: true });
  });

  app.post('/api/metrics/comment', (req, res) => {
    const { postId, status = 'submitted' } = req.body;
    
    blogComments
      .labels(postId, status)
      .inc();
      
    res.json({ success: true });
  });

  app.post('/api/metrics/feedback', (req, res) => {
    const { rating, hasText = false } = req.body;
    
    blogFeedback
      .labels(rating.toString(), hasText.toString())
      .inc();
      
    res.json({ success: true });
  });

  app.post('/api/metrics/like', (req, res) => {
    const { postId, action = 'like' } = req.body;
    
    blogLikes
      .labels(postId, action)
      .inc();
      
    res.json({ success: true });
  });

  app.post('/api/metrics/newsletter', (req, res) => {
    const { source = 'unknown' } = req.body;
    
    blogNewsletterSignups
      .labels(source)
      .inc();
      
    res.json({ success: true });
  });

  app.post('/api/metrics/active-users', (req, res) => {
    const { count, timeWindow = '5m' } = req.body;
    
    activeUsers
      .labels(timeWindow)
      .set(count);
      
    res.json({ success: true });
  });
}

// Example usage in your existing Express app:
/*
const express = require('express');
const app = express();

// Add metrics middleware
app.use(metricsMiddleware);

// Setup your existing routes
app.get('/api/posts', (req, res) => {
  // Your existing logic
});

app.post('/api/comments', (req, res) => {
  // Your existing logic
  // Also increment metrics
  blogComments.labels(req.body.postId, 'submitted').inc();
});

app.post('/api/feedback', (req, res) => {
  // Your existing logic
  // Also increment metrics
  blogFeedback.labels(req.body.rating.toString(), req.body.text ? 'true' : 'false').inc();
});

// Setup metrics routes
setupMetricsRoutes(app);

app.listen(3000, () => {
  console.log('Server running on port 3000');
});
*/

module.exports = {
  register,
  httpRequestDuration,
  httpRequestsTotal,
  blogPageViews,
  blogComments,
  blogFeedback,
  blogLikes,
  blogNewsletterSignups,
  activeUsers,
  metricsMiddleware,
  setupMetricsRoutes
};
