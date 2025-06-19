import { NextRequest, NextResponse } from 'next/server';
import { drizzle } from 'drizzle-orm/postgres-js';
import { z } from 'zod';

declare class Database {
    db: ReturnType<typeof drizzle>;
    private client;
    constructor(connectionString: string);
    testConnection(): Promise<void>;
    migrate(migrationsFolder?: string): Promise<void>;
    close(): Promise<void>;
    ensureTablesExist(): Promise<void>;
    cleanupExpiredSessions(): Promise<number>;
    cleanupExpiredTokens(): Promise<number>;
}

declare const UserSchema: z.ZodObject<{
    id: z.ZodString;
    email: z.ZodString;
    name: z.ZodOptional<z.ZodString>;
    emailVerified: z.ZodDefault<z.ZodBoolean>;
    image: z.ZodOptional<z.ZodString>;
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    id: string;
    email: string;
    emailVerified: boolean;
    createdAt: Date;
    updatedAt: Date;
    name?: string | undefined;
    image?: string | undefined;
}, {
    id: string;
    email: string;
    createdAt: Date;
    updatedAt: Date;
    name?: string | undefined;
    emailVerified?: boolean | undefined;
    image?: string | undefined;
}>;
type User = z.infer<typeof UserSchema>;
declare const AccountSchema: z.ZodObject<{
    id: z.ZodString;
    userId: z.ZodString;
    provider: z.ZodString;
    providerAccountId: z.ZodString;
    accessToken: z.ZodOptional<z.ZodString>;
    refreshToken: z.ZodOptional<z.ZodString>;
    expiresAt: z.ZodOptional<z.ZodNumber>;
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    userId: string;
    provider: string;
    providerAccountId: string;
    accessToken?: string | undefined;
    refreshToken?: string | undefined;
    expiresAt?: number | undefined;
}, {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    userId: string;
    provider: string;
    providerAccountId: string;
    accessToken?: string | undefined;
    refreshToken?: string | undefined;
    expiresAt?: number | undefined;
}>;
type Account = z.infer<typeof AccountSchema>;
declare const SessionSchema: z.ZodObject<{
    id: z.ZodString;
    userId: z.ZodString;
    sessionToken: z.ZodString;
    expiresAt: z.ZodDate;
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    userId: string;
    expiresAt: Date;
    sessionToken: string;
}, {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    userId: string;
    expiresAt: Date;
    sessionToken: string;
}>;
type Session = z.infer<typeof SessionSchema>;
declare const AuthConfigSchema: z.ZodObject<{
    database: z.ZodObject<{
        type: z.ZodLiteral<"postgres">;
        url: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        type: "postgres";
        url: string;
    }, {
        type: "postgres";
        url: string;
    }>;
    session: z.ZodObject<{
        strategy: z.ZodDefault<z.ZodEnum<["database", "jwt"]>>;
        maxAge: z.ZodDefault<z.ZodNumber>;
        secret: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        strategy: "database" | "jwt";
        maxAge: number;
        secret: string;
    }, {
        secret: string;
        strategy?: "database" | "jwt" | undefined;
        maxAge?: number | undefined;
    }>;
    providers: z.ZodObject<{
        emailPassword: z.ZodOptional<z.ZodObject<{
            enabled: z.ZodDefault<z.ZodBoolean>;
        }, "strip", z.ZodTypeAny, {
            enabled: boolean;
        }, {
            enabled?: boolean | undefined;
        }>>;
        google: z.ZodOptional<z.ZodObject<{
            clientId: z.ZodString;
            clientSecret: z.ZodString;
            scope: z.ZodDefault<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            clientId: string;
            clientSecret: string;
            scope: string;
        }, {
            clientId: string;
            clientSecret: string;
            scope?: string | undefined;
        }>>;
        github: z.ZodOptional<z.ZodObject<{
            clientId: z.ZodString;
            clientSecret: z.ZodString;
            scope: z.ZodDefault<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            clientId: string;
            clientSecret: string;
            scope: string;
        }, {
            clientId: string;
            clientSecret: string;
            scope?: string | undefined;
        }>>;
    }, "strip", z.ZodTypeAny, {
        emailPassword?: {
            enabled: boolean;
        } | undefined;
        google?: {
            clientId: string;
            clientSecret: string;
            scope: string;
        } | undefined;
        github?: {
            clientId: string;
            clientSecret: string;
            scope: string;
        } | undefined;
    }, {
        emailPassword?: {
            enabled?: boolean | undefined;
        } | undefined;
        google?: {
            clientId: string;
            clientSecret: string;
            scope?: string | undefined;
        } | undefined;
        github?: {
            clientId: string;
            clientSecret: string;
            scope?: string | undefined;
        } | undefined;
    }>;
    callbacks: z.ZodOptional<z.ZodObject<{
        onSignUp: z.ZodOptional<z.ZodFunction<z.ZodTuple<[z.ZodObject<{
            user: z.ZodObject<{
                id: z.ZodString;
                email: z.ZodString;
                name: z.ZodOptional<z.ZodString>;
                emailVerified: z.ZodDefault<z.ZodBoolean>;
                image: z.ZodOptional<z.ZodString>;
                createdAt: z.ZodDate;
                updatedAt: z.ZodDate;
            }, "strip", z.ZodTypeAny, {
                id: string;
                email: string;
                emailVerified: boolean;
                createdAt: Date;
                updatedAt: Date;
                name?: string | undefined;
                image?: string | undefined;
            }, {
                id: string;
                email: string;
                createdAt: Date;
                updatedAt: Date;
                name?: string | undefined;
                emailVerified?: boolean | undefined;
                image?: string | undefined;
            }>;
        }, "strip", z.ZodTypeAny, {
            user: {
                id: string;
                email: string;
                emailVerified: boolean;
                createdAt: Date;
                updatedAt: Date;
                name?: string | undefined;
                image?: string | undefined;
            };
        }, {
            user: {
                id: string;
                email: string;
                createdAt: Date;
                updatedAt: Date;
                name?: string | undefined;
                emailVerified?: boolean | undefined;
                image?: string | undefined;
            };
        }>], z.ZodUnknown>, z.ZodVoid>>;
        onSignIn: z.ZodOptional<z.ZodFunction<z.ZodTuple<[z.ZodObject<{
            user: z.ZodObject<{
                id: z.ZodString;
                email: z.ZodString;
                name: z.ZodOptional<z.ZodString>;
                emailVerified: z.ZodDefault<z.ZodBoolean>;
                image: z.ZodOptional<z.ZodString>;
                createdAt: z.ZodDate;
                updatedAt: z.ZodDate;
            }, "strip", z.ZodTypeAny, {
                id: string;
                email: string;
                emailVerified: boolean;
                createdAt: Date;
                updatedAt: Date;
                name?: string | undefined;
                image?: string | undefined;
            }, {
                id: string;
                email: string;
                createdAt: Date;
                updatedAt: Date;
                name?: string | undefined;
                emailVerified?: boolean | undefined;
                image?: string | undefined;
            }>;
            account: z.ZodOptional<z.ZodObject<{
                id: z.ZodString;
                userId: z.ZodString;
                provider: z.ZodString;
                providerAccountId: z.ZodString;
                accessToken: z.ZodOptional<z.ZodString>;
                refreshToken: z.ZodOptional<z.ZodString>;
                expiresAt: z.ZodOptional<z.ZodNumber>;
                createdAt: z.ZodDate;
                updatedAt: z.ZodDate;
            }, "strip", z.ZodTypeAny, {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                userId: string;
                provider: string;
                providerAccountId: string;
                accessToken?: string | undefined;
                refreshToken?: string | undefined;
                expiresAt?: number | undefined;
            }, {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                userId: string;
                provider: string;
                providerAccountId: string;
                accessToken?: string | undefined;
                refreshToken?: string | undefined;
                expiresAt?: number | undefined;
            }>>;
        }, "strip", z.ZodTypeAny, {
            user: {
                id: string;
                email: string;
                emailVerified: boolean;
                createdAt: Date;
                updatedAt: Date;
                name?: string | undefined;
                image?: string | undefined;
            };
            account?: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                userId: string;
                provider: string;
                providerAccountId: string;
                accessToken?: string | undefined;
                refreshToken?: string | undefined;
                expiresAt?: number | undefined;
            } | undefined;
        }, {
            user: {
                id: string;
                email: string;
                createdAt: Date;
                updatedAt: Date;
                name?: string | undefined;
                emailVerified?: boolean | undefined;
                image?: string | undefined;
            };
            account?: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                userId: string;
                provider: string;
                providerAccountId: string;
                accessToken?: string | undefined;
                refreshToken?: string | undefined;
                expiresAt?: number | undefined;
            } | undefined;
        }>], z.ZodUnknown>, z.ZodVoid>>;
        onSignOut: z.ZodOptional<z.ZodFunction<z.ZodTuple<[z.ZodObject<{
            user: z.ZodObject<{
                id: z.ZodString;
                email: z.ZodString;
                name: z.ZodOptional<z.ZodString>;
                emailVerified: z.ZodDefault<z.ZodBoolean>;
                image: z.ZodOptional<z.ZodString>;
                createdAt: z.ZodDate;
                updatedAt: z.ZodDate;
            }, "strip", z.ZodTypeAny, {
                id: string;
                email: string;
                emailVerified: boolean;
                createdAt: Date;
                updatedAt: Date;
                name?: string | undefined;
                image?: string | undefined;
            }, {
                id: string;
                email: string;
                createdAt: Date;
                updatedAt: Date;
                name?: string | undefined;
                emailVerified?: boolean | undefined;
                image?: string | undefined;
            }>;
        }, "strip", z.ZodTypeAny, {
            user: {
                id: string;
                email: string;
                emailVerified: boolean;
                createdAt: Date;
                updatedAt: Date;
                name?: string | undefined;
                image?: string | undefined;
            };
        }, {
            user: {
                id: string;
                email: string;
                createdAt: Date;
                updatedAt: Date;
                name?: string | undefined;
                emailVerified?: boolean | undefined;
                image?: string | undefined;
            };
        }>], z.ZodUnknown>, z.ZodVoid>>;
    }, "strip", z.ZodTypeAny, {
        onSignUp?: ((args_0: {
            user: {
                id: string;
                email: string;
                createdAt: Date;
                updatedAt: Date;
                name?: string | undefined;
                emailVerified?: boolean | undefined;
                image?: string | undefined;
            };
        }, ...args: unknown[]) => void) | undefined;
        onSignIn?: ((args_0: {
            user: {
                id: string;
                email: string;
                createdAt: Date;
                updatedAt: Date;
                name?: string | undefined;
                emailVerified?: boolean | undefined;
                image?: string | undefined;
            };
            account?: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                userId: string;
                provider: string;
                providerAccountId: string;
                accessToken?: string | undefined;
                refreshToken?: string | undefined;
                expiresAt?: number | undefined;
            } | undefined;
        }, ...args: unknown[]) => void) | undefined;
        onSignOut?: ((args_0: {
            user: {
                id: string;
                email: string;
                createdAt: Date;
                updatedAt: Date;
                name?: string | undefined;
                emailVerified?: boolean | undefined;
                image?: string | undefined;
            };
        }, ...args: unknown[]) => void) | undefined;
    }, {
        onSignUp?: ((args_0: {
            user: {
                id: string;
                email: string;
                emailVerified: boolean;
                createdAt: Date;
                updatedAt: Date;
                name?: string | undefined;
                image?: string | undefined;
            };
        }, ...args: unknown[]) => void) | undefined;
        onSignIn?: ((args_0: {
            user: {
                id: string;
                email: string;
                emailVerified: boolean;
                createdAt: Date;
                updatedAt: Date;
                name?: string | undefined;
                image?: string | undefined;
            };
            account?: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                userId: string;
                provider: string;
                providerAccountId: string;
                accessToken?: string | undefined;
                refreshToken?: string | undefined;
                expiresAt?: number | undefined;
            } | undefined;
        }, ...args: unknown[]) => void) | undefined;
        onSignOut?: ((args_0: {
            user: {
                id: string;
                email: string;
                emailVerified: boolean;
                createdAt: Date;
                updatedAt: Date;
                name?: string | undefined;
                image?: string | undefined;
            };
        }, ...args: unknown[]) => void) | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    database: {
        type: "postgres";
        url: string;
    };
    session: {
        strategy: "database" | "jwt";
        maxAge: number;
        secret: string;
    };
    providers: {
        emailPassword?: {
            enabled: boolean;
        } | undefined;
        google?: {
            clientId: string;
            clientSecret: string;
            scope: string;
        } | undefined;
        github?: {
            clientId: string;
            clientSecret: string;
            scope: string;
        } | undefined;
    };
    callbacks?: {
        onSignUp?: ((args_0: {
            user: {
                id: string;
                email: string;
                createdAt: Date;
                updatedAt: Date;
                name?: string | undefined;
                emailVerified?: boolean | undefined;
                image?: string | undefined;
            };
        }, ...args: unknown[]) => void) | undefined;
        onSignIn?: ((args_0: {
            user: {
                id: string;
                email: string;
                createdAt: Date;
                updatedAt: Date;
                name?: string | undefined;
                emailVerified?: boolean | undefined;
                image?: string | undefined;
            };
            account?: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                userId: string;
                provider: string;
                providerAccountId: string;
                accessToken?: string | undefined;
                refreshToken?: string | undefined;
                expiresAt?: number | undefined;
            } | undefined;
        }, ...args: unknown[]) => void) | undefined;
        onSignOut?: ((args_0: {
            user: {
                id: string;
                email: string;
                createdAt: Date;
                updatedAt: Date;
                name?: string | undefined;
                emailVerified?: boolean | undefined;
                image?: string | undefined;
            };
        }, ...args: unknown[]) => void) | undefined;
    } | undefined;
}, {
    database: {
        type: "postgres";
        url: string;
    };
    session: {
        secret: string;
        strategy?: "database" | "jwt" | undefined;
        maxAge?: number | undefined;
    };
    providers: {
        emailPassword?: {
            enabled?: boolean | undefined;
        } | undefined;
        google?: {
            clientId: string;
            clientSecret: string;
            scope?: string | undefined;
        } | undefined;
        github?: {
            clientId: string;
            clientSecret: string;
            scope?: string | undefined;
        } | undefined;
    };
    callbacks?: {
        onSignUp?: ((args_0: {
            user: {
                id: string;
                email: string;
                emailVerified: boolean;
                createdAt: Date;
                updatedAt: Date;
                name?: string | undefined;
                image?: string | undefined;
            };
        }, ...args: unknown[]) => void) | undefined;
        onSignIn?: ((args_0: {
            user: {
                id: string;
                email: string;
                emailVerified: boolean;
                createdAt: Date;
                updatedAt: Date;
                name?: string | undefined;
                image?: string | undefined;
            };
            account?: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                userId: string;
                provider: string;
                providerAccountId: string;
                accessToken?: string | undefined;
                refreshToken?: string | undefined;
                expiresAt?: number | undefined;
            } | undefined;
        }, ...args: unknown[]) => void) | undefined;
        onSignOut?: ((args_0: {
            user: {
                id: string;
                email: string;
                emailVerified: boolean;
                createdAt: Date;
                updatedAt: Date;
                name?: string | undefined;
                image?: string | undefined;
            };
        }, ...args: unknown[]) => void) | undefined;
    } | undefined;
}>;
type AuthConfig = z.infer<typeof AuthConfigSchema>;
interface SignInResult {
    success: boolean;
    user?: User;
    session?: Session;
    error?: string;
}
interface SignUpResult {
    success: boolean;
    user?: User;
    requiresVerification?: boolean;
    error?: string;
}

