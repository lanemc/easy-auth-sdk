import * as React from 'react'
import { LoginForm } from './login-form'
import { SignUpForm } from './signup-form'
import { PasswordResetForm } from './password-reset-form'
import { cn } from '../utils'

export type AuthView = 'signin' | 'signup' | 'reset-password'

export interface AuthComponentProps {
  // Callbacks
  onSignIn: (email: string, password: string) => Promise<void> | void
  onSignUp: (email: string, password: string, name?: string) => Promise<void> | void
  onOAuthSignIn?: (provider: string) => Promise<void> | void
  onPasswordReset?: (email: string) => Promise<void> | void
  
  // Configuration
  providers?: Array<{ id: string; name: string }>
  initialView?: AuthView
  allowViewChange?: boolean
  
  // State
  loading?: boolean
  error?: string
  
  // Customization
  texts?: {
    signIn?: {
      title?: string
      description?: string
    }
    signUp?: {
      title?: string
      description?: string
    }
    resetPassword?: {
      title?: string
      description?: string
    }
  }
  
  // Features
  requireName?: boolean
  showPasswordReset?: boolean
  
  // Styling
  className?: string
}

const AuthComponent = React.forwardRef<HTMLDivElement, AuthComponentProps>(
  ({
    onSignIn,
    onSignUp,
    onOAuthSignIn,
    onPasswordReset,
    providers = [],
    initialView = 'signin',
    allowViewChange = true,
    loading = false,
    error,
    texts = {},
    requireName = false,
    showPasswordReset = true,
    className,
    ...props
  }, ref) => {
    const [currentView, setCurrentView] = React.useState<AuthView>(initialView)
    const [passwordResetSuccess, setPasswordResetSuccess] = React.useState(false)

    const handleSignIn = async (email: string, password: string) => {
      setPasswordResetSuccess(false)
      await onSignIn(email, password)
    }

    const handleSignUp = async (email: string, password: string, name?: string) => {
      setPasswordResetSuccess(false)
      await onSignUp(email, password, name)
    }

    const handleOAuth = async (provider: string) => {
      setPasswordResetSuccess(false)
      if (onOAuthSignIn) {
        await onOAuthSignIn(provider)
      }
    }

    const handlePasswordReset = async (email: string) => {
      if (onPasswordReset) {
        await onPasswordReset(email)
        setPasswordResetSuccess(true)
      }
    }

    const switchToSignUp = () => {
      if (allowViewChange) {
        setCurrentView('signup')
        setPasswordResetSuccess(false)
      }
    }

    const switchToSignIn = () => {
      if (allowViewChange) {
        setCurrentView('signin')
        setPasswordResetSuccess(false)
      }
    }

    const switchToPasswordReset = () => {
      if (allowViewChange && showPasswordReset) {
        setCurrentView('reset-password')
        setPasswordResetSuccess(false)
      }
    }

    return (
      <div ref={ref} className={cn('w-full', className)} {...props}>
        {currentView === 'signin' && (
          <LoginForm
            onSubmit={handleSignIn}
            onOAuthSignIn={handleOAuth}
            onSignUpClick={allowViewChange ? switchToSignUp : undefined}
            onForgotPasswordClick={allowViewChange && showPasswordReset ? switchToPasswordReset : undefined}
            providers={providers}
            loading={loading}
            error={error}
            title={texts.signIn?.title}
            description={texts.signIn?.description}
            showSignUpLink={allowViewChange}
            showForgotPasswordLink={allowViewChange && showPasswordReset}
          />
        )}

        {currentView === 'signup' && (
          <SignUpForm
            onSubmit={handleSignUp}
            onOAuthSignIn={handleOAuth}
            onSignInClick={allowViewChange ? switchToSignIn : undefined}
            providers={providers}
            loading={loading}
            error={error}
            title={texts.signUp?.title}
            description={texts.signUp?.description}
            showSignInLink={allowViewChange}
            requireName={requireName}
          />
        )}

        {currentView === 'reset-password' && (
          <PasswordResetForm
            onSubmit={handlePasswordReset}
            onBackToSignIn={allowViewChange ? switchToSignIn : undefined}
            loading={loading}
            error={error}
            success={passwordResetSuccess}
            title={texts.resetPassword?.title}
            description={texts.resetPassword?.description}
          />
        )}
      </div>
    )
  }
)
AuthComponent.displayName = 'AuthComponent'

export { AuthComponent }