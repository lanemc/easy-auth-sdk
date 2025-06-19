import bcrypt from 'bcryptjs'
import { nanoid } from 'nanoid'
import jwt from 'jsonwebtoken'
import { AuthError } from '../types'

// ID generation
export function generateId(prefix?: string): string {
  const id = nanoid(21) // 21 characters for good uniqueness
  return prefix ? `${prefix}_${id}` : id
}

export function generateUserId(): string {
  return generateId('user')
}

export function generateAccountId(): string {
  return generateId('acc')
}

export function generateSessionId(): string {
  return generateId('sess')
}

export function generateSessionToken(): string {
  return nanoid(32) // Longer token for sessions
}

export function generateVerificationToken(): string {
  return nanoid(32)
}

// Password utilities
export async function hashPassword(password: string): Promise<string> {
  try {
    const saltRounds = 12
    return await bcrypt.hash(password, saltRounds)
  } catch (error) {
    throw new AuthError(
      'Failed to hash password',
      'HASH_ERROR',
      500
    )
  }
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  try {
    return await bcrypt.compare(password, hash)
  } catch (error) {
    throw new AuthError(
      'Failed to verify password',
      'VERIFY_ERROR',
      500
    )
  }
}

// JWT utilities
export function createJWT(payload: Record<string, unknown>, secret: string, expiresIn: string = '30d'): string {
  try {
    return jwt.sign(payload, secret, { expiresIn } as any)
  } catch (error) {
    throw new AuthError(
      'Failed to create JWT',
      'JWT_CREATE_ERROR',
      500
    )
  }
}

export function verifyJWT<T = Record<string, unknown>>(token: string, secret: string): T {
  try {
    return jwt.verify(token, secret) as T
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new AuthError('Token expired', 'TOKEN_EXPIRED', 401)
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new AuthError('Invalid token', 'INVALID_TOKEN', 401)
    }
    throw new AuthError('Token verification failed', 'TOKEN_ERROR', 401)
  }
}

// Email validation
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// Password strength validation
export interface PasswordStrength {
  isValid: boolean
  errors: string[]
}

export function validatePasswordStrength(password: string): PasswordStrength {
  const errors: string[] = []
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long')
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter')
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter')
  }
  
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number')
  }
  
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Password must contain at least one special character')
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

// URL utilities
export function buildURL(base: string, path: string, params?: Record<string, string>): string {
  const url = new URL(path, base)
  
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.set(key, value)
    })
  }
  
  return url.toString()
}

// Time utilities
export function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60000)
}

export function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000)
}

export function isExpired(date: Date): boolean {
  return date.getTime() < Date.now()
}

// Cookie utilities
export interface CookieOptions {
  httpOnly?: boolean
  secure?: boolean
  sameSite?: 'strict' | 'lax' | 'none'
  maxAge?: number
  path?: string
  domain?: string
}

export function serializeCookie(name: string, value: string, options: CookieOptions = {}): string {
  const opts = {
    httpOnly: true,
    secure: true,
    sameSite: 'lax' as const,
    path: '/',
    ...options
  }
  
  let cookie = `${name}=${encodeURIComponent(value)}`
  
  if (opts.maxAge) {
    cookie += `; Max-Age=${opts.maxAge}`
  }
  
  if (opts.path) {
    cookie += `; Path=${opts.path}`
  }
  
  if (opts.domain) {
    cookie += `; Domain=${opts.domain}`
  }
  
  if (opts.httpOnly) {
    cookie += '; HttpOnly'
  }
  
  if (opts.secure) {
    cookie += '; Secure'
  }
  
  if (opts.sameSite) {
    cookie += `; SameSite=${opts.sameSite}`
  }
  
  return cookie
}

export function parseCookies(cookieHeader: string): Record<string, string> {
  const cookies: Record<string, string> = {}
  
  cookieHeader.split(';').forEach(cookie => {
    const [name, value] = cookie.trim().split('=')
    if (name && value) {
      cookies[name] = decodeURIComponent(value)
    }
  })
  
  return cookies
}