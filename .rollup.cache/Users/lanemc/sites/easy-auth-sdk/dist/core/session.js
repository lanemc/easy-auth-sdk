import { eq, and, gt } from 'drizzle-orm';
import { schema } from '../db/schema';
import { AuthError, DatabaseError } from '../types';
import { generateSessionId, generateSessionToken, createJWT, verifyJWT, addDays, isExpired, serializeCookie, parseCookies } from '../utils';
export class SessionManager {
    constructor(db, config) {
        this.db = db;
        this.cookieName = 'easy-auth-session';
        this.strategy = config.session.strategy;
        this.maxAge = config.session.maxAge;
        this.secret = config.session.secret;
    }
    async createSession(user) {
        const sessionId = generateSessionId();
        const sessionToken = generateSessionToken();
        const expiresAt = addDays(new Date(), this.maxAge / (24 * 60 * 60)); // Convert seconds to days
        const now = new Date();
        if (this.strategy === 'database') {
            // Store session in database
            const [session] = await this.db.db
                .insert(schema.sessions)
                .values({
                id: sessionId,
                userId: user.id,
                sessionToken,
                expiresAt,
                createdAt: now,
                updatedAt: now
            })
                .returning();
            return {
                id: session.id,
                userId: session.userId,
                sessionToken: session.sessionToken,
                expiresAt: session.expiresAt,
                createdAt: session.createdAt,
                updatedAt: session.updatedAt
            };
        }
        else {
            // JWT strategy - create token with user data
            const jwtPayload = {
                sub: user.id,
                email: user.email,
                name: user.name,
                emailVerified: user.emailVerified,
                image: user.image,
                iat: Math.floor(Date.now() / 1000),
                exp: Math.floor(expiresAt.getTime() / 1000)
            };
            const jwt = createJWT(jwtPayload, this.secret, `${this.maxAge}s`);
            return {
                id: sessionId,
                userId: user.id,
                sessionToken: jwt,
                expiresAt,
                createdAt: now,
                updatedAt: now
            };
        }
    }
    async getSession(sessionToken) {
        try {
            if (this.strategy === 'database') {
                return await this.getDatabaseSession(sessionToken);
            }
            else {
                return await this.getJWTSession(sessionToken);
            }
        }
        catch (error) {
            // Invalid or expired sessions should return null, not throw
            if (error instanceof AuthError && (error.code === 'TOKEN_EXPIRED' || error.code === 'INVALID_TOKEN')) {
                return null;
            }
            throw error;
        }
    }
    async getDatabaseSession(sessionToken) {
        const [result] = await this.db.db
            .select()
            .from(schema.sessions)
            .innerJoin(schema.users, eq(schema.sessions.userId, schema.users.id))
            .where(and(eq(schema.sessions.sessionToken, sessionToken), gt(schema.sessions.expiresAt, new Date())))
            .limit(1);
        if (!result) {
            return null;
        }
        const session = {
            id: result.sessions.id,
            userId: result.sessions.userId,
            sessionToken: result.sessions.sessionToken,
            expiresAt: result.sessions.expiresAt,
            createdAt: result.sessions.createdAt,
            updatedAt: result.sessions.updatedAt
        };
        const user = {
            id: result.users.id,
            email: result.users.email,
            name: result.users.name || undefined,
            emailVerified: result.users.emailVerified,
            image: result.users.image || undefined,
            createdAt: result.users.createdAt,
            updatedAt: result.users.updatedAt
        };
        return { user, session };
    }
    async getJWTSession(sessionToken) {
        try {
            const payload = verifyJWT(sessionToken, this.secret);
            // Check if token is expired (additional check)
            if (payload.exp < Math.floor(Date.now() / 1000)) {
                return null;
            }
            const user = {
                id: payload.sub,
                email: payload.email,
                name: payload.name,
                emailVerified: payload.emailVerified,
                image: payload.image,
                createdAt: new Date(payload.iat * 1000),
                updatedAt: new Date(payload.iat * 1000)
            };
            const session = {
                id: `jwt_${payload.sub}`,
                userId: payload.sub,
                sessionToken,
                expiresAt: new Date(payload.exp * 1000),
                createdAt: new Date(payload.iat * 1000),
                updatedAt: new Date(payload.iat * 1000)
            };
            return { user, session };
        }
        catch (error) {
            if (error instanceof AuthError) {
                throw error;
            }
            throw new AuthError('Invalid session token', 'INVALID_TOKEN', 401);
        }
    }
    async updateSession(sessionToken) {
        if (this.strategy === 'jwt') {
            // JWT sessions don't need updating
            const sessionData = await this.getJWTSession(sessionToken);
            return sessionData?.session || null;
        }
        try {
            const now = new Date();
            const [updatedSession] = await this.db.db
                .update(schema.sessions)
                .set({ updatedAt: now })
                .where(and(eq(schema.sessions.sessionToken, sessionToken), gt(schema.sessions.expiresAt, now)))
                .returning();
            if (!updatedSession) {
                return null;
            }
            return {
                id: updatedSession.id,
                userId: updatedSession.userId,
                sessionToken: updatedSession.sessionToken,
                expiresAt: updatedSession.expiresAt,
                createdAt: updatedSession.createdAt,
                updatedAt: updatedSession.updatedAt
            };
        }
        catch (error) {
            throw new DatabaseError(`Failed to update session: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async deleteSession(sessionToken) {
        if (this.strategy === 'jwt') {
            // JWT sessions can't be deleted from server side
            // They expire naturally or need to be blacklisted (not implemented here)
            return true;
        }
        try {
            const result = await this.db.db
                .delete(schema.sessions)
                .where(eq(schema.sessions.sessionToken, sessionToken))
                .returning({ id: schema.sessions.id });
            return result.length > 0;
        }
        catch (error) {
            throw new DatabaseError(`Failed to delete session: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async deleteAllUserSessions(userId) {
        if (this.strategy === 'jwt') {
            // JWT sessions can't be deleted from server side
            return 0;
        }
        try {
            const result = await this.db.db
                .delete(schema.sessions)
                .where(eq(schema.sessions.userId, userId))
                .returning({ id: schema.sessions.id });
            return result.length;
        }
        catch (error) {
            throw new DatabaseError(`Failed to delete user sessions: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async cleanupExpiredSessions() {
        if (this.strategy === 'jwt') {
            // JWT sessions expire naturally
            return 0;
        }
        try {
            const result = await this.db.db
                .delete(schema.sessions)
                .where(sql `expires_at < NOW()`)
                .returning({ id: schema.sessions.id });
            return result.length;
        }
        catch (error) {
            throw new DatabaseError(`Failed to cleanup expired sessions: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    // Cookie helpers
    createSessionCookie(sessionToken, options = {}) {
        const cookieOptions = {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: this.maxAge,
            ...options
        };
        return serializeCookie(this.cookieName, sessionToken, cookieOptions);
    }
    getSessionFromCookies(cookieHeader) {
        const cookies = parseCookies(cookieHeader);
        return cookies[this.cookieName] || null;
    }
    createLogoutCookie(options = {}) {
        const cookieOptions = {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: 0, // Expire immediately
            ...options
        };
        return serializeCookie(this.cookieName, '', cookieOptions);
    }
    // Session validation
    async validateSession(sessionToken) {
        const sessionData = await this.getSession(sessionToken);
        if (!sessionData) {
            return null;
        }
        // Check if session is expired
        if (isExpired(sessionData.session.expiresAt)) {
            // Clean up expired session if using database strategy
            if (this.strategy === 'database') {
                await this.deleteSession(sessionToken);
            }
            return null;
        }
        // Update session activity if using database strategy
        if (this.strategy === 'database') {
            await this.updateSession(sessionToken);
        }
        return sessionData;
    }
    // Get session info without validation (for debugging)
    async getSessionInfo(sessionToken) {
        try {
            const sessionData = await this.getSession(sessionToken);
            if (!sessionData) {
                return { valid: false, expired: false, error: 'Session not found' };
            }
            const expired = isExpired(sessionData.session.expiresAt);
            return {
                valid: !expired,
                expired,
                user: sessionData.user,
                session: sessionData.session
            };
        }
        catch (error) {
            return {
                valid: false,
                expired: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }
}
// Import sql from drizzle-orm for raw queries
import { sql } from 'drizzle-orm';
//# sourceMappingURL=session.js.map