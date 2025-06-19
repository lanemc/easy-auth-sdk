'use client'

import { AuthComponent } from 'easy-auth-sdk/react'
import { useNextAuth } from 'easy-auth-sdk/next/client'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function LoginPage() {
  const router = useRouter()
  const { 
    signIn, 
    signUp, 
    oauthSignIn, 
    resetPassword, 
    user, 
    loading, 
    error,
    clearError 
  } = useNextAuth()

  // Redirect if already authenticated
  useEffect(() => {
    if (user && !loading) {
      router.push('/')
    }
  }, [user, loading, router])

  const handleSignIn = async (email: string, password: string) => {
    clearError()
    await signIn(email, password)
  }

  const handleSignUp = async (email: string, password: string, name?: string) => {
    clearError()
    await signUp(email, password, name)
  }

  const handleOAuthSignIn = async (provider: string) => {
    clearError()
    await oauthSignIn(provider)
  }

  const handlePasswordReset = async (email: string) => {
    clearError()
    await resetPassword(email)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-current border-t-transparent" />
      </div>
    )
  }

  if (user) {
    return null // Will redirect
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full">
        <AuthComponent
          onSignIn={handleSignIn}
          onSignUp={handleSignUp}
          onOAuthSignIn={handleOAuthSignIn}
          onPasswordReset={handlePasswordReset}
          providers={[
            { id: 'google', name: 'Google' },
            { id: 'github', name: 'GitHub' }
          ]}
          loading={loading}
          error={error}
          requireName={true}
          showPasswordReset={true}
        />
      </div>
    </div>
  )
}