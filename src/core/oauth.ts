import { eq, and } from 'drizzle-orm'
import { Database } from '../db/database'
import { schema } from '../db/schema'
import { 
  User, 
  Account,
  SignInResult, 
  OAuthProvider,
  AuthError, 
  ValidationError,
  DatabaseError 
} from '../types'
import { 
  generateUserId, 
  generateAccountId,
  generateId,
  buildURL 
} from '../utils'

interface OAuthProfile {
  id: string
  email?: string
  name?: string
  image?: string
  username?: string
}

interface OAuthTokens {
  access_token: string
  refresh_token?: string
  expires_in?: number
  token_type?: string
  scope?: string
  id_token?: string
}

export class OAuthManager {
  private providers: Map<string, OAuthProvider> = new Map()

  constructor(private db: Database) {
    this.initializeDefaultProviders()
  }

  private initializeDefaultProviders(): void {
    // Google OAuth provider
    this.providers.set('google', {
      id: 'google',
      name: 'Google',
      authorizationUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
      tokenUrl: 'https://oauth2.googleapis.com/token',
      userInfoUrl: 'https://www.googleapis.com/oauth2/v2/userinfo',
      clientId: '',
      clientSecret: '',
      scope: 'openid email profile'
    })

    // GitHub OAuth provider
    this.providers.set('github', {
      id: 'github',
      name: 'GitHub',
      authorizationUrl: 'https://github.com/login/oauth/authorize',
      tokenUrl: 'https://github.com/login/oauth/access_token',
      userInfoUrl: 'https://api.github.com/user',
      clientId: '',
      clientSecret: '',
      scope: 'user:email'
    })

    // Facebook OAuth provider
    this.providers.set('facebook', {
      id: 'facebook',
      name: 'Facebook',
      authorizationUrl: 'https://www.facebook.com/v18.0/dialog/oauth',
      tokenUrl: 'https://graph.facebook.com/v18.0/oauth/access_token',
      userInfoUrl: 'https://graph.facebook.com/v18.0/me',
      clientId: '',
      clientSecret: '',
      scope: 'email'
    })
  }

  configureProvider(providerId: string, config: { clientId: string; clientSecret: string; scope?: string }): void {
    const provider = this.providers.get(providerId)
    if (!provider) {
      throw new ValidationError(`Unknown OAuth provider: ${providerId}`)
    }

    provider.clientId = config.clientId
    provider.clientSecret = config.clientSecret
    if (config.scope) {
      provider.scope = config.scope
    }
  }

  addCustomProvider(provider: OAuthProvider): void {
    this.providers.set(provider.id, provider)
  }

  generateAuthorizationUrl(providerId: string, redirectUri: string, state: string): string {
    const provider = this.providers.get(providerId)
    if (!provider) {
      throw new ValidationError(`Unknown OAuth provider: ${providerId}`)
    }

    if (!provider.clientId) {
      throw new ValidationError(`OAuth provider ${providerId} is not configured`)
    }

    const params: Record<string, string> = {
      client_id: provider.clientId,
      redirect_uri: redirectUri,
      scope: provider.scope,
      response_type: 'code',
      state
    }

    // Provider-specific parameters
    if (providerId === 'google') {
      params.access_type = 'offline'
      params.prompt = 'consent'
    }

    return buildURL(provider.authorizationUrl, '', params)
  }

  async handleCallback(
    providerId: string, 
    code: string, 
    redirectUri: string,
    state?: string
  ): Promise<SignInResult> {
    try {
      const provider = this.providers.get(providerId)
      if (!provider) {
        return {
          success: false,
          error: 'Unknown OAuth provider'
        }
      }

      // Exchange code for tokens
      const tokens = await this.exchangeCodeForTokens(provider, code, redirectUri)
      
      // Get user profile
      const profile = await this.getUserProfile(provider, tokens.access_token)
      
      if (!profile.email) {
        return {
          success: false,
          error: 'Email not provided by OAuth provider'
        }
      }

      // Find or create user
      const result = await this.findOrCreateUser(profile, provider.id, tokens)
      
      return result

    } catch (error) {
      if (error instanceof AuthError) {
        return {
          success: false,
          error: error.message
        }
      }

      return {
        success: false,
        error: 'OAuth authentication failed'
      }
    }
  }