interface AuthEngineCallbacks {
    onSignUp?: (data: {
        user: User;
    }) => Promise<void> | void;
    onSignIn?: (data: {
        user: User;
        account?: Account;
    }) => Promise<void> | void;
    onSignOut?: (data: {
        user: User;
    }) => Promise<void> | void;
}

/**
 * EasyAuth - Main SDK class for authentication
 *
 * This is the primary interface developers will use to integrate authentication
 * into their applications. It provides a simple, intuitive API while handling
 * all the complexity of authentication flows, session management, and security.
 */
declare class EasyAuth {
    private engine;
    private initialized;
    constructor(config: AuthConfig, callbacks?: AuthEngineCallbacks);
    private validateConfig;
    /**
     * Initialize the authentication system
     * Must be called before using any other methods
     */
    initialize(): Promise<void>;
    /**
     * Sign up a new user with email and password
     */
    signUp(email: string, password: string, name?: string): Promise<SignUpResult>;
    /**
     * Sign in a user with email and password
     */
    signIn(email: string, password: string): Promise<SignInResult & {
        sessionCookie?: string;
    }>;
    /**
     * Get OAuth authorization URL for a provider
     */
    getOAuthURL(provider: string, redirectUri: string, state?: string): string;
    /**
     * Handle OAuth callback and sign in user
     */
    handleOAuthCallback(provider: string, code: string, redirectUri: string, state?: string): Promise<SignInResult & {
        sessionCookie?: string;
    }>;
    /**
     * Get current user session
     */
    getSession(sessionToken: string): Promise<{
        user: User;
        session: Session;
    } | null>;
    /**
     * Get session from cookie header
     */
    getSessionFromCookies(cookieHeader: string): string | null;
    /**
     * Sign out user and invalidate session
     */
    signOut(sessionToken: string): Promise<{
        success: boolean;
        logoutCookie: string;
    }>;
    /**
     * Sign out user from all sessions
     */
    signOutAll(userId: string): Promise<number>;
    /**
     * Update user password
     */
    updatePassword(userId: string, oldPassword: string, newPassword: string): Promise<boolean>;
    /**
     * Request password reset token
     */
    requestPasswordReset(email: string): Promise<string | null>;
    /**
     * Reset password with token
     */
    resetPassword(email: string, newPassword: string, token: string): Promise<boolean>;
    /**
     * Get list of configured OAuth providers
     */
    getProviders(): Array<{
        id: string;
        name: string;
    }>;
    /**
     * Check if authentication system is healthy
     */
    health(): Promise<{
        status: 'ok' | 'error';
        database: boolean;
        error?: string;
    }>;
    /**
     * Cleanup expired sessions and tokens
     */
    cleanupExpired(): Promise<{
        sessions: number;
        tokens: number;
    }>;
    /**
     * Get access to the underlying database (for advanced usage)
     */
    getDatabase(): Database;
    /**
     * Gracefully shutdown the authentication system
     */
    close(): Promise<void>;
    private ensureInitialized;
    private generateState;
    /**
     * Create a middleware function for protecting routes
     * Returns a function that can be used in web frameworks
     */
    requireAuth(): (req: any, res: any, next: any) => Promise<any>;
    private getSessionFromRequest;
    private handleUnauthorized;
    /**
     * Create a higher-order function for protecting route handlers
     */
    withAuth<T extends (...args: any[]) => any>(handler: T): T;
}

