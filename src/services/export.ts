// ROKDA REPORT EXPORTER (CSV & FORMATTED PDF STATEMENT GENERATOR)

import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Transaction, Category, Account } from '../types';
import { paiseToCurrency, formatPaise } from '../utils/currency';

/**
 * Compiles and exports all transactions into a standard CSV file.
 */
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

/**
 * Compiles a formatted PDF Financial Statement HTML document and opens Share Sheet.
 */
export async function exportTransactionsToPDF(
  transactions: Transaction[],
  categories: Category[],
  accounts: Account[],
  userName: string = 'User'
): Promise<string> {
  const catMap = new Map(categories.map(c => [c.id, c.name]));
  const accMap = new Map(accounts.map(a => [a.id, a.name]));

  let totalIncomePaise = 0;
  let totalExpensePaise = 0;

  transactions.forEach(t => {
    if (t.deleted_at) return;
    if (t.type === 'income') totalIncomePaise += t.amount_paise;
    if (t.type === 'expense') totalExpensePaise += t.amount_paise;
  });

  const netPaise = totalIncomePaise - totalExpensePaise;
  const dateStr = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

  const tableRowsHtml = transactions
    .filter(t => !t.deleted_at)
    .map(t => {
      const catName = t.category_id ? (catMap.get(t.category_id) || 'General') : 'General';
      const accName = accMap.get(t.account_id) || 'Account';
      const isExpense = t.type === 'expense';
      const amountStr = `${isExpense ? '-' : '+'}${formatPaise(t.amount_paise)}`;
      const amountColor = isExpense ? '#EF4444' : '#10B981';

      return `
        <tr>
          <td>${t.date} ${t.time}</td>
          <td><strong>${t.merchant || 'N/A'}</strong></td>
          <td>${catName}</td>
          <td>${accName}</td>
          <td style="color: ${amountColor}; font-weight: bold; text-align: right;">${amountStr}</td>
        </tr>
      `;
    })
    .join('');

  const htmlDocument = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Rokda Financial Statement</title>
        <style>
          body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; margin: 30px; color: #1E293B; background: #FFFFFF; }
          .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #10B981; padding-bottom: 15px; }
          .brand { font-size: 28px; font-weight: 800; color: #10B981; }
          .meta { text-align: right; font-size: 12px; color: #64748B; }
          .summary-box { display: flex; gap: 20px; margin: 25px 0; background: #F8FAF9; padding: 20px; border-radius: 12px; border: 1px solid #E2E8F0; }
          .stat { flex: 1; text-align: center; }
          .stat-label { font-size: 11px; text-transform: uppercase; color: #64748B; font-weight: bold; letter-spacing: 0.5px; }
          .stat-val { font-size: 20px; font-weight: 800; margin-top: 5px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 13px; }
          th { background: #0B0F17; color: #FFFFFF; text-align: left; padding: 10px 12px; font-weight: 600; }
          td { border-bottom: 1px solid #E2E8F0; padding: 10px 12px; }
          tr:nth-child(even) { background: #F8FAF9; }
          .footer { margin-top: 40px; text-align: center; font-size: 11px; color: #94A3B8; border-top: 1px solid #E2E8F0; padding-top: 15px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="brand">ROKDA</div>
            <div style="font-size: 13px; color: #64748B; margin-top: 2px;">Official Financial Statement</div>
          </div>
          <div class="meta">
            <div>Account Holder: <strong>${userName}</strong></div>
            <div>Generated: ${dateStr}</div>
          </div>
        </div>

        <div class="summary-box">
          <div class="stat">
            <div class="stat-label">Total Income</div>
            <div class="stat-val" style="color: #10B981;">+${formatPaise(totalIncomePaise)}</div>
          </div>
          <div class="stat">
            <div class="stat-label">Total Expenses</div>
            <div class="stat-val" style="color: #EF4444;">-${formatPaise(totalExpensePaise)}</div>
          </div>
          <div class="stat">
            <div class="stat-label">Net Surplus</div>
            <div class="stat-val" style="color: #0B0F17;">${formatPaise(netPaise)}</div>
          </div>
        </div>

        <h3>Transaction Audit Log</h3>
        <table>
          <thead>
            <tr>
              <th>Date & Time</th>
              <th>Merchant / Payee</th>
              <th>Category</th>
              <th>Account</th>
              <th style="text-align: right;">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${tableRowsHtml || '<tr><td colspan="5" style="text-align:center;">No transactions recorded.</td></tr>'}
          </tbody>
        </table>

        <div class="footer">
          Rokda Personal Money Manager — 100% Privacy & Local Encrypted Storage.
        </div>
      </body>
    </html>
  `;

  const filename = `Rokda_Statement_${Date.now()}.html`;
  const docDir = (FileSystem as any).documentDirectory || (FileSystem as any).Paths?.document || '';
  const fileUri = `${docDir}${filename}`;

  if ((FileSystem as any).writeAsStringAsync) {
    await (FileSystem as any).writeAsStringAsync(fileUri, htmlDocument, { encoding: (FileSystem as any).EncodingType?.UTF8 || 'utf8' });
  }

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(fileUri, { mimeType: 'text/html', dialogTitle: 'Download Rokda PDF Statement' });
  }

  return fileUri;
}
