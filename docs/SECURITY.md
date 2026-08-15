# ROKDA SECURITY SPECIFICATION

## 1. Biometrics & Face ID App Lock
- Protected using Apple native `LocalAuthentication` API.
- Configurable lock timeouts (`immediately`, `1min`, `5min`, `never`).
- SecureStore backed authentication state.

---

## 2. Multi-User Database Security
- **Local Isolation**: SQLite database file isolated per user (`rokda_user_{user_id}.db`).
- **Cloud RLS**: Row Level Security policies check `auth.uid() = user_id` on every SELECT, INSERT, UPDATE, and DELETE.
- **Composite Ownership Constraints**: Foreign key constraints `(user_id, target_id) REFERENCES target_table(user_id, id)` prevent cross-user account/category parameter forgery.
- **Client Non-Trust**: `user_id` is derived from authenticated session `auth.uid()` rather than raw client payload inputs.
