/**
 * Security middleware for HTTP security headers and CSRF protection
 */

const ALLOWED_ORIGINS = [
    'https://blog.sudharsana.dev',
    'http://localhost',
    'http://localhost:80',
    'http://localhost:3000'
];

/**
 * Add security headers to response
 */
export function addSecurityHeaders(response: Response): Response {
    const headers = new Headers(response.headers);

    // Content Security Policy - Allows inline scripts/styles for dynamic blog content
    headers.set(
        'Content-Security-Policy',
        "default-src 'self'; " +
        "script-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com; " +
        "style-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com https://fonts.googleapis.com; " +
        "font-src 'self' https://cdnjs.cloudflare.com https://fonts.gstatic.com; " +
        "img-src 'self' data: https:; " +
        "connect-src 'self'; " +
        "frame-ancestors 'none'; " +
        "base-uri 'self'; " +
        "form-action 'self';"
    );

    // Prevent clickjacking
    headers.set('X-Frame-Options', 'DENY');

    // Prevent MIME type sniffing
    headers.set('X-Content-Type-Options', 'nosniff');

    // Referrer policy
    headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

    // HSTS - Force HTTPS (only set in production)
    if (process.env.NODE_ENV === 'production') {
        headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    }

    // Permissions Policy - Disable unnecessary browser features
    headers.set(
        'Permissions-Policy',
        'camera=(), microphone=(), geolocation=(), interest-cohort=()'
    );

    // XSS Protection (legacy but still useful for older browsers)
    headers.set('X-XSS-Protection', '1; mode=block');

    return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers
    });
}

/**
 * Validate origin for CSRF protection on state-changing requests
 */
export function validateOrigin(req: Request): boolean {
    const method = req.method.toUpperCase();

    // Only check origin for state-changing methods
    if (!['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
        return true;
    }

    const origin = req.headers.get('Origin');
    const referer = req.headers.get('Referer');

    // Check Origin header first (most reliable)
    if (origin) {
        return ALLOWED_ORIGINS.some(allowed =>
            origin === allowed || origin.startsWith(allowed + ':')
        );
    }

    // Fallback to Referer if Origin is not present
    if (referer) {
        try {
            const refererUrl = new URL(referer);
            const refererOrigin = `${refererUrl.protocol}//${refererUrl.host}`;
            return ALLOWED_ORIGINS.some(allowed =>
                refererOrigin === allowed || refererOrigin.startsWith(allowed + ':')
            );
        } catch {
            return false;
        }
    }

    // Allow requests without Origin/Referer for same-origin requests
    // (some browsers don't send these for privacy)
    return true;
}

/**
 * Create JSON response with security headers
 */
export function secureJson(data: any, status = 200): Response {
    const response = new Response(JSON.stringify(data), {
        status,
        headers: { 'Content-Type': 'application/json' }
    });
    return addSecurityHeaders(response);
}

/**
 * Create HTML response with security headers
 */
export function secureHtml(html: string, status = 200): Response {
    const response = new Response(html, {
        status,
        headers: { 'Content-Type': 'text/html; charset=utf-8' }
    });
    return addSecurityHeaders(response);
}

/**
 * CSRF protection middleware
 */
export function csrfProtection(req: Request): Response | null {
    if (!validateOrigin(req)) {
        return secureJson({ error: 'Invalid origin' }, 403);
    }
    return null;
}
