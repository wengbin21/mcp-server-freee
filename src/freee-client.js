/**
 * freee API Client
 * Handles OAuth2 authentication and API calls to freee accounting API
 */

const FREEE_API_BASE = 'https://api.freee.co.jp';
const FREEE_AUTH_URL = 'https://accounts.secure.freee.co.jp/public_api/authorize';
const FREEE_TOKEN_URL = 'https://accounts.secure.freee.co.jp/public_api/token';

export class FreeeClient {
  constructor({ accessToken, refreshToken, clientId, clientSecret }) {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
    this.clientId = clientId;
    this.clientSecret = clientSecret;
  }

  async request(method, path, body = null) {
    const url = `${FREEE_API_BASE}${path}`;
    const headers = {
      'Authorization': `Bearer ${this.accessToken}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    const options = { method, headers };
    if (body && (method === 'POST' || method === 'PUT')) {
      options.body = JSON.stringify(body);
    }

    const res = await fetch(url, options);

    if (res.status === 401 && this.refreshToken) {
      await this.refreshAccessToken();
      headers['Authorization'] = `Bearer ${this.accessToken}`;
      const retryRes = await fetch(url, { method, headers, body: options.body });
      if (!retryRes.ok) {
        const err = await retryRes.text();
        throw new Error(`freee API error ${retryRes.status}: ${err}`);
      }
      return retryRes.json();
    }

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`freee API error ${res.status}: ${err}`);
    }

    return res.json();
  }

  async refreshAccessToken() {
    const res = await fetch(FREEE_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        grant_type: 'refresh_token',
        refresh_token: this.refreshToken,
        client_id: this.clientId,
        client_secret: this.clientSecret,
      }),
    });
    if (!res.ok) throw new Error('Failed to refresh freee access token');
    const data = await res.json();
    this.accessToken = data.access_token;
    if (data.refresh_token) this.refreshToken = data.refresh_token;
  }

  // ========== Companies ==========
  async getCompanies() {
    return this.request('GET', '/api/1/companies');
  }

  async getCompany(companyId) {
    return this.request('GET', `/api/1/companies/${companyId}`);
  }

  // ========== Deals (取引) ==========
  async getDeals(companyId, { offset = 0, limit = 20, partner_id, status, type } = {}) {
    const params = new URLSearchParams({ company_id: companyId, offset, limit });
    if (partner_id) params.set('partner_id', partner_id);
    if (status) params.set('status', status);
    if (type) params.set('type', type);
    return this.request('GET', `/api/1/deals?${params}`);
  }

  async getDeal(companyId, dealId) {
    return this.request('GET', `/api/1/deals/${dealId}?company_id=${companyId}`);
  }

  async createDeal(companyId, dealData) {
    return this.request('POST', '/api/1/deals', {
      company_id: companyId,
      ...dealData,
    });
  }

  // ========== Account Items (勘定科目) ==========
  async getAccountItems(companyId) {
    return this.request('GET', `/api/1/account_items?company_id=${companyId}`);
  }

  // ========== Partners (取引先) ==========
  async getPartners(companyId, { offset = 0, limit = 100 } = {}) {
    return this.request('GET', `/api/1/partners?company_id=${companyId}&offset=${offset}&limit=${limit}`);
  }

  async createPartner(companyId, partnerData) {
    return this.request('POST', '/api/1/partners', {
      company_id: companyId,
      ...partnerData,
    });
  }

  // ========== Invoices (請求書) ==========
  async getInvoices(companyId, { offset = 0, limit = 20 } = {}) {
    return this.request('GET', `/api/1/invoices?company_id=${companyId}&offset=${offset}&limit=${limit}`);
  }

  async createInvoice(companyId, invoiceData) {
    return this.request('POST', '/api/1/invoices', {
      company_id: companyId,
      ...invoiceData,
    });
  }

  // ========== Sections (部門) ==========
  async getSections(companyId) {
    return this.request('GET', `/api/1/sections?company_id=${companyId}`);
  }

  // ========== Tags (メモタグ) ==========
  async getTags(companyId) {
    return this.request('GET', `/api/1/tags?company_id=${companyId}`);
  }

  // ========== Walletables (口座) ==========
  async getWalletables(companyId, { type } = {}) {
    const params = new URLSearchParams({ company_id: companyId });
    if (type) params.set('type', type);
    return this.request('GET', `/api/1/walletables?${params}`);
  }

  // ========== Trial Balance (試算表) ==========
  async getTrialBalance(companyId, { fiscal_year, start_month, end_month } = {}) {
    const params = new URLSearchParams({ company_id: companyId });
    if (fiscal_year) params.set('fiscal_year', fiscal_year);
    if (start_month) params.set('start_month', start_month);
    if (end_month) params.set('end_month', end_month);
    return this.request('GET', `/api/1/reports/trial_bs?${params}`);
  }

  // ========== Expense Applications (経費精算) ==========
  async getExpenseApplications(companyId, { status, offset = 0, limit = 20 } = {}) {
    const params = new URLSearchParams({ company_id: companyId, offset, limit });
    if (status) params.set('status', status);
    return this.request('GET', `/api/1/expense_applications?${params}`);
  }

  async createExpenseApplication(companyId, data) {
    return this.request('POST', '/api/1/expense_applications', {
      company_id: companyId,
      ...data,
    });
  }

  // ========== Transfers (口座振替) ==========
  async getTransfers(companyId, { offset = 0, limit = 20 } = {}) {
    return this.request('GET', `/api/1/transfers?company_id=${companyId}&offset=${offset}&limit=${limit}`);
  }

  // ========== Manual Journals (振替伝票) ==========
  async getManualJournals(companyId, { offset = 0, limit = 20 } = {}) {
    return this.request('GET', `/api/1/manual_journals?company_id=${companyId}&offset=${offset}&limit=${limit}`);
  }

  async createManualJournal(companyId, data) {
    return this.request('POST', '/api/1/manual_journals', {
      company_id: companyId,
      ...data,
    });
  }
}
