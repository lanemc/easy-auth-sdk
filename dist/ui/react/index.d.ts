import * as class_variance_authority_dist_types from 'class-variance-authority/dist/types';
import * as React from 'react';
import { VariantProps } from 'class-variance-authority';
import * as LabelPrimitive from '@radix-ui/react-label';
import * as SeparatorPrimitive from '@radix-ui/react-separator';
import * as react_jsx_runtime from 'react/jsx-runtime';
import { ClassValue } from 'clsx';
import { z } from 'zod';

declare const buttonVariants: (props?: {
    variant?: "link" | "default" | "destructive" | "outline" | "secondary" | "ghost";
    size?: "default" | "sm" | "lg" | "icon";
} & class_variance_authority_dist_types.ClassProp) => string;
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
    asChild?: boolean;
}
declare const Button: React.ForwardRefExoticComponent<ButtonProps & React.RefAttributes<HTMLButtonElement>>;

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
}
declare const Input: React.ForwardRefExoticComponent<InputProps & React.RefAttributes<HTMLInputElement>>;

declare const Label: React.ForwardRefExoticComponent<Omit<LabelPrimitive.LabelProps & React.RefAttributes<HTMLLabelElement>, "ref"> & VariantProps<(props?: class_variance_authority_dist_types.ClassProp) => string> & React.RefAttributes<HTMLLabelElement>>;

declare const Card: React.ForwardRefExoticComponent<React.HTMLAttributes<HTMLDivElement> & React.RefAttributes<HTMLDivElement>>;
declare const CardHeader: React.ForwardRefExoticComponent<React.HTMLAttributes<HTMLDivElement> & React.RefAttributes<HTMLDivElement>>;
declare const CardTitle: React.ForwardRefExoticComponent<React.HTMLAttributes<HTMLHeadingElement> & React.RefAttributes<HTMLParagraphElement>>;
declare const CardDescription: React.ForwardRefExoticComponent<React.HTMLAttributes<HTMLParagraphElement> & React.RefAttributes<HTMLParagraphElement>>;
declare const CardContent: React.ForwardRefExoticComponent<React.HTMLAttributes<HTMLDivElement> & React.RefAttributes<HTMLDivElement>>;
declare const CardFooter: React.ForwardRefExoticComponent<React.HTMLAttributes<HTMLDivElement> & React.RefAttributes<HTMLDivElement>>;

declare const Separator: React.ForwardRefExoticComponent<Omit<SeparatorPrimitive.SeparatorProps & React.RefAttributes<HTMLDivElement>, "ref"> & React.RefAttributes<HTMLDivElement>>;

declare const providerIcons: {
    google: react_jsx_runtime.JSX.Element;
    github: react_jsx_runtime.JSX.Element;
    facebook: react_jsx_runtime.JSX.Element;
    twitter: react_jsx_runtime.JSX.Element;
};
interface OAuthButtonProps extends Omit<ButtonProps, 'children'> {
    provider: keyof typeof providerIcons;
    text?: string;
    icon?: React.ReactNode;
}
declare const OAuthButton: React.ForwardRefExoticComponent<OAuthButtonProps & React.RefAttributes<HTMLButtonElement>>;

interface LoginFormProps {
    onSubmit: (email: string, password: string) => Promise<void> | void;
    onOAuthSignIn?: (provider: string) => Promise<void> | void;
    onSignUpClick?: () => void;
    onForgotPasswordClick?: () => void;
    providers?: Array<{
        id: string;
        name: string;
    }>;
    loading?: boolean;
    error?: string;
    title?: string;
    description?: string;
    showSignUpLink?: boolean;
    showForgotPasswordLink?: boolean;
    className?: string;
}
declare const LoginForm: React.ForwardRefExoticComponent<LoginFormProps & React.RefAttributes<HTMLDivElement>>;

interface SignUpFormProps {
    onSubmit: (email: string, password: string, name?: string) => Promise<void> | void;
    onOAuthSignIn?: (provider: string) => Promise<void> | void;
    onSignInClick?: () => void;
    providers?: Array<{
        id: string;
        name: string;
    }>;
    loading?: boolean;
    error?: string;
    title?: string;
    description?: string;
    showSignInLink?: boolean;
    requireName?: boolean;
    className?: string;
}
declare const SignUpForm: React.ForwardRefExoticComponent<SignUpFormProps & React.RefAttributes<HTMLDivElement>>;

interface PasswordResetFormProps {
    onSubmit: (email: string) => Promise<void> | void;
    onBackToSignIn?: () => void;
    loading?: boolean;
    error?: string;
    success?: boolean;
    title?: string;
    description?: string;
    className?: string;
}
declare const PasswordResetForm: React.ForwardRefExoticComponent<PasswordResetFormProps & React.RefAttributes<HTMLDivElement>>;

type AuthView = 'signin' | 'signup' | 'reset-password';
interface AuthComponentProps {
    onSignIn: (email: string, password: string) => Promise<void> | void;
    onSignUp: (email: string, password: string, name?: string) => Promise<void> | void;
    onOAuthSignIn?: (provider: string) => Promise<void> | void;
    onPasswordReset?: (email: string) => Promise<void> | void;
    providers?: Array<{
        id: string;
        name: string;
    }>;
    initialView?: AuthView;
    allowViewChange?: boolean;
    loading?: boolean;
    error?: string;
    texts?: {
        signIn?: {
            title?: string;
            description?: string;
        };
        signUp?: {
            title?: string;
            description?: string;
        };
        resetPassword?: {
            title?: string;
            description?: string;
        };
    };
    requireName?: boolean;
    showPasswordReset?: boolean;
    className?: string;
}
declare const AuthComponent: React.ForwardRefExoticComponent<AuthComponentProps & React.RefAttributes<HTMLDivElement>>;

