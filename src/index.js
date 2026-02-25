#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

// ============================================================
// freee MCP Server — by AS LINK (aslink.co)
// First MCP Server for Japanese accounting SaaS
// ============================================================

const FREEE_API_BASE = "https://api.freee.co.jp";

// --- Auth & HTTP helpers ---

function getAccessToken() {
  const token = process.env.FREEE_ACCESS_TOKEN;
  if (!token) throw new Error("FREEE_ACCESS_TOKEN environment variable is required");
  return token;
}

async function freeeRequest(path, options = {}) {
  const token = getAccessToken();
  const url = `${FREEE_API_BASE}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
      ...options.headers,
    },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`freee API ${res.status}: ${body}`);
  }
  return res.json();
}

async function freeeGet(path) {
  return freeeRequest(path);
}

async function freeePost(path, body) {
  return freeeRequest(path, { method: "POST", body: JSON.stringify(body) });
}

async function freeePut(path, body) {
  return freeeRequest(path, { method: "PUT", body: JSON.stringify(body) });
}

async function freeeDelete(path) {
  return freeeRequest(path, { method: "DELETE" });
}

// --- MCP Server ---

const server = new McpServer({
  name: "freee-accounting",
  version: "0.1.0",
});

// ==================== Companies ====================

server.tool(
  "get_companies",
  "freeeアカウントに紐づく事業所一覧を取得",
  {},
  async () => {
    const data = await freeeGet("/api/1/companies");
    return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
  }
);

server.tool(
  "get_company",
  "事業所の詳細情報を取得",
  { company_id: z.number().describe("事業所ID") },
  async ({ company_id }) => {
    const data = await freeeGet(`/api/1/companies/${company_id}`);
    return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
  }
);

// ==================== Deals (取引) ====================

server.tool(
  "list_deals",
  "取引（収入・支出）一覧を取得",
  {
    company_id: z.number().describe("事業所ID"),
    partner_id: z.number().optional().describe("取引先ID"),
    status: z.enum(["settled", "unsettled"]).optional().describe("決済状況"),
    type: z.enum(["income", "expense"]).optional().describe("収入/支出"),
    start_issue_date: z.string().optional().describe("発生日From (yyyy-MM-dd)"),
    end_issue_date: z.string().optional().describe("発生日To (yyyy-MM-dd)"),
    offset: z.number().optional().describe("オフセット"),
    limit: z.number().optional().describe("取得件数 (max 100)"),
  },
  async (params) => {
    const qs = new URLSearchParams();
    qs.set("company_id", String(params.company_id));
    if (params.partner_id) qs.set("partner_id", String(params.partner_id));
    if (params.status) qs.set("status", params.status);
    if (params.type) qs.set("type", params.type);
    if (params.start_issue_date) qs.set("start_issue_date", params.start_issue_date);
    if (params.end_issue_date) qs.set("end_issue_date", params.end_issue_date);
    if (params.offset) qs.set("offset", String(params.offset));
    if (params.limit) qs.set("limit", String(params.limit));
    const data = await freeeGet(`/api/1/deals?${qs}`);
    return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
  }
);

server.tool(
  "create_deal",
  "取引（収入・支出）を作成",
  {
    company_id: z.number().describe("事業所ID"),
    type: z.enum(["income", "expense"]).describe("収入/支出"),
    issue_date: z.string().describe("発生日 (yyyy-MM-dd)"),
    due_date: z.string().optional().describe("支払期日 (yyyy-MM-dd)"),
    partner_id: z.number().optional().describe("取引先ID"),
    ref_number: z.string().optional().describe("管理番号"),
    details: z
      .array(
        z.object({
          account_item_id: z.number().describe("勘定科目ID"),
          tax_code: z.number().describe("税区分コード"),
          amount: z.number().describe("金額"),
          item_id: z.number().optional().describe("品目ID"),
          section_id: z.number().optional().describe("部門ID"),
          tag_ids: z.array(z.number()).optional().describe("タグID"),
          description: z.string().optional().describe("備考"),
        })
      )
      .describe("取引明細行"),
  },
  async (params) => {
    const body = {
      company_id: params.company_id,
      type: params.type,
      issue_date: params.issue_date,
      details: params.details,
    };
    if (params.due_date) body.due_date = params.due_date;
    if (params.partner_id) body.partner_id = params.partner_id;
    if (params.ref_number) body.ref_number = params.ref_number;
    const data = await freeePost("/api/1/deals", body);
    return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
  }
);

server.tool(
  "get_deal",
  "取引の詳細を取得",
  {
    company_id: z.number().describe("事業所ID"),
    deal_id: z.number().describe("取引ID"),
  },
  async ({ company_id, deal_id }) => {
    const data = await freeeGet(`/api/1/deals/${deal_id}?company_id=${company_id}`);
    return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
  }
);

// ==================== Account Items (勘定科目) ====================

server.tool(
  "list_account_items",
  "勘定科目一覧を取得",
  {
    company_id: z.number().describe("事業所ID"),
    base_date: z.string().optional().describe("基準日 (yyyy-MM-dd)"),
  },
  async ({ company_id, base_date }) => {
    const qs = `company_id=${company_id}${base_date ? `&base_date=${base_date}` : ""}`;
    const data = await freeeGet(`/api/1/account_items?${qs}`);
    return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
  }
);

// ==================== Partners (取引先) ====================

server.tool(
  "list_partners",
  "取引先一覧を取得",
  {
    company_id: z.number().describe("事業所ID"),
    keyword: z.string().optional().describe("検索キーワード"),
    offset: z.number().optional(),
    limit: z.number().optional(),
  },
  async (params) => {
    const qs = new URLSearchParams({ company_id: String(params.company_id) });
    if (params.keyword) qs.set("keyword", params.keyword);
    if (params.offset) qs.set("offset", String(params.offset));
    if (params.limit) qs.set("limit", String(params.limit));
    const data = await freeeGet(`/api/1/partners?${qs}`);
    return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
  }
);

server.tool(
  "create_partner",
  "取引先を作成",
  {
    company_id: z.number().describe("事業所ID"),
    name: z.string().describe("取引先名"),
    shortcut1: z.string().optional().describe("ショートカット1"),
    long_name: z.string().optional().describe("正式名称"),
    name_kana: z.string().optional().describe("カナ名称"),
    country_code: z.string().optional().describe("国コード (JP等)"),
    org_code: z.number().optional().describe("法人番号"),
  },
  async (params) => {
    const data = await freeePost("/api/1/partners", {
      company_id: params.company_id,
      name: params.name,
      shortcut1: params.shortcut1,
      long_name: params.long_name,
      name_kana: params.name_kana,
      country_code: params.country_code,
      org_code: params.org_code,
    });
    return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
  }
);

// ==================== Sections (部門) ====================

server.tool(
  "list_sections",
  "部門一覧を取得",
  { company_id: z.number().describe("事業所ID") },
  async ({ company_id }) => {
    const data = await freeeGet(`/api/1/sections?company_id=${company_id}`);
    return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
  }
);

// ==================== Items (品目) ====================

server.tool(
  "list_items",
  "品目一覧を取得",
  { company_id: z.number().describe("事業所ID") },
  async ({ company_id }) => {
    const data = await freeeGet(`/api/1/items?company_id=${company_id}`);
    return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
  }
);

// ==================== Tags (メモタグ) ====================

server.tool(
  "list_tags",
  "メモタグ一覧を取得",
  { company_id: z.number().describe("事業所ID") },
  async ({ company_id }) => {
    const data = await freeeGet(`/api/1/tags?company_id=${company_id}`);
    return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
  }
);

// ==================== Journals (仕訳) ====================

server.tool(
  "list_journals",
  "仕訳帳をダウンロード（非同期）。まずリクエストを送信し、ステータスを確認してからダウンロード",
  {
    company_id: z.number().describe("事業所ID"),
    start_date: z.string().optional().describe("開始日 (yyyy-MM-dd)"),
    end_date: z.string().optional().describe("終了日 (yyyy-MM-dd)"),
  },
  async ({ company_id, start_date, end_date }) => {
    const qs = new URLSearchParams({
      company_id: String(company_id),
      download_type: "generic",
    });
    if (start_date) qs.set("start_date", start_date);
    if (end_date) qs.set("end_date", end_date);
    const data = await freeeGet(`/api/1/journals?${qs}`);
    return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
  }
);

// ==================== Invoices (請求書) ====================

server.tool(
  "list_invoices",
  "請求書一覧を取得",
  {
    company_id: z.number().describe("事業所ID"),
    partner_id: z.number().optional().describe("取引先ID"),
    invoice_status: z.string().optional().describe("ステータス"),
    payment_status: z.string().optional().describe("入金ステータス"),
    start_issue_date: z.string().optional().describe("発行日From"),
    end_issue_date: z.string().optional().describe("発行日To"),
    offset: z.number().optional(),
    limit: z.number().optional(),
  },
  async (params) => {
    const qs = new URLSearchParams({ company_id: String(params.company_id) });
    if (params.partner_id) qs.set("partner_id", String(params.partner_id));
    if (params.invoice_status) qs.set("invoice_status", params.invoice_status);
    if (params.payment_status) qs.set("payment_status", params.payment_status);
    if (params.start_issue_date) qs.set("start_issue_date", params.start_issue_date);
    if (params.end_issue_date) qs.set("end_issue_date", params.end_issue_date);
    if (params.offset) qs.set("offset", String(params.offset));
    if (params.limit) qs.set("limit", String(params.limit));
    const data = await freeeGet(`/api/1/invoices?${qs}`);
    return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
  }
);

server.tool(
  "create_invoice",
  "請求書を作成",
  {
    company_id: z.number().describe("事業所ID"),
    partner_id: z.number().describe("取引先ID"),
    issue_date: z.string().describe("発行日 (yyyy-MM-dd)"),
    due_date: z.string().optional().describe("支払期日"),
    booking_date: z.string().optional().describe("売上計上日"),
    title: z.string().optional().describe("タイトル"),
    invoice_number: z.string().optional().describe("請求書番号"),
    invoice_lines: z
      .array(
        z.object({
          name: z.string().describe("品名"),
          quantity: z.number().describe("数量"),
          unit_price: z.number().describe("単価"),
          tax_code: z.number().describe("税区分コード"),
          description: z.string().optional().describe("備考"),
        })
      )
      .describe("請求書明細"),
  },
  async (params) => {
    const body = {
      company_id: params.company_id,
      partner_id: params.partner_id,
      issue_date: params.issue_date,
      invoice_lines: params.invoice_lines,
    };
    if (params.due_date) body.due_date = params.due_date;
    if (params.booking_date) body.booking_date = params.booking_date;
    if (params.title) body.title = params.title;
    if (params.invoice_number) body.invoice_number = params.invoice_number;
    const data = await freeePost("/api/1/invoices", body);
    return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
  }
);

// ==================== Transfers (振替) ====================

server.tool(
  "list_transfers",
  "口座振替一覧を取得",
  {
    company_id: z.number().describe("事業所ID"),
    start_date: z.string().optional(),
    end_date: z.string().optional(),
    offset: z.number().optional(),
    limit: z.number().optional(),
  },
  async (params) => {
    const qs = new URLSearchParams({ company_id: String(params.company_id) });
    if (params.start_date) qs.set("start_date", params.start_date);
    if (params.end_date) qs.set("end_date", params.end_date);
    if (params.offset) qs.set("offset", String(params.offset));
    if (params.limit) qs.set("limit", String(params.limit));
    const data = await freeeGet(`/api/1/transfers?${qs}`);
    return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
  }
);

// ==================== Wallet Transactions (明細) ====================

server.tool(
  "list_wallet_txns",
  "明細（自動で経理）一覧を取得",
  {
    company_id: z.number().describe("事業所ID"),
    walletable_type: z.enum(["bank_account", "credit_card", "wallet"]).optional(),
    walletable_id: z.number().optional(),
    start_date: z.string().optional(),
    end_date: z.string().optional(),
    offset: z.number().optional(),
    limit: z.number().optional(),
  },
  async (params) => {
    const qs = new URLSearchParams({ company_id: String(params.company_id) });
    if (params.walletable_type) qs.set("walletable_type", params.walletable_type);
    if (params.walletable_id) qs.set("walletable_id", String(params.walletable_id));
    if (params.start_date) qs.set("start_date", params.start_date);
    if (params.end_date) qs.set("end_date", params.end_date);
    if (params.offset) qs.set("offset", String(params.offset));
    if (params.limit) qs.set("limit", String(params.limit));
    const data = await freeeGet(`/api/1/wallet_txns?${qs}`);
    return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
  }
);

// ==================== Walletables (口座) ====================

server.tool(
  "list_walletables",
  "口座一覧を取得",
  {
    company_id: z.number().describe("事業所ID"),
    with_balance: z.boolean().optional().describe("残高情報を含む"),
  },
  async ({ company_id, with_balance }) => {
    const qs = `company_id=${company_id}${with_balance ? "&with_balance=true" : ""}`;
    const data = await freeeGet(`/api/1/walletables?${qs}`);
    return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
  }
);

// ==================== Users (ユーザー) ====================

server.tool(
  "list_users",
  "事業所のユーザー一覧を取得",
  { company_id: z.number().describe("事業所ID") },
  async ({ company_id }) => {
    const data = await freeeGet(`/api/1/users?company_id=${company_id}`);
    return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
  }
);

// ==================== Trial Balance (試算表) ====================

server.tool(
  "get_trial_balance",
  "試算表を取得（貸借対照表/損益計算書）",
  {
    company_id: z.number().describe("事業所ID"),
    fiscal_year: z.number().optional().describe("会計年度"),
    start_month: z.number().optional().describe("開始月 (1-12)"),
    end_month: z.number().optional().describe("終了月 (1-12)"),
  },
  async (params) => {
    const qs = new URLSearchParams({ company_id: String(params.company_id) });
    if (params.fiscal_year) qs.set("fiscal_year", String(params.fiscal_year));
    if (params.start_month) qs.set("start_month", String(params.start_month));
    if (params.end_month) qs.set("end_month", String(params.end_month));
    const data = await freeeGet(`/api/1/reports/trial_bs?${qs}`);
    return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
  }
);

// ==================== Expense Applications (経費申請) ====================

server.tool(
  "list_expense_applications",
  "経費申請一覧を取得",
  {
    company_id: z.number().describe("事業所ID"),
    status: z.string().optional().describe("ステータス (draft/in_progress/approved/rejected)"),
    offset: z.number().optional(),
    limit: z.number().optional(),
  },
  async (params) => {
    const qs = new URLSearchParams({ company_id: String(params.company_id) });
    if (params.status) qs.set("status", params.status);
    if (params.offset) qs.set("offset", String(params.offset));
    if (params.limit) qs.set("limit", String(params.limit));
    const data = await freeeGet(`/api/1/expense_applications?${qs}`);
    return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
  }
);

// ==================== Taxes (税区分) ====================

server.tool(
  "list_taxes",
  "税区分コード一覧を取得",
  { company_id: z.number().describe("事業所ID") },
  async ({ company_id }) => {
    const data = await freeeGet(`/api/1/taxes/codes?company_id=${company_id}`);
    return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
  }
);

// ==================== Start Server ====================

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("freee MCP Server running on stdio");
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
