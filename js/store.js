/**
 * ReturnFlow - LocalStorage State Management & Persistence Layer
 * Simulates a mini backend repository with relational integrity.
 */

const DB_KEYS = {
  USERS: 'rrc_users',
  CURRENT_USER: 'rrc_current_user',
  CASES: 'rrc_cases',
  EXCEPTIONS: 'rrc_exceptions',
  REFUNDS: 'rrc_refunds',
  VENDOR_CLAIMS: 'rrc_vendor_claims',
  DISPOSITIONS: 'rrc_dispositions',
  NOTIFICATIONS: 'rrc_notifications',
  ACTIVITY_LOG: 'rrc_activity_log',
  SETTINGS: 'rrc_settings'
};

class Store {
  constructor() {
    this.init();
  }

  init() {
    // Check if store already initialized; if not, seed default demo data
    if (!localStorage.getItem(DB_KEYS.USERS) || !localStorage.getItem(DB_KEYS.CASES)) {
      this.seedDefaultData();
    }
  }

  seedDefaultData() {
    localStorage.setItem(DB_KEYS.USERS, JSON.stringify(SEED_DATA.users));
    localStorage.setItem(DB_KEYS.CASES, JSON.stringify(SEED_DATA.cases));
    localStorage.setItem(DB_KEYS.EXCEPTIONS, JSON.stringify(SEED_DATA.exceptions));
    localStorage.setItem(DB_KEYS.REFUNDS, JSON.stringify(SEED_DATA.refunds));
    localStorage.setItem(DB_KEYS.VENDOR_CLAIMS, JSON.stringify(SEED_DATA.vendorClaims));
    localStorage.setItem(DB_KEYS.DISPOSITIONS, JSON.stringify(SEED_DATA.dispositions));
    localStorage.setItem(DB_KEYS.NOTIFICATIONS, JSON.stringify(SEED_DATA.notifications));
    localStorage.setItem(DB_KEYS.ACTIVITY_LOG, JSON.stringify(SEED_DATA.activityLog));
    localStorage.setItem(DB_KEYS.SETTINGS, JSON.stringify(SEED_DATA.settings));
  }

  resetAllData() {
    this.seedDefaultData();
    this.clearSession();
  }

