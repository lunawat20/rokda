// ROKDA REPORT EXPORTER (NATIVE PDF GENERATOR & CSV EXPORTER)

import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as Print from 'expo-print';
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
 * Compiles a formatted PDF Financial Statement using native iOS/Android PDF engine and opens Share Sheet.
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
      const amountColor = isExpense ? '#FF5E7E' : '#00FF9D';

      return `
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #1E293D; color: #94A3B8;">${t.date} ${t.time}</td>
          <td style="padding: 10px; border-bottom: 1px solid #1E293D; color: #F8FAFC;"><strong>${t.merchant || 'N/A'}</strong></td>
          <td style="padding: 10px; border-bottom: 1px solid #1E293D; color: #CBD5E1;">${catName}</td>
          <td style="padding: 10px; border-bottom: 1px solid #1E293D; color: #CBD5E1;">${accName}</td>
          <td style="padding: 10px; border-bottom: 1px solid #1E293D; color: ${amountColor}; font-weight: bold; text-align: right;">${amountStr}</td>
        </tr>
      `;
    })
    .join('');

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Rokda Financial Statement</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 40px; color: #F8FAFC; background-color: #070A0F; }
          .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #00FF9D; padding-bottom: 20px; }
          .brand { font-size: 32px; font-weight: 900; color: #00FF9D; letter-spacing: -1px; }
          .subbrand { font-size: 14px; color: #94A3B8; margin-top: 4px; }
          .meta { text-align: right; font-size: 12px; color: #94A3B8; }
          .summary-box { display: flex; gap: 15px; margin: 30px 0; background: #0E1420; padding: 20px; border-radius: 16px; border: 1px solid #1E293D; }
          .stat { flex: 1; text-align: center; }
          .stat-label { font-size: 10px; text-transform: uppercase; color: #94A3B8; font-weight: 800; letter-spacing: 1px; }
          .stat-val { font-size: 22px; font-weight: 800; margin-top: 6px; }
          table { width: 100%; border-collapse: collapse; margin-top: 25px; font-size: 13px; }
          th { background: #1E293D; color: #00FF9D; text-align: left; padding: 12px; font-weight: 700; text-transform: uppercase; font-size: 11px; letter-spacing: 0.5px; }
          .footer { margin-top: 50px; text-align: center; font-size: 11px; color: #64748B; border-top: 1px solid #1E293D; padding-top: 20px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="brand">ROKDA</div>
            <div class="subbrand">Official Financial Statement & Audit Log</div>
          </div>
          <div class="meta">
            <div>Account Owner: <strong>${userName}</strong></div>
            <div>Date Generated: ${dateStr}</div>
          </div>
        </div>

        <div class="summary-box">
          <div class="stat">
            <div class="stat-label">Total Income</div>
            <div class="stat-val" style="color: #00FF9D;">+${formatPaise(totalIncomePaise)}</div>
          </div>
          <div class="stat">
            <div class="stat-label">Total Expenses</div>
            <div class="stat-val" style="color: #FF5E7E;">-${formatPaise(totalExpensePaise)}</div>
          </div>
          <div class="stat">
            <div class="stat-label">Net Surplus</div>
            <div class="stat-val" style="color: #F8FAFC;">${formatPaise(netPaise)}</div>
          </div>
        </div>

        <h3 style="color: #F8FAFC; font-size: 18px; margin-top: 30px;">Transaction Audit Log</h3>
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
            ${tableRowsHtml || '<tr><td colspan="5" style="text-align:center; padding:20px; color:#64748B;">No transactions recorded.</td></tr>'}
          </tbody>
        </table>

        <div class="footer">
          Rokda Money Manager — Hardware Encrypted Local Finance Vault.
        </div>
      </body>
    </html>
  `;

  // Compile HTML into native PDF binary using expo-print
  const { uri } = await Print.printToFileAsync({
    html: htmlContent,
    base64: false
  });

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, {
      mimeType: 'application/pdf',
      dialogTitle: 'Download Rokda PDF Statement',
      UTI: 'com.adobe.pdf'
    });
  }

  return uri;
}
