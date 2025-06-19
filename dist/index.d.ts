import { drizzle } from 'drizzle-orm/postgres-js';
import { z } from 'zod';
import * as drizzle_orm from 'drizzle-orm';
import * as drizzle_orm_pg_core from 'drizzle-orm/pg-core';

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
    id?: string;
    email?: string;
    name?: string;
    emailVerified?: boolean;
    image?: string;
    createdAt?: Date;
    updatedAt?: Date;
}, {
    id?: string;
    email?: string;
    name?: string;
    emailVerified?: boolean;
    image?: string;
    createdAt?: Date;
    updatedAt?: Date;
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
    id?: string;
    createdAt?: Date;
    updatedAt?: Date;
    userId?: string;
    provider?: string;
    providerAccountId?: string;
    accessToken?: string;
    refreshToken?: string;
    expiresAt?: number;
}, {
    id?: string;
    createdAt?: Date;
    updatedAt?: Date;
    userId?: string;
    provider?: string;
    providerAccountId?: string;
    accessToken?: string;
    refreshToken?: string;
    expiresAt?: number;
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
    id?: string;
    createdAt?: Date;
    updatedAt?: Date;
    userId?: string;
    expiresAt?: Date;
    sessionToken?: string;
}, {
    id?: string;
    createdAt?: Date;
    updatedAt?: Date;
    userId?: string;
    expiresAt?: Date;
    sessionToken?: string;
}>;
type Session = z.infer<typeof SessionSchema>;
declare const AuthConfigSchema: z.ZodObject<{
    database: z.ZodObject<{
        type: z.ZodLiteral<"postgres">;
        url: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        type?: "postgres";
        url?: string;
    }, {
        type?: "postgres";
        url?: string;
    }>;
    session: z.ZodObject<{
        strategy: z.ZodDefault<z.ZodEnum<["database", "jwt"]>>;
        maxAge: z.ZodDefault<z.ZodNumber>;
        secret: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        strategy?: "database" | "jwt";
        maxAge?: number;
        secret?: string;
    }, {
        strategy?: "database" | "jwt";
        maxAge?: number;
        secret?: string;
    }>;
    providers: z.ZodObject<{
        emailPassword: z.ZodOptional<z.ZodObject<{
            enabled: z.ZodDefault<z.ZodBoolean>;
        }, "strip", z.ZodTypeAny, {
            enabled?: boolean;
        }, {
            enabled?: boolean;
        }>>;
        google: z.ZodOptional<z.ZodObject<{
            clientId: z.ZodString;
            clientSecret: z.ZodString;
            scope: z.ZodDefault<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            scope?: string;
            clientId?: string;
            clientSecret?: string;
        }, {
            scope?: string;
            clientId?: string;
            clientSecret?: string;
        }>>;
        github: z.ZodOptional<z.ZodObject<{
            clientId: z.ZodString;
            clientSecret: z.ZodString;
            scope: z.ZodDefault<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            scope?: string;
            clientId?: string;
            clientSecret?: string;
        }, {
            scope?: string;
            clientId?: string;
            clientSecret?: string;
        }>>;
    }, "strip", z.ZodTypeAny, {
        emailPassword?: {
            enabled?: boolean;
        };
        google?: {
            scope?: string;
            clientId?: string;
            clientSecret?: string;
        };
        github?: {
            scope?: string;
            clientId?: string;
            clientSecret?: string;
        };
    }, {
        emailPassword?: {
            enabled?: boolean;
        };
        google?: {
            scope?: string;
            clientId?: string;
            clientSecret?: string;
        };
        github?: {
            scope?: string;
            clientId?: string;
            clientSecret?: string;
        };
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
                id?: string;
                email?: string;
                name?: string;
                emailVerified?: boolean;
                image?: string;
                createdAt?: Date;
                updatedAt?: Date;
            }, {
                id?: string;
                email?: string;
                name?: string;
                emailVerified?: boolean;
                image?: string;
                createdAt?: Date;
                updatedAt?: Date;
            }>;
        }, "strip", z.ZodTypeAny, {
            user?: {
                id?: string;
                email?: string;
                name?: string;
                emailVerified?: boolean;
                image?: string;
                createdAt?: Date;
                updatedAt?: Date;
            };
        }, {
            user?: {
                id?: string;
                email?: string;
                name?: string;
                emailVerified?: boolean;
                image?: string;
                createdAt?: Date;
                updatedAt?: Date;
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
                id?: string;
                email?: string;
                name?: string;
                emailVerified?: boolean;
                image?: string;
                createdAt?: Date;
                updatedAt?: Date;
            }, {
                id?: string;
                email?: string;
                name?: string;
                emailVerified?: boolean;
                image?: string;
                createdAt?: Date;
                updatedAt?: Date;
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
                id?: string;
                createdAt?: Date;
                updatedAt?: Date;
                userId?: string;
                provider?: string;
                providerAccountId?: string;
                accessToken?: string;
                refreshToken?: string;
                expiresAt?: number;
            }, {
                id?: string;
                createdAt?: Date;
                updatedAt?: Date;
                userId?: string;
                provider?: string;
                providerAccountId?: string;
                accessToken?: string;
                refreshToken?: string;
                expiresAt?: number;
            }>>;
        }, "strip", z.ZodTypeAny, {
            user?: {
                id?: string;
                email?: string;
                name?: string;
                emailVerified?: boolean;
                image?: string;
                createdAt?: Date;
                updatedAt?: Date;
            };
            account?: {
                id?: string;
                createdAt?: Date;
                updatedAt?: Date;
                userId?: string;
                provider?: string;
                providerAccountId?: string;
                accessToken?: string;
                refreshToken?: string;
                expiresAt?: number;
            };
        }, {
            user?: {
                id?: string;
                email?: string;
                name?: string;
                emailVerified?: boolean;
                image?: string;
                createdAt?: Date;
                updatedAt?: Date;
            };
            account?: {
                id?: string;
                createdAt?: Date;
                updatedAt?: Date;
                userId?: string;
                provider?: string;
                providerAccountId?: string;
                accessToken?: string;
                refreshToken?: string;
                expiresAt?: number;
            };
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
                id?: string;
                email?: string;
                name?: string;
                emailVerified?: boolean;
                image?: string;
                createdAt?: Date;
                updatedAt?: Date;
            }, {
                id?: string;
                email?: string;
                name?: string;
                emailVerified?: boolean;
                image?: string;
                createdAt?: Date;
                updatedAt?: Date;
            }>;
        }, "strip", z.ZodTypeAny, {
            user?: {
                id?: string;
                email?: string;
                name?: string;
                emailVerified?: boolean;
                image?: string;
                createdAt?: Date;
                updatedAt?: Date;
            };
        }, {
            user?: {
                id?: string;
                email?: string;
                name?: string;
                emailVerified?: boolean;
                image?: string;
                createdAt?: Date;
                updatedAt?: Date;
            };
        }>], z.ZodUnknown>, z.ZodVoid>>;
    }, "strip", z.ZodTypeAny, {
        onSignUp?: (args_0: {
            user?: {
                id?: string;
                email?: string;
                name?: string;
                emailVerified?: boolean;
                image?: string;
                createdAt?: Date;
                updatedAt?: Date;
            };
        }, ...args: unknown[]) => void;
        onSignIn?: (args_0: {
            user?: {
                id?: string;
                email?: string;
                name?: string;
                emailVerified?: boolean;
                image?: string;
                createdAt?: Date;
                updatedAt?: Date;
            };
            account?: {
                id?: string;
                createdAt?: Date;
                updatedAt?: Date;
                userId?: string;
                provider?: string;
                providerAccountId?: string;
                accessToken?: string;
                refreshToken?: string;
                expiresAt?: number;
            };
        }, ...args: unknown[]) => void;
        onSignOut?: (args_0: {
            user?: {
                id?: string;
                email?: string;
                name?: string;
                emailVerified?: boolean;
                image?: string;
                createdAt?: Date;
                updatedAt?: Date;
            };
        }, ...args: unknown[]) => void;
    }, {
        onSignUp?: (args_0: {
            user?: {
                id?: string;
                email?: string;
                name?: string;
                emailVerified?: boolean;
                image?: string;
                createdAt?: Date;
                updatedAt?: Date;
            };
        }, ...args: unknown[]) => void;
        onSignIn?: (args_0: {
            user?: {
                id?: string;
                email?: string;
                name?: string;
                emailVerified?: boolean;
                image?: string;
                createdAt?: Date;
                updatedAt?: Date;
            };
            account?: {
                id?: string;
                createdAt?: Date;
                updatedAt?: Date;
                userId?: string;
                provider?: string;
                providerAccountId?: string;
                accessToken?: string;
                refreshToken?: string;
                expiresAt?: number;
            };
        }, ...args: unknown[]) => void;
        onSignOut?: (args_0: {
            user?: {
                id?: string;
                email?: string;
                name?: string;
                emailVerified?: boolean;
                image?: string;
                createdAt?: Date;
                updatedAt?: Date;
            };
        }, ...args: unknown[]) => void;
    }>>;
}, "strip", z.ZodTypeAny, {
    database?: {
        type?: "postgres";
        url?: string;
    };
    session?: {
        strategy?: "database" | "jwt";
        maxAge?: number;
        secret?: string;
    };
    providers?: {
        emailPassword?: {
            enabled?: boolean;
        };
        google?: {
            scope?: string;
            clientId?: string;
            clientSecret?: string;
        };
        github?: {
            scope?: string;
            clientId?: string;
            clientSecret?: string;
        };
    };
    callbacks?: {
        onSignUp?: (args_0: {
            user?: {
                id?: string;
                email?: string;
                name?: string;
                emailVerified?: boolean;
                image?: string;
                createdAt?: Date;
                updatedAt?: Date;
            };
        }, ...args: unknown[]) => void;
        onSignIn?: (args_0: {
            user?: {
                id?: string;
                email?: string;
                name?: string;
                emailVerified?: boolean;
                image?: string;
                createdAt?: Date;
                updatedAt?: Date;
            };
            account?: {
                id?: string;
                createdAt?: Date;
                updatedAt?: Date;
                userId?: string;
                provider?: string;
                providerAccountId?: string;
                accessToken?: string;
                refreshToken?: string;
                expiresAt?: number;
            };
        }, ...args: unknown[]) => void;
        onSignOut?: (args_0: {
            user?: {
                id?: string;
                email?: string;
                name?: string;
                emailVerified?: boolean;
                image?: string;
                createdAt?: Date;
                updatedAt?: Date;
            };
        }, ...args: unknown[]) => void;
    };
}, {
    database?: {
        type?: "postgres";
        url?: string;
    };
    session?: {
        strategy?: "database" | "jwt";
        maxAge?: number;
        secret?: string;
    };
    providers?: {
        emailPassword?: {
            enabled?: boolean;
        };
        google?: {
            scope?: string;
            clientId?: string;
            clientSecret?: string;
        };
        github?: {
            scope?: string;
            clientId?: string;
            clientSecret?: string;
        };
    };
    callbacks?: {
        onSignUp?: (args_0: {
            user?: {
                id?: string;
                email?: string;
                name?: string;
                emailVerified?: boolean;
                image?: string;
                createdAt?: Date;
                updatedAt?: Date;
            };
        }, ...args: unknown[]) => void;
        onSignIn?: (args_0: {
            user?: {
                id?: string;
                email?: string;
                name?: string;
                emailVerified?: boolean;
                image?: string;
                createdAt?: Date;
                updatedAt?: Date;
            };
            account?: {
                id?: string;
                createdAt?: Date;
                updatedAt?: Date;
                userId?: string;
                provider?: string;
                providerAccountId?: string;
                accessToken?: string;
                refreshToken?: string;
                expiresAt?: number;
            };
        }, ...args: unknown[]) => void;
        onSignOut?: (args_0: {
            user?: {
                id?: string;
                email?: string;
                name?: string;
                emailVerified?: boolean;
                image?: string;
                createdAt?: Date;
                updatedAt?: Date;
            };
        }, ...args: unknown[]) => void;
    };
}>;
type AuthConfig = z.infer<typeof AuthConfigSchema>;
interface OAuthProvider {
    id: string;
    name: string;
    authorizationUrl: string;
    tokenUrl: string;
    userInfoUrl: string;
    clientId: string;
    clientSecret: string;
    scope: string;
    redirectUri?: string;
}
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
interface AuthRequest {
    method: string;
    url: string;
    headers: Record<string, string>;
    body?: unknown;
    query?: Record<string, string>;
}
interface AuthResponse {
    status: number;
    headers?: Record<string, string>;
    body?: unknown;
    redirect?: string;
}
declare class AuthError extends Error {
    code: string;
    status: number;
    constructor(message: string, code: string, status?: number);
}
declare class ConfigError extends AuthError {
    constructor(message: string);
}
declare class DatabaseError extends AuthError {
    constructor(message: string);
}
declare class ValidationError extends AuthError {
    constructor(message: string);
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
declare class AuthEngine {
    private db;
    private passwordAuth;
    private oauthManager;
    private sessionManager;
    private config;
    private callbacks;
    constructor(config: AuthConfig, callbacks?: AuthEngineCallbacks);
    private validateConfig;
    private configureOAuthProviders;
    initialize(): Promise<void>;
    signUpWithPassword(email: string, password: string, name?: string): Promise<SignUpResult>;
    signInWithPassword(email: string, password: string): Promise<{
        result: SignInResult;
        session?: Session;
    }>;
    getOAuthAuthorizationUrl(provider: string, redirectUri: string, state: string): string;
    handleOAuthCallback(provider: string, code: string, redirectUri: string, state?: string): Promise<{
        result: SignInResult;
        session?: Session;
    }>;
    getSession(sessionToken: string): Promise<{
        user: User;
        session: Session;
    } | null>;
    refreshSession(sessionToken: string): Promise<Session | null>;
    signOut(sessionToken: string): Promise<boolean>;
    signOutAllSessions(userId: string): Promise<number>;
    updatePassword(userId: string, oldPassword: string, newPassword: string): Promise<boolean>;
    requestPasswordReset(email: string): Promise<string | null>;
    resetPassword(email: string, newPassword: string, token: string): Promise<boolean>;
    createSessionCookie(sessionToken: string): string;
    createLogoutCookie(): string;
    getSessionFromCookies(cookieHeader: string): string | null;
    getConfiguredOAuthProviders(): Array<{
        id: string;
        name: string;
    }>;
    cleanupExpiredSessions(): Promise<number>;
    cleanupExpiredTokens(): Promise<number>;
    getDatabase(): Database;
    close(): Promise<void>;
    health(): Promise<{
        status: 'ok' | 'error';
        database: boolean;
        error?: string;
    }>;
}

declare function generateId(prefix?: string): string;
declare function hashPassword(password: string): Promise<string>;
declare function verifyPassword(password: string, hash: string): Promise<boolean>;
interface CookieOptions {
    httpOnly?: boolean;
    secure?: boolean;
    sameSite?: 'strict' | 'lax' | 'none';
    maxAge?: number;
    path?: string;
    domain?: string;
}

interface SessionData {
    user: User;
    session: Session;
}
declare class SessionManager {
    private db;
    private strategy;
    private maxAge;
    private secret;
    private cookieName;
    constructor(db: Database, config: Pick<AuthConfig, 'session'>);
    createSession(user: User): Promise<Session>;
    getSession(sessionToken: string): Promise<SessionData | null>;
    private getDatabaseSession;
    private getJWTSession;
    updateSession(sessionToken: string): Promise<Session | null>;
    deleteSession(sessionToken: string): Promise<boolean>;
    deleteAllUserSessions(userId: string): Promise<number>;
    cleanupExpiredSessions(): Promise<number>;
    createSessionCookie(sessionToken: string, options?: Partial<CookieOptions>): string;
    getSessionFromCookies(cookieHeader: string): string | null;
    createLogoutCookie(options?: Partial<CookieOptions>): string;
    validateSession(sessionToken: string): Promise<{
        user: User;
        session: Session;
    } | null>;
    getSessionInfo(sessionToken: string): Promise<{
        valid: boolean;
        expired: boolean;
        user?: User;
        session?: Session;
        error?: string;
    }>;
}

declare class PasswordAuth {
    private db;
    constructor(db: Database);
    signUp(email: string, password: string, name?: string): Promise<SignUpResult>;
    signIn(email: string, password: string): Promise<SignInResult>;
    updatePassword(userId: string, oldPassword: string, newPassword: string): Promise<boolean>;
    resetPassword(email: string, newPassword: string, token: string): Promise<boolean>;
    generatePasswordResetToken(email: string): Promise<string | null>;
}

declare class OAuthManager {
    private db;
    private providers;
    constructor(db: Database);
    private initializeDefaultProviders;
    configureProvider(providerId: string, config: {
        clientId: string;
        clientSecret: string;
        scope?: string;
    }): void;
    addCustomProvider(provider: OAuthProvider): void;
    generateAuthorizationUrl(providerId: string, redirectUri: string, state: string): string;
    handleCallback(providerId: string, code: string, redirectUri: string, state?: string): Promise<SignInResult>;
    private exchangeCodeForTokens;
    private getUserProfile;
    private findOrCreateUser;
    private createAccountLink;
    private updateAccountTokens;
    getProvider(providerId: string): OAuthProvider | undefined;
    getConfiguredProviders(): OAuthProvider[];
}

declare const schema: {
    users: drizzle_orm_pg_core.PgTableWithColumns<{
        name: "users";
        schema: undefined;
        columns: {
            id: drizzle_orm_pg_core.PgColumn<{
                name: "id";
                tableName: "users";
                dataType: "string";
                columnType: "PgText";
                data: string;
                driverParam: string;
                notNull: true;
                hasDefault: false;
                enumValues: [string, ...string[]];
                baseColumn: never;
            }, {}, {}>;
            email: drizzle_orm_pg_core.PgColumn<{
                name: "email";
                tableName: "users";
                dataType: "string";
                columnType: "PgText";
                data: string;
                driverParam: string;
                notNull: true;
                hasDefault: false;
                enumValues: [string, ...string[]];
                baseColumn: never;
            }, {}, {}>;
            name: drizzle_orm_pg_core.PgColumn<{
                name: "name";
                tableName: "users";
                dataType: "string";
                columnType: "PgText";
                data: string;
                driverParam: string;
                notNull: false;
                hasDefault: false;
                enumValues: [string, ...string[]];
                baseColumn: never;
            }, {}, {}>;
            passwordHash: drizzle_orm_pg_core.PgColumn<{
                name: "password_hash";
                tableName: "users";
                dataType: "string";
                columnType: "PgText";
                data: string;
                driverParam: string;
                notNull: false;
                hasDefault: false;
                enumValues: [string, ...string[]];
                baseColumn: never;
            }, {}, {}>;
            emailVerified: drizzle_orm_pg_core.PgColumn<{
                name: "email_verified";
                tableName: "users";
                dataType: "boolean";
                columnType: "PgBoolean";
                data: boolean;
                driverParam: boolean;
                notNull: false;
                hasDefault: true;
                enumValues: undefined;
                baseColumn: never;
            }, {}, {}>;
            image: drizzle_orm_pg_core.PgColumn<{
                name: "image";
                tableName: "users";
                dataType: "string";
                columnType: "PgText";
                data: string;
                driverParam: string;
                notNull: false;
                hasDefault: false;
                enumValues: [string, ...string[]];
                baseColumn: never;
            }, {}, {}>;
            createdAt: drizzle_orm_pg_core.PgColumn<{
                name: "created_at";
                tableName: "users";
                dataType: "date";
                columnType: "PgTimestamp";
                data: Date;
                driverParam: string;
                notNull: true;
                hasDefault: true;
                enumValues: undefined;
                baseColumn: never;
            }, {}, {}>;
            updatedAt: drizzle_orm_pg_core.PgColumn<{
                name: "updated_at";
                tableName: "users";
                dataType: "date";
                columnType: "PgTimestamp";
                data: Date;
                driverParam: string;
                notNull: true;
                hasDefault: true;
                enumValues: undefined;
                baseColumn: never;
            }, {}, {}>;
        };
        dialect: "pg";
    }>;
    accounts: drizzle_orm_pg_core.PgTableWithColumns<{
        name: "accounts";
        schema: undefined;
        columns: {
            id: drizzle_orm_pg_core.PgColumn<{
                name: "id";
                tableName: "accounts";
                dataType: "string";
                columnType: "PgText";
                data: string;
                driverParam: string;
                notNull: true;
                hasDefault: false;
                enumValues: [string, ...string[]];
                baseColumn: never;
            }, {}, {}>;
            userId: drizzle_orm_pg_core.PgColumn<{
                name: "user_id";
                tableName: "accounts";
                dataType: "string";
                columnType: "PgText";
                data: string;
                driverParam: string;
                notNull: true;
                hasDefault: false;
                enumValues: [string, ...string[]];
                baseColumn: never;
            }, {}, {}>;
            provider: drizzle_orm_pg_core.PgColumn<{
                name: "provider";
                tableName: "accounts";
                dataType: "string";
                columnType: "PgText";
                data: string;
                driverParam: string;
                notNull: true;
                hasDefault: false;
                enumValues: [string, ...string[]];
                baseColumn: never;
            }, {}, {}>;
            providerAccountId: drizzle_orm_pg_core.PgColumn<{
                name: "provider_account_id";
                tableName: "accounts";
                dataType: "string";
                columnType: "PgText";
                data: string;
                driverParam: string;
                notNull: true;
                hasDefault: false;
                enumValues: [string, ...string[]];
                baseColumn: never;
            }, {}, {}>;
            accessToken: drizzle_orm_pg_core.PgColumn<{
                name: "access_token";
                tableName: "accounts";
                dataType: "string";
                columnType: "PgText";
                data: string;
                driverParam: string;
                notNull: false;
                hasDefault: false;
                enumValues: [string, ...string[]];
                baseColumn: never;
            }, {}, {}>;
            refreshToken: drizzle_orm_pg_core.PgColumn<{
                name: "refresh_token";
                tableName: "accounts";
                dataType: "string";
                columnType: "PgText";
                data: string;
                driverParam: string;
                notNull: false;
                hasDefault: false;
                enumValues: [string, ...string[]];
                baseColumn: never;
            }, {}, {}>;
            expiresAt: drizzle_orm_pg_core.PgColumn<{
                name: "expires_at";
                tableName: "accounts";
                dataType: "number";
                columnType: "PgInteger";
                data: number;
                driverParam: string | number;
                notNull: false;
                hasDefault: false;
                enumValues: undefined;
                baseColumn: never;
            }, {}, {}>;
            tokenType: drizzle_orm_pg_core.PgColumn<{
                name: "token_type";
                tableName: "accounts";
                dataType: "string";
                columnType: "PgText";
                data: string;
                driverParam: string;
                notNull: false;
                hasDefault: false;
                enumValues: [string, ...string[]];
                baseColumn: never;
            }, {}, {}>;
            scope: drizzle_orm_pg_core.PgColumn<{
                name: "scope";
                tableName: "accounts";
                dataType: "string";
                columnType: "PgText";
                data: string;
                driverParam: string;
                notNull: false;
                hasDefault: false;
                enumValues: [string, ...string[]];
                baseColumn: never;
            }, {}, {}>;
            idToken: drizzle_orm_pg_core.PgColumn<{
                name: "id_token";
                tableName: "accounts";
                dataType: "string";
                columnType: "PgText";
                data: string;
                driverParam: string;
                notNull: false;
                hasDefault: false;
                enumValues: [string, ...string[]];
                baseColumn: never;
            }, {}, {}>;
            createdAt: drizzle_orm_pg_core.PgColumn<{
                name: "created_at";
                tableName: "accounts";
                dataType: "date";
                columnType: "PgTimestamp";
                data: Date;
                driverParam: string;
                notNull: true;
                hasDefault: true;
                enumValues: undefined;
                baseColumn: never;
            }, {}, {}>;
            updatedAt: drizzle_orm_pg_core.PgColumn<{
                name: "updated_at";
                tableName: "accounts";
                dataType: "date";
                columnType: "PgTimestamp";
                data: Date;
                driverParam: string;
                notNull: true;
                hasDefault: true;
                enumValues: undefined;
                baseColumn: never;
            }, {}, {}>;
        };
        dialect: "pg";
    }>;
    sessions: drizzle_orm_pg_core.PgTableWithColumns<{
        name: "sessions";
        schema: undefined;
        columns: {
            id: drizzle_orm_pg_core.PgColumn<{
                name: "id";
                tableName: "sessions";
                dataType: "string";
                columnType: "PgText";
                data: string;
                driverParam: string;
                notNull: true;
                hasDefault: false;
                enumValues: [string, ...string[]];
                baseColumn: never;
            }, {}, {}>;
            userId: drizzle_orm_pg_core.PgColumn<{
                name: "user_id";
                tableName: "sessions";
                dataType: "string";
                columnType: "PgText";
                data: string;
                driverParam: string;
                notNull: true;
                hasDefault: false;
                enumValues: [string, ...string[]];
                baseColumn: never;
            }, {}, {}>;
            sessionToken: drizzle_orm_pg_core.PgColumn<{
                name: "session_token";
                tableName: "sessions";
                dataType: "string";
                columnType: "PgText";
                data: string;
                driverParam: string;
                notNull: true;
                hasDefault: false;
                enumValues: [string, ...string[]];
                baseColumn: never;
            }, {}, {}>;
            expiresAt: drizzle_orm_pg_core.PgColumn<{
                name: "expires_at";
                tableName: "sessions";
                dataType: "date";
                columnType: "PgTimestamp";
                data: Date;
                driverParam: string;
                notNull: true;
                hasDefault: false;
                enumValues: undefined;
                baseColumn: never;
            }, {}, {}>;
            createdAt: drizzle_orm_pg_core.PgColumn<{
                name: "created_at";
                tableName: "sessions";
                dataType: "date";
                columnType: "PgTimestamp";
                data: Date;
                driverParam: string;
                notNull: true;
                hasDefault: true;
                enumValues: undefined;
                baseColumn: never;
            }, {}, {}>;
            updatedAt: drizzle_orm_pg_core.PgColumn<{
                name: "updated_at";
                tableName: "sessions";
                dataType: "date";
                columnType: "PgTimestamp";
                data: Date;
                driverParam: string;
                notNull: true;
                hasDefault: true;
                enumValues: undefined;
                baseColumn: never;
            }, {}, {}>;
        };
        dialect: "pg";
    }>;
    verificationTokens: drizzle_orm_pg_core.PgTableWithColumns<{
        name: "verification_tokens";
        schema: undefined;
        columns: {
            id: drizzle_orm_pg_core.PgColumn<{
                name: "id";
                tableName: "verification_tokens";
                dataType: "string";
                columnType: "PgText";
                data: string;
                driverParam: string;
                notNull: true;
                hasDefault: false;
                enumValues: [string, ...string[]];
                baseColumn: never;
            }, {}, {}>;
            identifier: drizzle_orm_pg_core.PgColumn<{
                name: "identifier";
                tableName: "verification_tokens";
                dataType: "string";
                columnType: "PgText";
                data: string;
                driverParam: string;
                notNull: true;
                hasDefault: false;
                enumValues: [string, ...string[]];
                baseColumn: never;
            }, {}, {}>;
            token: drizzle_orm_pg_core.PgColumn<{
                name: "token";
                tableName: "verification_tokens";
                dataType: "string";
                columnType: "PgText";
                data: string;
                driverParam: string;
                notNull: true;
                hasDefault: false;
                enumValues: [string, ...string[]];
                baseColumn: never;
            }, {}, {}>;
            type: drizzle_orm_pg_core.PgColumn<{
                name: "type";
                tableName: "verification_tokens";
                dataType: "string";
                columnType: "PgText";
                data: string;
                driverParam: string;
                notNull: true;
                hasDefault: false;
                enumValues: [string, ...string[]];
                baseColumn: never;
            }, {}, {}>;
            expiresAt: drizzle_orm_pg_core.PgColumn<{
                name: "expires_at";
                tableName: "verification_tokens";
                dataType: "date";
                columnType: "PgTimestamp";
                data: Date;
                driverParam: string;
                notNull: true;
                hasDefault: false;
                enumValues: undefined;
                baseColumn: never;
            }, {}, {}>;
            createdAt: drizzle_orm_pg_core.PgColumn<{
                name: "created_at";
                tableName: "verification_tokens";
                dataType: "date";
                columnType: "PgTimestamp";
                data: Date;
                driverParam: string;
                notNull: true;
                hasDefault: true;
                enumValues: undefined;
                baseColumn: never;
            }, {}, {}>;
        };
        dialect: "pg";
    }>;
    usersRelations: drizzle_orm.Relations<"users", {
        accounts: drizzle_orm.Many<"accounts">;
        sessions: drizzle_orm.Many<"sessions">;
    }>;
    accountsRelations: drizzle_orm.Relations<"accounts", {
        user: drizzle_orm.One<"users", true>;
    }>;
    sessionsRelations: drizzle_orm.Relations<"sessions", {
        user: drizzle_orm.One<"users", true>;
    }>;
};

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

export { AccountSchema, AuthConfigSchema, AuthEngine, AuthError, ConfigError, Database, DatabaseError, EasyAuth, OAuthManager, PasswordAuth, SessionManager, SessionSchema, UserSchema, ValidationError, generateId, hashPassword, schema, verifyPassword };
export type { Account, AuthConfig, AuthRequest, AuthResponse, OAuthProvider, Session, SignInResult, SignUpResult, User };
