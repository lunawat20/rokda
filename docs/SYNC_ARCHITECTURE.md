# ROKDA OFFLINE-FIRST SYNC ENGINE SPECIFICATION

## Workflow Cycle

```text
Offline User Edit
       ↓
Local SQLite Write (rokda_user_{id}.db)
       ↓
Inserted into sync_queue
       ↓
Network Connected
       ↓
Push Worker reads pending queue items
       ↓
Calls PostgreSQL Atomic RPC Functions (e.g. sync_upsert_transaction)
       ↓
PostgreSQL validates auth.uid() & acquires FOR UPDATE lock
       ↓
Compares version -> Returns CREATED / UPDATED / CONFLICT
       ↓
Queue item marked synced
```

---

## Concurrency & Conflict Policy

- **Optimistic Concurrency**: Atomic stored RPC functions verify `server_version == client_version`.
- **Conflict Handling**: If server version > client version, the update is rejected with `status: CONFLICT`.
- **Tombstones**: Deletions update `deleted_at = NOW()` to prevent deleted records from reappearing.
- **Auth Expiration Handling**: HTTP 401/403 pauses background sync retries while preserving local SQLite mutations.
