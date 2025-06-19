import { Database } from '../db/database'
import { PasswordAuth } from './password'
import { OAuthManager } from './oauth'
import { SessionManager } from './session'
import { 
  User, 
  Session,
  Account,
  AuthConfig, 
  SignInResult, 
  SignUpResult,
  AuthError,
  ConfigError
} from '../types'

export interface AuthEngineCallbacks {
  onSignUp?: (data: { user: User }) => Promise<void> | void
  onSignIn?: (data: { user: User; account?: Account }) => Promise<void> | void
  onSignOut?: (data: { user: User }) => Promise<void> | void
}

export class AuthEngine {
  private db: Database
  private passwordAuth: PasswordAuth
  private oauthManager: OAuthManager
  private sessionManager: SessionManager
  private config: AuthConfig
  private callbacks: AuthEngineCallbacks

  constructor(config: AuthConfig, callbacks: AuthEngineCallbacks = {}) {
    this.config = this.validateConfig(config)
    this.callbacks = callbacks

    // Initialize database
    this.db = new Database(config.database.url)

    // Initialize auth components
    this.passwordAuth = new PasswordAuth(this.db)
    this.oauthManager = new OAuthManager(this.db)
    this.sessionManager = new SessionManager(this.db, config)

    // Configure OAuth providers
    this.configureOAuthProviders()
  }

