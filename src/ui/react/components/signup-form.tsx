import * as React from 'react'
import { Button } from './button'
import { Input } from './input'
import { Label } from './label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card'
import { Separator } from './separator'
import { OAuthButton } from './oauth-button'
import { cn } from '../utils'

export interface SignUpFormProps {
  onSubmit: (email: string, password: string, name?: string) => Promise<void> | void
  onOAuthSignIn?: (provider: string) => Promise<void> | void
  onSignInClick?: () => void
  providers?: Array<{ id: string; name: string }>
  loading?: boolean
  error?: string
  title?: string
  description?: string
  showSignInLink?: boolean
  requireName?: boolean
  className?: string
}

const SignUpForm = React.forwardRef<HTMLDivElement, SignUpFormProps>(
  ({
    onSubmit,
    onOAuthSignIn,
    onSignInClick,
    providers = [],
    loading = false,
    error,
    title = 'Create your account',
    description = 'Enter your details to create a new account',
    showSignInLink = true,
    requireName = false,
    className,
    ...props
  }, ref) => {
    const [email, setEmail] = React.useState('')
    const [password, setPassword] = React.useState('')
    const [confirmPassword, setConfirmPassword] = React.useState('')
    const [name, setName] = React.useState('')
    const [isSubmitting, setIsSubmitting] = React.useState(false)
    const [passwordStrength, setPasswordStrength] = React.useState<{
      isValid: boolean
      errors: string[]
    }>({ isValid: false, errors: [] })

    const validatePasswordStrength = (password: string) => {
      const errors: string[] = []
      
      if (password.length < 8) {
        errors.push('At least 8 characters')
      }
      
      if (!/[a-z]/.test(password)) {
        errors.push('One lowercase letter')
      }
      
      if (!/[A-Z]/.test(password)) {
        errors.push('One uppercase letter')
      }
      
      if (!/\d/.test(password)) {
        errors.push('One number')
      }
      
      return {
        isValid: errors.length === 0,
        errors
      }
    }

    React.useEffect(() => {
      if (password) {
        setPasswordStrength(validatePasswordStrength(password))
      }
    }, [password])

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault()
      if (isSubmitting || loading) return

      // Validate passwords match
      if (password !== confirmPassword) {
        return
      }

      // Validate password strength
      if (!passwordStrength.isValid) {
        return
      }

      setIsSubmitting(true)
      try {
        await onSubmit(email, password, name || undefined)
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
    const passwordsMatch = password === confirmPassword
    const canSubmit = email && password && confirmPassword && passwordsMatch && passwordStrength.isValid && (!requireName || name)

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
                  provider={provider.id as any}
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
            {/* Name Field */}
            <div className="space-y-2">
              <Label htmlFor="name">
                Name {requireName && <span className="text-destructive">*</span>}
              </Label>
              <Input
                id="name"
                type="text"
                placeholder="Enter your full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isLoading}
                required={requireName}
              />
            </div>

            {/* Email Field */}
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
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

            {/* Password Field */}
            <div className="space-y-2">
              <Label htmlFor="password">Password *</Label>
              <Input
                id="password"
                type="password"
                placeholder="Create a strong password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                required
              />
              
              {/* Password Strength Indicator */}
              {password && (
                <div className="text-xs space-y-1">
                  <div className="text-muted-foreground">Password must contain:</div>
                  <div className="space-y-1">
                    {passwordStrength.errors.map((error, index) => (
                      <div key={index} className="flex items-center space-x-1">
                        <div className="h-1.5 w-1.5 rounded-full bg-destructive" />
                        <span className="text-destructive">{error}</span>
                      </div>
                    ))}
                    {passwordStrength.isValid && (
                      <div className="flex items-center space-x-1">
                        <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
                        <span className="text-green-600">Strong password</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Confirm Password Field */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password *</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={isLoading}
                required
              />
              {confirmPassword && !passwordsMatch && (
                <div className="text-xs text-destructive">
                  Passwords do not match
                </div>
              )}
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading || !canSubmit}
            >
              {isLoading ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Creating account...
                </>
              ) : (
                'Create account'
              )}
            </Button>
          </form>

          {/* Sign In Link */}
          {showSignInLink && (
            <div className="text-center text-sm">
              Already have an account?{' '}
              <button
                type="button"
                onClick={onSignInClick}
                className="text-primary hover:underline font-medium"
                disabled={isLoading}
              >
                Sign in
              </button>
            </div>
          )}
        </CardContent>
      </Card>
    )
  }
)
SignUpForm.displayName = 'SignUpForm'

export { SignUpForm }