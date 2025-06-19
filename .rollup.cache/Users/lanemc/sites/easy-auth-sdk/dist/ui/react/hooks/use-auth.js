import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import * as React from 'react';
const AuthContext = React.createContext(null);
export function AuthProvider({ children, onSignIn, onSignUp, onSignOut, onOAuthSignIn, onPasswordReset, onGetSession, initialUser = null, initialSession = null }) {
    const [user, setUser] = React.useState(initialUser);
    const [session, setSession] = React.useState(initialSession);
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState(null);
    const clearError = React.useCallback(() => {
        setError(null);
    }, []);
    const signIn = React.useCallback(async (email, password) => {
        setLoading(true);
        setError(null);
        try {
            const result = await onSignIn(email, password);
            if (result.success && result.user) {
                setUser(result.user);
                setSession(result.session || null);
            }
            else {
                setError(result.error || 'Sign in failed');
            }
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'Sign in failed');
        }
        finally {
            setLoading(false);
        }
    }, [onSignIn]);
    const signUp = React.useCallback(async (email, password, name) => {
        setLoading(true);
        setError(null);
        try {
            const result = await onSignUp(email, password, name);
            if (result.success && result.user) {
                if (result.requiresVerification) {
                    setError('Please check your email to verify your account');
                }
                else {
                    setUser(result.user);
                }
            }
            else {
                setError(result.error || 'Sign up failed');
            }
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'Sign up failed');
        }
        finally {
            setLoading(false);
        }
    }, [onSignUp]);
    const signOut = React.useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            await onSignOut();
            setUser(null);
            setSession(null);
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'Sign out failed');
        }
        finally {
            setLoading(false);
        }
    }, [onSignOut]);
    const oauthSignIn = React.useCallback(async (provider) => {
        setLoading(true);
        setError(null);
        try {
            await onOAuthSignIn(provider);
            // OAuth redirect will handle the rest
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'OAuth sign in failed');
            setLoading(false);
        }
    }, [onOAuthSignIn]);
    const resetPassword = React.useCallback(async (email) => {
        setLoading(true);
        setError(null);
        try {
            await onPasswordReset(email);
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'Password reset failed');
        }
        finally {
            setLoading(false);
        }
    }, [onPasswordReset]);
    const refreshSession = React.useCallback(async () => {
        if (!onGetSession)
            return;
        try {
            const sessionData = await onGetSession();
            if (sessionData) {
                setUser(sessionData.user);
                setSession(sessionData.session);
            }
            else {
                setUser(null);
                setSession(null);
            }
        }
        catch (err) {
            setUser(null);
            setSession(null);
        }
    }, [onGetSession]);
    // Auto-refresh session on mount
    React.useEffect(() => {
        if (onGetSession && !user) {
            refreshSession();
        }
    }, [onGetSession, user, refreshSession]);
    const contextValue = {
        user,
        session,
        loading,
        error,
        signIn,
        signUp,
        signOut,
        oauthSignIn,
        resetPassword,
        clearError,
        refreshSession
    };
    return (_jsx(AuthContext.Provider, { value: contextValue, children: children }));
}
export function useAuth() {
    const context = React.useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
export function withAuth(Component, options = {}) {
    const WrappedComponent = React.forwardRef((props, ref) => {
        const { user, loading } = useAuth();
        const { fallback: Fallback, redirect = false } = options;
        if (loading) {
            return (_jsx("div", { className: "flex items-center justify-center p-4", children: _jsx("div", { className: "h-8 w-8 animate-spin rounded-full border-2 border-current border-t-transparent" }) }));
        }
        if (!user) {
            if (redirect && typeof window !== 'undefined') {
                window.location.href = '/login';
                return null;
            }
            if (Fallback) {
                return _jsx(Fallback, {});
            }
            return (_jsx("div", { className: "flex items-center justify-center p-4", children: _jsxs("div", { className: "text-center", children: [_jsx("h2", { className: "text-lg font-semibold", children: "Authentication Required" }), _jsx("p", { className: "text-muted-foreground", children: "Please sign in to access this page." })] }) }));
        }
        return _jsx(Component, { ...props, ref: ref });
    });
    WrappedComponent.displayName = `withAuth(${Component.displayName || Component.name})`;
    return WrappedComponent;
}
// Hook for conditional rendering based on auth state
export function useAuthGuard() {
    const { user, loading } = useAuth();
    return {
        isAuthenticated: !!user,
        isLoading: loading,
        user
    };
}
//# sourceMappingURL=use-auth.js.map