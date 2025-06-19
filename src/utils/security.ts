import { createHash, randomBytes } from 'crypto'
import { AuthError } from '../types'

// Rate limiting implementation
interface RateLimitEntry {
  count: number
  resetTime: number
  blocked: boolean
}

export class RateLimiter {
  private store: Map<string, RateLimitEntry> = new Map()
  private cleanupInterval: NodeJS.Timeout

  constructor(
    private maxAttempts: number = 5,
    private windowMs: number = 15 * 60 * 1000, // 15 minutes
    private blockDurationMs: number = 60 * 60 * 1000 // 1 hour
  ) {
    // Cleanup expired entries every 5 minutes
    this.cleanupInterval = setInterval(() => this.cleanup(), 5 * 60 * 1000)
  }

  async checkLimit(identifier: string): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
    const now = Date.now()
    const entry = this.store.get(identifier)

    if (!entry) {
      // First request
      this.store.set(identifier, {
        count: 1,
        resetTime: now + this.windowMs,
        blocked: false
      })
      return {
        allowed: true,
        remaining: this.maxAttempts - 1,
        resetTime: now + this.windowMs
      }
    }

    // Check if blocked
    if (entry.blocked && now < entry.resetTime) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: entry.resetTime
      }
    }

    // Reset if window expired
    if (now >= entry.resetTime) {
      entry.count = 1
      entry.resetTime = now + this.windowMs
      entry.blocked = false
      return {
        allowed: true,
        remaining: this.maxAttempts - 1,
        resetTime: entry.resetTime
      }
    }

    // Increment count
    entry.count++

    if (entry.count > this.maxAttempts) {
      entry.blocked = true
      entry.resetTime = now + this.blockDurationMs
      return {
        allowed: false,
        remaining: 0,
        resetTime: entry.resetTime
      }
    }

    return {
      allowed: true,
      remaining: this.maxAttempts - entry.count,
      resetTime: entry.resetTime
    }
  }

  async recordSuccess(identifier: string): Promise<void> {
    // Reset on successful auth
    this.store.delete(identifier)
  }

  private cleanup(): void {
    const now = Date.now()
    for (const [key, entry] of this.store.entries()) {
      if (now >= entry.resetTime && !entry.blocked) {
        this.store.delete(key)
      }
    }
  }

  destroy(): void {
    clearInterval(this.cleanupInterval)
    this.store.clear()
  }
}

// CSRF protection
export class CSRFProtection {
  private secret: string

  constructor(secret?: string) {
    this.secret = secret || randomBytes(32).toString('hex')
  }

  generateToken(sessionId: string): string {
    const timestamp = Date.now().toString()
    const data = `${sessionId}:${timestamp}`
    const signature = this.sign(data)
    
    return Buffer.from(`${data}:${signature}`).toString('base64')
  }

  validateToken(token: string, sessionId: string, maxAge = 3600000): boolean {
    try {
      const decoded = Buffer.from(token, 'base64').toString()
      const parts = decoded.split(':')
      
      if (parts.length !== 3) {
        return false
      }

      const [tokenSessionId, timestamp, signature] = parts
      
      // Check session ID
      if (tokenSessionId !== sessionId) {
        return false
      }

      // Check age
      const tokenTime = parseInt(timestamp)
      if (Date.now() - tokenTime > maxAge) {
        return false
      }

      // Check signature
      const expectedSignature = this.sign(`${tokenSessionId}:${timestamp}`)
      return this.safeCompare(signature, expectedSignature)

    } catch {
      return false
    }
  }

  private sign(data: string): string {
    return createHash('sha256')
      .update(data + this.secret)
      .digest('hex')
  }

  private safeCompare(a: string, b: string): boolean {
    if (a.length !== b.length) {
      return false
    }

    let result = 0
    for (let i = 0; i < a.length; i++) {
      result |= a.charCodeAt(i) ^ b.charCodeAt(i)
    }

    return result === 0
  }
}

// Input sanitization
export function sanitizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

export function sanitizeString(input: string, maxLength = 255): string {
  return input.trim().substring(0, maxLength)
}

// Password policy enforcement
export interface PasswordPolicy {
  minLength?: number
  maxLength?: number
  requireUppercase?: boolean
  requireLowercase?: boolean
  requireNumbers?: boolean
  requireSpecialChars?: boolean
  forbidCommonPasswords?: boolean
  forbidUserInfo?: boolean
}

export class PasswordValidator {
  private commonPasswords: Set<string>

  constructor(private policy: PasswordPolicy = {}) {
    // Load common passwords (top 1000 most common passwords)
    this.commonPasswords = new Set([
      'password', '123456', '123456789', 'qwerty', 'abc123', 'password123',
      'admin', 'letmein', 'welcome', 'monkey', '1234567890', 'dragon',
      'sunshine', 'princess', 'azerty', 'trustno1', '000000', 'football'
      // Add more as needed
    ])
  }

