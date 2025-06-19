import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import * as React from 'react';
import { Button } from './button';
import { Input } from './input';
import { Label } from './label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card';
import { Separator } from './separator';
import { OAuthButton } from './oauth-button';
import { cn } from '../utils';
const LoginForm = React.forwardRef(({ onSubmit, onOAuthSignIn, onSignUpClick, onForgotPasswordClick, providers = [], loading = false, error, title = 'Sign in to your account', description = 'Enter your email and password to sign in', showSignUpLink = true, showForgotPasswordLink = true, className, ...props }, ref) => {
    const [email, setEmail] = React.useState('');
    const [password, setPassword] = React.useState('');
    const [isSubmitting, setIsSubmitting] = React.useState(false);
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (isSubmitting || loading)
            return;
        setIsSubmitting(true);
        try {
            await onSubmit(email, password);
        }
        finally {
            setIsSubmitting(false);
        }
    };
    const handleOAuthClick = async (provider) => {
        if (onOAuthSignIn && !loading && !isSubmitting) {
            await onOAuthSignIn(provider);
        }
    };
    const isLoading = loading || isSubmitting;
    return (_jsxs(Card, { ref: ref, className: cn('w-full max-w-md mx-auto', className), ...props, children: [_jsxs(CardHeader, { className: "space-y-1", children: [_jsx(CardTitle, { className: "text-2xl text-center", children: title }), _jsx(CardDescription, { className: "text-center", children: description })] }), _jsxs(CardContent, { className: "space-y-4", children: [providers.length > 0 && (_jsxs("div", { className: "space-y-2", children: [providers.map((provider) => (_jsx(OAuthButton, { provider: provider.id, onClick: () => handleOAuthClick(provider.id), disabled: isLoading }, provider.id))), _jsxs("div", { className: "relative", children: [_jsx("div", { className: "absolute inset-0 flex items-center", children: _jsx(Separator, {}) }), _jsx("div", { className: "relative flex justify-center text-xs uppercase", children: _jsx("span", { className: "bg-background px-2 text-muted-foreground", children: "Or continue with" }) })] })] })), error && (_jsx("div", { className: "p-3 text-sm text-destructive-foreground bg-destructive/10 border border-destructive/20 rounded-md", children: error })), _jsxs("form", { onSubmit: handleSubmit, className: "space-y-4", children: [_jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "email", children: "Email" }), _jsx(Input, { id: "email", type: "email", placeholder: "name@example.com", value: email, onChange: (e) => setEmail(e.target.value), disabled: isLoading, required: true })] }), _jsxs("div", { className: "space-y-2", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx(Label, { htmlFor: "password", children: "Password" }), showForgotPasswordLink && (_jsx("button", { type: "button", onClick: onForgotPasswordClick, className: "text-sm text-primary hover:underline", disabled: isLoading, children: "Forgot password?" }))] }), _jsx(Input, { id: "password", type: "password", placeholder: "Enter your password", value: password, onChange: (e) => setPassword(e.target.value), disabled: isLoading, required: true })] }), _jsx(Button, { type: "submit", className: "w-full", disabled: isLoading, children: isLoading ? (_jsxs(_Fragment, { children: [_jsx("div", { className: "mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" }), "Signing in..."] })) : ('Sign in') })] }), showSignUpLink && (_jsxs("div", { className: "text-center text-sm", children: ["Don't have an account?", ' ', _jsx("button", { type: "button", onClick: onSignUpClick, className: "text-primary hover:underline font-medium", disabled: isLoading, children: "Sign up" })] }))] })] }));
});
LoginForm.displayName = 'LoginForm';
export { LoginForm };
//# sourceMappingURL=login-form.js.map