/**
 * ReturnFlow - Main Application Controller, Router & Lifecycle Manager
 */

const PAGE_NAMES = {
  login: 'Sign In',
  dashboard: 'Overview Dashboard',
  new: 'Create Return Case',
  cases: 'Return Cases',
  exceptions: 'Exception Work Queue',
  refund: 'Refund & Decision Center',
  finance: 'Finance Approval',
  vendor: 'Vendor Recovery',
  disposition: 'Return Disposition',
  analytics: 'Analytics & Intelligence',
  notifications: 'Notifications',
  activity: 'Audit Activity Log',
  profile: 'User Profile',
  admin: 'Administration & Demo Data',
  guide: 'Demo Guide'
};

const AppRouter = {
  currentPage: 'dashboard',

  init() {
    // Listen for state changes
    window.addEventListener('rrc_store_updated', () => {
      this.updateBadges();
    });

    window.addEventListener('rrc_auth_changed', () => {
      this.updateUserInterface();
    });

    // Check auth on startup
    const user = AppStore.getCurrentUser();
    if (!user) {
      this.navigate('login');
    } else {
      this.updateUserInterface();
      this.navigate('dashboard');
    }
  },

  navigate(pageId) {
    const user = AppStore.getCurrentUser();

    // Guard: not logged in
    if (!user && pageId !== 'login') {
      this.showPage('login');
      Pages.renderLogin();
      return;
    }

    // Guard: already logged in but visiting login
    if (user && pageId === 'login') {
      this.navigate('dashboard');
      return;
    }

    // Guard: RBAC check
    if (user && !AuthService.canAccess(user, pageId)) {
      this.showAccessDenied(pageId);
      return;
    }

    this.currentPage = pageId;
    this.showPage(pageId);

    // Update Topbar and Breadcrumb
    const crumb = document.getElementById('top-breadcrumb-current');
    if (crumb) crumb.textContent = PAGE_NAMES[pageId] || pageId;

    // Update active state in sidebar
    document.querySelectorAll('.nav-item').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.page === pageId);
    });

    // Render page content
    switch (pageId) {
      case 'login': Pages.renderLogin(); break;
      case 'dashboard': Pages.renderDashboard(); break;
      case 'new': Pages.renderCreateReturn(); break;
      case 'cases': Pages.renderCases(); break;
      case 'exceptions': Pages.renderExceptions(); break;
      case 'refund': Pages.renderRefund(); break;
      case 'finance': Pages.renderFinance(); break;
      case 'vendor': Pages.renderVendor(); break;
      case 'disposition': Pages.renderDisposition(); break;
      case 'analytics': Pages.renderAnalytics(); break;
      case 'notifications': Pages.renderNotifications(); break;
      case 'activity': Pages.renderActivityLog(); break;
      case 'profile': Pages.renderProfile(); break;
      case 'admin': Pages.renderAdmin(); break;
      case 'guide': Pages.renderGuide(); break;
    }

    this.updateBadges();
    window.scrollTo(0, 0);
  },

  refreshCurrentPage() {
    this.navigate(this.currentPage);
  },

  showPage(pageId) {
    const isLogin = pageId === 'login';
    const mainShell = document.getElementById('app-main-shell');
    const loginView = document.getElementById('login-view');

    if (isLogin) {
      if (mainShell) mainShell.style.display = 'none';
      if (loginView) {
        loginView.style.display = 'block';
        loginView.classList.add('active');
      }
    } else {
      if (loginView) {
        loginView.style.display = 'none';
        loginView.classList.remove('active');
      }
      if (mainShell) mainShell.style.display = 'flex';

      document.querySelectorAll('.page-view').forEach(view => {
        if (view.id !== 'login-view') {
          view.classList.remove('active');
          view.style.display = 'none';
        }
      });

      const activeView = document.getElementById(`${pageId}-view`);
      if (activeView) {
        activeView.style.display = 'block';
        activeView.classList.add('active');
      }
    }
  },

  showAccessDenied(pageId) {
    const user = AppStore.getCurrentUser();
    const mainShell = document.getElementById('app-main-shell');
    if (mainShell) mainShell.style.display = 'flex';

    document.querySelectorAll('.page-view').forEach(v => {
      v.style.display = 'none';
      v.classList.remove('active');
    });

    const activeView = document.getElementById(`${pageId}-view`) || document.getElementById('dashboard-view');
    if (activeView) {
      activeView.style.display = 'block';
      activeView.classList.add('active');
      activeView.innerHTML = `
        <div class="access-denied-card">
          <div style="width: 48px; height: 48px; background: var(--danger-bg); color: var(--danger); border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 12px;">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
          </div>
          <h2 style="font-size: 18px; color: var(--primary-navy); margin-bottom: 6px;">Access Restricted</h2>
          <p style="font-size: 12px; color: var(--text-muted); line-height: 1.5; margin-bottom: 16px;">
            The <strong>${PAGE_NAMES[pageId] || pageId}</strong> module requires permissions not granted to your current role (<strong>${user?.role}</strong>).
          </p>
          <div style="display: flex; gap: 8px; justify-content: center;">
            <button class="btn btn-primary" onclick="AppRouter.navigate('dashboard')">Return to Overview</button>
            <button class="btn btn-outline" onclick="AppRouter.navigate('guide')">View Demo Guide</button>
          </div>
        </div>
      `;
    }
  },

  updateUserInterface() {
    const user = AppStore.getCurrentUser();
    if (!user) return;

    // Update Header Avatar and Name
    const topAvatar = document.getElementById('top-user-avatar');
    const topName = document.getElementById('top-user-name');
    const topRole = document.getElementById('top-user-role');
    const roleSelect = document.getElementById('header-demo-role-select');

    if (topAvatar) topAvatar.textContent = user.avatar || 'U';
    if (topName) topName.textContent = user.name;
    if (topRole) topRole.textContent = user.role;

    if (roleSelect) {
      roleSelect.value = user.username;
    }

    // Sidebar User
    const sideAvatar = document.getElementById('side-user-avatar');
    const sideName = document.getElementById('side-user-name');
    const sideRole = document.getElementById('side-user-role');

    if (sideAvatar) sideAvatar.textContent = user.avatar || 'U';
    if (sideName) sideName.textContent = user.name;
    if (sideRole) sideRole.textContent = user.role;

    // Filter sidebar navigation items based on role
    document.querySelectorAll('.nav-item').forEach(item => {
      const page = item.dataset.page;
      if (page) {
        const canView = AuthService.canAccess(user, page);
        item.style.display = canView ? 'flex' : 'none';
      }
    });
  },

  updateBadges() {
    const user = AppStore.getCurrentUser();
    const exceptions = AppStore.getData(DB_KEYS.EXCEPTIONS);
    const refunds = AppStore.getData(DB_KEYS.REFUNDS);
    const notifs = AppStore.getData(DB_KEYS.NOTIFICATIONS);

    const openExcCount = exceptions.length;
    const pendingRefundsCount = refunds.filter(r => r.status.includes('Pending')).length;
    const unreadNotifsCount = notifs.filter(n => !n.read).length;

    // Sidebar Badges
    const excBadge = document.getElementById('nav-exc-badge');
    if (excBadge) {
      excBadge.textContent = openExcCount;
      excBadge.style.display = openExcCount > 0 ? 'inline-block' : 'none';
    }

    const refBadge = document.getElementById('nav-ref-badge');
    if (refBadge) {
      refBadge.textContent = pendingRefundsCount;
      refBadge.style.display = pendingRefundsCount > 0 ? 'inline-block' : 'none';
    }

    const notifBadge = document.getElementById('nav-notif-badge');
    if (notifBadge) {
      notifBadge.textContent = unreadNotifsCount;
      notifBadge.style.display = unreadNotifsCount > 0 ? 'inline-block' : 'none';
    }

    const headerNotifBadge = document.getElementById('header-notif-count');
    if (headerNotifBadge) {
      headerNotifBadge.textContent = unreadNotifsCount;
      headerNotifBadge.style.display = unreadNotifsCount > 0 ? 'flex' : 'none';
    }
  },

  handleRoleSwitch(username) {
    const res = AuthService.quickSwitchUser(username);
    if (res.success) {
      UI.toast(`Switched role to ${res.user.name} (${res.user.role})`, 'info');
      this.updateUserInterface();
      // If current page is restricted for this new role, redirect to dashboard
      if (!AuthService.canAccess(res.user, this.currentPage)) {
        this.navigate('dashboard');
      } else {
        this.refreshCurrentPage();
      }
    }
  },

  logout() {
    AuthService.logout();
    UI.toast('Signed out successfully.', 'info');
    this.navigate('login');
  },

  toggleMobileSidebar() {
    const side = document.querySelector('.sidebar');
    if (side) {
      side.classList.toggle('mobile-open');
    }
  }
};

// Document ready bootstrap
document.addEventListener('DOMContentLoaded', () => {
  AppRouter.init();
});
