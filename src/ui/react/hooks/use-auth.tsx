import * as React from 'react'
import { User, Session } from '../../../types'

export interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  error: string | null
  
  // Auth actions
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, name?: string) => Promise<void>
  signOut: () => Promise<void>
  oauthSignIn: (provider: string) => Promise<void>
  resetPassword: (email: string) => Promise<void>
  
  // Utility functions
  clearError: () => void
  refreshSession: () => Promise<void>
}

const AuthContext = React.createContext<AuthContextType | null>(null)

export interface AuthProviderProps {
  children: React.ReactNode
  
  // SDK instance or auth functions
  onSignIn: (email: string, password: string) => Promise<{ success: boolean; user?: User; session?: Session; error?: string }>
  onSignUp: (email: string, password: string, name?: string) => Promise<{ success: boolean; user?: User; error?: string; requiresVerification?: boolean }>
  onSignOut: () => Promise<{ success: boolean }>
  onOAuthSignIn: (provider: string) => Promise<void>
  onPasswordReset: (email: string) => Promise<void>
  onGetSession?: () => Promise<{ user: User; session: Session } | null>
  
  // Initial state
  initialUser?: User | null
  initialSession?: Session | null
}

export function AuthProvider({
  children,
  onSignIn,
  onSignUp,
  onSignOut,
  onOAuthSignIn,
  onPasswordReset,
  onGetSession,
  initialUser = null,
  initialSession = null
}: AuthProviderProps) {
  const [user, setUser] = React.useState<User | null>(initialUser)
  const [session, setSession] = React.useState<Session | null>(initialSession)
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const clearError = React.useCallback(() => {
    setError(null)
  }, [])

  const signIn = React.useCallback(async (email: string, password: string) => {
    setLoading(true)
    setError(null)
    
    try {
      const result = await onSignIn(email, password)
      
      if (result.success && result.user) {
        setUser(result.user)
        setSession(result.session || null)
      } else {
        setError(result.error || 'Sign in failed')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign in failed')
    } finally {
      setLoading(false)
    }
  }, [onSignIn])

  const signUp = React.useCallback(async (email: string, password: string, name?: string) => {
    setLoading(true)
    setError(null)
    
    try {
      const result = await onSignUp(email, password, name)
      
      if (result.success && result.user) {
        if (result.requiresVerification) {
          setError('Please check your email to verify your account')
        } else {
          setUser(result.user)
        }
      } else {
        setError(result.error || 'Sign up failed')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign up failed')
    } finally {
      setLoading(false)
    }
  }, [onSignUp])

  const signOut = React.useCallback(async () => {
    setLoading(true)
    setError(null)
    
    try {
      await onSignOut()
      setUser(null)
      setSession(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign out failed')
    } finally {
      setLoading(false)
    }
  }, [onSignOut])

  const oauthSignIn = React.useCallback(async (provider: string) => {
    setLoading(true)
    setError(null)
    
    try {
      await onOAuthSignIn(provider)
      // OAuth redirect will handle the rest
    } catch (err) {
      setError(err instanceof Error ? err.message : 'OAuth sign in failed')
      setLoading(false)
    }
  }, [onOAuthSignIn])

  const resetPassword = React.useCallback(async (email: string) => {
    setLoading(true)
    setError(null)
    
    try {
      await onPasswordReset(email)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Password reset failed')
    } finally {
      setLoading(false)
    }
  }, [onPasswordReset])

  const refreshSession = React.useCallback(async () => {
    if (!onGetSession) return
    
    try {
      const sessionData = await onGetSession()
      if (sessionData) {
        setUser(sessionData.user)
        setSession(sessionData.session)
      } else {
        setUser(null)
        setSession(null)
      }
    } catch (err) {
      setUser(null)
      setSession(null)
    }
  }, [onGetSession])

  // Auto-refresh session on mount
  React.useEffect(() => {
    if (onGetSession && !user) {
      refreshSession()
    }
  }, [onGetSession, user, refreshSession])

  const contextValue: AuthContextType = {
    user,
    session,
    loading,
    error,
    signIn,
    signUp,
    signOut,
    oauthSignIn,
    resetPassword,
    clearError,
    refreshSession
  }

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextType {
  const context = React.useContext(AuthContext)
  
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  
  return context
}

// Higher-order component for protecting routes
export interface WithAuthProps {
  fallback?: React.ComponentType
  redirect?: boolean
}

export function withAuth<P extends object>(
  Component: React.ComponentType<P>,
  options: WithAuthProps = {}
) {
  const WrappedComponent = React.forwardRef<any, P>((props, ref) => {
    const { user, loading } = useAuth()
    const { fallback: Fallback, redirect = false } = options

    if (loading) {
      return (
        <div className="flex items-center justify-center p-4">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-current border-t-transparent" />
        </div>
      )
    }

    if (!user) {
      if (redirect && typeof window !== 'undefined') {
        window.location.href = '/login'
        return null
      }
      
      if (Fallback) {
        return <Fallback />
      }
      
      return (
        <div className="flex items-center justify-center p-4">
          <div className="text-center">
            <h2 className="text-lg font-semibold">Authentication Required</h2>
            <p className="text-muted-foreground">Please sign in to access this page.</p>
          </div>
        </div>
      )
    }

    return <Component {...props} ref={ref} />
  })

  WrappedComponent.displayName = `withAuth(${Component.displayName || Component.name})`
  
  return WrappedComponent
}

// Hook for conditional rendering based on auth state
export function useAuthGuard() {
  const { user, loading } = useAuth()
  
  return {
    isAuthenticated: !!user,
    isLoading: loading,
    user
  }
}