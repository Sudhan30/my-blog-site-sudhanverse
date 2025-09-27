# Sudharsana Blog Analytics - Complete Setup Guide

## 🎯 Your Existing Infrastructure

You already have:
- ✅ **Prometheus**: `https://prometheus.sudharsana.dev`
- ✅ **Grafana**: `https://grafana.sudharsana.dev`
- ✅ **Backend API**: `https://api.sudharsana.dev`
- ✅ **Existing Metrics**: `http_requests_total`, `blog_likes_total`, `blog_comments_total`, etc.

## 🚀 Integration Steps

### 1. Update Your Prometheus Configuration

Add these jobs to your existing `prometheus.yml`:

```yaml
scrape_configs:
  # Your existing jobs...
  
  # Blog Frontend Analytics (via Pushgateway)
  - job_name: 'blog-frontend-analytics'
    static_configs:
      - targets: ['localhost:9091']  # Your Pushgateway instance
    scrape_interval: 15s
    metrics_path: '/metrics'
    honor_labels: true

  # Blog API Analytics (your existing backend)
  - job_name: 'blog-api-analytics'
    static_configs:
      - targets: ['api.sudharsana.dev']
    scrape_interval: 15s
    metrics_path: '/metrics'
    scheme: 'https'
```

### 2. Frontend Configuration

The frontend is already configured to use your infrastructure:

```typescript
// In unified-analytics.service.ts
private apiBaseUrl = 'https://api.sudharsana.dev/api/analytics';
endpoint: 'https://prometheus.sudharsana.dev'
```

### 3. Import Grafana Dashboard

1. **Login to Grafana**:
   - Go to `https://grafana.sudharsana.dev`
   - Use your existing credentials

2. **Import Dashboard**:
   - Click "+" → "Import"
   - Copy content from `grafana-sudharsana-dashboard.json`
   - Click "Import"

3. **Configure Data Source**:
   - Ensure Prometheus data source is configured
   - URL: `http://prometheus:9090` (internal) or your Prometheus endpoint

## 📊 Available Metrics

### Your Existing Metrics:
- `http_requests_total` - HTTP request counter
- `http_request_duration_seconds` - Request duration histogram
- `blog_likes_total` - Blog likes counter
- `blog_comments_total` - Blog comments counter
- `newsletter_subscriptions_total` - Newsletter subscriptions
- `feedback_submissions_total` - Feedback submissions

### New Frontend Metrics:
- `page_views_total` - Page view counter
- `clicks_total` - Click counter
- `user_sessions_total` - User sessions counter
- `blog_bounce_rate` - Bounce rate gauge
- `blog_average_session_duration_seconds` - Session duration
- `blog_reading_progress_percent` - Reading progress
- `blog_time_on_page_seconds` - Time on page
- `blog_scroll_depth_percent` - Scroll depth

## 🎯 Dashboard Features

### Key Metrics Panels:
1. **Total Page Views** - Overall traffic
2. **Total Sessions** - User sessions
3. **Blog Likes** - Engagement metric
4. **Comments** - User interaction
5. **Newsletter Subscriptions** - Lead generation
6. **Error Rate** - System health
7. **Request Rate** - API performance

### Advanced Analytics:
1. **Page Views Over Time** - Traffic trends
2. **User Engagement** - Likes, comments, feedback rates
3. **Feedback Rating Distribution** - User satisfaction
4. **API Response Times** - Performance monitoring
5. **Top Pages** - Most popular content
6. **Session Analytics** - Bounce rate and duration
7. **Device & Browser Breakdown** - User demographics
8. **Reading Progress Analysis** - Content engagement
9. **Time on Page Distribution** - Content consumption

## 🔧 Quick Setup Commands

### Test Your API Endpoints:
```bash
# Test analytics tracking
curl -X POST https://api.sudharsana.dev/api/analytics/track \
  -H "Content-Type: application/json" \
  -d '{"events": [{"type": "pageview", "data": {"url": "/test", "title": "Test Page"}}]}'

# Test session creation
curl -X POST https://api.sudharsana.dev/api/analytics/session \
  -H "Content-Type: application/json" \
  -d '{"session_id": "test-123", "user_id": "user-456", "entry_page": "/test"}'
```

### Check Prometheus Metrics:
```bash
# Check if metrics are being scraped
curl https://prometheus.sudharsana.dev/api/v1/targets

# Query specific metrics
curl "https://prometheus.sudharsana.dev/api/v1/query?query=page_views_total"
```

## 📱 Frontend Integration

### 1. Analytics Consent Banner
The consent banner will automatically appear for new users and track:
- Consent acceptance/decline
- Session start/end
- Page views, clicks, scroll depth

### 2. Automatic Tracking
Once consent is given, the system automatically tracks:
- **Page Views**: Every page visit
- **Clicks**: User interactions
- **Scroll Depth**: Reading progress
- **Time on Page**: Engagement duration
- **Session Data**: Entry/exit pages, duration
- **Device Info**: Browser, OS, device type

### 3. Custom Event Tracking
You can track custom events:
```typescript
// In any component
constructor(private analytics: UnifiedAnalyticsService) {}

// Track custom events
this.analytics.trackFeedbackSubmission(5, true);
this.analytics.trackCommentSubmission(true);
this.analytics.trackNewsletterSignup('footer');
this.analytics.trackReadingProgress(75, 'post-123');
```

## 🚨 Alerting Setup

### Critical Alerts:
1. **High Error Rate**: `sum(rate(http_requests_total{status_code=~"5.."}[5m])) > 0.1`
2. **Low Page Views**: `sum(rate(page_views_total[10m])) < 0.01`
3. **High Bounce Rate**: `blog_bounce_rate > 0.8`
4. **Slow Response Times**: `histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket[5m])) by (le)) > 3`

### Warning Alerts:
1. **High Comment Rate**: `sum(rate(blog_comments_total[1m])) > 10`
2. **Low Engagement**: `sum(rate(blog_likes_total[1h])) < 0.1`

## 🔍 Monitoring & Troubleshooting

### Check System Health:
1. **Grafana Dashboard**: Monitor all metrics in real-time
2. **Prometheus Targets**: Ensure all jobs are UP
3. **API Health**: Check `/health` endpoint
4. **Frontend Console**: Look for analytics errors

### Common Issues:
1. **CORS Errors**: Configure your API to allow frontend domain
2. **Metrics Not Appearing**: Check Prometheus scraping configuration
3. **High Memory Usage**: Adjust batch processing intervals
4. **Missing Data**: Verify consent banner is working

## 📈 Performance Optimization

### Frontend Optimizations:
- Batch processing every 30 seconds
- Efficient local storage usage
- Minimal performance impact
- Automatic error handling

### Backend Optimizations:
- Indexed database queries
- Efficient metric collection
- Rate limiting on endpoints
- Caching for dashboard data

## 🎉 You're All Set!

Your analytics system now provides:
- ✅ **Real-time monitoring** via Grafana
- ✅ **Comprehensive user tracking** (pageviews, clicks, scroll, time)
- ✅ **Performance monitoring** (response times, error rates)
- ✅ **User engagement metrics** (likes, comments, feedback)
- ✅ **Privacy compliance** (explicit consent, no personal data)
- ✅ **Beautiful dashboards** with 17 different visualizations
- ✅ **Automated alerting** for critical issues

## 🔗 Quick Links

- **Grafana Dashboard**: `https://grafana.sudharsana.dev`
- **Prometheus**: `https://prometheus.sudharsana.dev`
- **API Documentation**: `https://api.sudharsana.dev/docs`

Your blog analytics are now enterprise-grade! 📊✨