  // Generic Get
  getData(key) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('Error reading localStorage key:', key, e);
      return [];
    }
  }

  // Generic Set
  setData(key, data) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
      window.dispatchEvent(new CustomEvent('rrc_store_updated', { detail: { key } }));
      return true;
    } catch (e) {
      console.error('Error saving to localStorage key:', key, e);
      return false;
    }
  }

  // Item operations
  getItemById(key, id) {
    const list = this.getData(key);
    return list.find(item => item.id === id) || null;
  }

  addItem(key, item) {
    const list = this.getData(key);
    list.unshift(item);
    this.setData(key, list);
    return item;
  }

  updateItem(key, id, updates) {
    const list = this.getData(key);
    const index = list.findIndex(item => item.id === id);
    if (index !== -1) {
      list[index] = { ...list[index], ...updates, updatedAt: new Date().toISOString() };
      this.setData(key, list);
      return list[index];
    }
    return null;
  }

  deleteItem(key, id) {
    const list = this.getData(key);
    const filtered = list.filter(item => item.id !== id);
    this.setData(key, filtered);
    return filtered;
  }

  // Auth & Session
  getCurrentUser() {
    try {
      const u = localStorage.getItem(DB_KEYS.CURRENT_USER);
      return u ? JSON.parse(u) : null;
    } catch (e) {
      return null;
    }
  }

  setCurrentUser(user) {
    if (!user) {
      localStorage.removeItem(DB_KEYS.CURRENT_USER);
    } else {
      localStorage.setItem(DB_KEYS.CURRENT_USER, JSON.stringify(user));
    }
    window.dispatchEvent(new CustomEvent('rrc_auth_changed', { detail: { user } }));
  }

  clearSession() {
    localStorage.removeItem(DB_KEYS.CURRENT_USER);
    window.dispatchEvent(new CustomEvent('rrc_auth_changed', { detail: { user: null } }));
  }

  // Audit Logging
  logActivity(action, entity, entityId, details, userOverride = null) {
    const user = userOverride || this.getCurrentUser() || { name: 'System', role: 'Automated Service' };
    const logEntry = {
      id: 'ACT-' + Date.now().toString().slice(-6),
      timestamp: new Date().toISOString(),
      user: user.name,
      role: user.role,
      action: action,
      entity: entity,
      entityId: entityId,
      details: details
    };
    const logs = this.getData(DB_KEYS.ACTIVITY_LOG);
    logs.unshift(logEntry);
    this.setData(DB_KEYS.ACTIVITY_LOG, logs);
    return logEntry;
  }

  // Notification Center
  createNotification(title, message, type = 'info', roleTarget = 'All', linkPage = 'dashboard', linkId = null) {
    const notif = {
      id: 'NOTIF-' + Date.now().toString().slice(-5),
      title,
      message,
      type, // 'info' | 'success' | 'warning' | 'danger'
      timestamp: new Date().toISOString(),
      read: false,
      roleTarget, // 'Customer Service' | 'Returns Manager' | 'Finance' | 'Vendor Management' | 'Warehouse' | 'All'
      linkPage,
      linkId
    };
    const notifs = this.getData(DB_KEYS.NOTIFICATIONS);
    notifs.unshift(notif);
    this.setData(DB_KEYS.NOTIFICATIONS, notifs);
    return notif;
  }

  markNotificationRead(id) {
    const notifs = this.getData(DB_KEYS.NOTIFICATIONS);
    const n = notifs.find(item => item.id === id);
    if (n) {
      n.read = true;
      this.setData(DB_KEYS.NOTIFICATIONS, notifs);
    }
  }

  markAllNotificationsRead(role = null) {
    const notifs = this.getData(DB_KEYS.NOTIFICATIONS);
    notifs.forEach(n => {
      if (!role || role === 'Administrator' || n.roleTarget === 'All' || n.roleTarget === role) {
        n.read = true;
      }
    });
    this.setData(DB_KEYS.NOTIFICATIONS, notifs);
  }

  // Dynamic KPI Aggregator
  computeKpis() {
    const cases = this.getData(DB_KEYS.CASES);
    const exceptions = this.getData(DB_KEYS.EXCEPTIONS);
    const refunds = this.getData(DB_KEYS.REFUNDS);
    const vendorClaims = this.getData(DB_KEYS.VENDOR_CLAIMS);

    const totalCases = cases.length;
    const autoApprovedCases = cases.filter(c => c.aiAssessment && c.aiAssessment.suggestedDecision.includes('AUTO APPROVE')).length;
    const autoDecidedPct = totalCases > 0 ? Math.round((autoApprovedCases / totalCases) * 100) : 70;

    const openExceptions = exceptions.filter(e => e.status !== 'Resolved' && e.status !== 'Closed').length;
    const pendingRefunds = refunds.filter(r => r.status.includes('Pending')).length;

    // Total recovered from vendor claims
    const vendorRecoveredAmt = vendorClaims
      .filter(v => v.status === 'Accepted' || v.status === 'Settled')
      .reduce((sum, v) => sum + (v.recoveryAmount || 0), 0);

    // Total pending vendor claims
    const vendorPendingAmt = vendorClaims
      .filter(v => v.status === 'Claim Raised' || v.status === 'Disputed')
      .reduce((sum, v) => sum + (v.recoveryAmount || 0), 0);

    const highRiskCases = cases.filter(c => c.riskLevel === 'High').length;

    return {
      totalCases,
      autoApprovedCases,
      autoDecidedPct,
      openExceptions,
      pendingRefunds,
      vendorRecoveredAmt,
      vendorPendingAmt,
      highRiskCases,
      avgRefundTimeDays: '1.8'
    };
  }

  // Backup & Restore
  exportStateJson() {
    const state = {};
    Object.keys(DB_KEYS).forEach(k => {
      const keyName = DB_KEYS[k];
      state[keyName] = this.getData(keyName);
    });
    return JSON.stringify(state, null, 2);
  }

  importStateJson(jsonStr) {
    try {
      const state = JSON.parse(jsonStr);
      Object.keys(state).forEach(key => {
        localStorage.setItem(key, JSON.stringify(state[key]));
      });
      window.dispatchEvent(new CustomEvent('rrc_store_updated', { detail: { key: 'ALL' } }));
      return { success: true };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }
}

// Global singleton instance
const AppStore = new Store();
