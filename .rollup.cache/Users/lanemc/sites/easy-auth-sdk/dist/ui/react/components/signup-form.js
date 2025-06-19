import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import * as React from 'react';
import { Button } from './button';
import { Input } from './input';
import { Label } from './label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card';
import { Separator } from './separator';
import { OAuthButton } from './oauth-button';
import { cn } from '../utils';
const SignUpForm = React.forwardRef(({ onSubmit, onOAuthSignIn, onSignInClick, providers = [], loading = false, error, title = 'Create your account', description = 'Enter your details to create a new account', showSignInLink = true, requireName = false, className, ...props }, ref) => {
    const [email, setEmail] = React.useState('');
    const [password, setPassword] = React.useState('');
    const [confirmPassword, setConfirmPassword] = React.useState('');
    const [name, setName] = React.useState('');
    const [isSubmitting, setIsSubmitting] = React.useState(false);
    const [passwordStrength, setPasswordStrength] = React.useState({ isValid: false, errors: [] });
    const validatePasswordStrength = (password) => {
        const errors = [];
        if (password.length < 8) {
            errors.push('At least 8 characters');
        }
        if (!/[a-z]/.test(password)) {
            errors.push('One lowercase letter');
        }
        if (!/[A-Z]/.test(password)) {
            errors.push('One uppercase letter');
        }
        if (!/\d/.test(password)) {
            errors.push('One number');
        }
        return {
            isValid: errors.length === 0,
            errors
        };
    };
    React.useEffect(() => {
        if (password) {
            setPasswordStrength(validatePasswordStrength(password));
        }
    }, [password]);
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (isSubmitting || loading)
            return;
        // Validate passwords match
        if (password !== confirmPassword) {
            return;
        }
        // Validate password strength
        if (!passwordStrength.isValid) {
            return;
        }
        setIsSubmitting(true);
        try {
            await onSubmit(email, password, name || undefined);
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
    const passwordsMatch = password === confirmPassword;
    const canSubmit = email && password && confirmPassword && passwordsMatch && passwordStrength.isValid && (!requireName || name);
    return (_jsxs(Card, { ref: ref, className: cn('w-full max-w-md mx-auto', className), ...props, children: [_jsxs(CardHeader, { className: "space-y-1", children: [_jsx(CardTitle, { className: "text-2xl text-center", children: title }), _jsx(CardDescription, { className: "text-center", children: description })] }), _jsxs(CardContent, { className: "space-y-4", children: [providers.length > 0 && (_jsxs("div", { className: "space-y-2", children: [providers.map((provider) => (_jsx(OAuthButton, { provider: provider.id, onClick: () => handleOAuthClick(provider.id), disabled: isLoading }, provider.id))), _jsxs("div", { className: "relative", children: [_jsx("div", { className: "absolute inset-0 flex items-center", children: _jsx(Separator, {}) }), _jsx("div", { className: "relative flex justify-center text-xs uppercase", children: _jsx("span", { className: "bg-background px-2 text-muted-foreground", children: "Or continue with" }) })] })] })), error && (_jsx("div", { className: "p-3 text-sm text-destructive-foreground bg-destructive/10 border border-destructive/20 rounded-md", children: error })), _jsxs("form", { onSubmit: handleSubmit, className: "space-y-4", children: [_jsxs("div", { className: "space-y-2", children: [_jsxs(Label, { htmlFor: "name", children: ["Name ", requireName && _jsx("span", { className: "text-destructive", children: "*" })] }), _jsx(Input, { id: "name", type: "text", placeholder: "Enter your full name", value: name, onChange: (e) => setName(e.target.value), disabled: isLoading, required: requireName })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "email", children: "Email *" }), _jsx(Input, { id: "email", type: "email", placeholder: "name@example.com", value: email, onChange: (e) => setEmail(e.target.value), disabled: isLoading, required: true })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "password", children: "Password *" }), _jsx(Input, { id: "password", type: "password", placeholder: "Create a strong password", value: password, onChange: (e) => setPassword(e.target.value), disabled: isLoading, required: true }), password && (_jsxs("div", { className: "text-xs space-y-1", children: [_jsx("div", { className: "text-muted-foreground", children: "Password must contain:" }), _jsxs("div", { className: "space-y-1", children: [passwordStrength.errors.map((error, index) => (_jsxs("div", { className: "flex items-center space-x-1", children: [_jsx("div", { className: "h-1.5 w-1.5 rounded-full bg-destructive" }), _jsx("span", { className: "text-destructive", children: error })] }, index))), passwordStrength.isValid && (_jsxs("div", { className: "flex items-center space-x-1", children: [_jsx("div", { className: "h-1.5 w-1.5 rounded-full bg-green-500" }), _jsx("span", { className: "text-green-600", children: "Strong password" })] }))] })] }))] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "confirmPassword", children: "Confirm Password *" }), _jsx(Input, { id: "confirmPassword", type: "password", placeholder: "Confirm your password", value: confirmPassword, onChange: (e) => setConfirmPassword(e.target.value), disabled: isLoading, required: true }), confirmPassword && !passwordsMatch && (_jsx("div", { className: "text-xs text-destructive", children: "Passwords do not match" }))] }), _jsx(Button, { type: "submit", className: "w-full", disabled: isLoading || !canSubmit, children: isLoading ? (_jsxs(_Fragment, { children: [_jsx("div", { className: "mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" }), "Creating account..."] })) : ('Create account') })] }), showSignInLink && (_jsxs("div", { className: "text-center text-sm", children: ["Already have an account?", ' ', _jsx("button", { type: "button", onClick: onSignInClick, className: "text-primary hover:underline font-medium", disabled: isLoading, children: "Sign in" })] }))] })] }));
});
SignUpForm.displayName = 'SignUpForm';
export { SignUpForm };
//# sourceMappingURL=signup-form.js.map