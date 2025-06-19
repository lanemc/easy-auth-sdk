import { AuthEngine } from './engine';
import { AuthConfigSchema, ConfigError } from '../types';
/**
 * EasyAuth - Main SDK class for authentication
 *
 * This is the primary interface developers will use to integrate authentication
 * into their applications. It provides a simple, intuitive API while handling
 * all the complexity of authentication flows, session management, and security.
 */
export class EasyAuth {
    constructor(config, callbacks) {
        this.initialized = false;
        // Validate configuration
        const validatedConfig = this.validateConfig(config);
        // Initialize the auth engine
        this.engine = new AuthEngine(validatedConfig, callbacks);
    }
    validateConfig(config) {
        try {
            return AuthConfigSchema.parse(config);
        }
        catch (error) {
            throw new ConfigError(`Invalid EasyAuth configuration: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    /**
     * Initialize the authentication system
     * Must be called before using any other methods
     */
    async initialize() {
        if (this.initialized) {
            return;
        }
        await this.engine.initialize();
        this.initialized = true;
    }
    /**
     * Sign up a new user with email and password
     */
    async signUp(email, password, name) {
        this.ensureInitialized();
        return await this.engine.signUpWithPassword(email, password, name);
    }
    /**
     * Sign in a user with email and password
     */
    async signIn(email, password) {
        this.ensureInitialized();
        const { result, session } = await this.engine.signInWithPassword(email, password);
        if (result.success && session) {
            return {
                ...result,
                session,
                sessionCookie: this.engine.createSessionCookie(session.sessionToken)
            };
        }
        return result;
    }
    /**
     * Get OAuth authorization URL for a provider
     */
    getOAuthURL(provider, redirectUri, state) {
        this.ensureInitialized();
        const stateParam = state || this.generateState();
        return this.engine.getOAuthAuthorizationUrl(provider, redirectUri, stateParam);
    }
    /**
     * Handle OAuth callback and sign in user
     */
    async handleOAuthCallback(provider, code, redirectUri, state) {
        this.ensureInitialized();
        const { result, session } = await this.engine.handleOAuthCallback(provider, code, redirectUri, state);
        if (result.success && session) {
            return {
                ...result,
                session,
                sessionCookie: this.engine.createSessionCookie(session.sessionToken)
            };
        }
        return result;
    }
    /**
     * Get current user session
     */
    async getSession(sessionToken) {
        this.ensureInitialized();
        return await this.engine.getSession(sessionToken);
    }
    /**
     * Get session from cookie header
     */
    getSessionFromCookies(cookieHeader) {
        return this.engine.getSessionFromCookies(cookieHeader);
    }
    /**
     * Sign out user and invalidate session
     */
    async signOut(sessionToken) {
        this.ensureInitialized();
        const success = await this.engine.signOut(sessionToken);
        const logoutCookie = this.engine.createLogoutCookie();
        return { success, logoutCookie };
    }
    /**
     * Sign out user from all sessions
     */
    async signOutAll(userId) {
        this.ensureInitialized();
        return await this.engine.signOutAllSessions(userId);
    }
    /**
     * Update user password
     */
    async updatePassword(userId, oldPassword, newPassword) {
        this.ensureInitialized();
        return await this.engine.updatePassword(userId, oldPassword, newPassword);
    }
    /**
     * Request password reset token
     */
    async requestPasswordReset(email) {
        this.ensureInitialized();
        return await this.engine.requestPasswordReset(email);
    }
    /**
     * Reset password with token
     */
    async resetPassword(email, newPassword, token) {
        this.ensureInitialized();
        return await this.engine.resetPassword(email, newPassword, token);
    }
    /**
     * Get list of configured OAuth providers
     */
    getProviders() {
        return this.engine.getConfiguredOAuthProviders();
    }
    /**
     * Check if authentication system is healthy
     */
    async health() {
        if (!this.initialized) {
            return { status: 'error', database: false, error: 'Not initialized' };
        }
        return await this.engine.health();
    }
    /**
     * Cleanup expired sessions and tokens
     */
    async cleanupExpired() {
        this.ensureInitialized();
        const [sessions, tokens] = await Promise.all([
            this.engine.cleanupExpiredSessions(),
            this.engine.cleanupExpiredTokens()
        ]);
        return { sessions, tokens };
    }
    /**
     * Get access to the underlying database (for advanced usage)
     */
    getDatabase() {
        this.ensureInitialized();
        return this.engine.getDatabase();
    }
    /**
     * Gracefully shutdown the authentication system
     */
    async close() {
        if (this.initialized) {
            await this.engine.close();
            this.initialized = false;
        }
    }
    // Helper methods
    ensureInitialized() {
        if (!this.initialized) {
            throw new ConfigError('EasyAuth must be initialized before use. Call initialize() first.');
        }
    }
    generateState() {
        return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    }
    /**
     * Create a middleware function for protecting routes
     * Returns a function that can be used in web frameworks
     */
    requireAuth() {
        return async (req, res, next) => {
            this.ensureInitialized();
            try {
                const sessionToken = this.getSessionFromRequest(req);
                if (!sessionToken) {
                    return this.handleUnauthorized(res, 'No session token provided');
                }
                const sessionData = await this.getSession(sessionToken);
                if (!sessionData) {
                    return this.handleUnauthorized(res, 'Invalid or expired session');
                }
                // Attach user to request object
                req.user = sessionData.user;
                req.session = sessionData.session;
                next();
            }
            catch (error) {
                return this.handleUnauthorized(res, 'Authentication error');
            }
        };
    }
    getSessionFromRequest(req) {
        // Try to get session token from various sources
        // 1. Authorization header (Bearer token)
        const authHeader = req.headers?.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            return authHeader.substring(7);
        }
        // 2. Cookie header
        const cookieHeader = req.headers?.cookie;
        if (cookieHeader) {
            return this.getSessionFromCookies(cookieHeader);
        }
        // 3. Query parameter (not recommended for production)
        if (req.query?.sessionToken) {
            return req.query.sessionToken;
        }
        return null;
    }
    handleUnauthorized(res, message) {
        if (res.status && res.json) {
            // Express-style response
            return res.status(401).json({ error: message });
        }
        else if (res.respond) {
            // Next.js API response
            return res.respond(401, { error: message });
        }
        else {
            // Generic response
            res.statusCode = 401;
            res.end(JSON.stringify({ error: message }));
        }
    }
    /**
     * Create a higher-order function for protecting route handlers
     */
    withAuth(handler) {
        return (async (...args) => {
            this.ensureInitialized();
            const [req, res] = args;
            try {
                const sessionToken = this.getSessionFromRequest(req);
                if (!sessionToken) {
                    return this.handleUnauthorized(res, 'No session token provided');
                }
                const sessionData = await this.getSession(sessionToken);
                if (!sessionData) {
                    return this.handleUnauthorized(res, 'Invalid or expired session');
                }
                // Attach user to request object
                req.user = sessionData.user;
                req.session = sessionData.session;
                return await handler(...args);
            }
            catch (error) {
                return this.handleUnauthorized(res, 'Authentication error');
            }
        });
    }
}
//# sourceMappingURL=easy-auth.js.map