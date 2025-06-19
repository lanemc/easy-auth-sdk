import bcrypt from 'bcryptjs';
import { nanoid } from 'nanoid';
import jwt from 'jsonwebtoken';
import { AuthError } from '../types';
// ID generation
export function generateId(prefix) {
    const id = nanoid(21); // 21 characters for good uniqueness
    return prefix ? `${prefix}_${id}` : id;
}
export function generateUserId() {
    return generateId('user');
}
export function generateAccountId() {
    return generateId('acc');
}
export function generateSessionId() {
    return generateId('sess');
}
export function generateSessionToken() {
    return nanoid(32); // Longer token for sessions
}
export function generateVerificationToken() {
    return nanoid(32);
}
// Password utilities
export async function hashPassword(password) {
    try {
        const saltRounds = 12;
        return await bcrypt.hash(password, saltRounds);
    }
    catch (error) {
        throw new AuthError('Failed to hash password', 'HASH_ERROR', 500);
    }
}
export async function verifyPassword(password, hash) {
    try {
        return await bcrypt.compare(password, hash);
    }
    catch (error) {
        throw new AuthError('Failed to verify password', 'VERIFY_ERROR', 500);
    }
}
// JWT utilities
export function createJWT(payload, secret, expiresIn = '30d') {
    try {
        return jwt.sign(payload, secret, { expiresIn });
    }
    catch (error) {
        throw new AuthError('Failed to create JWT', 'JWT_CREATE_ERROR', 500);
    }
}
export function verifyJWT(token, secret) {
    try {
        return jwt.verify(token, secret);
    }
    catch (error) {
        if (error instanceof jwt.TokenExpiredError) {
            throw new AuthError('Token expired', 'TOKEN_EXPIRED', 401);
        }
        if (error instanceof jwt.JsonWebTokenError) {
            throw new AuthError('Invalid token', 'INVALID_TOKEN', 401);
        }
        throw new AuthError('Token verification failed', 'TOKEN_ERROR', 401);
    }
}
// Email validation
export function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}
export function validatePasswordStrength(password) {
    const errors = [];
    if (password.length < 8) {
        errors.push('Password must be at least 8 characters long');
    }
    if (!/[a-z]/.test(password)) {
        errors.push('Password must contain at least one lowercase letter');
    }
    if (!/[A-Z]/.test(password)) {
        errors.push('Password must contain at least one uppercase letter');
    }
    if (!/\d/.test(password)) {
        errors.push('Password must contain at least one number');
    }
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
        errors.push('Password must contain at least one special character');
    }
    return {
        isValid: errors.length === 0,
        errors
    };
}
// URL utilities
export function buildURL(base, path, params) {
    const url = new URL(path, base);
    if (params) {
        Object.entries(params).forEach(([key, value]) => {
            url.searchParams.set(key, value);
        });
    }
    return url.toString();
}
// Time utilities
export function addMinutes(date, minutes) {
    return new Date(date.getTime() + minutes * 60000);
}
export function addDays(date, days) {
    return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}
export function isExpired(date) {
    return date.getTime() < Date.now();
}
export function serializeCookie(name, value, options = {}) {
    const opts = {
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        path: '/',
        ...options
    };
    let cookie = `${name}=${encodeURIComponent(value)}`;
    if (opts.maxAge) {
        cookie += `; Max-Age=${opts.maxAge}`;
    }
    if (opts.path) {
        cookie += `; Path=${opts.path}`;
    }
    if (opts.domain) {
        cookie += `; Domain=${opts.domain}`;
    }
    if (opts.httpOnly) {
        cookie += '; HttpOnly';
    }
    if (opts.secure) {
        cookie += '; Secure';
    }
    if (opts.sameSite) {
        cookie += `; SameSite=${opts.sameSite}`;
    }
    return cookie;
}
export function parseCookies(cookieHeader) {
    const cookies = {};
    cookieHeader.split(';').forEach(cookie => {
        const [name, value] = cookie.trim().split('=');
        if (name && value) {
            cookies[name] = decodeURIComponent(value);
        }
    });
    return cookies;
}
//# sourceMappingURL=index.js.map