declare function cn(...inputs: ClassValue[]): string;
declare const authTheme: {
    colors: {
        primary: string;
        primaryForeground: string;
        secondary: string;
        secondaryForeground: string;
        background: string;
        foreground: string;
        card: string;
        cardForeground: string;
        border: string;
        input: string;
        ring: string;
        destructive: string;
        destructiveForeground: string;
        muted: string;
        mutedForeground: string;
        accent: string;
        accentForeground: string;
    };
};
declare const cssVariables = "\n:root {\n  --background: 0 0% 100%;\n  --foreground: 222.2 84% 4.9%;\n  --card: 0 0% 100%;\n  --card-foreground: 222.2 84% 4.9%;\n  --popover: 0 0% 100%;\n  --popover-foreground: 222.2 84% 4.9%;\n  --primary: 222.2 47.4% 11.2%;\n  --primary-foreground: 210 40% 98%;\n  --secondary: 210 40% 96%;\n  --secondary-foreground: 222.2 47.4% 11.2%;\n  --muted: 210 40% 96%;\n  --muted-foreground: 215.4 16.3% 46.9%;\n  --accent: 210 40% 96%;\n  --accent-foreground: 222.2 47.4% 11.2%;\n  --destructive: 0 84.2% 60.2%;\n  --destructive-foreground: 210 40% 98%;\n  --border: 214.3 31.8% 91.4%;\n  --input: 214.3 31.8% 91.4%;\n  --ring: 222.2 84% 4.9%;\n  --radius: 0.5rem;\n}\n\n.dark {\n  --background: 222.2 84% 4.9%;\n  --foreground: 210 40% 98%;\n  --card: 222.2 84% 4.9%;\n  --card-foreground: 210 40% 98%;\n  --popover: 222.2 84% 4.9%;\n  --popover-foreground: 210 40% 98%;\n  --primary: 210 40% 98%;\n  --primary-foreground: 222.2 47.4% 11.2%;\n  --secondary: 217.2 32.6% 17.5%;\n  --secondary-foreground: 210 40% 98%;\n  --muted: 217.2 32.6% 17.5%;\n  --muted-foreground: 215 20.2% 65.1%;\n  --accent: 217.2 32.6% 17.5%;\n  --accent-foreground: 210 40% 98%;\n  --destructive: 0 62.8% 30.6%;\n  --destructive-foreground: 210 40% 98%;\n  --border: 217.2 32.6% 17.5%;\n  --input: 217.2 32.6% 17.5%;\n  --ring: 212.7 26.8% 83.9%;\n}\n";

declare const UserSchema: z.ZodObject<{
    id: z.ZodString;
    email: z.ZodString;
    name: z.ZodOptional<z.ZodString>;
    emailVerified: z.ZodDefault<z.ZodBoolean>;
    image: z.ZodOptional<z.ZodString>;
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    image?: string;
    id?: string;
    name?: string;
    email?: string;
    emailVerified?: boolean;
    createdAt?: Date;
    updatedAt?: Date;
}, {
    image?: string;
    id?: string;
    name?: string;
    email?: string;
    emailVerified?: boolean;
    createdAt?: Date;
    updatedAt?: Date;
}>;
type User = z.infer<typeof UserSchema>;
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

interface AuthContextType {
    user: User | null;
    session: Session | null;
    loading: boolean;
    error: string | null;
    signIn: (email: string, password: string) => Promise<void>;
    signUp: (email: string, password: string, name?: string) => Promise<void>;
    signOut: () => Promise<void>;
    oauthSignIn: (provider: string) => Promise<void>;
    resetPassword: (email: string) => Promise<void>;
    clearError: () => void;
    refreshSession: () => Promise<void>;
}
interface AuthProviderProps {
    children: React.ReactNode;
    onSignIn: (email: string, password: string) => Promise<{
        success: boolean;
        user?: User;
        session?: Session;
        error?: string;
    }>;
    onSignUp: (email: string, password: string, name?: string) => Promise<{
        success: boolean;
        user?: User;
        error?: string;
        requiresVerification?: boolean;
    }>;
    onSignOut: () => Promise<{
        success: boolean;
    }>;
    onOAuthSignIn: (provider: string) => Promise<void>;
    onPasswordReset: (email: string) => Promise<void>;
    onGetSession?: () => Promise<{
        user: User;
        session: Session;
    } | null>;
    initialUser?: User | null;
    initialSession?: Session | null;
}
declare function AuthProvider({ children, onSignIn, onSignUp, onSignOut, onOAuthSignIn, onPasswordReset, onGetSession, initialUser, initialSession }: AuthProviderProps): react_jsx_runtime.JSX.Element;
declare function useAuth(): AuthContextType;

export { AuthComponent, AuthProvider, Button, Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle, Input, Label, LoginForm, OAuthButton, PasswordResetForm, Separator, SignUpForm, authTheme, cn, cssVariables, useAuth };
export type { AuthComponentProps, AuthContextType, AuthView, ButtonProps, InputProps, LoginFormProps, OAuthButtonProps, PasswordResetFormProps, SignUpFormProps };
