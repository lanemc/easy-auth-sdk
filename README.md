<div align="center">

# 🔐 Easy Auth SDK

### The authentication solution that just works™

[![npm version](https://img.shields.io/npm/v/easy-auth-sdk.svg?style=flat-square)](https://www.npmjs.com/package/easy-auth-sdk)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg?style=flat-square)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](https://opensource.org/licenses/MIT)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](http://makeapullrequest.com)

<p align="center">
  <b>Stop building auth. Start shipping features.</b>
</p>

<p align="center">
  <a href="#-quick-start">Quick Start</a> •
  <a href="#-features">Features</a> •
  <a href="#-demo">Demo</a> •
  <a href="#-docs">Docs</a> •
  <a href="#-examples">Examples</a>
</p>

<br />

<img src="https://raw.githubusercontent.com/your-org/easy-auth-sdk/main/docs/assets/hero-demo.gif" alt="Easy Auth Demo" width="600" />

</div>

---

## 🌟 Why Easy Auth?

Building authentication is **hard**. Building it **securely** is even harder. We've all been there:

- 😩 Spending days setting up auth instead of building features
- 🔧 Wrestling with OAuth provider documentation
- 🎨 Building the same login forms over and over
- 🔒 Worrying about security vulnerabilities
- 📚 Dealing with incomplete or confusing documentation

**Easy Auth SDK** solves all of this. One package, five minutes, and you're done.

```typescript
// This is all you need. Seriously.
import { createAuthHandlers } from 'easy-auth-sdk/next'

export const { GET, POST } = createAuthHandlers({
  database: { url: process.env.DATABASE_URL },
  providers: { google: { enabled: true } }
})
```

## ✨ Features

<table>
<tr>
<td width="33%" valign="top">

### 🎯 Dead Simple Setup
```bash
npm install easy-auth-sdk
```
That's it. No complex configuration. Sensible defaults. It just works.

</td>
<td width="33%" valign="top">

### 🎨 Beautiful UI Included
Pre-built components with Shadcn UI + Tailwind. Fully customizable or bring your own.

</td>
<td width="33%" valign="top">

### 🔐 Secure by Default
Rate limiting, CSRF protection, secure sessions, and password policies built-in. Sleep easy.

</td>
</tr>
<tr>
<td width="33%" valign="top">

### 🚀 Framework Ready
First-class Next.js support. Express coming soon. Works with any Node.js app.

</td>
<td width="33%" valign="top">

### 📦 Batteries Included
Email/password, OAuth (Google, GitHub, etc.), password reset, and more out of the box.

</td>
<td width="33%" valign="top">

### 💪 TypeScript First
Full type safety. Autocomplete everything. Catch errors before runtime.

</td>
</tr>
</table>

## 🚀 Quick Start

### 1. Install

```bash
npm install easy-auth-sdk

# Required peer dependencies (if not already installed)
npm install react react-dom next
```

### 2. Set Environment Variables

```env
# .env.local
DATABASE_URL="postgresql://user:pass@localhost:5432/myapp"
AUTH_SECRET="your-secret-key-min-32-chars" # Generate with: openssl rand -base64 32
```

### 3. Create Auth API Route

```typescript
// app/api/auth/[...auth]/route.ts
import { createAuthHandlers } from 'easy-auth-sdk/next'

export const { GET, POST } = createAuthHandlers({
  database: { 
    type: 'postgres',
    url: process.env.DATABASE_URL! 
  },
  session: {
    secret: process.env.AUTH_SECRET!
  },
  providers: {
    emailPassword: { enabled: true },
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!
    }
  }
})
```

### 4. Add Provider to Layout

```tsx
// app/layout.tsx
import { NextAuthProvider } from 'easy-auth-sdk/next/client'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <NextAuthProvider>
          {children}
        </NextAuthProvider>
      </body>
    </html>
  )
}
```

### 5. Create Login Page

```tsx
// app/login/page.tsx
'use client'

import { AuthComponent } from 'easy-auth-sdk/react'
import { useNextAuth } from 'easy-auth-sdk/next/client'

export default function LoginPage() {
  const { signIn, signUp, oauthSignIn, loading, error } = useNextAuth()

  return (
    <AuthComponent
      onSignIn={signIn}
      onSignUp={signUp}
      onOAuthSignIn={oauthSignIn}
      providers={[
        { id: 'google', name: 'Google' },
        { id: 'github', name: 'GitHub' }
      ]}
      loading={loading}
      error={error}
    />
  )
}
```

**That's it!** You now have a fully functional auth system with:
- ✅ Beautiful login/signup UI
- ✅ Email/password authentication
- ✅ Social logins
- ✅ Secure sessions
- ✅ Password reset flow
- ✅ TypeScript support

## 🎨 UI Components

<div align="center">
<table>
<tr>
<td align="center">
<img src="https://raw.githubusercontent.com/your-org/easy-auth-sdk/main/docs/assets/login-form.png" width="300" />
<br />
<b>Login Form</b>
</td>
<td align="center">
<img src="https://raw.githubusercontent.com/your-org/easy-auth-sdk/main/docs/assets/signup-form.png" width="300" />
<br />
<b>Sign Up Form</b>
</td>
</tr>
<tr>
<td align="center">
<img src="https://raw.githubusercontent.com/your-org/easy-auth-sdk/main/docs/assets/reset-form.png" width="300" />
<br />
<b>Password Reset</b>
</td>
<td align="center">
<img src="https://raw.githubusercontent.com/your-org/easy-auth-sdk/main/docs/assets/oauth-buttons.png" width="300" />
<br />
<b>OAuth Providers</b>
</td>
</tr>
</table>
</div>

All components are:
- 🎨 **Beautifully designed** with Shadcn UI
- 📱 **Fully responsive** out of the box
- ♿ **Accessible** (WCAG 2.1 compliant)
- 🎯 **Customizable** with Tailwind classes
- 🌙 **Dark mode ready**

## 🔧 Advanced Usage

### 🛡️ Protecting Pages

#### Server Components
```tsx
import { getServerSession } from 'easy-auth-sdk/next/server'
import { redirect } from 'next/navigation'

export default async function DashboardPage() {
  const session = await getServerSession()
  
  if (!session) {
    redirect('/login')
  }

  return <h1>Welcome, {session.user.name}!</h1>
}
```

#### Client Components
```tsx
'use client'

import { withNextAuth } from 'easy-auth-sdk/next/client'

function ProtectedComponent() {
  return <div>Secret content 🤫</div>
}

export default withNextAuth(ProtectedComponent)
```

### 🔌 OAuth Providers

Setting up OAuth is as simple as adding credentials:

```typescript
providers: {
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID!,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET!
  },
  github: {
    clientId: process.env.GITHUB_CLIENT_ID!,
    clientSecret: process.env.GITHUB_CLIENT_SECRET!
  },
  // Add more providers...
}
```

<details>
<summary><b>📋 Supported Providers</b></summary>

- ✅ Google
- ✅ GitHub  
- ✅ Facebook
- ✅ Twitter/X
- ✅ Microsoft (coming soon)
- ✅ Apple (coming soon)
- ✅ Discord (coming soon)
- ✅ [Custom OAuth](#custom-oauth-provider)

</details>

### 🎨 Customizing UI

#### Using Theme Variables
```css
:root {
  --primary: 220 90% 56%;           /* Your brand color */
  --primary-foreground: 0 0% 100%;  /* Text on primary */
  /* ... more variables */
}
```

#### Custom Styling
```tsx
<AuthComponent
  className="custom-auth-wrapper"
  texts={{
    signIn: {
      title: "Welcome Back! 👋",
      description: "Sign in to continue your journey"
    }
  }}
/>
```

#### Headless Mode
```tsx
import { useNextAuth } from 'easy-auth-sdk/next/client'

function CustomLoginForm() {
  const { signIn, loading, error } = useNextAuth()
  
  // Build your own UI
  return (
    <form onSubmit={(e) => {
      e.preventDefault()
      signIn(email, password)
    }}>
      {/* Your custom form */}
    </form>
  )
}
```

### 🔐 Security Configuration

```typescript
const config = {
  security: {
    rateLimit: {
      maxAttempts: 5,
      windowMs: 15 * 60 * 1000 // 15 minutes
    },
    passwordPolicy: {
      minLength: 8,
      requireUppercase: true,
      requireNumbers: true,
      requireSpecialChars: true
    },
    csrf: {
      enabled: true
    }
  }
}
```

### 🪝 Event Hooks

```typescript
const config = {
  callbacks: {
    onSignUp: async ({ user }) => {
      // Send welcome email
      await sendWelcomeEmail(user.email)
      
      // Track analytics
      analytics.track('user_signup', { userId: user.id })
    },
    
    onSignIn: async ({ user, account }) => {
      // Update last login
      await updateLastLogin(user.id)
    },
    
    onSignOut: async ({ user }) => {
      // Cleanup tasks
      await clearUserCache(user.id)
    }
  }
}
```

## 📊 Database

### Schema Overview

Easy Auth automatically creates and manages these tables:

```sql
┌─────────────┐     ┌──────────────┐     ┌──────────────┐
│   users     │     │   accounts   │     │   sessions   │
├─────────────┤     ├──────────────┤     ├──────────────┤
│ id          │◄────┤ userId       │◄────┤ userId       │
│ email       │     │ provider     │     │ sessionToken │
│ name        │     │ providerId   │     │ expiresAt    │
│ password    │     │ accessToken  │     │ createdAt    │
│ verified    │     │ refreshToken │     │ updatedAt    │
│ createdAt   │     │ createdAt    │     └──────────────┘
│ updatedAt   │     │ updatedAt    │
└─────────────┘     └──────────────┘
```

### Migrations

```bash
# Generate migration files
npx drizzle-kit generate:pg

# Apply migrations
npx drizzle-kit push:pg

# View database studio
npx drizzle-kit studio
```

## 🔄 Migration from NextAuth

Moving from NextAuth? It's seamless:

```diff
- import NextAuth from 'next-auth'
- import GoogleProvider from 'next-auth/providers/google'
+ import { createAuthHandlers } from 'easy-auth-sdk/next'

- export default NextAuth({
-   providers: [
-     GoogleProvider({
-       clientId: process.env.GOOGLE_CLIENT_ID,
-       clientSecret: process.env.GOOGLE_CLIENT_SECRET,
-     })
-   ]
- })

+ export const { GET, POST } = createAuthHandlers({
+   providers: {
+     google: {
+       clientId: process.env.GOOGLE_CLIENT_ID!,
+       clientSecret: process.env.GOOGLE_CLIENT_SECRET!
+     }
+   }
+ })
```

<details>
<summary><b>Full Migration Guide →</b></summary>

1. **Database Compatible**: Our schema is NextAuth-compatible
2. **Similar API**: Most functions have direct equivalents
3. **Better DX**: Less configuration, more features
4. **Migration Script**: Coming soon!

</details>

## 📚 Examples

### Next.js App Router
```bash
cd examples/next-app
npm install
npm run dev
```

### Express.js (Coming Soon)
```bash
cd examples/express-app
npm install
npm run dev
```

## 🛣️ Roadmap

- [x] Email/Password authentication
- [x] OAuth providers (Google, GitHub, etc.)
- [x] Next.js integration
- [x] Beautiful UI components
- [x] TypeScript support
- [x] Rate limiting & security
- [ ] Two-factor authentication (2FA)
- [ ] Magic link authentication
- [ ] Express.js adapter
- [ ] Remix adapter
- [ ] Email service integrations
- [ ] Admin dashboard
- [ ] Multi-tenant support

## 🤝 Contributing

We love contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

```bash
# Clone the repo
git clone https://github.com/your-org/easy-auth-sdk

# Install dependencies
npm install

# Run tests
npm test

# Build
npm run build
```

## 📄 License

MIT © [Your Company](https://github.com/your-org)

---

<div align="center">

### Built with ❤️ by developers, for developers

<p>
  <a href="https://twitter.com/easyauthsdk">Twitter</a> •
  <a href="https://discord.gg/easyauth">Discord</a> •
  <a href="https://github.com/your-org/easy-auth-sdk">GitHub</a>
</p>

<sub>If Easy Auth helped you ship faster, consider <a href="https://github.com/sponsors/your-org">sponsoring</a> the project!</sub>

</div>