import { NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import { EasyAuth } from '../../core/easy-auth'
import { User, Session, AuthConfig } from '../../types'

// Server-side utilities for Next.js App Router

export interface ServerAuthConfig extends AuthConfig {
  basePath?: string
}

let authInstance: EasyAuth | null = null

export function initializeServerAuth(config: ServerAuthConfig): EasyAuth {
  if (!authInstance) {
    authInstance = new EasyAuth(config)
  }
  return authInstance
}

export function getServerAuth(): EasyAuth {
  if (!authInstance) {
    throw new Error('Server auth not initialized. Call initializeServerAuth() first.')
  }
  return authInstance
}

/**
 * Get the current user session on the server side
 * Use this in Server Components, API routes, etc.
 */
export async function getServerSession(): Promise<{ user: User; session: Session } | null> {
  try {
    const auth = getServerAuth()
    const cookieStore = cookies()
    
    // Get session token from cookies
    const sessionToken = auth.getSessionFromCookies(
      cookieStore.toString()
    )
    
    if (!sessionToken) {
      return null
    }

    return await auth.getSession(sessionToken)
  } catch (error) {
    console.error('Failed to get server session:', error)
    return null
  }
}

/**
 * Get user from request (for API routes)
 */
export async function getUserFromRequest(request: NextRequest): Promise<User | null> {
  try {
    const auth = getServerAuth()
    
    // Try Authorization header first
    const authHeader = request.headers.get('authorization')
    let sessionToken: string | null = null
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      sessionToken = authHeader.substring(7)
    } else {
      // Try cookie
      const cookieHeader = request.headers.get('cookie')
      if (cookieHeader) {
        sessionToken = auth.getSessionFromCookies(cookieHeader)
      }
    }
    
    if (!sessionToken) {
      return null
    }

    const sessionData = await auth.getSession(sessionToken)
    return sessionData?.user || null
  } catch (error) {
    console.error('Failed to get user from request:', error)
    return null
  }
}

/**
 * Require authentication in API routes
 * Throws an error if user is not authenticated
 */
export async function requireAuth(request: NextRequest): Promise<User> {
  const user = await getUserFromRequest(request)
  
  if (!user) {
    throw new Error('Authentication required')
  }
  
  return user
}

/**
 * Create a protected API route handler
 */
export function withAuth<T extends unknown[]>(
  handler: (user: User, ...args: T) => Promise<Response> | Response
) {
  return async (request: NextRequest, ...args: T): Promise<Response> => {
    try {
      const user = await requireAuth(request)
      return await handler(user, ...args)
    } catch (error) {
      return Response.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
  }
}

/**
 * Server action wrapper for authentication
 * Use this to protect Server Actions
 */
export function withServerAuth<T extends unknown[], R>(
  action: (user: User, ...args: T) => Promise<R> | R
) {
  return async (...args: T): Promise<R> => {
    const sessionData = await getServerSession()
    
    if (!sessionData) {
      throw new Error('Authentication required')
    }
    
    return await action(sessionData.user, ...args)
  }
}

/**
 * Redirect helper for unauthenticated users
 */
export function redirectToLogin(callbackUrl?: string, basePath = '/login'): never {
  const url = new URL(basePath, process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000')
  
  if (callbackUrl) {
    url.searchParams.set('callbackUrl', callbackUrl)
  }
  
  throw new Error(`REDIRECT:${url.toString()}`)
}

/**
 * Check if user has specific permissions (extend as needed)
 */
export async function hasPermission(
  permission: string,
  user?: User
): Promise<boolean> {
  const currentUser = user || (await getServerSession())?.user
  
  if (!currentUser) {
    return false
  }
  
  // Implement your permission logic here
  // This is a basic example - extend based on your needs
  return true
}

/**
 * Get session with error handling for pages
 */
export async function getSessionOrRedirect(redirectTo = '/login'): Promise<{ user: User; session: Session }> {
  const sessionData = await getServerSession()
  
  if (!sessionData) {
    redirectToLogin(undefined, redirectTo)
  }
  
  return sessionData!
}

/**
 * Utility to check authentication status without throwing
 */
export async function checkAuth(): Promise<{
  isAuthenticated: boolean
  user: User | null
  session: Session | null
}> {
  try {
    const sessionData = await getServerSession()
    
    return {
      isAuthenticated: !!sessionData,
      user: sessionData?.user || null,
      session: sessionData?.session || null
    }
  } catch (error) {
    return {
      isAuthenticated: false,
      user: null,
      session: null
    }
  }
}

/**
 * Middleware helper for specific route patterns
 */
export interface MiddlewareOptions {
  protectedPaths?: string[]
  publicPaths?: string[]
  loginPath?: string
  afterSignInPath?: string
}

export function createAuthMiddleware(
  config: ServerAuthConfig,
  options: MiddlewareOptions = {}
) {
  const {
    protectedPaths = [],
    publicPaths = ['/login', '/signup', '/api/auth'],
    loginPath = '/login',
    afterSignInPath = '/'
  } = options

  return async (request: NextRequest) => {
    const { pathname } = request.nextUrl

    // Skip middleware for public paths
    if (publicPaths.some(path => pathname.startsWith(path))) {
      return
    }

    // Check if path needs protection
    const needsAuth = protectedPaths.length === 0 || 
      protectedPaths.some(path => pathname.startsWith(path))

    if (!needsAuth) {
      return
    }

    // Initialize auth if needed
    if (!authInstance) {
      initializeServerAuth(config)
    }

    // Check authentication
    const user = await getUserFromRequest(request)
    
    if (!user) {
      const loginUrl = new URL(loginPath, request.url)
      loginUrl.searchParams.set('callbackUrl', request.url)
      
      return Response.redirect(loginUrl)
    }

    // User is authenticated, continue
    return
  }
}

// Export types for convenience
export type { User, Session, AuthConfig }