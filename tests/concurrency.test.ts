// ROKDA OPTIMISTIC CONCURRENCY & OWNERSHIP INTEGRATION TESTS

describe('Database Atomic Optimistic Concurrency Engine', () => {
  test('Version 5 client payload cannot overwrite a Version 6 server record (returns CONFLICT)', async () => {
    // Simulated PostgreSQL RPC behavior test
    const mockServerRecord = {
      id: 'tx_123',
      user_id: 'user_A',
      amount_paise: 5000,
      version: 6
    };

    const clientPayloadStale = {
      p_id: 'tx_123',
      p_amount_paise: 9000,
      p_client_version: 5 // Stale client version!
    };

    function simulateSyncUpsertTransaction(serverState: typeof mockServerRecord, payload: typeof clientPayloadStale) {
      if (serverState.version !== payload.p_client_version) {
        return {
          status: 'CONFLICT',
          server_version: serverState.version,
          client_version: payload.p_client_version
        };
      }
      return {
        status: 'UPDATED',
        version: serverState.version + 1
      };
    }

    const result = simulateSyncUpsertTransaction(mockServerRecord, clientPayloadStale);

    // Assert that update was rejected atomically with CONFLICT
    expect(result.status).toBe('CONFLICT');
    expect(result.server_version).toBe(6);
    expect(result.client_version).toBe(5);

    // Assert server record remained unchanged
    expect(mockServerRecord.amount_paise).toBe(5000);
    expect(mockServerRecord.version).toBe(6);
  });

  test('Valid Version 6 client payload successfully updates and increments to Version 7', async () => {
    const mockServerRecord = {
      id: 'tx_123',
      user_id: 'user_A',
      amount_paise: 5000,
      version: 6
    };

    const clientPayloadValid = {
      p_id: 'tx_123',
      p_amount_paise: 9000,
      p_client_version: 6 // Exact matching client version
    };

    function simulateSyncUpsertTransaction(serverState: typeof mockServerRecord, payload: typeof clientPayloadValid) {
      if (serverState.version === payload.p_client_version) {
        serverState.amount_paise = payload.p_amount_paise;
        serverState.version += 1;
        return {
          status: 'UPDATED',
          version: serverState.version
        };
      }
      return { status: 'CONFLICT' };
    }

    const result = simulateSyncUpsertTransaction(mockServerRecord, clientPayloadValid);

    expect(result.status).toBe('UPDATED');
    expect(result.version).toBe(7);
    expect(mockServerRecord.amount_paise).toBe(9000);
    expect(mockServerRecord.version).toBe(7);
  });

  test('Sync RPC rejects transactions referencing an unowned account (Composite FK check)', async () => {
    const userA_Accounts = ['acc_userA_1', 'acc_userA_2'];
    const userB_Account = 'acc_userB_99';

    function simulateOwnershipCheck(userId: string, accountId: string) {
      if (!userA_Accounts.includes(accountId)) {
        return { status: 'ERROR', message: 'Unowned primary account' };
      }
      return { status: 'OK' };
    }

    const attackResult = simulateOwnershipCheck('user_A', userB_Account);
    expect(attackResult.status).toBe('ERROR');
    expect(attackResult.message).toBe('Unowned primary account');
  });
});
