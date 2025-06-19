import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import * as React from 'react';
import { LoginForm } from './login-form';
import { SignUpForm } from './signup-form';
import { PasswordResetForm } from './password-reset-form';
import { cn } from '../utils';
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
    return (_jsxs("div", { ref: ref, className: cn('w-full', className), ...props, children: [currentView === 'signin' && (_jsx(LoginForm, { onSubmit: handleSignIn, onOAuthSignIn: handleOAuth, onSignUpClick: allowViewChange ? switchToSignUp : undefined, onForgotPasswordClick: allowViewChange && showPasswordReset ? switchToPasswordReset : undefined, providers: providers, loading: loading, error: error, title: texts.signIn?.title, description: texts.signIn?.description, showSignUpLink: allowViewChange, showForgotPasswordLink: allowViewChange && showPasswordReset })), currentView === 'signup' && (_jsx(SignUpForm, { onSubmit: handleSignUp, onOAuthSignIn: handleOAuth, onSignInClick: allowViewChange ? switchToSignIn : undefined, providers: providers, loading: loading, error: error, title: texts.signUp?.title, description: texts.signUp?.description, showSignInLink: allowViewChange, requireName: requireName })), currentView === 'reset-password' && (_jsx(PasswordResetForm, { onSubmit: handlePasswordReset, onBackToSignIn: allowViewChange ? switchToSignIn : undefined, loading: loading, error: error, success: passwordResetSuccess, title: texts.resetPassword?.title, description: texts.resetPassword?.description }))] }));
});
AuthComponent.displayName = 'AuthComponent';
export { AuthComponent };
//# sourceMappingURL=auth-component.js.map