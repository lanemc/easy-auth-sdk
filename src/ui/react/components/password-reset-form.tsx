import * as React from 'react'
import { Button } from './button'
import { Input } from './input'
import { Label } from './label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card'
import { cn } from '../utils'

export interface PasswordResetFormProps {
  onSubmit: (email: string) => Promise<void> | void
  onBackToSignIn?: () => void
  loading?: boolean
  error?: string
  success?: boolean
  title?: string
  description?: string
  className?: string
}

const PasswordResetForm = React.forwardRef<HTMLDivElement, PasswordResetFormProps>(
  ({
    onSubmit,
    onBackToSignIn,
    loading = false,
    error,
    success = false,
    title = 'Reset your password',
    description = 'Enter your email and we\'ll send you a reset link',
    className,
    ...props
  }, ref) => {
    const [email, setEmail] = React.useState('')
    const [isSubmitting, setIsSubmitting] = React.useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault()
      if (isSubmitting || loading) return

      setIsSubmitting(true)
      try {
        await onSubmit(email)
      } finally {
        setIsSubmitting(false)
      }
    }

    const isLoading = loading || isSubmitting

    if (success) {
      return (
        <Card ref={ref} className={cn('w-full max-w-md mx-auto', className)} {...props}>
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">Check your email</CardTitle>
            <CardDescription className="text-center">
              We&apos;ve sent a password reset link to {email}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <svg
                  className="w-6 h-6 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Click the link in the email to reset your password. If you don&apos;t see it, check your spam folder.
              </p>
            </div>
            
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={onBackToSignIn}
            >
              Back to sign in
            </Button>
          </CardContent>
        </Card>
      )
    }

    return (
      <Card ref={ref} className={cn('w-full max-w-md mx-auto', className)} {...props}>
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl text-center">{title}</CardTitle>
          <CardDescription className="text-center">{description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Error Message */}
          {error && (
            <div className="p-3 text-sm text-destructive-foreground bg-destructive/10 border border-destructive/20 rounded-md">
              {error}
            </div>
          )}

          {/* Email Form */}
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
            
            <Button
              type="submit"
              className="w-full"
              disabled={isLoading || !email}
            >
              {isLoading ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Sending reset link...
                </>
              ) : (
                'Send reset link'
              )}
            </Button>
          </form>

          {/* Back to Sign In */}
          <div className="text-center">
            <button
              type="button"
              onClick={onBackToSignIn}
              className="text-sm text-primary hover:underline"
              disabled={isLoading}
            >
              Back to sign in
            </button>
          </div>
        </CardContent>
      </Card>
    )
  }
)
PasswordResetForm.displayName = 'PasswordResetForm'

export { PasswordResetForm }