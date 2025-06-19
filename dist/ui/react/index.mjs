import { jsx, jsxs, Fragment } from 'react/jsx-runtime';
import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva } from 'class-variance-authority';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import * as LabelPrimitive from '@radix-ui/react-label';
import * as SeparatorPrimitive from '@radix-ui/react-separator';

function cn(...inputs) {
    return twMerge(clsx(inputs));
}
// Theme utilities
const authTheme = {
    colors: {
        primary: 'hsl(var(--primary))',
        primaryForeground: 'hsl(var(--primary-foreground))',
        secondary: 'hsl(var(--secondary))',
        secondaryForeground: 'hsl(var(--secondary-foreground))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: 'hsl(var(--card))',
        cardForeground: 'hsl(var(--card-foreground))',
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        destructive: 'hsl(var(--destructive))',
        destructiveForeground: 'hsl(var(--destructive-foreground))',
        muted: 'hsl(var(--muted))',
        mutedForeground: 'hsl(var(--muted-foreground))',
        accent: 'hsl(var(--accent))',
        accentForeground: 'hsl(var(--accent-foreground))'
    }
};
// Default CSS variables that should be included in the app's CSS
const cssVariables = `
:root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  --card: 0 0% 100%;
  --card-foreground: 222.2 84% 4.9%;
  --popover: 0 0% 100%;
  --popover-foreground: 222.2 84% 4.9%;
  --primary: 222.2 47.4% 11.2%;
  --primary-foreground: 210 40% 98%;
  --secondary: 210 40% 96%;
  --secondary-foreground: 222.2 47.4% 11.2%;
  --muted: 210 40% 96%;
  --muted-foreground: 215.4 16.3% 46.9%;
  --accent: 210 40% 96%;
  --accent-foreground: 222.2 47.4% 11.2%;
  --destructive: 0 84.2% 60.2%;
  --destructive-foreground: 210 40% 98%;
  --border: 214.3 31.8% 91.4%;
  --input: 214.3 31.8% 91.4%;
  --ring: 222.2 84% 4.9%;
  --radius: 0.5rem;
}

.dark {
  --background: 222.2 84% 4.9%;
  --foreground: 210 40% 98%;
  --card: 222.2 84% 4.9%;
  --card-foreground: 210 40% 98%;
  --popover: 222.2 84% 4.9%;
  --popover-foreground: 210 40% 98%;
  --primary: 210 40% 98%;
  --primary-foreground: 222.2 47.4% 11.2%;
  --secondary: 217.2 32.6% 17.5%;
  --secondary-foreground: 210 40% 98%;
  --muted: 217.2 32.6% 17.5%;
  --muted-foreground: 215 20.2% 65.1%;
  --accent: 217.2 32.6% 17.5%;
  --accent-foreground: 210 40% 98%;
  --destructive: 0 62.8% 30.6%;
  --destructive-foreground: 210 40% 98%;
  --border: 217.2 32.6% 17.5%;
  --input: 217.2 32.6% 17.5%;
  --ring: 212.7 26.8% 83.9%;
}
`;

