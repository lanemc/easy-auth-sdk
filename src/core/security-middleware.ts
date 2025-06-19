import { AuthRequest, AuthResponse, AuthError } from '../types'
import { 
  RateLimiter, 
  CSRFProtection, 
  PasswordValidator, 
  getClientIP, 
  getSecurityHeaders,
  sanitizeEmail,
  sanitizeString 
} from '../utils/security'

export interface SecurityConfig {
  rateLimit?: {
    enabled?: boolean
    maxAttempts?: number
    windowMs?: number
    blockDurationMs?: number
  }
  csrf?: {
    enabled?: boolean
    secret?: string
  }
  passwordPolicy?: {
    enabled?: boolean
    minLength?: number
    maxLength?: number
    requireUppercase?: boolean
    requireLowercase?: boolean
    requireNumbers?: boolean
    requireSpecialChars?: boolean
    forbidCommonPasswords?: boolean
    forbidUserInfo?: boolean
  }
  headers?: {
    enabled?: boolean
    customHeaders?: Record<string, string>
  }
  logging?: {
    enabled?: boolean
    logSuccessfulAuth?: boolean
    logFailedAuth?: boolean
    logSuspiciousActivity?: boolean
  }
}

interface SecurityEvent {
  type: 'auth_success' | 'auth_failure' | 'rate_limit_exceeded' | 'csrf_violation' | 'suspicious_activity'
  timestamp: Date
  ip: string
  userAgent?: string
  userId?: string
  email?: string
  details: Record<string, unknown>
}

export class SecurityMiddleware {
  private rateLimiter?: RateLimiter
  private csrfProtection?: CSRFProtection
  private passwordValidator?: PasswordValidator
  private securityHeaders: Record<string, string>
  private events: SecurityEvent[] = []

  constructor(private config: SecurityConfig = {}) {
    // Initialize rate limiter
    if (this.config.rateLimit?.enabled !== false) {
      this.rateLimiter = new RateLimiter(
        this.config.rateLimit?.maxAttempts || 5,
        this.config.rateLimit?.windowMs || 15 * 60 * 1000,
        this.config.rateLimit?.blockDurationMs || 60 * 60 * 1000
      )
    }

    // Initialize CSRF protection
    if (this.config.csrf?.enabled !== false) {
      this.csrfProtection = new CSRFProtection(this.config.csrf?.secret)
    }

    // Initialize password validator
    if (this.config.passwordPolicy?.enabled !== false) {
      this.passwordValidator = new PasswordValidator(this.config.passwordPolicy || {})
    }

    // Initialize security headers
    this.securityHeaders = {
      ...getSecurityHeaders(),
      ...this.config.headers?.customHeaders
    }
  }

  async validateRequest(request: AuthRequest, action: string): Promise<void> {
    const ip = getClientIP(request.headers)
    const userAgent = request.headers['user-agent'] || 'unknown'

    // Rate limiting
    if (this.rateLimiter && this.shouldRateLimit(action)) {
      const rateLimitKey = this.getRateLimitKey(ip, action)
      const result = await this.rateLimiter.checkLimit(rateLimitKey)

      if (!result.allowed) {
        this.logSecurityEvent({
          type: 'rate_limit_exceeded',
          timestamp: new Date(),
          ip,
          userAgent,
          details: {
            action,
            resetTime: result.resetTime
          }
        })

        throw new AuthError(
          'Too many attempts. Please try again later.',
          'RATE_LIMIT_EXCEEDED',
          429
        )
      }
    }

    // CSRF protection for state-changing operations
    if (this.csrfProtection && this.requiresCSRFToken(action)) {
      await this.validateCSRFToken(request)
    }

    // Validate input based on action
    if (action === 'signin' || action === 'signup') {
      this.validateAuthInput(request)
    }
  }

  async validatePassword(password: string, userInfo?: { email?: string; name?: string }): Promise<void> {
    if (!this.passwordValidator) {
      return
    }

    const result = this.passwordValidator.validate(password, userInfo)
    
    if (!result.valid) {
      throw new AuthError(
        result.errors.join(', '),
        'WEAK_PASSWORD',
        400
      )
    }
  }

  async onAuthSuccess(ip: string, userId: string, email: string, action: string): Promise<void> {
    // Reset rate limiting on success
    if (this.rateLimiter) {
      const rateLimitKey = this.getRateLimitKey(ip, action)
      await this.rateLimiter.recordSuccess(rateLimitKey)
    }

    // Log successful authentication
    if (this.config.logging?.logSuccessfulAuth !== false) {
      this.logSecurityEvent({
        type: 'auth_success',
        timestamp: new Date(),
        ip,
        userId,
        email,
        details: { action }
      })
    }
  }

  async onAuthFailure(ip: string, email: string | undefined, action: string, error: string): Promise<void> {
    // Log failed authentication
    if (this.config.logging?.logFailedAuth !== false) {
      this.logSecurityEvent({
        type: 'auth_failure',
        timestamp: new Date(),
        ip,
        email,
        details: { action, error }
      })
    }

    // Check for suspicious patterns
    this.detectSuspiciousActivity(ip, email, action)
  }

