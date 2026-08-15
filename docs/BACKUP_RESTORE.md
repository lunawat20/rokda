# ROKDA LOCAL BACKUP & RESTORE SPECIFICATION

## Format & Payload Structure
Rokda generates a structured JSON export payload containing all user financial records and an integrity checksum hash:

```json
{
  "backup_version": 1,
  "app_version": "1.0.0",
  "created_at": "2026-08-15T23:30:00.000Z",
  "user_id": "usr_12345",
  "checksum": "RKD_4a9b2c",
  "data": {
    "accounts": [],
    "categories": [],
    "transactions": [],
    "budgets": [],
    "goals": [],
    "subscriptions": [],
    "recurring_transactions": []
  }
}
```

---

## Pre-Restore Validation Steps

1. **File Parsing**: Validates valid JSON syntax.
2. **Schema Version Check**: Verifies `backup_version` is supported.
3. **Checksum Verification**: Re-computes data payload hash to detect file tampering or corruption.
4. **Summary & Diff Preview**: Prompts user with exact counts of transactions, accounts, budgets, and goals to be restored.
5. **Transactional Restoration**: Inserts records into local SQLite database inside an isolated transaction.
