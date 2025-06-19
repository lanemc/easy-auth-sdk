import * as React from 'react'
import { Button } from './button'
import { Input } from './input'
import { Label } from './label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card'
import { Separator } from './separator'
import { OAuthButton } from './oauth-button'
import { cn } from '../utils'

export interface LoginFormProps {
  onSubmit: (email: string, password: string) => Promise<void> | void
  onOAuthSignIn?: (provider: string) => Promise<void> | void
  onSignUpClick?: () => void
  onForgotPasswordClick?: () => void
  providers?: Array<{ id: string; name: string }>
  loading?: boolean
  error?: string
  title?: string
  description?: string
  showSignUpLink?: boolean
  showForgotPasswordLink?: boolean
  className?: string
}

const LoginForm = React.forwardRef<HTMLDivElement, LoginFormProps>(
  ({
    onSubmit,
    onOAuthSignIn,
    onSignUpClick,
    onForgotPasswordClick,
    providers = [],
    loading = false,
    error,
    title = 'Sign in to your account',
    description = 'Enter your email and password to sign in',
    showSignUpLink = true,
    showForgotPasswordLink = true,
    className,
    ...props
  }, ref) => {
    const [email, setEmail] = React.useState('')
    const [password, setPassword] = React.useState('')
    const [isSubmitting, setIsSubmitting] = React.useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault()
      if (isSubmitting || loading) return

      setIsSubmitting(true)
      try {
        await onSubmit(email, password)
      } finally {
        setIsSubmitting(false)
      }
    }

    const handleOAuthClick = async (provider: string) => {
      if (onOAuthSignIn && !loading && !isSubmitting) {
        await onOAuthSignIn(provider)
      }
    }

    const isLoading = loading || isSubmitting

    return (
      <Card ref={ref} className={cn('w-full max-w-md mx-auto', className)} {...props}>
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl text-center">{title}</CardTitle>
          <CardDescription className="text-center">{description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* OAuth Providers */}
          {providers.length > 0 && (
            <div className="space-y-2">
              {providers.map((provider) => (
                <OAuthButton
                  key={provider.id}
                  provider={provider.id as keyof typeof providerIcons}
                  onClick={() => handleOAuthClick(provider.id)}
                  disabled={isLoading}
                />
              ))}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <Separator />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    Or continue with
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="p-3 text-sm text-destructive-foreground bg-destructive/10 border border-destructive/20 rounded-md">
              {error}
            </div>
          )}

          {/* Email/Password Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                {showForgotPasswordLink && (
                  <button
                    type="button"
                    onClick={onForgotPasswordClick}
                    className="text-sm text-primary hover:underline"
                    disabled={isLoading}
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>
            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Signing in...
                </>
              ) : (
                'Sign in'
              )}
            </Button>
          </form>

          {/* Sign Up Link */}
          {showSignUpLink && (
            <div className="text-center text-sm">
              Don&apos;t have an account?{' '}
              <button
                type="button"
                onClick={onSignUpClick}
                className="text-primary hover:underline font-medium"
                disabled={isLoading}
              >
                Sign up
              </button>
            </div>
          )}
        </CardContent>
      </Card>
    )
  }
)
LoginForm.displayName = 'LoginForm'

export { LoginForm }

// Re-export provider icons type for usage
import { providerIcons } from './oauth-button'