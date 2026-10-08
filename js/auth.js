/**
 * ReturnFlow - Authentication, Session & Role-Based Access Control (RBAC)
 */

const ROLE_PERMISSIONS = {
  'Customer Service': {
    pages: ['dashboard', 'new', 'cases', 'notifications', 'profile', 'guide'],
    canCreateReturn: true,
    canRunAiReview: true,
    canApproveRefund: false,
    canSettleFinance: false,
    canManageVendorClaims: false,
    canManageDisposition: false,
    canAdminister: false
  },
  'Returns Manager': {
    pages: ['dashboard', 'new', 'cases', 'exceptions', 'refund', 'analytics', 'notifications', 'activity', 'profile', 'guide'],
    canCreateReturn: true,
    canRunAiReview: true,
    canApproveRefund: true,
    canRejectRefund: true,
    canOverrideAi: true,
    canSettleFinance: false,
    canManageVendorClaims: false,
    canManageDisposition: false,
    canAdminister: false
  },
  'Finance': {
    pages: ['dashboard', 'cases', 'finance', 'analytics', 'notifications', 'activity', 'profile', 'guide'],
    canCreateReturn: false,
    canRunAiReview: false,
    canApproveRefund: false,
    canSettleFinance: true,
    canRejectSettlement: true,
    canManageVendorClaims: false,
    canManageDisposition: false,
    canAdminister: false
  },
  'Vendor Management': {
    pages: ['dashboard', 'cases', 'vendor', 'analytics', 'notifications', 'activity', 'profile', 'guide'],
    canCreateReturn: false,
    canRunAiReview: false,
    canApproveRefund: false,
    canSettleFinance: false,
    canManageVendorClaims: true,
    canManageDisposition: false,
    canAdminister: false
  },
  'Warehouse': {
    pages: ['dashboard', 'cases', 'disposition', 'notifications', 'activity', 'profile', 'guide'],
    canCreateReturn: false,
    canRunAiReview: false,
    canApproveRefund: false,
    canSettleFinance: false,
    canManageVendorClaims: false,
    canManageDisposition: true,
    canAdminister: false
  },
  'Administrator': {
    pages: ['dashboard', 'new', 'cases', 'exceptions', 'refund', 'finance', 'vendor', 'disposition', 'analytics', 'notifications', 'activity', 'profile', 'admin', 'guide'],
    canCreateReturn: true,
    canRunAiReview: true,
    canApproveRefund: true,
    canRejectRefund: true,
    canOverrideAi: true,
    canSettleFinance: true,
    canRejectSettlement: true,
    canManageVendorClaims: true,
    canManageDisposition: true,
    canAdminister: true
  }
};

const AuthService = {
  /**
   * Log in with username and password
   */
  login(username, password) {
    const users = AppStore.getData(DB_KEYS.USERS);
    const user = users.find(u => u.username.toLowerCase() === username.trim().toLowerCase() && u.password === password);
    
    if (user) {
      AppStore.setCurrentUser(user);
      AppStore.logActivity('User Logged In', 'User', user.id, `User ${user.name} (${user.role}) initiated active session.`);
      return { success: true, user };
    }
    return { success: false, error: 'Invalid username or password. Please use demo credentials.' };
  },

  /**
   * Fast demo login switch (for convenient role walkthroughs)
   */
  quickSwitchUser(username) {
    const users = AppStore.getData(DB_KEYS.USERS);
    const user = users.find(u => u.username.toLowerCase() === username.trim().toLowerCase());
    if (user) {
      AppStore.setCurrentUser(user);
      AppStore.logActivity('Switched Demo Role', 'User', user.id, `Session switched to ${user.name} (${user.role}).`);
      return { success: true, user };
    }
    return { success: false, error: 'User not found.' };
  },

  /**
   * Logout user
   */
  logout() {
    const current = AppStore.getCurrentUser();
    if (current) {
      AppStore.logActivity('User Logged Out', 'User', current.id, `User ${current.name} ended session.`);
    }
    AppStore.clearSession();
  },

  /**
   * Check if user has permission to access a page
   */
  canAccess(user, pageId) {
    if (!user) return false;
    if (user.role === 'Administrator') return true;
    const permissions = ROLE_PERMISSIONS[user.role];
    if (!permissions) return false;
    return permissions.pages.includes(pageId);
  },

  /**
   * Check a specific feature permission
   */
  hasPermission(permissionName) {
    const user = AppStore.getCurrentUser();
    if (!user) return false;
    if (user.role === 'Administrator') return true;
    const permissions = ROLE_PERMISSIONS[user.role];
    return !!(permissions && permissions[permissionName]);
  }
};
