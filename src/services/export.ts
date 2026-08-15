// ROKDA CSV REPORT EXPORTER & NATIVE SHARE HANDLER

import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Transaction, Category, Account } from '../types';
import { paiseToCurrency } from '../utils/currency';

export async function exportTransactionsToCSV(
  transactions: Transaction[],
  categories: Category[],
  accounts: Account[]
): Promise<string> {
  const catMap = new Map(categories.map(c => [c.id, c.name]));
  const accMap = new Map(accounts.map(a => [a.id, a.name]));

  const headers = ['Date', 'Time', 'Merchant', 'Type', 'Amount (INR)', 'Category', 'Account', 'Notes'];
  const rows = transactions.map(t => {
    const catName = t.category_id ? (catMap.get(t.category_id) || 'Uncategorized') : 'Uncategorized';
    const accName = accMap.get(t.account_id) || 'Unknown Account';
    const amountFormatted = (t.type === 'expense' ? -paiseToCurrency(t.amount_paise) : paiseToCurrency(t.amount_paise)).toFixed(2);

    return [
      `"${t.date}"`,
      `"${t.time}"`,
      `"${(t.merchant || '').replace(/"/g, '""')}"`,
      `"${t.type}"`,
      amountFormatted,
      `"${catName.replace(/"/g, '""')}"`,
      `"${accName.replace(/"/g, '""')}"`,
      `"${(t.notes || '').replace(/"/g, '""')}"`
    ].join(',');
  });

  const csvContent = [headers.join(','), ...rows].join('\n');

  const dateStr = new Date().toISOString().split('T')[0];
  const filename = `Rokda_Transactions_${dateStr}.csv`;
  const docDir = (FileSystem as any).documentDirectory || (FileSystem as any).Paths?.document || '';
  const fileUri = `${docDir}${filename}`;

  if ((FileSystem as any).writeAsStringAsync) {
    await (FileSystem as any).writeAsStringAsync(fileUri, csvContent, { encoding: (FileSystem as any).EncodingType?.UTF8 || 'utf8' });
  }

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(fileUri, { mimeType: 'text/csv', dialogTitle: 'Export Rokda Financial Report' });
  }

  return fileUri;
}
