import { pgTable, text, timestamp, boolean, integer, index, unique } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

// Users table
export const users = pgTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  name: text('name'),
  passwordHash: text('password_hash'),
  emailVerified: boolean('email_verified').default(false),
  image: text('image'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
}, (table) => ({
  emailIdx: index('users_email_idx').on(table.email),
  createdAtIdx: index('users_created_at_idx').on(table.createdAt)
}))

// Accounts table for OAuth providers
export const accounts = pgTable('accounts', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  provider: text('provider').notNull(),
  providerAccountId: text('provider_account_id').notNull(),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  expiresAt: integer('expires_at'),
  tokenType: text('token_type'),
  scope: text('scope'),
  idToken: text('id_token'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
}, (table) => ({
  userIdIdx: index('accounts_user_id_idx').on(table.userId),
  providerIdx: index('accounts_provider_idx').on(table.provider),
  providerAccountUnique: unique('accounts_provider_account_unique').on(table.provider, table.providerAccountId)
}))

// Sessions table
export const sessions = pgTable('sessions', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  sessionToken: text('session_token').notNull().unique(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
}, (table) => ({
  userIdIdx: index('sessions_user_id_idx').on(table.userId),
  sessionTokenIdx: index('sessions_session_token_idx').on(table.sessionToken),
  expiresAtIdx: index('sessions_expires_at_idx').on(table.expiresAt)
}))

// Verification tokens table (for email verification, password reset, etc.)
export const verificationTokens = pgTable('verification_tokens', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(), // email or user id
  token: text('token').notNull(),
  type: text('type').notNull(), // 'email_verification', 'password_reset'
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull()
}, (table) => ({
  identifierIdx: index('verification_tokens_identifier_idx').on(table.identifier),
  tokenIdx: index('verification_tokens_token_idx').on(table.token),
  expiresAtIdx: index('verification_tokens_expires_at_idx').on(table.expiresAt),
  tokenUnique: unique('verification_tokens_token_unique').on(table.token)
}))

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  accounts: many(accounts),
  sessions: many(sessions)
}))

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, {
    fields: [accounts.userId],
    references: [users.id]
  })
}))

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id]
  })
}))

// Export schema object
export const schema = {
  users,
  accounts,
  sessions,
  verificationTokens,
  usersRelations,
  accountsRelations,
  sessionsRelations
}