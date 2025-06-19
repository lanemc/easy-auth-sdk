import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import * as React from 'react';
import { Button } from './button';
import { Input } from './input';
import { Label } from './label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card';
import { cn } from '../utils';
const PasswordResetForm = React.forwardRef(({ onSubmit, onBackToSignIn, loading = false, error, success = false, title = 'Reset your password', description = 'Enter your email and we\'ll send you a reset link', className, ...props }, ref) => {
    const [email, setEmail] = React.useState('');
    const [isSubmitting, setIsSubmitting] = React.useState(false);
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (isSubmitting || loading)
            return;
        setIsSubmitting(true);
        try {
            await onSubmit(email);
        }
        finally {
            setIsSubmitting(false);
        }
    };
    const isLoading = loading || isSubmitting;
    if (success) {
        return (_jsxs(Card, { ref: ref, className: cn('w-full max-w-md mx-auto', className), ...props, children: [_jsxs(CardHeader, { className: "space-y-1", children: [_jsx(CardTitle, { className: "text-2xl text-center", children: "Check your email" }), _jsxs(CardDescription, { className: "text-center", children: ["We've sent a password reset link to ", email] })] }), _jsxs(CardContent, { className: "space-y-4", children: [_jsxs("div", { className: "text-center", children: [_jsx("div", { className: "mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4", children: _jsx("svg", { className: "w-6 h-6 text-green-600", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M5 13l4 4L19 7" }) }) }), _jsx("p", { className: "text-sm text-muted-foreground mb-4", children: "Click the link in the email to reset your password. If you don't see it, check your spam folder." })] }), _jsx(Button, { type: "button", variant: "outline", className: "w-full", onClick: onBackToSignIn, children: "Back to sign in" })] })] }));
    }
    return (_jsxs(Card, { ref: ref, className: cn('w-full max-w-md mx-auto', className), ...props, children: [_jsxs(CardHeader, { className: "space-y-1", children: [_jsx(CardTitle, { className: "text-2xl text-center", children: title }), _jsx(CardDescription, { className: "text-center", children: description })] }), _jsxs(CardContent, { className: "space-y-4", children: [error && (_jsx("div", { className: "p-3 text-sm text-destructive-foreground bg-destructive/10 border border-destructive/20 rounded-md", children: error })), _jsxs("form", { onSubmit: handleSubmit, className: "space-y-4", children: [_jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "email", children: "Email" }), _jsx(Input, { id: "email", type: "email", placeholder: "name@example.com", value: email, onChange: (e) => setEmail(e.target.value), disabled: isLoading, required: true })] }), _jsx(Button, { type: "submit", className: "w-full", disabled: isLoading || !email, children: isLoading ? (_jsxs(_Fragment, { children: [_jsx("div", { className: "mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" }), "Sending reset link..."] })) : ('Send reset link') })] }), _jsx("div", { className: "text-center", children: _jsx("button", { type: "button", onClick: onBackToSignIn, className: "text-sm text-primary hover:underline", disabled: isLoading, children: "Back to sign in" }) })] })] }));
});
PasswordResetForm.displayName = 'PasswordResetForm';
export { PasswordResetForm };
//# sourceMappingURL=password-reset-form.js.map