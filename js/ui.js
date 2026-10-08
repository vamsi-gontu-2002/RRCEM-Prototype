/**
 * ReturnFlow - UI Utilities, Formatters, Modals, Toasts & SVG Icons
 */

const UI = {
  /**
   * Currency formatter for Indian Rupee
   */
  formatINR(amount) {
    if (amount === undefined || amount === null || isNaN(amount)) return '₹0';
    const num = Number(amount);
    return '₹' + num.toLocaleString('en-IN');
  },

  /**
   * Format large numbers in Lakhs / Crores if helpful
   */
  formatLakhs(amount) {
    if (amount >= 100000) {
      const lakhs = (amount / 100000).toFixed(1);
      return `₹${lakhs}L`;
    }
    return this.formatINR(amount);
  },

  /**
   * Date and Time formatters
   */
  formatDate(isoString) {
    if (!isoString) return '—';
    const d = new Date(isoString);
    return d.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  },

  formatDateTime(isoString) {
    if (!isoString) return '—';
    const d = new Date(isoString);
    return d.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  },

  timeAgo(isoString) {
    if (!isoString) return '—';
    const d = new Date(isoString);
    const now = new Date();
    const diffMs = now - d;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  },

  /**
   * Badge Generators
   */
  riskBadge(risk) {
    const r = (risk || 'Low').toLowerCase();
    let cls = 'badge-success';
    let icon = '●';
    if (r.includes('high')) {
      cls = 'badge-danger';
    } else if (r.includes('medium') || r.includes('moderate')) {
      cls = 'badge-warning';
    }
    return `<span class="badge ${cls}"><span class="badge-dot"></span>${risk}</span>`;
  },

  statusBadge(status) {
    const s = (status || '').toLowerCase();
    let cls = 'badge-neutral';
    if (s.includes('approved') || s.includes('settled') || s.includes('resolved') || s.includes('accepted') || s.includes('complete')) {
      cls = 'badge-success';
    } else if (s.includes('exception') || s.includes('review') || s.includes('pending') || s.includes('raised')) {
      cls = 'badge-warning';
    } else if (s.includes('reject') || s.includes('escalat') || s.includes('dispute') || s.includes('fraud')) {
      cls = 'badge-danger';
    } else if (s.includes('auto') || s.includes('info') || s.includes('transit')) {
      cls = 'badge-info';
    }
    return `<span class="badge ${cls}"><span class="badge-dot"></span>${status}</span>`;
  },

  slaBadge(hoursLeft) {
    const h = parseInt(hoursLeft) || 0;
    if (h <= 2) {
      return `<span class="badge badge-danger"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg> ${h}h left (Critical)</span>`;
    } else if (h <= 6) {
      return `<span class="badge badge-warning"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg> ${h}h left</span>`;
    }
    return `<span class="badge badge-neutral"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg> ${h}h left</span>`;
  },

  /**
   * Toast notification system
   */
  toast(message, type = 'info', title = null) {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast-card toast-${type}`;
    
    let iconSvg = '';
    if (type === 'success') {
      iconSvg = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
    } else if (type === 'warning') {
      iconSvg = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>`;
    } else if (type === 'danger') {
      iconSvg = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>`;
    } else {
      iconSvg = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>`;
    }

    toast.innerHTML = `
      <div class="toast-icon">${iconSvg}</div>
      <div class="toast-body">
        ${title ? `<strong class="toast-title">${title}</strong>` : ''}
        <div class="toast-msg">${message}</div>
      </div>
      <button class="toast-close" onclick="this.parentElement.remove()">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
      </button>
    `;

    container.appendChild(toast);
    setTimeout(() => {
      toast.classList.add('show');
    }, 10);

    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  },

  /**
   * Modal dialog system
   */
  openModal(title, contentHtml, footerHtml = '', size = 'md') {
    const overlay = document.getElementById('modal-overlay');
    const modalTitle = document.getElementById('modal-title');
    const modalBody = document.getElementById('modal-body');
    const modalFooter = document.getElementById('modal-footer');
    const modalBox = document.getElementById('modal-box');

    if (!overlay) return;

    modalTitle.textContent = title;
    modalBody.innerHTML = contentHtml;
    modalFooter.innerHTML = footerHtml;
    modalFooter.style.display = footerHtml ? 'flex' : 'none';

    modalBox.className = `modal-box modal-${size}`;
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
  },

  closeModal() {
    const overlay = document.getElementById('modal-overlay');
    if (overlay) {
      overlay.classList.remove('active');
      document.body.style.overflow = '';
    }
  },

  /**
   * Confirmation Dialog
   */
  confirm(options) {
    const {
      title = 'Confirm Action',
      message = 'Are you sure you want to proceed?',
      confirmText = 'Confirm',
      confirmClass = 'btn-primary',
      cancelText = 'Cancel',
      onConfirm = () => {}
    } = options;

    const contentHtml = `
      <div style="padding: 10px 0; color: var(--text-color); font-size: 14px; line-height: 1.6;">
        ${message}
      </div>
    `;

    const footerHtml = `
      <button class="btn btn-outline" onclick="UI.closeModal()">${cancelText}</button>
      <button class="btn ${confirmClass}" id="confirm-dialog-btn">${confirmText}</button>
    `;

    this.openModal(title, contentHtml, footerHtml, 'sm');

    document.getElementById('confirm-dialog-btn').onclick = () => {
      UI.closeModal();
      onConfirm();
    };
  }
};