  validate(password: string, userInfo?: { email?: string; name?: string }): {
    valid: boolean
    errors: string[]
    score: number
  } {
    const errors: string[] = []
    let score = 0

    // Length checks
    const minLength = this.policy.minLength || 8
    const maxLength = this.policy.maxLength || 128

    if (password.length < minLength) {
      errors.push(`Password must be at least ${minLength} characters long`)
    } else {
      score += Math.min(password.length / minLength, 2) * 10
    }

    if (password.length > maxLength) {
      errors.push(`Password must be no more than ${maxLength} characters long`)
    }

    // Character type checks
    if (this.policy.requireUppercase !== false) {
      if (!/[A-Z]/.test(password)) {
        errors.push('Password must contain at least one uppercase letter')
      } else {
        score += 5
      }
    }

    if (this.policy.requireLowercase !== false) {
      if (!/[a-z]/.test(password)) {
        errors.push('Password must contain at least one lowercase letter')
      } else {
        score += 5
      }
    }

    if (this.policy.requireNumbers !== false) {
      if (!/\d/.test(password)) {
        errors.push('Password must contain at least one number')
      } else {
        score += 5
      }
    }

    if (this.policy.requireSpecialChars !== false) {
      if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
        errors.push('Password must contain at least one special character')
      } else {
        score += 10
      }
    }

    // Common password check
    if (this.policy.forbidCommonPasswords !== false) {
      if (this.commonPasswords.has(password.toLowerCase())) {
        errors.push('Password is too common')
        score = Math.max(0, score - 20)
      }
    }

    // User info check
    if (this.policy.forbidUserInfo !== false && userInfo) {
      if (userInfo.email && password.toLowerCase().includes(userInfo.email.split('@')[0].toLowerCase())) {
        errors.push('Password cannot contain your email address')
        score = Math.max(0, score - 15)
      }
      
      if (userInfo.name && password.toLowerCase().includes(userInfo.name.toLowerCase())) {
        errors.push('Password cannot contain your name')
        score = Math.max(0, score - 15)
      }
    }

    // Bonus points for complexity
    const uniqueChars = new Set(password).size
    score += Math.min(uniqueChars / password.length, 0.5) * 20

    // Penalize repeated characters
    const repeatedChars = password.match(/(.)\1{2,}/g)
    if (repeatedChars) {
      score = Math.max(0, score - repeatedChars.length * 5)
    }

    return {
      valid: errors.length === 0,
      errors,
      score: Math.min(100, Math.max(0, score))
    }
  }
}

// Secure token generation
export function generateSecureToken(length = 32): string {
  return randomBytes(length).toString('hex')
}

export function generateSecureOTP(length = 6): string {
  const digits = '0123456789'
  let result = ''
  
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * digits.length)
    result += digits[randomIndex]
  }
  
  return result
}

// IP address utilities
export function getClientIP(headers: Record<string, string | undefined>): string {
  // Check various headers for the real IP
  const candidates = [
    headers['x-forwarded-for'],
    headers['x-real-ip'],
    headers['x-client-ip'],
    headers['cf-connecting-ip'], // Cloudflare
    headers['x-forwarded'],
    headers['forwarded-for'],
    headers['forwarded']
  ]

  for (const candidate of candidates) {
    if (candidate) {
      // x-forwarded-for can contain multiple IPs, take the first one
      const ip = candidate.split(',')[0].trim()
      if (this.isValidIP(ip)) {
        return ip
      }
    }
  }

  return '127.0.0.1' // fallback
}

function isValidIP(ip: string): boolean {
  // Basic IP validation (IPv4)
  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/
  if (ipv4Regex.test(ip)) {
    const parts = ip.split('.').map(Number)
    return parts.every(part => part >= 0 && part <= 255)
  }

  // Basic IPv6 validation
  const ipv6Regex = /^([0-9a-fA-F]{0,4}:){1,7}[0-9a-fA-F]{0,4}$/
  return ipv6Regex.test(ip)
}

// Security headers
export function getSecurityHeaders(): Record<string, string> {
  return {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
    'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';"
  }
}

// Time-based token validation (for OTP, email verification, etc.)
export function isTokenExpired(issuedAt: Date, expirationMinutes: number): boolean {
  const now = new Date()
  const expirationTime = new Date(issuedAt.getTime() + expirationMinutes * 60 * 1000)
  return now > expirationTime
}

// Secure comparison for timing attack prevention
export function secureCompare(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false
  }

  let result = 0
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }

  return result === 0
}