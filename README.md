# mcp-server-freee 🇯🇵

**日本初！freee会計向けMCPサーバー**

[Model Context Protocol (MCP)](https://modelcontextprotocol.io) を通じて、AI Agentが[freee会計](https://www.freee.co.jp/)を直接操作できるようにするサーバーです。

Claude, GPT, Gemini, その他MCP対応のAI Agentから、freee会計の取引作成、請求書発行、試算表取得などが可能になります。

## 🚀 できること

| ツール | 説明 |
|--------|------|
| `freee_get_companies` | 事業所一覧の取得 |
| `freee_get_deals` | 取引（収入・支出）一覧の取得 |
| `freee_create_deal` | 取引の作成 |
| `freee_get_account_items` | 勘定科目一覧の取得 |
| `freee_get_partners` | 取引先一覧の取得 |
| `freee_create_partner` | 取引先の作成 |
| `freee_get_invoices` | 請求書一覧の取得 |
| `freee_create_invoice` | 請求書の作成 |
| `freee_get_walletables` | 口座一覧の取得 |
| `freee_get_trial_balance` | 試算表（B/S）の取得 |
| `freee_get_expense_applications` | 経費精算一覧の取得 |
| `freee_get_sections` | 部門一覧の取得 |
| `freee_create_manual_journal` | 振替伝票の作成 |

## 📦 インストール

```bash
npm install @aslink/mcp-server-freee
```

または直接cloneして使用:

```bash
git clone https://github.com/aslink-ai/mcp-server-freee.git
cd mcp-server-freee
npm install
```

## ⚙️ セットアップ

### 1. freee APIアプリの作成

1. [freee Developers](https://developer.freee.co.jp/) にアクセス
2. 「アプリ管理」→「新規作成」
3. リダイレクトURI: `urn:ietf:wg:oauth:2.0:oob`（CLIの場合）
4. Client ID と Client Secret を取得

### 2. アクセストークンの取得

[freeeクイックスタートガイド](https://developer.freee.co.jp/startguide/getting-access-token)に従ってOAuth2認証を行い、アクセストークンを取得してください。

### 3. 環境変数の設定

```bash
export FREEE_ACCESS_TOKEN="your_access_token"
export FREEE_REFRESH_TOKEN="your_refresh_token"  # 推奨
export FREEE_CLIENT_ID="your_client_id"           # リフレッシュ用
export FREEE_CLIENT_SECRET="your_client_secret"   # リフレッシュ用
```

## 🔌 使い方

### Claude Desktop / OpenClaw での設定

`claude_desktop_config.json` または OpenClaw の設定に追加:

```json
{
  "mcpServers": {
    "freee": {
      "command": "node",
      "args": ["/path/to/mcp-server-freee/src/index.js"],
      "env": {
        "FREEE_ACCESS_TOKEN": "your_token"
      }
    }
  }
}
```

### 直接起動

```bash
FREEE_ACCESS_TOKEN=your_token node src/index.js
```

## 💡 使用例

### AIに話しかけるだけ:

```
「今月の取引一覧を見せて」
→ freee_get_deals を呼び出し、取引一覧を返します

「田中商事に10万円の請求書を発行して」
→ freee_create_partner + freee_create_invoice を連携実行

「今期の試算表を確認して」
→ freee_get_trial_balance で貸借対照表を取得

「交通費3,200円を経費精算に追加して」
→ freee_create_deal で支出取引を作成
```

## 🔒 セキュリティ

- アクセストークンは環境変数で管理してください（コードに直書きしないこと）
- 書き込み系ツール（`create_*`）はAI Agentの設定でHuman-in-the-Loopを推奨
- 本番環境ではアクセス権限を最小限に設定してください

## 🛠️ 開発

```bash
# 開発モード（ファイル変更時に自動再起動）
npm run dev

# テスト（coming soon）
npm test
```

## 📄 ライセンス

MIT License

## 🏢 開発元

**[AS LINK](https://aslink.co)** — 中小企業向けAIインフラ・ソリューションプロバイダー

大阪を拠点に、オープンソースのAIツールで日本の中小企業のDXを支援しています。

### 関連プロジェクト

- [mcp-server-kintone](https://github.com/aslink-ai/mcp-server-kintone) (coming soon)
- [mcp-server-moneyforward](https://github.com/aslink-ai/mcp-server-moneyforward) (coming soon)
- [mcp-server-chatwork](https://github.com/aslink-ai/mcp-server-chatwork) (coming soon)

---

**⭐ このプロジェクトが役に立ったら、GitHubでスターをお願いします！**