const buttonVariants = cva('inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50', {
    variants: {
        variant: {
            default: 'bg-primary text-primary-foreground hover:bg-primary/90',
            destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
            outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
            secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
            ghost: 'hover:bg-accent hover:text-accent-foreground',
            link: 'text-primary underline-offset-4 hover:underline',
        },
        size: {
            default: 'h-10 px-4 py-2',
            sm: 'h-9 rounded-md px-3',
            lg: 'h-11 rounded-md px-8',
            icon: 'h-10 w-10',
        },
    },
    defaultVariants: {
        variant: 'default',
        size: 'default',
    },
});
const Button = React.forwardRef(({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (jsx(Comp, { className: cn(buttonVariants({ variant, size, className })), ref: ref, ...props }));
});
Button.displayName = 'Button';

const Input = React.forwardRef(({ className, type, ...props }, ref) => {
    return (jsx("input", { type: type, className: cn('flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50', className), ref: ref, ...props }));
});
Input.displayName = 'Input';

const labelVariants = cva('text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70');
const Label = React.forwardRef(({ className, ...props }, ref) => (jsx(LabelPrimitive.Root, { ref: ref, className: cn(labelVariants(), className), ...props })));
Label.displayName = LabelPrimitive.Root.displayName;

const Card = React.forwardRef(({ className, ...props }, ref) => (jsx("div", { ref: ref, className: cn('rounded-lg border bg-card text-card-foreground shadow-sm', className), ...props })));
Card.displayName = 'Card';
const CardHeader = React.forwardRef(({ className, ...props }, ref) => (jsx("div", { ref: ref, className: cn('flex flex-col space-y-1.5 p-6', className), ...props })));
CardHeader.displayName = 'CardHeader';
const CardTitle = React.forwardRef(({ className, ...props }, ref) => (jsx("h3", { ref: ref, className: cn('text-2xl font-semibold leading-none tracking-tight', className), ...props })));
CardTitle.displayName = 'CardTitle';
const CardDescription = React.forwardRef(({ className, ...props }, ref) => (jsx("p", { ref: ref, className: cn('text-sm text-muted-foreground', className), ...props })));
CardDescription.displayName = 'CardDescription';
const CardContent = React.forwardRef(({ className, ...props }, ref) => (jsx("div", { ref: ref, className: cn('p-6 pt-0', className), ...props })));
CardContent.displayName = 'CardContent';
const CardFooter = React.forwardRef(({ className, ...props }, ref) => (jsx("div", { ref: ref, className: cn('flex items-center p-6 pt-0', className), ...props })));
CardFooter.displayName = 'CardFooter';

const Separator = React.forwardRef(({ className, orientation = 'horizontal', decorative = true, ...props }, ref) => (jsx(SeparatorPrimitive.Root, { ref: ref, decorative: decorative, orientation: orientation, className: cn('shrink-0 bg-border', orientation === 'horizontal' ? 'h-[1px] w-full' : 'h-full w-[1px]', className), ...props })));
Separator.displayName = SeparatorPrimitive.Root.displayName;

const providerIcons = {
    google: (jsxs("svg", { viewBox: "0 0 24 24", className: "h-4 w-4", children: [jsx("path", { fill: "currentColor", d: "M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" }), jsx("path", { fill: "currentColor", d: "M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" }), jsx("path", { fill: "currentColor", d: "M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" }), jsx("path", { fill: "currentColor", d: "M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" })] })),
    github: (jsx("svg", { viewBox: "0 0 24 24", className: "h-4 w-4", children: jsx("path", { fill: "currentColor", d: "M12 0C5.374 0 0 5.373 0 12 0 17.302 3.438 21.8 8.207 23.387c.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" }) })),
    facebook: (jsx("svg", { viewBox: "0 0 24 24", className: "h-4 w-4", children: jsx("path", { fill: "currentColor", d: "M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" }) })),
    twitter: (jsx("svg", { viewBox: "0 0 24 24", className: "h-4 w-4", children: jsx("path", { fill: "currentColor", d: "M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" }) }))
};
const providerNames = {
    google: 'Google',
    github: 'GitHub',
    facebook: 'Facebook',
    twitter: 'Twitter'
};
const OAuthButton = React.forwardRef(({ provider, text, icon, className, variant = 'outline', ...props }, ref) => {
    const defaultText = text || `Continue with ${providerNames[provider]}`;
    const defaultIcon = icon || providerIcons[provider];
    return (jsxs(Button, { ref: ref, variant: variant, className: cn('w-full', className), ...props, children: [defaultIcon, jsx("span", { className: "ml-2", children: defaultText })] }));
});
OAuthButton.displayName = 'OAuthButton';

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
    return (jsxs(Card, { ref: ref, className: cn('w-full max-w-md mx-auto', className), ...props, children: [jsxs(CardHeader, { className: "space-y-1", children: [jsx(CardTitle, { className: "text-2xl text-center", children: title }), jsx(CardDescription, { className: "text-center", children: description })] }), jsxs(CardContent, { className: "space-y-4", children: [providers.length > 0 && (jsxs("div", { className: "space-y-2", children: [providers.map((provider) => (jsx(OAuthButton, { provider: provider.id, onClick: () => handleOAuthClick(provider.id), disabled: isLoading }, provider.id))), jsxs("div", { className: "relative", children: [jsx("div", { className: "absolute inset-0 flex items-center", children: jsx(Separator, {}) }), jsx("div", { className: "relative flex justify-center text-xs uppercase", children: jsx("span", { className: "bg-background px-2 text-muted-foreground", children: "Or continue with" }) })] })] })), error && (jsx("div", { className: "p-3 text-sm text-destructive-foreground bg-destructive/10 border border-destructive/20 rounded-md", children: error })), jsxs("form", { onSubmit: handleSubmit, className: "space-y-4", children: [jsxs("div", { className: "space-y-2", children: [jsx(Label, { htmlFor: "email", children: "Email" }), jsx(Input, { id: "email", type: "email", placeholder: "name@example.com", value: email, onChange: (e) => setEmail(e.target.value), disabled: isLoading, required: true })] }), jsxs("div", { className: "space-y-2", children: [jsxs("div", { className: "flex items-center justify-between", children: [jsx(Label, { htmlFor: "password", children: "Password" }), showForgotPasswordLink && (jsx("button", { type: "button", onClick: onForgotPasswordClick, className: "text-sm text-primary hover:underline", disabled: isLoading, children: "Forgot password?" }))] }), jsx(Input, { id: "password", type: "password", placeholder: "Enter your password", value: password, onChange: (e) => setPassword(e.target.value), disabled: isLoading, required: true })] }), jsx(Button, { type: "submit", className: "w-full", disabled: isLoading, children: isLoading ? (jsxs(Fragment, { children: [jsx("div", { className: "mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" }), "Signing in..."] })) : ('Sign in') })] }), showSignUpLink && (jsxs("div", { className: "text-center text-sm", children: ["Don't have an account?", ' ', jsx("button", { type: "button", onClick: onSignUpClick, className: "text-primary hover:underline font-medium", disabled: isLoading, children: "Sign up" })] }))] })] }));
});
LoginForm.displayName = 'LoginForm';

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
    return (jsxs(Card, { ref: ref, className: cn('w-full max-w-md mx-auto', className), ...props, children: [jsxs(CardHeader, { className: "space-y-1", children: [jsx(CardTitle, { className: "text-2xl text-center", children: title }), jsx(CardDescription, { className: "text-center", children: description })] }), jsxs(CardContent, { className: "space-y-4", children: [providers.length > 0 && (jsxs("div", { className: "space-y-2", children: [providers.map((provider) => (jsx(OAuthButton, { provider: provider.id, onClick: () => handleOAuthClick(provider.id), disabled: isLoading }, provider.id))), jsxs("div", { className: "relative", children: [jsx("div", { className: "absolute inset-0 flex items-center", children: jsx(Separator, {}) }), jsx("div", { className: "relative flex justify-center text-xs uppercase", children: jsx("span", { className: "bg-background px-2 text-muted-foreground", children: "Or continue with" }) })] })] })), error && (jsx("div", { className: "p-3 text-sm text-destructive-foreground bg-destructive/10 border border-destructive/20 rounded-md", children: error })), jsxs("form", { onSubmit: handleSubmit, className: "space-y-4", children: [jsxs("div", { className: "space-y-2", children: [jsxs(Label, { htmlFor: "name", children: ["Name ", requireName && jsx("span", { className: "text-destructive", children: "*" })] }), jsx(Input, { id: "name", type: "text", placeholder: "Enter your full name", value: name, onChange: (e) => setName(e.target.value), disabled: isLoading, required: requireName })] }), jsxs("div", { className: "space-y-2", children: [jsx(Label, { htmlFor: "email", children: "Email *" }), jsx(Input, { id: "email", type: "email", placeholder: "name@example.com", value: email, onChange: (e) => setEmail(e.target.value), disabled: isLoading, required: true })] }), jsxs("div", { className: "space-y-2", children: [jsx(Label, { htmlFor: "password", children: "Password *" }), jsx(Input, { id: "password", type: "password", placeholder: "Create a strong password", value: password, onChange: (e) => setPassword(e.target.value), disabled: isLoading, required: true }), password && (jsxs("div", { className: "text-xs space-y-1", children: [jsx("div", { className: "text-muted-foreground", children: "Password must contain:" }), jsxs("div", { className: "space-y-1", children: [passwordStrength.errors.map((error, index) => (jsxs("div", { className: "flex items-center space-x-1", children: [jsx("div", { className: "h-1.5 w-1.5 rounded-full bg-destructive" }), jsx("span", { className: "text-destructive", children: error })] }, index))), passwordStrength.isValid && (jsxs("div", { className: "flex items-center space-x-1", children: [jsx("div", { className: "h-1.5 w-1.5 rounded-full bg-green-500" }), jsx("span", { className: "text-green-600", children: "Strong password" })] }))] })] }))] }), jsxs("div", { className: "space-y-2", children: [jsx(Label, { htmlFor: "confirmPassword", children: "Confirm Password *" }), jsx(Input, { id: "confirmPassword", type: "password", placeholder: "Confirm your password", value: confirmPassword, onChange: (e) => setConfirmPassword(e.target.value), disabled: isLoading, required: true }), confirmPassword && !passwordsMatch && (jsx("div", { className: "text-xs text-destructive", children: "Passwords do not match" }))] }), jsx(Button, { type: "submit", className: "w-full", disabled: isLoading || !canSubmit, children: isLoading ? (jsxs(Fragment, { children: [jsx("div", { className: "mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" }), "Creating account..."] })) : ('Create account') })] }), showSignInLink && (jsxs("div", { className: "text-center text-sm", children: ["Already have an account?", ' ', jsx("button", { type: "button", onClick: onSignInClick, className: "text-primary hover:underline font-medium", disabled: isLoading, children: "Sign in" })] }))] })] }));
});
SignUpForm.displayName = 'SignUpForm';

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
        return (jsxs(Card, { ref: ref, className: cn('w-full max-w-md mx-auto', className), ...props, children: [jsxs(CardHeader, { className: "space-y-1", children: [jsx(CardTitle, { className: "text-2xl text-center", children: "Check your email" }), jsxs(CardDescription, { className: "text-center", children: ["We've sent a password reset link to ", email] })] }), jsxs(CardContent, { className: "space-y-4", children: [jsxs("div", { className: "text-center", children: [jsx("div", { className: "mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4", children: jsx("svg", { className: "w-6 h-6 text-green-600", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M5 13l4 4L19 7" }) }) }), jsx("p", { className: "text-sm text-muted-foreground mb-4", children: "Click the link in the email to reset your password. If you don't see it, check your spam folder." })] }), jsx(Button, { type: "button", variant: "outline", className: "w-full", onClick: onBackToSignIn, children: "Back to sign in" })] })] }));
    }
    return (jsxs(Card, { ref: ref, className: cn('w-full max-w-md mx-auto', className), ...props, children: [jsxs(CardHeader, { className: "space-y-1", children: [jsx(CardTitle, { className: "text-2xl text-center", children: title }), jsx(CardDescription, { className: "text-center", children: description })] }), jsxs(CardContent, { className: "space-y-4", children: [error && (jsx("div", { className: "p-3 text-sm text-destructive-foreground bg-destructive/10 border border-destructive/20 rounded-md", children: error })), jsxs("form", { onSubmit: handleSubmit, className: "space-y-4", children: [jsxs("div", { className: "space-y-2", children: [jsx(Label, { htmlFor: "email", children: "Email" }), jsx(Input, { id: "email", type: "email", placeholder: "name@example.com", value: email, onChange: (e) => setEmail(e.target.value), disabled: isLoading, required: true })] }), jsx(Button, { type: "submit", className: "w-full", disabled: isLoading || !email, children: isLoading ? (jsxs(Fragment, { children: [jsx("div", { className: "mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" }), "Sending reset link..."] })) : ('Send reset link') })] }), jsx("div", { className: "text-center", children: jsx("button", { type: "button", onClick: onBackToSignIn, className: "text-sm text-primary hover:underline", disabled: isLoading, children: "Back to sign in" }) })] })] }));
});
PasswordResetForm.displayName = 'PasswordResetForm';

const AuthComponent = React.forwardRef(({ onSignIn, onSignUp, onOAuthSignIn, onPasswordReset, providers = [], initialView = 'signin', allowViewChange = true, loading = false, error, texts = {}, requireName = false, showPasswordReset = true, className, ...props }, ref) => {
    const [currentView, setCurrentView] = React.useState(initialView);
    const [passwordResetSuccess, setPasswordResetSuccess] = React.useState(false);
    const handleSignIn = async (email, password) => {
        setPasswordResetSuccess(false);
        await onSignIn(email, password);
    };
    const handleSignUp = async (email, password, name) => {
        setPasswordResetSuccess(false);
        await onSignUp(email, password, name);
    };
    const handleOAuth = async (provider) => {
        setPasswordResetSuccess(false);
        if (onOAuthSignIn) {
            await onOAuthSignIn(provider);
        }
    };
    const handlePasswordReset = async (email) => {
        if (onPasswordReset) {
            await onPasswordReset(email);
            setPasswordResetSuccess(true);
        }
    };
    const switchToSignUp = () => {
        if (allowViewChange) {
            setCurrentView('signup');
            setPasswordResetSuccess(false);
        }
    };
    const switchToSignIn = () => {
        if (allowViewChange) {
            setCurrentView('signin');
            setPasswordResetSuccess(false);
        }
    };
    const switchToPasswordReset = () => {
        if (allowViewChange && showPasswordReset) {
            setCurrentView('reset-password');
            setPasswordResetSuccess(false);
        }
    };
    return (jsxs("div", { ref: ref, className: cn('w-full', className), ...props, children: [currentView === 'signin' && (jsx(LoginForm, { onSubmit: handleSignIn, onOAuthSignIn: handleOAuth, onSignUpClick: allowViewChange ? switchToSignUp : undefined, onForgotPasswordClick: allowViewChange && showPasswordReset ? switchToPasswordReset : undefined, providers: providers, loading: loading, error: error, title: texts.signIn?.title, description: texts.signIn?.description, showSignUpLink: allowViewChange, showForgotPasswordLink: allowViewChange && showPasswordReset })), currentView === 'signup' && (jsx(SignUpForm, { onSubmit: handleSignUp, onOAuthSignIn: handleOAuth, onSignInClick: allowViewChange ? switchToSignIn : undefined, providers: providers, loading: loading, error: error, title: texts.signUp?.title, description: texts.signUp?.description, showSignInLink: allowViewChange, requireName: requireName })), currentView === 'reset-password' && (jsx(PasswordResetForm, { onSubmit: handlePasswordReset, onBackToSignIn: allowViewChange ? switchToSignIn : undefined, loading: loading, error: error, success: passwordResetSuccess, title: texts.resetPassword?.title, description: texts.resetPassword?.description }))] }));
});
AuthComponent.displayName = 'AuthComponent';

const AuthContext = React.createContext(null);
function AuthProvider({ children, onSignIn, onSignUp, onSignOut, onOAuthSignIn, onPasswordReset, onGetSession, initialUser = null, initialSession = null }) {
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
    return (jsx(AuthContext.Provider, { value: contextValue, children: children }));
}
function useAuth() {
    const context = React.useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}

export { AuthComponent, AuthProvider, Button, Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle, Input, Label, LoginForm, OAuthButton, PasswordResetForm, Separator, SignUpForm, authTheme, cn, cssVariables, useAuth };