  generateCSRFToken(sessionId: string): string {
    if (!this.csrfProtection) {
      throw new Error('CSRF protection is not enabled')
    }
    
    return this.csrfProtection.generateToken(sessionId)
  }

  addSecurityHeaders(response: AuthResponse): AuthResponse {
    if (this.config.headers?.enabled !== false) {
      return {
        ...response,
        headers: {
          ...response.headers,
          ...this.securityHeaders
        }
      }
    }
    
    return response
  }

  private shouldRateLimit(action: string): boolean {
    return ['signin', 'signup', 'reset-password', 'oauth-callback'].includes(action)
  }

  private getRateLimitKey(ip: string, action: string): string {
    return `${action}:${ip}`
  }

  private requiresCSRFToken(action: string): boolean {
    return ['signin', 'signup', 'signout', 'reset-password'].includes(action)
  }

  private async validateCSRFToken(request: AuthRequest): Promise<void> {
    if (!this.csrfProtection) {
      return
    }

    const token = request.headers['x-csrf-token'] || 
                  (request.body as any)?.csrfToken ||
                  request.query?.csrfToken

    if (!token) {
      throw new AuthError('CSRF token missing', 'CSRF_TOKEN_MISSING', 403)
    }

    // We need session ID to validate CSRF token
    // This should be extracted from the session cookie or JWT
    const sessionId = this.extractSessionId(request)
    
    if (!sessionId) {
      throw new AuthError('Session required for CSRF validation', 'SESSION_REQUIRED', 401)
    }

    if (!this.csrfProtection.validateToken(token, sessionId)) {
      this.logSecurityEvent({
        type: 'csrf_violation',
        timestamp: new Date(),
        ip: getClientIP(request.headers),
        details: { token, sessionId }
      })

      throw new AuthError('Invalid CSRF token', 'CSRF_TOKEN_INVALID', 403)
    }
  }

  private extractSessionId(request: AuthRequest): string | null {
    // Try to extract session ID from cookie or Authorization header
    const authHeader = request.headers['authorization']
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7).split('.')[0] // Simplified - extract from JWT or session token
    }

    // Try cookie (simplified)
    const cookieHeader = request.headers['cookie']
    if (cookieHeader) {
      const match = cookieHeader.match(/easy-auth-session=([^;]+)/)
      return match ? match[1] : null
    }

    return null
  }

  private validateAuthInput(request: AuthRequest): void {
    const body = request.body as any

    if (!body || typeof body !== 'object') {
      throw new AuthError('Invalid request body', 'INVALID_INPUT', 400)
    }

    // Validate and sanitize email
    if (body.email) {
      if (typeof body.email !== 'string') {
        throw new AuthError('Email must be a string', 'INVALID_INPUT', 400)
      }
      
      body.email = sanitizeEmail(body.email)
      
      if (!body.email || body.email.length > 254) {
        throw new AuthError('Invalid email address', 'INVALID_INPUT', 400)
      }
    }

    // Validate password
    if (body.password) {
      if (typeof body.password !== 'string') {
        throw new AuthError('Password must be a string', 'INVALID_INPUT', 400)
      }

      if (body.password.length > 128) {
        throw new AuthError('Password is too long', 'INVALID_INPUT', 400)
      }
    }

    // Validate name
    if (body.name) {
      if (typeof body.name !== 'string') {
        throw new AuthError('Name must be a string', 'INVALID_INPUT', 400)
      }
      
      body.name = sanitizeString(body.name, 100)
    }
  }

  private detectSuspiciousActivity(ip: string, email: string | undefined, action: string): void {
    // Simple suspicious activity detection
    const recentEvents = this.events.filter(event => 
      event.ip === ip && 
      event.timestamp > new Date(Date.now() - 60 * 1000) // Last minute
    )

    const failureCount = recentEvents.filter(event => event.type === 'auth_failure').length

    if (failureCount >= 3) {
      this.logSecurityEvent({
        type: 'suspicious_activity',
        timestamp: new Date(),
        ip,
        email,
        details: {
          action,
          recentFailures: failureCount,
          pattern: 'rapid_failures'
        }
      })
    }

    // Clean up old events (keep last 1000)
    if (this.events.length > 1000) {
      this.events = this.events.slice(-1000)
    }
  }

  private logSecurityEvent(event: SecurityEvent): void {
    if (this.config.logging?.enabled !== false) {
      this.events.push(event)
      
      // In production, you might want to send this to a logging service
      if (process.env.NODE_ENV === 'development') {
        console.log('Security Event:', JSON.stringify(event, null, 2))
      }
    }
  }

  // Public method to get security events (for monitoring)
  getSecurityEvents(since?: Date): SecurityEvent[] {
    if (!since) {
      return [...this.events]
    }
    
    return this.events.filter(event => event.timestamp >= since)
  }

  // Clean up resources
  destroy(): void {
    if (this.rateLimiter) {
      this.rateLimiter.destroy()
    }
    this.events = []
  }
}