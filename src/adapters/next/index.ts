import { NextRequest, NextResponse } from 'next/server'
import { EasyAuth } from '../../core/easy-auth'
import { AuthConfig, User, Session } from '../../types'
import { generateId } from '../../utils'

export interface NextAuthConfig extends AuthConfig {
  basePath?: string
  redirects?: {
    signIn?: string
    signOut?: string
    error?: string
  }
}

export interface AuthHandlerOptions {
  auth: EasyAuth
  config: NextAuthConfig
}

export class NextAuthAdapter {
  private auth: EasyAuth
  private config: NextAuthConfig
  private basePath: string

  constructor(options: AuthHandlerOptions) {
    this.auth = options.auth
    this.config = options.config
    this.basePath = options.config.basePath || '/api/auth'
  }

  /**
   * Main route handler for Next.js API routes
   * Use this in app/api/auth/[...auth]/route.ts
   */
  handler() {
    return {
      GET: (request: NextRequest) => this.handleRequest(request),
      POST: (request: NextRequest) => this.handleRequest(request)
    }
  }

  private async handleRequest(request: NextRequest): Promise<NextResponse> {
    try {
      const url = new URL(request.url)
      const pathParts = url.pathname.replace(this.basePath, '').split('/').filter(Boolean)
      const action = pathParts[0]
      const provider = pathParts[1]

      switch (action) {
        case 'signin':
          return this.handleSignIn(request)
        
        case 'signup':
          return this.handleSignUp(request)
        
        case 'signout':
          return this.handleSignOut(request)
        
        case 'session':
          return this.handleGetSession(request)
        
        case 'oauth':
          if (request.method === 'GET') {
            return this.handleOAuthRedirect(request, provider)
          } else {
            return this.handleOAuthCallback(request, provider)
          }
        
        case 'reset-password':
          return this.handlePasswordReset(request)
        
        case 'providers':
          return this.handleGetProviders()
        
        default:
          return NextResponse.json({ error: 'Not found' }, { status: 404 })
      }
    } catch (error) {
      console.error('Auth handler error:', error)
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    }
  }

  private async handleSignIn(request: NextRequest): Promise<NextResponse> {
    if (request.method !== 'POST') {
      return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
    }

    try {
      const { email, password } = await request.json()
      const result = await this.auth.signIn(email, password)

      if (result.success && result.user && result.sessionCookie) {
        const response = NextResponse.json({
          success: true,
          user: result.user,
          session: result.session
        })
        
        response.headers.set('Set-Cookie', result.sessionCookie)
        return response
      }

      return NextResponse.json({
        success: false,
        error: result.error || 'Sign in failed'
      }, { status: 401 })

    } catch (error) {
      return NextResponse.json({
        success: false,
        error: 'Invalid request'
      }, { status: 400 })
    }
  }

  private async handleSignUp(request: NextRequest): Promise<NextResponse> {
    if (request.method !== 'POST') {
      return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
    }

    try {
      const { email, password, name } = await request.json()
      const result = await this.auth.signUp(email, password, name)

      return NextResponse.json(result)

    } catch (error) {
      return NextResponse.json({
        success: false,
        error: 'Invalid request'
      }, { status: 400 })
    }
  }

  private async handleSignOut(request: NextRequest): Promise<NextResponse> {
    if (request.method !== 'POST') {
      return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
    }

    try {
      const sessionToken = this.getSessionTokenFromRequest(request)
      
      if (sessionToken) {
        const result = await this.auth.signOut(sessionToken)
        
        const response = NextResponse.json({ success: result.success })
        response.headers.set('Set-Cookie', result.logoutCookie)
        return response
      }

      return NextResponse.json({ success: true })

    } catch (error) {
      return NextResponse.json({
        success: false,
        error: 'Sign out failed'
      }, { status: 500 })
    }
  }

  private async handleGetSession(request: NextRequest): Promise<NextResponse> {
    if (request.method !== 'GET') {
      return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
    }

    try {
      const sessionToken = this.getSessionTokenFromRequest(request)
      
      if (!sessionToken) {
        return NextResponse.json({ user: null, session: null })
      }

      const sessionData = await this.auth.getSession(sessionToken)
      
      if (sessionData) {
        return NextResponse.json({
          user: sessionData.user,
          session: sessionData.session
        })
      }

      return NextResponse.json({ user: null, session: null })

    } catch (error) {
      return NextResponse.json({ user: null, session: null })
    }
  }

