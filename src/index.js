#!/usr/bin/env node

/**
 * MCP Server for freee Accounting API
 * 
 * AI AgentがMCPプロトコル経由でfreee会計を操作できるようにするサーバー。
 * 日本初のfreee向けMCPサーバー。
 * 
 * © 2026 AS LINK | MIT License
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { FreeeClient } from './freee-client.js';

const server = new McpServer({
  name: 'mcp-server-freee',
  version: '0.1.0',
});

// Initialize freee client from environment variables
function getClient() {
  const accessToken = process.env.FREEE_ACCESS_TOKEN;
  const refreshToken = process.env.FREEE_REFRESH_TOKEN;
  const clientId = process.env.FREEE_CLIENT_ID;
  const clientSecret = process.env.FREEE_CLIENT_SECRET;

  if (!accessToken) {
    throw new Error('FREEE_ACCESS_TOKEN is required. Set it as an environment variable.');
  }

  return new FreeeClient({ accessToken, refreshToken, clientId, clientSecret });
}

// ========== Tool Definitions ==========

// 事業所一覧
server.tool(
  'freee_get_companies',
  '事業所一覧を取得します。freee会計に登録されている事業所の一覧とcompany_idを返します。他のAPIを使う前にまずこれでcompany_idを確認してください。',
  {},
  async () => {
    const client = getClient();
    const data = await client.getCompanies();
    return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
  }
);

// 取引一覧
server.tool(
  'freee_get_deals',
  '取引（収入・支出）の一覧を取得します。取引はお金の動きを伴う仕訳です。',
  {
    company_id: z.number().describe('事業所ID（freee_get_companiesで取得）'),
    limit: z.number().optional().default(20).describe('取得件数（最大100）'),
    offset: z.number().optional().default(0).describe('オフセット'),
    type: z.enum(['income', 'expense']).optional().describe('取引種別: income=収入, expense=支出'),
    partner_id: z.number().optional().describe('取引先IDでフィルタ'),
  },
  async ({ company_id, limit, offset, type, partner_id }) => {
    const client = getClient();
    const data = await client.getDeals(company_id, { limit, offset, type, partner_id });
    return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
  }
);

// 取引作成
server.tool(
  'freee_create_deal',
  '新しい取引（収入・支出）を作成します。⚠️ 実際にfreee会計にデータを書き込みます。',
  {
    company_id: z.number().describe('事業所ID'),
    issue_date: z.string().describe('発生日 (YYYY-MM-DD)'),
    type: z.enum(['income', 'expense']).describe('取引種別: income=収入, expense=支出'),
    partner_id: z.number().optional().describe('取引先ID'),
    details: z.array(z.object({
      account_item_id: z.number().describe('勘定科目ID'),
      tax_code: z.number().describe('税区分コード'),
      amount: z.number().describe('金額'),
      description: z.string().optional().describe('摘要'),
    })).describe('取引明細（1つ以上）'),
  },
  async ({ company_id, issue_date, type, partner_id, details }) => {
    const client = getClient();
    const data = await client.createDeal(company_id, {
      issue_date, type, partner_id, details,
    });
    return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
  }
);

// 勘定科目一覧
server.tool(
  'freee_get_account_items',
  '勘定科目一覧を取得します。取引作成時にaccount_item_idが必要です。',
  {
    company_id: z.number().describe('事業所ID'),
  },
  async ({ company_id }) => {
    const client = getClient();
    const data = await client.getAccountItems(company_id);
    return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
  }
);

// 取引先一覧
server.tool(
  'freee_get_partners',
  '取引先一覧を取得します。',
  {
    company_id: z.number().describe('事業所ID'),
    limit: z.number().optional().default(100).describe('取得件数'),
  },
  async ({ company_id, limit }) => {
    const client = getClient();
    const data = await client.getPartners(company_id, { limit });
    return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
  }
);

// 取引先作成
server.tool(
  'freee_create_partner',
  '新しい取引先を作成します。',
  {
    company_id: z.number().describe('事業所ID'),
    name: z.string().describe('取引先名'),
    shortcut1: z.string().optional().describe('ショートカット1（検索用）'),
    long_name: z.string().optional().describe('正式名称'),
  },
  async ({ company_id, name, shortcut1, long_name }) => {
    const client = getClient();
    const data = await client.createPartner(company_id, { name, shortcut1, long_name });
    return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
  }
);

// 請求書一覧
server.tool(
  'freee_get_invoices',
  '請求書一覧を取得します。',
  {
    company_id: z.number().describe('事業所ID'),
    limit: z.number().optional().default(20).describe('取得件数'),
  },
  async ({ company_id, limit }) => {
    const client = getClient();
    const data = await client.getInvoices(company_id, { limit });
    return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
  }
);

// 請求書作成
server.tool(
  'freee_create_invoice',
  '新しい請求書を作成します。⚠️ 実際にfreee会計にデータを書き込みます。',
  {
    company_id: z.number().describe('事業所ID'),
    partner_id: z.number().describe('請求先取引先ID'),
    invoice_number: z.string().optional().describe('請求書番号'),
    issue_date: z.string().describe('発行日 (YYYY-MM-DD)'),
    due_date: z.string().optional().describe('支払期日 (YYYY-MM-DD)'),
    title: z.string().optional().describe('タイトル'),
    invoice_lines: z.array(z.object({
      name: z.string().describe('品名'),
      quantity: z.number().describe('数量'),
      unit_price: z.number().describe('単価'),
      tax_code: z.number().optional().describe('税区分コード'),
      description: z.string().optional().describe('説明'),
    })).describe('請求書明細行'),
  },
  async ({ company_id, partner_id, invoice_number, issue_date, due_date, title, invoice_lines }) => {
    const client = getClient();
    const data = await client.createInvoice(company_id, {
      partner_id, invoice_number, issue_date, due_date, title,
      invoice_contents: invoice_lines.map(line => ({
        name: line.name,
        quantity: line.quantity,
        unit_price: line.unit_price,
        tax_code: line.tax_code,
        description: line.description,
      })),
    });
    return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
  }
);

// 口座一覧
server.tool(
  'freee_get_walletables',
  '口座（銀行口座・クレジットカード・現金等）の一覧を取得します。',
  {
    company_id: z.number().describe('事業所ID'),
    type: z.enum(['bank_account', 'credit_card', 'wallet']).optional().describe('口座種別'),
  },
  async ({ company_id, type }) => {
    const client = getClient();
    const data = await client.getWalletables(company_id, { type });
    return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
  }
);

// 試算表
server.tool(
  'freee_get_trial_balance',
  '試算表（貸借対照表）を取得します。会社の財務状況を確認できます。',
  {
    company_id: z.number().describe('事業所ID'),
    fiscal_year: z.number().optional().describe('会計年度'),
    start_month: z.number().optional().describe('開始月 (1-12)'),
    end_month: z.number().optional().describe('終了月 (1-12)'),
  },
  async ({ company_id, fiscal_year, start_month, end_month }) => {
    const client = getClient();
    const data = await client.getTrialBalance(company_id, { fiscal_year, start_month, end_month });
    return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
  }
);

// 経費精算一覧
server.tool(
  'freee_get_expense_applications',
  '経費精算申請の一覧を取得します。',
  {
    company_id: z.number().describe('事業所ID'),
    status: z.enum(['draft', 'in_progress', 'approved', 'rejected']).optional().describe('ステータス'),
    limit: z.number().optional().default(20).describe('取得件数'),
  },
  async ({ company_id, status, limit }) => {
    const client = getClient();
    const data = await client.getExpenseApplications(company_id, { status, limit });
    return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
  }
);

// 部門一覧
server.tool(
  'freee_get_sections',
  '部門一覧を取得します。取引に部門タグを付与することで部門別集計が可能です。',
  {
    company_id: z.number().describe('事業所ID'),
  },
  async ({ company_id }) => {
    const client = getClient();
    const data = await client.getSections(company_id);
    return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
  }
);

// 振替伝票作成
server.tool(
  'freee_create_manual_journal',
  '振替伝票を作成します。お金の動きを伴わない仕訳（減価償却、前払費用振替など）に使います。',
  {
    company_id: z.number().describe('事業所ID'),
    issue_date: z.string().describe('発生日 (YYYY-MM-DD)'),
    details: z.array(z.object({
      entry_side: z.enum(['debit', 'credit']).describe('貸借区分: debit=借方, credit=貸方'),
      account_item_id: z.number().describe('勘定科目ID'),
      tax_code: z.number().describe('税区分コード'),
      amount: z.number().describe('金額'),
      description: z.string().optional().describe('摘要'),
    })).describe('仕訳明細（借方・貸方の合計が一致する必要あり）'),
  },
  async ({ company_id, issue_date, details }) => {
    const client = getClient();
    const data = await client.createManualJournal(company_id, { issue_date, details });
    return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
  }
);

// ========== Start Server ==========
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('freee MCP Server started (stdio transport)');
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
