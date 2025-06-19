import { Database } from '../db/database';
import { PasswordAuth } from './password';
import { OAuthManager } from './oauth';
import { SessionManager } from './session';
import { AuthError, ConfigError } from '../types';
export class AuthEngine {
    constructor(config, callbacks = {}) {
        this.config = this.validateConfig(config);
        this.callbacks = callbacks;
        // Initialize database
        this.db = new Database(config.database.url);
        // Initialize auth components
        this.passwordAuth = new PasswordAuth(this.db);
        this.oauthManager = new OAuthManager(this.db);
        this.sessionManager = new SessionManager(this.db, config);
        // Configure OAuth providers
        this.configureOAuthProviders();
    }
    validateConfig(config) {
        try {
            return config; // Assumes validation is done by Zod schema at higher level
        }
        catch (error) {
            throw new ConfigError(`Invalid configuration: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    configureOAuthProviders() {
        const providers = this.config.providers;
        if (providers.google) {
            this.oauthManager.configureProvider('google', {
                clientId: providers.google.clientId,
                clientSecret: providers.google.clientSecret,
                scope: providers.google.scope || 'openid email profile'
            });
        }
        if (providers.github) {
            this.oauthManager.configureProvider('github', {
                clientId: providers.github.clientId,
                clientSecret: providers.github.clientSecret,
                scope: providers.github.scope || 'user:email'
            });
        }
    }
    // Initialize the auth engine
    async initialize() {
        await this.db.testConnection();
        await this.db.ensureTablesExist();
    }
    // Password authentication
    async signUpWithPassword(email, password, name) {
        if (!this.config.providers.emailPassword?.enabled) {
            return {
                success: false,
                error: 'Password authentication is not enabled'
            };
        }
        const result = await this.passwordAuth.signUp(email, password, name);
        if (result.success && result.user && this.callbacks.onSignUp) {
            try {
                await this.callbacks.onSignUp({ user: result.user });
            }
            catch (error) {
                // Log callback error but don't fail the signup
                console.error('Sign up callback error:', error);
            }
        }
        return result;
    }
    async signInWithPassword(email, password) {
        if (!this.config.providers.emailPassword?.enabled) {
            return {
                result: {
                    success: false,
                    error: 'Password authentication is not enabled'
                }
            };
        }
        const result = await this.passwordAuth.signIn(email, password);
        if (result.success && result.user) {
            const session = await this.sessionManager.createSession(result.user);
            if (this.callbacks.onSignIn) {
                try {
                    await this.callbacks.onSignIn({ user: result.user });
                }
                catch (error) {
                    console.error('Sign in callback error:', error);
                }
            }
            return {
                result: { ...result, session },
                session
            };
        }
        return { result };
    }
    // OAuth authentication
    getOAuthAuthorizationUrl(provider, redirectUri, state) {
        const providerConfig = this.config.providers[provider];
        if (!providerConfig) {
            throw new AuthError(`OAuth provider ${provider} is not configured`, 'PROVIDER_NOT_CONFIGURED');
        }
        return this.oauthManager.generateAuthorizationUrl(provider, redirectUri, state);
    }
    async handleOAuthCallback(provider, code, redirectUri, state) {
        const providerConfig = this.config.providers[provider];
        if (!providerConfig) {
            return {
                result: {
                    success: false,
                    error: `OAuth provider ${provider} is not configured`
                }
            };
        }
        const result = await this.oauthManager.handleCallback(provider, code, redirectUri, state);
        if (result.success && result.user) {
            const session = await this.sessionManager.createSession(result.user);
            if (this.callbacks.onSignIn) {
                try {
                    await this.callbacks.onSignIn({ user: result.user });
                }
                catch (error) {
                    console.error('OAuth sign in callback error:', error);
                }
            }
            return {
                result: { ...result, session },
                session
            };
        }
        return { result };
    }
    // Session management
    async getSession(sessionToken) {
        return await this.sessionManager.validateSession(sessionToken);
    }
    async refreshSession(sessionToken) {
        return await this.sessionManager.updateSession(sessionToken);
    }
    async signOut(sessionToken) {
        const sessionData = await this.sessionManager.getSession(sessionToken);
        if (sessionData && this.callbacks.onSignOut) {
            try {
                await this.callbacks.onSignOut({ user: sessionData.user });
            }
            catch (error) {
                console.error('Sign out callback error:', error);
            }
        }
        return await this.sessionManager.deleteSession(sessionToken);
    }
    async signOutAllSessions(userId) {
        return await this.sessionManager.deleteAllUserSessions(userId);
    }
    // User management
    async updatePassword(userId, oldPassword, newPassword) {
        if (!this.config.providers.emailPassword?.enabled) {
            throw new AuthError('Password authentication is not enabled', 'PASSWORD_AUTH_DISABLED');
        }
        return await this.passwordAuth.updatePassword(userId, oldPassword, newPassword);
    }
    async requestPasswordReset(email) {
        if (!this.config.providers.emailPassword?.enabled) {
            throw new AuthError('Password authentication is not enabled', 'PASSWORD_AUTH_DISABLED');
        }
        return await this.passwordAuth.generatePasswordResetToken(email);
    }
    async resetPassword(email, newPassword, token) {
        if (!this.config.providers.emailPassword?.enabled) {
            throw new AuthError('Password authentication is not enabled', 'PASSWORD_AUTH_DISABLED');
        }
        return await this.passwordAuth.resetPassword(email, newPassword, token);
    }
    // Utility methods
    createSessionCookie(sessionToken) {
        return this.sessionManager.createSessionCookie(sessionToken);
    }
    createLogoutCookie() {
        return this.sessionManager.createLogoutCookie();
    }
    getSessionFromCookies(cookieHeader) {
        return this.sessionManager.getSessionFromCookies(cookieHeader);
    }
    getConfiguredOAuthProviders() {
        return this.oauthManager.getConfiguredProviders().map(provider => ({
            id: provider.id,
            name: provider.name
        }));
    }
    // Maintenance
    async cleanupExpiredSessions() {
        return await this.sessionManager.cleanupExpiredSessions();
    }
    async cleanupExpiredTokens() {
        return await this.db.cleanupExpiredTokens();
    }
    // Database access (for advanced usage)
    getDatabase() {
        return this.db;
    }
    // Graceful shutdown
    async close() {
        await this.db.close();
    }
    // Health check
    async health() {
        try {
            await this.db.testConnection();
            return { status: 'ok', database: true };
        }
        catch (error) {
            return {
                status: 'error',
                database: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }
}
//# sourceMappingURL=engine.js.map