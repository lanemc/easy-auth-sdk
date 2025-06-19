// Core exports
export { AuthEngine } from './core/engine'
export { SessionManager } from './core/session'
export { PasswordAuth } from './core/password'
export { OAuthManager } from './core/oauth'

// Database exports
export { Database } from './db/database'
export { schema } from './db/schema'

// Type exports
export type {
  User,
  Account,
  Session,
  AuthConfig,
  OAuthProvider,
  SignInResult,
  SignUpResult,
  AuthRequest,
  AuthResponse
} from './types'

export {
  AuthError,
  ConfigError,
  DatabaseError,
  ValidationError,
  UserSchema,
  AccountSchema,
  SessionSchema,
  AuthConfigSchema
} from './types'

// Utility exports
export { generateId, hashPassword, verifyPassword } from './utils'

// Main SDK class
export { EasyAuth } from './core/easy-auth'