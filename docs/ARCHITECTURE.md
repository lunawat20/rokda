# ROKDA ARCHITECTURE DOCUMENTATION

Rokda is a local-first, privacy-first, multi-user personal finance management application for iOS built using **React Native**, **Expo**, **TypeScript**, **Expo Router**, **Expo SQLite**, and **Supabase (Auth, PostgreSQL, & Row Level Security)**.

---

## High-Level System Architecture

```text
                               ROKDA MOBILE APP (iOS)
                                         │
                                React Native + Expo
                                         │
                     ┌───────────────────┴───────────────────┐
                     │                                       │
                     ▼                                       ▼
             User SQLite DB                     SecureStore & Keychain
         rokda_user_{user_id}.db                 Auth Tokens & Face ID
                     │                                       │
                     │ Offline-First Sync                    │ Session Token
                     ▼                                       ▼
             Sync Queue Service                       Supabase Client
                     │                                       │
                     └───────────────────┬───────────────────┘
                                         │ HTTPS / WebSockets
                                         ▼
                                 SUPABASE BACKEND
                                         │
                   ┌─────────────────────┴─────────────────────┐
                   ▼                                           ▼
             Supabase Auth                          PostgreSQL Database
          (Email, Password,                          Row Level Security
         Sign in with Apple)                          (auth.uid() = user_id)
```

---

## Core Operational Principles

1. **Local-First & Offline-First**: All user transactions, accounts, budgets, goals, and categories are saved directly to an isolated local SQLite database on the iPhone (`rokda_user_{user_id}.db`). The app operates with zero network latency and works 100% offline.
2. **Integer Minor Units (Paise)**: All monetary values are represented internally as 64-bit integers in minor units (1 INR = 100 paise) to eliminate floating-point rounding errors.
3. **Multi-User Isolation**:
   - **Device Level**: Unique SQLite database file per authenticated user (`rokda_user_{user_id}.db`). Logging out unmounts and closes the active DB.
   - **Cloud Level**: Supabase Row Level Security (RLS) policies and composite foreign keys `(user_id, target_id)` enforce absolute workspace privacy.
4. **Device Security**: Apple native `LocalAuthentication` (Face ID / Touch ID) protects access to the authenticated user's session.
