# mcp-server-freee

[日本語](#日本語) | [English](#english)

---

## 日本語

### freee会計 MCP Server

**AI Agentがfreee会計を直接操作するための [Model Context Protocol (MCP)](https://modelcontextprotocol.io) サーバー**

日本初のfreee会計向けMCPサーバーです。Claude、ChatGPT、その他のAI Agentからfreee会計APIを安全に呼び出せます。

### 対応機能

| カテゴリ | ツール | 説明 |
|---------|--------|------|
| 事業所 | `get_companies`, `get_company` | 事業所情報の取得 |
| 取引 | `list_deals`, `create_deal`, `get_deal` | 収入・支出の管理 |
| 請求書 | `list_invoices`, `create_invoice` | 請求書の作成・管理 |
| 勘定科目 | `list_account_items` | 勘定科目一覧 |
| 取引先 | `list_partners`, `create_partner` | 取引先の管理 |
| 部門 | `list_sections` | 部門一覧 |
| 品目 | `list_items` | 品目一覧 |
| タグ | `list_tags` | メモタグ一覧 |
| 仕訳 | `list_journals` | 仕訳帳のダウンロード |
| 口座振替 | `list_transfers` | 振替一覧 |
| 明細 | `list_wallet_txns` | 自動で経理の明細 |
| 口座 | `list_walletables` | 口座一覧・残高 |
| ユーザー | `list_users` | 事業所ユーザー一覧 |
| 試算表 | `get_trial_balance` | 貸借対照表・損益計算書 |
| 経費 | `list_expense_applications` | 経費申請一覧 |
| 税区分 | `list_taxes` | 税区分コード一覧 |

### セットアップ

#### 1. freee APIアプリ作成

1. [freee Developers](https://developer.freee.co.jp/) でアプリを作成
2. OAuth 2.0でアクセストークンを取得

#### 2. インストール

```bash
npm install @aslink/mcp-server-freee
```

または直接実行:

```bash
npx @aslink/mcp-server-freee
```

#### 3. 環境変数

```bash
export FREEE_ACCESS_TOKEN="your_access_token_here"
```

#### 4. Claude Desktop設定

`claude_desktop_config.json` に追加:

```json
{
  "mcpServers": {
    "freee": {
      "command": "npx",
      "args": ["@aslink/mcp-server-freee"],
      "env": {
        "FREEE_ACCESS_TOKEN": "your_access_token_here"
      }
    }
  }
}
```

### 使用例

Claudeに話しかけるだけ:

- 「今月の売上を教えて」
- 「株式会社〇〇への請求書を作成して」
- 「未決済の取引を一覧して」
- 「試算表を見せて」
- 「先月の経費申請を確認して」

### ライセンス

MIT — [AS LINK](https://aslink.co)

---

## English

### freee Accounting MCP Server

**[Model Context Protocol (MCP)](https://modelcontextprotocol.io) server for AI Agents to interact with freee Accounting API**

The first MCP server for freee — Japan's leading cloud accounting SaaS. Enables Claude, ChatGPT, and other AI agents to securely access freee accounting data.

### Features

- 20+ tools covering deals, invoices, partners, journals, trial balance, and more
- Full read/write support for core accounting operations
- Japanese-native — designed for Japanese business workflows
- Secure — uses OAuth 2.0 access tokens, no credentials stored

### Quick Start

```bash
export FREEE_ACCESS_TOKEN="your_token"
npx @aslink/mcp-server-freee
```

### License

MIT — [AS LINK](https://aslink.co)