interface NextAuthConfig extends AuthConfig {
    basePath?: string;
    redirects?: {
        signIn?: string;
        signOut?: string;
        error?: string;
    };
}
interface AuthHandlerOptions {
    auth: EasyAuth;
    config: NextAuthConfig;
}
declare class NextAuthAdapter {
    private auth;
    private config;
    private basePath;
    constructor(options: AuthHandlerOptions);
    /**
     * Main route handler for Next.js API routes
     * Use this in app/api/auth/[...auth]/route.ts
     */
    handler(): {
        GET: (request: NextRequest) => Promise<NextResponse<unknown>>;
        POST: (request: NextRequest) => Promise<NextResponse<unknown>>;
    };
    private handleRequest;
    private handleSignIn;
    private handleSignUp;
    private handleSignOut;
    private handleGetSession;
    private handleOAuthRedirect;
    private handleOAuthCallback;
    private handlePasswordReset;
    private handleGetProviders;
    private getSessionTokenFromRequest;
    /**
     * Middleware helper for protecting routes
     */
    middleware(): (request: NextRequest) => Promise<NextResponse<unknown>>;
    /**
     * Server-side helper to get session in Server Components/API routes
     */
    getServerSession(request: NextRequest): Promise<{
        user: User;
        session: Session;
    } | null>;
}
declare function createAuthHandlers(config: NextAuthConfig): {
    auth: EasyAuth;
    adapter: NextAuthAdapter;
    handlers: {
        GET: (request: NextRequest) => Promise<NextResponse<unknown>>;
        POST: (request: NextRequest) => Promise<NextResponse<unknown>>;
    };
    middleware: (request: NextRequest) => Promise<NextResponse<unknown>>;
    getServerSession: (request: NextRequest) => Promise<{
        user: User;
        session: Session;
    } | null>;
};

export { NextAuthAdapter, createAuthHandlers };
export type { AuthHandlerOptions, NextAuthConfig };
