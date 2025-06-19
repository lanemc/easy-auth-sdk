import { z } from 'zod'

// Base user schema
export const UserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string().optional(),
  emailVerified: z.boolean().default(false),
  image: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date()
})

export type User = z.infer<typeof UserSchema>

// Account schema for OAuth providers
export const AccountSchema = z.object({
  id: z.string(),
  userId: z.string(),
  provider: z.string(),
  providerAccountId: z.string(),
  accessToken: z.string().optional(),
  refreshToken: z.string().optional(),
  expiresAt: z.number().optional(),
  createdAt: z.date(),
  updatedAt: z.date()
})

export type Account = z.infer<typeof AccountSchema>

// Session schema
export const SessionSchema = z.object({
  id: z.string(),
  userId: z.string(),
  sessionToken: z.string(),
  expiresAt: z.date(),
  createdAt: z.date(),
  updatedAt: z.date()
})

export type Session = z.infer<typeof SessionSchema>

// Auth configuration
export const AuthConfigSchema = z.object({
  database: z.object({
    type: z.literal('postgres'),
    url: z.string().url()
  }),
  session: z.object({
    strategy: z.enum(['database', 'jwt']).default('database'),
    maxAge: z.number().default(30 * 24 * 60 * 60), // 30 days
    secret: z.string().min(32)
  }),
  providers: z.object({
    emailPassword: z.object({
      enabled: z.boolean().default(false)
    }).optional(),
    google: z.object({
      clientId: z.string(),
      clientSecret: z.string(),
      scope: z.string().default('openid email profile')
    }).optional(),
    github: z.object({
      clientId: z.string(),
      clientSecret: z.string(),
      scope: z.string().default('user:email')
    }).optional()
  }),
  callbacks: z.object({
    onSignUp: z.function().args(z.object({ user: UserSchema })).returns(z.void()).optional(),
    onSignIn: z.function().args(z.object({ user: UserSchema, account: AccountSchema.optional() })).returns(z.void()).optional(),
    onSignOut: z.function().args(z.object({ user: UserSchema })).returns(z.void()).optional()
  }).optional()
})

export type AuthConfig = z.infer<typeof AuthConfigSchema>

// OAuth provider types
export interface OAuthProvider {
  id: string
  name: string
  authorizationUrl: string
  tokenUrl: string
  userInfoUrl: string
  clientId: string
  clientSecret: string
  scope: string
  redirectUri?: string
}

// Auth result types
export interface SignInResult {
  success: boolean
  user?: User
  session?: Session
  error?: string
}

export interface SignUpResult {
  success: boolean
  user?: User
  requiresVerification?: boolean
  error?: string
}

// Request/Response types
export interface AuthRequest {
  method: string
  url: string
  headers: Record<string, string>
  body?: unknown
  query?: Record<string, string>
}

export interface AuthResponse {
  status: number
  headers?: Record<string, string>
  body?: unknown
  redirect?: string
}

// Error types
export class AuthError extends Error {
  constructor(
    message: string,
    public code: string,
    public status: number = 400
  ) {
    super(message)
    this.name = 'AuthError'
  }
}

export class ConfigError extends AuthError {
  constructor(message: string) {
    super(message, 'CONFIG_ERROR', 500)
  }
}

export class DatabaseError extends AuthError {
  constructor(message: string) {
    super(message, 'DATABASE_ERROR', 500)
  }
}

export class ValidationError extends AuthError {
  constructor(message: string) {
    super(message, 'VALIDATION_ERROR', 400)
  }
}