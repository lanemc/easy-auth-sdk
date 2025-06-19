import * as React from 'react'
import { User, Session } from '../../types'

interface AuthSession {
  user: User | null
  session: Session | null
  loading: boolean
  error: string | null
}

interface NextAuthContextType extends AuthSession {
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, name?: string) => Promise<void>
  signOut: () => Promise<void>
  oauthSignIn: (provider: string) => Promise<void>
  resetPassword: (email: string) => Promise<void>
  refreshSession: () => Promise<void>
  clearError: () => void
}

const NextAuthContext = React.createContext<NextAuthContextType | null>(null)

export interface NextAuthProviderProps {
  children: React.ReactNode
  basePath?: string
  initialSession?: AuthSession
}

export function NextAuthProvider({ 
  children, 
  basePath = '/api/auth',
  initialSession 
}: NextAuthProviderProps) {
  const [session, setSession] = React.useState<AuthSession>(
    initialSession || { user: null, session: null, loading: true, error: null }
  )

  const clearError = React.useCallback(() => {
    setSession(prev => ({ ...prev, error: null }))
  }, [])

  const refreshSession = React.useCallback(async () => {
    try {
      const response = await fetch(`${basePath}/session`)
      const data = await response.json()
      
      setSession(prev => ({
        ...prev,
        user: data.user || null,
        session: data.session || null,
        loading: false,
        error: null
      }))
    } catch (error) {
      setSession(prev => ({
        ...prev,
        user: null,
        session: null,
        loading: false,
        error: 'Failed to load session'
      }))
    }
  }, [basePath])

  const signIn = React.useCallback(async (email: string, password: string) => {
    setSession(prev => ({ ...prev, loading: true, error: null }))
    
    try {
      const response = await fetch(`${basePath}/signin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })
      
      const data = await response.json()
      
      if (data.success) {
        setSession(prev => ({
          ...prev,
          user: data.user,
          session: data.session,
          loading: false,
          error: null
        }))
      } else {
        setSession(prev => ({
          ...prev,
          loading: false,
          error: data.error || 'Sign in failed'
        }))
      }
    } catch (error) {
      setSession(prev => ({
        ...prev,
        loading: false,
        error: 'Network error during sign in'
      }))
    }
  }, [basePath])

  const signUp = React.useCallback(async (email: string, password: string, name?: string) => {
    setSession(prev => ({ ...prev, loading: true, error: null }))
    
    try {
      const response = await fetch(`${basePath}/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name })
      })
      
      const data = await response.json()
      
      if (data.success) {
        if (data.requiresVerification) {
          setSession(prev => ({
            ...prev,
            loading: false,
            error: 'Please check your email to verify your account'
          }))
        } else {
          setSession(prev => ({
            ...prev,
            user: data.user,
            loading: false,
            error: null
          }))
        }
      } else {
        setSession(prev => ({
          ...prev,
          loading: false,
          error: data.error || 'Sign up failed'
        }))
      }
    } catch (error) {
      setSession(prev => ({
        ...prev,
        loading: false,
        error: 'Network error during sign up'
      }))
    }
  }, [basePath])

  const signOut = React.useCallback(async () => {
    setSession(prev => ({ ...prev, loading: true, error: null }))
    
    try {
      await fetch(`${basePath}/signout`, { method: 'POST' })
      
      setSession({
        user: null,
        session: null,
        loading: false,
        error: null
      })
    } catch (error) {
      setSession(prev => ({
        ...prev,
        loading: false,
        error: 'Sign out failed'
      }))
    }
  }, [basePath])

  const oauthSignIn = React.useCallback(async (provider: string) => {
    setSession(prev => ({ ...prev, loading: true, error: null }))
    
    try {
      // Redirect to OAuth provider
      window.location.href = `${basePath}/oauth/${provider}`
    } catch (error) {
      setSession(prev => ({
        ...prev,
        loading: false,
        error: 'OAuth sign in failed'
      }))
    }
  }, [basePath])

  const resetPassword = React.useCallback(async (email: string) => {
    setSession(prev => ({ ...prev, loading: true, error: null }))
    
    try {
      const response = await fetch(`${basePath}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })
      
      const data = await response.json()
      
      setSession(prev => ({
        ...prev,
        loading: false,
        error: data.success ? null : 'Password reset failed'
      }))
    } catch (error) {
      setSession(prev => ({
        ...prev,
        loading: false,
        error: 'Network error during password reset'
      }))
    }
  }, [basePath])

  // Initialize session on mount
  React.useEffect(() => {
    if (!initialSession) {
      refreshSession()
    }
  }, [initialSession, refreshSession])

  const contextValue: NextAuthContextType = {
    ...session,
    signIn,
    signUp,
    signOut,
    oauthSignIn,
    resetPassword,
    refreshSession,
    clearError
  }

  return (
    <NextAuthContext.Provider value={contextValue}>
      {children}
    </NextAuthContext.Provider>
  )
}

export function useNextAuth(): NextAuthContextType {
  const context = React.useContext(NextAuthContext)
  
  if (!context) {
    throw new Error('useNextAuth must be used within a NextAuthProvider')
  }
  
  return context
}

// Higher-order component for protecting pages
export interface WithNextAuthProps {
  redirectTo?: string
  fallback?: React.ComponentType
}

export function withNextAuth<P extends object>(
  Component: React.ComponentType<P>,
  options: WithNextAuthProps = {}
) {
  const WrappedComponent = React.forwardRef<any, P>((props, ref) => {
    const { user, loading } = useNextAuth()
    const { redirectTo = '/login', fallback: Fallback } = options

    React.useEffect(() => {
      if (!loading && !user && redirectTo) {
        window.location.href = redirectTo
      }
    }, [loading, user, redirectTo])

    if (loading) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-current border-t-transparent" />
        </div>
      )
    }

    if (!user) {
      if (Fallback) {
        return <Fallback />
      }
      
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h2 className="text-lg font-semibold">Authentication Required</h2>
            <p className="text-muted-foreground">Redirecting to sign in...</p>
          </div>
        </div>
      )
    }

    return <Component {...props as any} ref={ref} />
  })

  WrappedComponent.displayName = `withNextAuth(${Component.displayName || Component.name})`
  
  return WrappedComponent
}

// Hook for getting providers
export function useAuthProviders(basePath = '/api/auth') {
  const [providers, setProviders] = React.useState<Array<{ id: string; name: string }>>([])
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    fetch(`${basePath}/providers`)
      .then(res => res.json())
      .then(data => {
        setProviders(data.providers || [])
        setLoading(false)
      })
      .catch(() => {
        setProviders([])
        setLoading(false)
      })
  }, [basePath])

  return { providers, loading }
}