  private async exchangeCodeForTokens(provider: OAuthProvider, code: string, redirectUri: string): Promise<OAuthTokens> {
    const params = new URLSearchParams({
      client_id: provider.clientId,
      client_secret: provider.clientSecret,
      code,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code'
    })

    const response = await fetch(provider.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      },
      body: params.toString()
    })

    if (!response.ok) {
      throw new AuthError('Failed to exchange authorization code for tokens', 'OAUTH_TOKEN_ERROR')
    }

    const tokens = await response.json() as OAuthTokens
    
    if (!tokens.access_token) {
      throw new AuthError('No access token received from OAuth provider', 'OAUTH_TOKEN_ERROR')
    }

    return tokens
  }

  private async getUserProfile(provider: OAuthProvider, accessToken: string): Promise<OAuthProfile> {
    let url = provider.userInfoUrl
    let headers: Record<string, string> = {
      'Authorization': `Bearer ${accessToken}`
    }

    // Provider-specific adjustments
    if (provider.id === 'facebook') {
      url = `${provider.userInfoUrl}?fields=id,email,name,picture`
    } else if (provider.id === 'github') {
      headers['User-Agent'] = 'easy-auth-sdk'
    }

    const response = await fetch(url, { headers })

    if (!response.ok) {
      throw new AuthError('Failed to fetch user profile from OAuth provider', 'OAUTH_PROFILE_ERROR')
    }

    const data = await response.json()

    // Normalize profile data across providers
    let profile: OAuthProfile = {
      id: String(data.id),
      email: data.email,
      name: data.name || data.login, // GitHub uses 'login' instead of 'name'
    }

    // Handle profile images
    if (provider.id === 'google') {
      profile.image = data.picture
    } else if (provider.id === 'github') {
      profile.image = data.avatar_url
    } else if (provider.id === 'facebook') {
      profile.image = data.picture?.data?.url
    }

    // For GitHub, we need to fetch the email separately if it's not public
    if (provider.id === 'github' && !profile.email) {
      const emailResponse = await fetch('https://api.github.com/user/emails', { headers })
      if (emailResponse.ok) {
        const emails = await emailResponse.json()
        const primaryEmail = emails.find((email: any) => email.primary)
        if (primaryEmail) {
          profile.email = primaryEmail.email
        }
      }
    }

    return profile
  }

  private async findOrCreateUser(profile: OAuthProfile, providerId: string, tokens: OAuthTokens): Promise<SignInResult> {
    try {
      // Look for existing account
      const [existingAccount] = await this.db.db
        .select()
        .from(schema.accounts)
        .innerJoin(schema.users, eq(schema.accounts.userId, schema.users.id))
        .where(
          and(
            eq(schema.accounts.provider, providerId),
            eq(schema.accounts.providerAccountId, profile.id)
          )
        )
        .limit(1)

      if (existingAccount) {
        // Update tokens
        await this.updateAccountTokens(existingAccount.accounts.id, tokens)

        const user: User = {
          id: existingAccount.users.id,
          email: existingAccount.users.email,
          name: existingAccount.users.name || undefined,
          emailVerified: existingAccount.users.emailVerified,
          image: existingAccount.users.image || undefined,
          createdAt: existingAccount.users.createdAt,
          updatedAt: existingAccount.users.updatedAt
        }

        return {
          success: true,
          user
        }
      }

      // Look for existing user by email (account linking)
      let user: any = null
      if (profile.email) {
        const [existingUser] = await this.db.db
          .select()
          .from(schema.users)
          .where(eq(schema.users.email, profile.email.toLowerCase()))
          .limit(1)

        if (existingUser) {
          user = existingUser
        }
      }

      // Create new user if needed
      if (!user && profile.email) {
        const userId = generateUserId()
        const now = new Date()

        const [newUser] = await this.db.db
          .insert(schema.users)
          .values({
            id: userId,
            email: profile.email.toLowerCase(),
            name: profile.name || null,
            emailVerified: true, // OAuth emails are considered verified
            image: profile.image || null,
            createdAt: now,
            updatedAt: now
          })
          .returning()

        user = newUser
      }

      if (!user) {
        return {
          success: false,
          error: 'Unable to create user account'
        }
      }

      // Create account link
      await this.createAccountLink(user.id, providerId, profile.id, tokens)

      const resultUser: User = {
        id: user.id,
        email: user.email,
        name: user.name || undefined,
        emailVerified: user.emailVerified,
        image: user.image || undefined,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }

      return {
        success: true,
        user: resultUser
      }

    } catch (error) {
      throw new DatabaseError(
        `Failed to find or create user: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }

  private async createAccountLink(userId: string, providerId: string, providerAccountId: string, tokens: OAuthTokens): Promise<void> {
    const accountId = generateAccountId()
    const now = new Date()

    await this.db.db
      .insert(schema.accounts)
      .values({
        id: accountId,
        userId,
        provider: providerId,
        providerAccountId,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token || null,
        expiresAt: tokens.expires_in ? Math.floor(Date.now() / 1000) + tokens.expires_in : null,
        tokenType: tokens.token_type || 'Bearer',
        scope: tokens.scope || null,
        idToken: tokens.id_token || null,
        createdAt: now,
        updatedAt: now
      })
  }

  private async updateAccountTokens(accountId: string, tokens: OAuthTokens): Promise<void> {
    await this.db.db
      .update(schema.accounts)
      .set({
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token || null,
        expiresAt: tokens.expires_in ? Math.floor(Date.now() / 1000) + tokens.expires_in : null,
        updatedAt: new Date()
      })
      .where(eq(schema.accounts.id, accountId))
  }

  getProvider(providerId: string): OAuthProvider | undefined {
    return this.providers.get(providerId)
  }

  getConfiguredProviders(): OAuthProvider[] {
    return Array.from(this.providers.values()).filter(provider => provider.clientId && provider.clientSecret)
  }
}