# Blog Analytics Setup with Prometheus & Grafana

This guide will help you integrate Prometheus and Grafana analytics into your blog.

## Prerequisites

- Prometheus instance running (you mentioned you have this)
- Grafana instance running (you mentioned you have this)
- Prometheus Pushgateway (for frontend metrics)

## Frontend Setup

### 1. Update Configuration

Edit `src/app/components/analytics-consent.component.ts` and update the Prometheus endpoint:

```typescript
this.prometheusMetrics.initialize({
  endpoint: 'https://your-prometheus-pushgateway.com', // Your Pushgateway URL
  job: 'blog-frontend',
  instance: window.location.hostname
});
```

### 2. Add Metrics Tracking

The service automatically tracks:
- Page views
- User interactions (clicks, scrolls)
- Form submissions
- Reading progress
- Performance metrics
- Errors

### 3. Custom Metrics

You can add custom tracking anywhere in your app:

```typescript
// Inject the service
constructor(private prometheusMetrics: PrometheusMetricsService) {}

// Track custom events
this.prometheusMetrics.trackClick('newsletter-signup', '/home');
this.prometheusMetrics.trackFormSubmission('contact-form', true);
this.prometheusMetrics.trackContentInteraction('post', 'share', 'post-123');
```

## Backend Setup

### 1. Install Dependencies

```bash
npm install prom-client
```

### 2. Integrate with Your Existing API

Add the metrics collection from `backend-metrics-example.js` to your existing Node.js API.

Key endpoints to add:
- `/metrics` - For Prometheus scraping
- `/api/metrics/*` - For frontend to push data

### 3. Update Your Prometheus Config

Add these jobs to your `prometheus.yml`:

```yaml
scrape_configs:
  - job_name: 'blog-api'
    static_configs:
      - targets: ['your-blog-api-domain.com:3000']
    scrape_interval: 15s
    metrics_path: '/metrics'
    scheme: 'https'

  - job_name: 'blog-frontend'
    static_configs:
      - targets: ['your-pushgateway-domain.com:9091']
    scrape_interval: 15s
    metrics_path: '/metrics'
    scheme: 'https'
```

## Grafana Dashboard

### 1. Import Dashboard

1. Open Grafana
2. Go to "+" → "Import"
3. Copy the content from `grafana-dashboard.json`
4. Import the dashboard

### 2. Configure Data Source

Make sure your Prometheus data source is configured in Grafana:
- URL: `http://your-prometheus-instance:9090`
- Access: Server (default)

## Available Metrics

### Frontend Metrics
- `blog_page_views_total` - Page view counts
- `blog_clicks_total` - User click interactions
- `blog_scroll_depth_percent` - Reading progress
- `blog_time_on_page_seconds` - Time spent on pages
- `blog_form_submissions_total` - Form submissions
- `blog_content_interactions_total` - Content interactions
- `blog_reading_progress_percent` - Reading progress per post
- `blog_performance_*` - Performance metrics
- `blog_errors_total` - Frontend errors
- `blog_analytics_consent_total` - Consent tracking
- `blog_feedback_submissions_total` - Feedback submissions
- `blog_comment_submissions_total` - Comment submissions

### Backend Metrics
- `http_requests_total` - HTTP request counts
- `http_request_duration_seconds` - Request duration
- `blog_comments_total` - Comment counts
- `blog_feedback_total` - Feedback counts
- `blog_likes_total` - Like/clap counts
- `blog_newsletter_signups_total` - Newsletter signups
- `blog_active_users` - Active user count

## Privacy & GDPR Compliance

The analytics system is designed to be privacy-focused:

1. **Consent Banner**: Users must explicitly accept analytics
2. **Anonymous Data**: No personal information is collected
3. **Local Storage**: Consent preference is stored locally
4. **Self-Hosted**: All data stays on your infrastructure
5. **No Cookies**: Uses local storage instead of cookies

## Monitoring & Alerts

Set up alerts in Prometheus for:
- High error rates
- Unusual traffic patterns
- Performance degradation
- System health

Example alert rules are provided in `prometheus-config.yml`.

## Troubleshooting

### Frontend Issues
- Check browser console for metric sending errors
- Verify Pushgateway URL is correct
- Ensure CORS is configured on Pushgateway

### Backend Issues
- Verify `/metrics` endpoint is accessible
- Check Prometheus can scrape your API
- Ensure metrics are being incremented correctly

### Grafana Issues
- Verify Prometheus data source is working
- Check dashboard queries are correct
- Ensure time range includes data

## Security Considerations

1. **Pushgateway**: Secure with authentication
2. **Metrics Endpoint**: Consider rate limiting
3. **CORS**: Configure properly for your domain
4. **HTTPS**: Use HTTPS in production

## Performance Impact

The metrics collection is designed to be lightweight:
- Metrics are batched and sent asynchronously
- Minimal performance impact on page load
- Efficient data structures for metric storage

## Next Steps

1. Deploy the frontend changes
2. Integrate backend metrics
3. Configure Prometheus scraping
4. Import Grafana dashboard
5. Set up alerts
6. Monitor and optimize based on data
