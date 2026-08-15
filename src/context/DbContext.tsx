// ROKDA REACTIVE DATABASE CONTEXT PROVIDER

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { Account, Category, Transaction, Budget, Goal, Subscription, RecurringTransaction } from '../types';
import { getAccounts, getCategories, getTransactions, getBudgets, getGoals, getSubscriptions, getRecurringTransactions, initializeUserDefaults } from '../database/repository';
import { calculateAccountBalances } from '../services/financial';

interface DbContextType {
  accounts: Account[];
  categories: Category[];
  transactions: Transaction[];
  budgets: Budget[];
  goals: Goal[];
  subscriptions: Subscription[];
  recurring: RecurringTransaction[];
  isLoading: boolean;
  refreshData: () => Promise<void>;
}

const DbContext = createContext<DbContextType>({
  accounts: [],
  categories: [],
  transactions: [],
  budgets: [],
  goals: [],
  subscriptions: [],
  recurring: [],
  isLoading: true,
  refreshData: async () => {}
});

export const DbProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [recurring, setRecurring] = useState<RecurringTransaction[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshData = useCallback(async () => {
    if (!user) {
      setAccounts([]);
      setCategories([]);
      setTransactions([]);
      setBudgets([]);
      setGoals([]);
      setSubscriptions([]);
      setRecurring([]);
      setIsLoading(false);
      return;
    }

    try {
      await initializeUserDefaults(user.id);

      const [accs, cats, txs, buds, gls, subs, recs] = await Promise.all([
        getAccounts(),
        getCategories(),
        getTransactions(),
        getBudgets(),
        getGoals(),
        getSubscriptions(),
        getRecurringTransactions()
      ]);

      // Dynamically calculate and apply active transaction mutation balances
      const balanceMap = calculateAccountBalances(accs, txs);
      const updatedAccs = accs.map(a => ({
        ...a,
        current_balance_paise: balanceMap.get(a.id) ?? a.opening_balance_paise
      }));

      setAccounts(updatedAccs);
      setCategories(cats);
      setTransactions(txs);
      setBudgets(buds);
      setGoals(gls);
      setSubscriptions(subs);
      setRecurring(recs);
    } catch (e) {
      console.error('Error refreshing SQLite data:', e);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  return (
    <DbContext.Provider value={{ accounts, categories, transactions, budgets, goals, subscriptions, recurring, isLoading, refreshData }}>
      {children}
    </DbContext.Provider>
  );
};

export const useDb = () => useContext(DbContext);
