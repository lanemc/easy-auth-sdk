import { eq } from 'drizzle-orm'
import { Database } from '../db/database'
import { schema } from '../db/schema'
import { 
  User, 
  SignInResult, 
  SignUpResult, 
  AuthError, 
  ValidationError,
  DatabaseError 
} from '../types'
import { 
  generateUserId, 
  hashPassword, 
  verifyPassword, 
  isValidEmail, 
  validatePasswordStrength 
} from '../utils'

export class PasswordAuth {
  constructor(private db: Database) {}

  async signUp(email: string, password: string, name?: string): Promise<SignUpResult> {
    try {
      // Validate input
      if (!isValidEmail(email)) {
        return {
          success: false,
          error: 'Invalid email address'
        }
      }

      const passwordValidation = validatePasswordStrength(password)
      if (!passwordValidation.isValid) {
        return {
          success: false,
          error: passwordValidation.errors.join(', ')
        }
      }

      // Check if user already exists
      const existingUser = await this.db.db
        .select()
        .from(schema.users)
        .where(eq(schema.users.email, email.toLowerCase()))
        .limit(1)

      if (existingUser.length > 0) {
        return {
          success: false,
          error: 'User already exists with this email'
        }
      }

      // Hash password
      const passwordHash = await hashPassword(password)

      // Create user
      const userId = generateUserId()
      const now = new Date()

      const [newUser] = await this.db.db
        .insert(schema.users)
        .values({
          id: userId,
          email: email.toLowerCase(),
          name: name || null,
          passwordHash,
          emailVerified: false,
          createdAt: now,
          updatedAt: now
        })
        .returning()

      const user: User = {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name || undefined,
        emailVerified: newUser.emailVerified,
        image: newUser.image || undefined,
        createdAt: newUser.createdAt,
        updatedAt: newUser.updatedAt
      }

      return {
        success: true,
        user,
        requiresVerification: !user.emailVerified
      }

    } catch (error) {
      if (error instanceof AuthError) {
        return {
          success: false,
          error: error.message
        }
      }

      throw new DatabaseError(
        `Sign up failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }

  async signIn(email: string, password: string): Promise<SignInResult> {
    try {
      // Validate input
      if (!isValidEmail(email)) {
        return {
          success: false,
          error: 'Invalid email address'
        }
      }

      if (!password) {
        return {
          success: false,
          error: 'Password is required'
        }
      }

      // Find user
      const [dbUser] = await this.db.db
        .select()
        .from(schema.users)
        .where(eq(schema.users.email, email.toLowerCase()))
        .limit(1)

      if (!dbUser || !dbUser.passwordHash) {
        return {
          success: false,
          error: 'Invalid email or password'
        }
      }

      // Verify password
      const isValidPassword = await verifyPassword(password, dbUser.passwordHash)
      if (!isValidPassword) {
        return {
          success: false,
          error: 'Invalid email or password'
        }
      }

      const user: User = {
        id: dbUser.id,
        email: dbUser.email,
        name: dbUser.name || undefined,
        emailVerified: dbUser.emailVerified,
        image: dbUser.image || undefined,
        createdAt: dbUser.createdAt,
        updatedAt: dbUser.updatedAt
      }

      return {
        success: true,
        user
      }

    } catch (error) {
      if (error instanceof AuthError) {
        return {
          success: false,
          error: error.message
        }
      }

      throw new DatabaseError(
        `Sign in failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }

  async updatePassword(userId: string, oldPassword: string, newPassword: string): Promise<boolean> {
    try {
      // Get user
      const [user] = await this.db.db
        .select()
        .from(schema.users)
        .where(eq(schema.users.id, userId))
        .limit(1)

      if (!user || !user.passwordHash) {
        throw new ValidationError('User not found or password not set')
      }

      // Verify old password
      const isValidOldPassword = await verifyPassword(oldPassword, user.passwordHash)
      if (!isValidOldPassword) {
        throw new ValidationError('Current password is incorrect')
      }

      // Validate new password
      const passwordValidation = validatePasswordStrength(newPassword)
      if (!passwordValidation.isValid) {
        throw new ValidationError(passwordValidation.errors.join(', '))
      }

      // Hash new password
      const newPasswordHash = await hashPassword(newPassword)

      // Update password
      await this.db.db
        .update(schema.users)
        .set({
          passwordHash: newPasswordHash,
          updatedAt: new Date()
        })
        .where(eq(schema.users.id, userId))

      return true

    } catch (error) {
      if (error instanceof AuthError) {
        throw error
      }

      throw new DatabaseError(
        `Password update failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }

  async resetPassword(email: string, newPassword: string, token: string): Promise<boolean> {
    try {
      // Validate new password
      const passwordValidation = validatePasswordStrength(newPassword)
      if (!passwordValidation.isValid) {
        throw new ValidationError(passwordValidation.errors.join(', '))
      }

      // Verify token and get user
      const [verificationToken] = await this.db.db
        .select()
        .from(schema.verificationTokens)
        .where(eq(schema.verificationTokens.token, token))
        .limit(1)

      if (!verificationToken || verificationToken.type !== 'password_reset') {
        throw new ValidationError('Invalid or expired reset token')
      }

      if (verificationToken.expiresAt < new Date()) {
        throw new ValidationError('Reset token has expired')
      }

      if (verificationToken.identifier !== email.toLowerCase()) {
        throw new ValidationError('Token does not match email')
      }

      // Hash new password
      const passwordHash = await hashPassword(newPassword)

      // Update password
      await this.db.db
        .update(schema.users)
        .set({
          passwordHash,
          updatedAt: new Date()
        })
        .where(eq(schema.users.email, email.toLowerCase()))

      // Delete used token
      await this.db.db
        .delete(schema.verificationTokens)
        .where(eq(schema.verificationTokens.id, verificationToken.id))

      return true

    } catch (error) {
      if (error instanceof AuthError) {
        throw error
      }

      throw new DatabaseError(
        `Password reset failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }

  // Generate password reset token
  async generatePasswordResetToken(email: string): Promise<string | null> {
    try {
      // Check if user exists
      const [user] = await this.db.db
        .select()
        .from(schema.users)
        .where(eq(schema.users.email, email.toLowerCase()))
        .limit(1)

      if (!user) {
        // Don't reveal if user exists or not
        return null
      }

      // Generate token
      const token = generateVerificationToken()
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000) // 15 minutes

      // Store token
      await this.db.db
        .insert(schema.verificationTokens)
        .values({
          id: generateId('vrfy'),
          identifier: email.toLowerCase(),
          token,
          type: 'password_reset',
          expiresAt,
          createdAt: new Date()
        })

      return token

    } catch (error) {
      throw new DatabaseError(
        `Failed to generate reset token: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }
}

// Import missing utilities
import { generateId, generateVerificationToken } from '../utils'