  private validateConfig(config: AuthConfig): AuthConfig {
    try {
      return config // Assumes validation is done by Zod schema at higher level
    } catch (error) {
      throw new ConfigError(`Invalid configuration: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  private configureOAuthProviders(): void {
    const providers = this.config.providers

    if (providers.google) {
      this.oauthManager.configureProvider('google', {
        clientId: providers.google.clientId,
        clientSecret: providers.google.clientSecret,
        scope: providers.google.scope || 'openid email profile'
      })
    }

    if (providers.github) {
      this.oauthManager.configureProvider('github', {
        clientId: providers.github.clientId,
        clientSecret: providers.github.clientSecret,
        scope: providers.github.scope || 'user:email'
      })
    }
  }

  // Initialize the auth engine
  async initialize(): Promise<void> {
    await this.db.testConnection()
    await this.db.ensureTablesExist()
  }

  // Password authentication
  async signUpWithPassword(email: string, password: string, name?: string): Promise<SignUpResult> {
    if (!this.config.providers.emailPassword?.enabled) {
      return {
        success: false,
        error: 'Password authentication is not enabled'
      }
    }

    const result = await this.passwordAuth.signUp(email, password, name)
    
    if (result.success && result.user && this.callbacks.onSignUp) {
      try {
        await this.callbacks.onSignUp({ user: result.user })
      } catch (error) {
        // Log callback error but don't fail the signup
        console.error('Sign up callback error:', error)
      }
    }

    return result
  }

  async signInWithPassword(email: string, password: string): Promise<{ result: SignInResult; session?: Session }> {
    if (!this.config.providers.emailPassword?.enabled) {
      return {
        result: {
          success: false,
          error: 'Password authentication is not enabled'
        }
      }
    }

    const result = await this.passwordAuth.signIn(email, password)
    
    if (result.success && result.user) {
      const session = await this.sessionManager.createSession(result.user)
      
      if (this.callbacks.onSignIn) {
        try {
          await this.callbacks.onSignIn({ user: result.user })
        } catch (error) {
          console.error('Sign in callback error:', error)
        }
      }

      return {
        result: { ...result, session },
        session
      }
    }

    return { result }
  }

  // OAuth authentication
  getOAuthAuthorizationUrl(provider: string, redirectUri: string, state: string): string {
    const providerConfig = this.config.providers[provider as keyof typeof this.config.providers]
    if (!providerConfig) {
      throw new AuthError(`OAuth provider ${provider} is not configured`, 'PROVIDER_NOT_CONFIGURED')
    }

    return this.oauthManager.generateAuthorizationUrl(provider, redirectUri, state)
  }

  async handleOAuthCallback(
    provider: string, 
    code: string, 
    redirectUri: string, 
    state?: string
  ): Promise<{ result: SignInResult; session?: Session }> {
    const providerConfig = this.config.providers[provider as keyof typeof this.config.providers]
    if (!providerConfig) {
      return {
        result: {
          success: false,
          error: `OAuth provider ${provider} is not configured`
        }
      }
    }

    const result = await this.oauthManager.handleCallback(provider, code, redirectUri, state)
    
    if (result.success && result.user) {
      const session = await this.sessionManager.createSession(result.user)
      
      if (this.callbacks.onSignIn) {
        try {
          await this.callbacks.onSignIn({ user: result.user })
        } catch (error) {
          console.error('OAuth sign in callback error:', error)
        }
      }

      return {
        result: { ...result, session },
        session
      }
    }

    return { result }
  }

  // Session management
  async getSession(sessionToken: string): Promise<{ user: User; session: Session } | null> {
    return await this.sessionManager.validateSession(sessionToken)
  }

  async refreshSession(sessionToken: string): Promise<Session | null> {
    return await this.sessionManager.updateSession(sessionToken)
  }

  async signOut(sessionToken: string): Promise<boolean> {
    const sessionData = await this.sessionManager.getSession(sessionToken)
    
    if (sessionData && this.callbacks.onSignOut) {
      try {
        await this.callbacks.onSignOut({ user: sessionData.user })
      } catch (error) {
        console.error('Sign out callback error:', error)
      }
    }

    return await this.sessionManager.deleteSession(sessionToken)
  }

  async signOutAllSessions(userId: string): Promise<number> {
    return await this.sessionManager.deleteAllUserSessions(userId)
  }

  // User management
  async updatePassword(userId: string, oldPassword: string, newPassword: string): Promise<boolean> {
    if (!this.config.providers.emailPassword?.enabled) {
      throw new AuthError('Password authentication is not enabled', 'PASSWORD_AUTH_DISABLED')
    }

    return await this.passwordAuth.updatePassword(userId, oldPassword, newPassword)
  }

  async requestPasswordReset(email: string): Promise<string | null> {
    if (!this.config.providers.emailPassword?.enabled) {
      throw new AuthError('Password authentication is not enabled', 'PASSWORD_AUTH_DISABLED')
    }

    return await this.passwordAuth.generatePasswordResetToken(email)
  }

  async resetPassword(email: string, newPassword: string, token: string): Promise<boolean> {
    if (!this.config.providers.emailPassword?.enabled) {
      throw new AuthError('Password authentication is not enabled', 'PASSWORD_AUTH_DISABLED')
    }

    return await this.passwordAuth.resetPassword(email, newPassword, token)
  }

  // Utility methods
  createSessionCookie(sessionToken: string): string {
    return this.sessionManager.createSessionCookie(sessionToken)
  }

  createLogoutCookie(): string {
    return this.sessionManager.createLogoutCookie()
  }

  getSessionFromCookies(cookieHeader: string): string | null {
    return this.sessionManager.getSessionFromCookies(cookieHeader)
  }

  getConfiguredOAuthProviders(): Array<{ id: string; name: string }> {
    return this.oauthManager.getConfiguredProviders().map(provider => ({
      id: provider.id,
      name: provider.name
    }))
  }

  // Maintenance
  async cleanupExpiredSessions(): Promise<number> {
    return await this.sessionManager.cleanupExpiredSessions()
  }

  async cleanupExpiredTokens(): Promise<number> {
    return await this.db.cleanupExpiredTokens()
  }

  // Database access (for advanced usage)
  getDatabase(): Database {
    return this.db
  }

  // Graceful shutdown
  async close(): Promise<void> {
    await this.db.close()
  }

  // Health check
  async health(): Promise<{ status: 'ok' | 'error'; database: boolean; error?: string }> {
    try {
      await this.db.testConnection()
      return { status: 'ok', database: true }
    } catch (error) {
      return { 
        status: 'error', 
        database: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }
}