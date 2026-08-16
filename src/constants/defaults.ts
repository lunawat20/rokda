// DEFAULT CONSTANTS & CATEGORY TREES

import { Category, Account } from '../types';

export const DEFAULT_CURRENCY = {
  code: 'INR',
  symbol: '₹',
  name: 'Indian Rupee'
};

export const SYSTEM_CATEGORIES: Omit<Category, 'user_id' | 'created_at' | 'updated_at' | 'version'>[] = [
  // Food & Dining
  { id: 'cat_food', name: 'Food & Dining', type: 'expense', icon: 'restaurant', color: '#EF4444', is_archived: false, is_system: true },
  { id: 'cat_groceries', name: 'Groceries', type: 'expense', icon: 'cart', color: '#EF4444', parent_id: 'cat_food', is_archived: false, is_system: true },
  { id: 'cat_restaurant', name: 'Restaurants', type: 'expense', icon: 'fast-food', color: '#EF4444', parent_id: 'cat_food', is_archived: false, is_system: true },
  { id: 'cat_coffee', name: 'Coffee & Snacks', type: 'expense', icon: 'cafe', color: '#EF4444', parent_id: 'cat_food', is_archived: false, is_system: true },

  // Transport
  { id: 'cat_transport', name: 'Transport', type: 'expense', icon: 'car', color: '#F59E0B', is_archived: false, is_system: true },
  { id: 'cat_fuel', name: 'Fuel', type: 'expense', icon: 'car-sport', color: '#F59E0B', parent_id: 'cat_transport', is_archived: false, is_system: true },
  { id: 'cat_cab', name: 'Cabs & Taxi', type: 'expense', icon: 'navigate', color: '#F59E0B', parent_id: 'cat_transport', is_archived: false, is_system: true },
  { id: 'cat_public_transport', name: 'Public Transport', type: 'expense', icon: 'bus', color: '#F59E0B', parent_id: 'cat_transport', is_archived: false, is_system: true },

  // Shopping
  { id: 'cat_shopping', name: 'Shopping', type: 'expense', icon: 'bag-handle', color: '#EC4899', is_archived: false, is_system: true },
  { id: 'cat_clothing', name: 'Clothing', type: 'expense', icon: 'shirt', color: '#EC4899', parent_id: 'cat_shopping', is_archived: false, is_system: true },
  { id: 'cat_electronics', name: 'Electronics', type: 'expense', icon: 'laptop', color: '#EC4899', parent_id: 'cat_shopping', is_archived: false, is_system: true },

  // Bills & Utilities
  { id: 'cat_bills', name: 'Bills & Utilities', type: 'expense', icon: 'flash', color: '#3B82F6', is_archived: false, is_system: true },
  { id: 'cat_rent', name: 'Rent', type: 'expense', icon: 'home', color: '#3B82F6', parent_id: 'cat_bills', is_archived: false, is_system: true },
  { id: 'cat_electricity', name: 'Electricity', type: 'expense', icon: 'flash', color: '#3B82F6', parent_id: 'cat_bills', is_archived: false, is_system: true },
  { id: 'cat_internet', name: 'Internet & Phone', type: 'expense', icon: 'wifi', color: '#3B82F6', parent_id: 'cat_bills', is_archived: false, is_system: true },

  // Entertainment
  { id: 'cat_entertainment', name: 'Entertainment', type: 'expense', icon: 'film', color: '#8B5CF6', is_archived: false, is_system: true },
  { id: 'cat_streaming', name: 'Subscriptions', type: 'expense', icon: 'tv', color: '#8B5CF6', parent_id: 'cat_entertainment', is_archived: false, is_system: true },
  { id: 'cat_games', name: 'Gaming & Events', type: 'expense', icon: 'game-controller', color: '#8B5CF6', parent_id: 'cat_entertainment', is_archived: false, is_system: true },

  // Health
  { id: 'cat_health', name: 'Health & Fitness', type: 'expense', icon: 'fitness', color: '#10B981', is_archived: false, is_system: true },
  { id: 'cat_medicine', name: 'Medicine & Doctor', type: 'expense', icon: 'medical', color: '#10B981', parent_id: 'cat_health', is_archived: false, is_system: true },

  // Personal
  { id: 'cat_personal', name: 'Personal & Travel', type: 'expense', icon: 'airplane', color: '#06B6D4', is_archived: false, is_system: true },

  // Income Categories
  { id: 'cat_salary', name: 'Salary & Wages', type: 'income', icon: 'wallet', color: '#10B981', is_archived: false, is_system: true },
  { id: 'cat_freelance', name: 'Freelance & Business', type: 'income', icon: 'briefcase', color: '#10B981', is_archived: false, is_system: true },
  { id: 'cat_investments_income', name: 'Investment Returns', type: 'income', icon: 'trending-up', color: '#10B981', is_archived: false, is_system: true },
  { id: 'cat_other_income', name: 'Other Income', type: 'income', icon: 'cash', color: '#10B981', is_archived: false, is_system: true }
];

// Clean Zero Balance Initial Accounts
export const DEFAULT_ACCOUNTS: Omit<Account, 'user_id' | 'created_at' | 'updated_at' | 'version'>[] = [
  {
    id: 'acc_cash',
    name: 'Cash In Hand',
    type: 'cash',
    opening_balance_paise: 0, // ₹0
    current_balance_paise: 0,
    currency_code: 'INR',
    icon: 'cash',
    color: '#10B981',
    is_archived: false
  },
  {
    id: 'acc_bank_main',
    name: 'Primary Bank Account',
    type: 'bank',
    opening_balance_paise: 0, // ₹0
    current_balance_paise: 0,
    currency_code: 'INR',
    icon: 'card',
    color: '#3B82F6',
    is_archived: false
  },
  {
    id: 'acc_credit_card',
    name: 'Credit Card',
    type: 'credit_card',
    opening_balance_paise: 0, // ₹0
    current_balance_paise: 0,
    currency_code: 'INR',
    icon: 'card-outline',
    color: '#EF4444',
    is_archived: false
  }
];

export const DEFAULT_DASHBOARD_SECTIONS = [
  { section_id: 'balance_card', order_index: 0, is_visible: true },
  { section_id: 'cash_flow_summary', order_index: 1, is_visible: true },
  { section_id: 'budget_progress', order_index: 2, is_visible: true },
  { section_id: 'category_breakdown', order_index: 3, is_visible: true },
  { section_id: 'upcoming_bills', order_index: 4, is_visible: true },
  { section_id: 'active_goals', order_index: 5, is_visible: true },
  { section_id: 'recent_transactions', order_index: 6, is_visible: true },
  { section_id: 'smart_insights', order_index: 7, is_visible: true }
];