  private async handleOAuthRedirect(request: NextRequest, provider: string): Promise<NextResponse> {
    try {
      const url = new URL(request.url)
      const redirectUri = `${url.origin}${this.basePath}/oauth/${provider}/callback`
      const state = generateId()
      
      // Store state in session/cookie for validation
      const authUrl = this.auth.getOAuthURL(provider, redirectUri, state)
      
      const response = NextResponse.redirect(authUrl)
      
      // Set state cookie for validation
      response.cookies.set('oauth-state', state, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 600 // 10 minutes
      })
      
      return response

    } catch (error) {
      const errorUrl = this.config.redirects?.error || '/'
      return NextResponse.redirect(new URL(errorUrl, request.url))
    }
  }

  private async handleOAuthCallback(request: NextRequest, provider: string): Promise<NextResponse> {
    try {
      const url = new URL(request.url)
      const code = url.searchParams.get('code')
      const state = url.searchParams.get('state')
      const storedState = request.cookies.get('oauth-state')?.value

      if (!code) {
        throw new Error('No authorization code received')
      }

      if (!state || state !== storedState) {
        throw new Error('Invalid state parameter')
      }

      const redirectUri = `${url.origin}${this.basePath}/oauth/${provider}/callback`
      const result = await this.auth.handleOAuthCallback(provider, code, redirectUri, state)

      if (result.success && result.user && result.sessionCookie) {
        const redirectUrl = this.config.redirects?.signIn || '/'
        const response = NextResponse.redirect(new URL(redirectUrl, request.url))
        
        response.headers.set('Set-Cookie', result.sessionCookie)
        
        // Clear state cookie
        response.cookies.delete('oauth-state')
        
        return response
      }

      throw new Error(result.error || 'OAuth authentication failed')

    } catch (error) {
      console.error('OAuth callback error:', error)
      const errorUrl = this.config.redirects?.error || '/'
      return NextResponse.redirect(new URL(errorUrl, request.url))
    }
  }

  private async handlePasswordReset(request: NextRequest): Promise<NextResponse> {
    if (request.method !== 'POST') {
      return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
    }

    try {
      const { email } = await request.json()
      const token = await this.auth.requestPasswordReset(email)

      // Always return success for security (don't reveal if email exists)
      return NextResponse.json({ success: true })

    } catch (error) {
      return NextResponse.json({
        success: false,
        error: 'Password reset failed'
      }, { status: 500 })
    }
  }

  private async handleGetProviders(): Promise<NextResponse> {
    try {
      const providers = this.auth.getProviders()
      return NextResponse.json({ providers })
    } catch (error) {
      return NextResponse.json({ providers: [] })
    }
  }

  private getSessionTokenFromRequest(request: NextRequest): string | null {
    // Try Authorization header first
    const authHeader = request.headers.get('authorization')
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7)
    }

    // Try cookie
    const cookieHeader = request.headers.get('cookie')
    if (cookieHeader) {
      return this.auth.getSessionFromCookies(cookieHeader)
    }

    return null
  }

  /**
   * Middleware helper for protecting routes
   */
  middleware() {
    return async (request: NextRequest) => {
      // Skip auth routes
      if (request.nextUrl.pathname.startsWith(this.basePath)) {
        return NextResponse.next()
      }

      const sessionToken = this.getSessionTokenFromRequest(request)
      
      if (!sessionToken) {
        const signInUrl = new URL(this.config.redirects?.signIn || '/login', request.url)
        signInUrl.searchParams.set('callbackUrl', request.url)
        return NextResponse.redirect(signInUrl)
      }

      try {
        const sessionData = await this.auth.getSession(sessionToken)
        
        if (!sessionData) {
          const signInUrl = new URL(this.config.redirects?.signIn || '/login', request.url)
          signInUrl.searchParams.set('callbackUrl', request.url)
          return NextResponse.redirect(signInUrl)
        }

        // Add user info to request headers (for access in components)
        const response = NextResponse.next()
        response.headers.set('x-user-id', sessionData.user.id)
        response.headers.set('x-user-email', sessionData.user.email)
        
        return response

      } catch (error) {
        const signInUrl = new URL(this.config.redirects?.signIn || '/login', request.url)
        signInUrl.searchParams.set('callbackUrl', request.url)
        return NextResponse.redirect(signInUrl)
      }
    }
  }

  /**
   * Server-side helper to get session in Server Components/API routes
   */
  async getServerSession(request: NextRequest): Promise<{ user: User; session: Session } | null> {
    const sessionToken = this.getSessionTokenFromRequest(request)
    
    if (!sessionToken) {
      return null
    }

    try {
      return await this.auth.getSession(sessionToken)
    } catch {
      return null
    }
  }
}

// Helper function to create Next.js auth handlers
export function createAuthHandlers(config: NextAuthConfig) {
  const auth = new EasyAuth(config)
  const adapter = new NextAuthAdapter({ auth, config })
  
  return {
    auth,
    adapter,
    handlers: adapter.handler(),
    middleware: adapter.middleware(),
    getServerSession: (request: NextRequest) => adapter.getServerSession(request)
  }
}