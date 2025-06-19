import { createAuthHandlers } from 'easy-auth-sdk/next'
import type { NextAuthConfig } from 'easy-auth-sdk/next'

const config: NextAuthConfig = {
  database: {
    type: 'postgres',
    url: process.env.DATABASE_URL!
  },
  session: {
    strategy: 'database',
    maxAge: 30 * 24 * 60 * 60, // 30 days
    secret: process.env.AUTH_SECRET!
  },
  providers: {
    emailPassword: {
      enabled: true
    },
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!
    },
    github: {
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!
    }
  },
  callbacks: {
    onSignUp: async ({ user }) => {
      console.log('User signed up:', user.email)
      // Send welcome email, etc.
    },
    onSignIn: async ({ user }) => {
      console.log('User signed in:', user.email)
      // Update last login time, etc.
    }
  }
}

const { handlers } = createAuthHandlers(config)

export const { GET, POST } = handlers