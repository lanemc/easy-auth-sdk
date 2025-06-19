import { z } from 'zod';
// Base user schema
export const UserSchema = z.object({
    id: z.string(),
    email: z.string().email(),
    name: z.string().optional(),
    emailVerified: z.boolean().default(false),
    image: z.string().optional(),
    createdAt: z.date(),
    updatedAt: z.date()
});
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
});
// Session schema
export const SessionSchema = z.object({
    id: z.string(),
    userId: z.string(),
    sessionToken: z.string(),
    expiresAt: z.date(),
    createdAt: z.date(),
    updatedAt: z.date()
});
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
});
// Error types
export class AuthError extends Error {
    constructor(message, code, status = 400) {
        super(message);
        this.code = code;
        this.status = status;
        this.name = 'AuthError';
    }
}
export class ConfigError extends AuthError {
    constructor(message) {
        super(message, 'CONFIG_ERROR', 500);
    }
}
export class DatabaseError extends AuthError {
    constructor(message) {
        super(message, 'DATABASE_ERROR', 500);
    }
}
export class ValidationError extends AuthError {
    constructor(message) {
        super(message, 'VALIDATION_ERROR', 400);
    }
}
//# sourceMappingURL=index.js.map