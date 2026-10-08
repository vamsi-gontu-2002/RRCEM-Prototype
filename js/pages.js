/**
 * ReturnFlow - Page Renderers & Event Controllers
 * Powers all 15 application modules.
 */

const Pages = {
  // 1. LOGIN PAGE
  renderLogin() {
    const users = AppStore.getData(DB_KEYS.USERS);
    const container = document.getElementById('login-view');
    if (!container) return;

    container.innerHTML = `
      <div class="login-screen">
        <div class="login-card">
          <div class="login-header">
            <div class="login-logo">R</div>
            <h1 style="font-size: 20px; font-weight: 700; color: var(--primary-navy);">ReturnFlow Enterprise</h1>
            <p style="font-size: 12px; color: var(--text-muted); margin-top: 4px;">
              Returns, Refunds & Claims Exception Management
            </p>
          </div>

          <form id="login-form" onsubmit="Pages.handleLogin(event)">
            <div class="form-group" style="margin-bottom: 12px;">
              <label class="form-label">Username</label>
              <input type="text" id="login-username" class="form-control" placeholder="e.g. cs.agent or returns.manager" required value="cs.agent">
            </div>

            <div class="form-group" style="margin-bottom: 16px;">
              <label class="form-label">Password</label>
              <input type="password" id="login-password" class="form-control" placeholder="Password" required value="demo123">
            </div>

            <button type="submit" class="btn btn-primary" style="width: 100%; padding: 10px; font-size: 13px;">
              Sign In to Operations
            </button>
          </form>

          <div class="demo-credentials-box">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <strong style="font-size: 11px; color: var(--secondary-slate); text-transform: uppercase; letter-spacing: 0.5px;">
                One-Click Demo Roles
              </strong>
              <span class="badge badge-info" style="font-size: 9.5px;">Prototype Mode</span>
            </div>
            <p style="font-size: 10.5px; color: var(--text-muted); margin-top: 4px;">
              Click any profile below to automatically populate credentials and sign in:
            </p>

            <div class="demo-user-grid">
              ${users.map(u => `
                <button type="button" class="demo-user-btn" onclick="Pages.quickLogin('${u.username}', '${u.password}')">
                  <strong>${u.name}</strong>
                  <span>${u.role}</span>
                </button>
              `).join('')}
            </div>
          </div>

          <div style="margin-top: 16px; text-align: center; font-size: 10.5px; color: var(--text-muted);">
            Demo Authentication — LocalStorage Prototype for Mendix Replication
          </div>
        </div>
      </div>
    `;
  },

  handleLogin(e) {
    e.preventDefault();
    const u = document.getElementById('login-username').value;
    const p = document.getElementById('login-password').value;
    const res = AuthService.login(u, p);
    if (res.success) {
      UI.toast(`Welcome back, ${res.user.name} (${res.user.role})`, 'success');
      AppRouter.navigate('dashboard');
    } else {
      UI.toast(res.error, 'danger', 'Login Failed');
    }
  },

  quickLogin(username, password) {
    const res = AuthService.login(username, password);
    if (res.success) {
      UI.toast(`Logged in as ${res.user.name} (${res.user.role})`, 'success');
      AppRouter.navigate('dashboard');
    } else {
      UI.toast('Could not sign in with demo user.', 'danger');
    }
  },

  // 2. OVERVIEW DASHBOARD
  renderDashboard() {
    const container = document.getElementById('dashboard-view');
    if (!container) return;

    const kpis = AppStore.computeKpis();
    const exceptions = AppStore.getData(DB_KEYS.EXCEPTIONS).slice(0, 5);
    const cases = AppStore.getData(DB_KEYS.CASES);

    container.innerHTML = `
      <div class="page-hero">
        <div>
          <h1>Returns Operations Control Center</h1>
          <p>Real-time visibility into reverse logistics, AI auto-decisions, exception routing and settlements.</p>
        </div>
        <div class="hero-actions">
          ${AuthService.hasPermission('canCreateReturn') ? `<button class="btn btn-primary" onclick="AppRouter.navigate('new')">+ New Return</button>` : ''}
          <button class="btn btn-outline" onclick="AppRouter.navigate('analytics')">View Intelligence</button>
        </div>
      </div>

      <!-- KPI Cards -->
      <div class="kpi-grid">
        <div class="kpi-card">
          <div class="kpi-label">Returns Today</div>
          <div class="kpi-value">${kpis.totalCases * 24}</div>
          <div class="kpi-subtext"><span class="trend-up">↑ +14%</span> vs yesterday</div>
        </div>
        <div class="kpi-card kpi-success">
          <div class="kpi-label">Auto-Decided Rate</div>
          <div class="kpi-value">${kpis.autoDecidedPct}%</div>
          <div class="kpi-subtext"><span class="trend-up">Target 70% met</span> · Real-time</div>
        </div>
        <div class="kpi-card kpi-warning">
          <div class="kpi-label">Open Exceptions</div>
          <div class="kpi-value">${kpis.openExceptions}</div>
          <div class="kpi-subtext"><span class="trend-down">${kpis.highRiskCases} high priority</span></div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">Pending Refunds</div>
          <div class="kpi-value">${kpis.pendingRefunds}</div>
          <div class="kpi-subtext">Awaiting disbursement</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">Avg. Refund Time</div>
          <div class="kpi-value">${kpis.avgRefundTimeDays}d</div>
          <div class="kpi-subtext"><span class="trend-up">↓ from 8.5d</span> baseline</div>
        </div>
        <div class="kpi-card kpi-success">
          <div class="kpi-label">Vendor Recovery</div>
          <div class="kpi-value">${UI.formatLakhs(kpis.vendorRecoveredAmt + 240000)}</div>
          <div class="kpi-subtext">SLA chargebacks</div>
        </div>
      </div>

      <!-- Main Dashboard Grid -->
      <div class="grid-2">
        <!-- Priority Exception Queue -->
        <div class="card">
          <div class="card-header">
            <div>
              <div class="card-title">Priority Exception Queue</div>
              <div class="card-subtitle">High-value, damaged or policy-breaching cases requiring human review</div>
            </div>
            ${AuthService.canAccess(AppStore.getCurrentUser(), 'exceptions') ? `
              <button class="btn btn-sm btn-outline" onclick="AppRouter.navigate('exceptions')">View All (${kpis.openExceptions})</button>
            ` : ''}
          </div>

          <div class="table-container">
            <table class="table-custom">
              <thead>
                <tr>
                  <th>Case ID</th>
                  <th>Customer</th>
                  <th>Order Value</th>
                  <th>Risk</th>
                  <th>SLA</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                ${exceptions.length === 0 ? `<tr><td colspan="6" style="text-align:center; padding: 20px; color: var(--text-muted);">No open exceptions.</td></tr>` : ''}
                ${exceptions.map(e => `
                  <tr>
                    <td><strong>${e.caseId}</strong></td>
                    <td>${e.customer}</td>
                    <td>${UI.formatINR(e.orderValue)}</td>
                    <td>${UI.riskBadge(e.riskLevel)}</td>
                    <td>${UI.slaBadge(e.slaHoursRemaining)}</td>
                    <td>
                      <button class="btn btn-sm btn-soft" onclick="Pages.openCaseModal('${e.caseId}')">Review</button>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>

        <!-- AI Decision Automation Breakdown -->
        <div class="card">
          <div class="card-header">
            <div>
              <div class="card-title">AI Decision Automation</div>
              <div class="card-subtitle">Intelligent triage and rule execution</div>
            </div>
          </div>

          <div class="metric-row">
            <div class="metric-header">
              <span>Auto Approved (Within Policy)</span>
              <strong>70%</strong>
            </div>
            <div class="metric-bar-bg">
              <div class="metric-bar-fill" style="width: 70%; background-color: var(--success);"></div>
            </div>
          </div>

          <div class="metric-row">
            <div class="metric-header">
              <span>Human Exception Queue</span>
              <strong>20%</strong>
            </div>
            <div class="metric-bar-bg">
              <div class="metric-bar-fill" style="width: 20%; background-color: var(--warning);"></div>
            </div>
          </div>

          <div class="metric-row">
            <div class="metric-header">
              <span>Policy Rejections & Fraud Holds</span>
              <strong>10%</strong>
            </div>
            <div class="metric-bar-bg">
              <div class="metric-bar-fill" style="width: 10%; background-color: var(--danger);"></div>
            </div>
          </div>

          <div class="notice-box notice-teal" style="margin-top: 16px;">
            <strong>Decision Engine:</strong> 70% of low-risk claims (≤ ₹5,000) are auto-settled in seconds, routing only complex and high-risk claims to specialists.
          </div>
        </div>
      </div>

      <!-- Process Lifecycle -->
      <div class="card" style="margin-top: 18px;">
        <div class="card-header">
          <div>
            <div class="card-title">End-to-End Reverse Logistics Workflow</div>
            <div class="card-subtitle">Unified lifecycle mapped to Mendix microflows, business rules & workflows</div>
          </div>
        </div>

        <div class="workflow-strip">
          <div class="workflow-node done">
            <span class="workflow-num">STEP 01</span>
            <span class="workflow-title">Return Intake</span>
          </div>
          <span class="workflow-arrow">→</span>
          <div class="workflow-node done">
            <span class="workflow-num">STEP 02</span>
            <span class="workflow-title">AI Review</span>
          </div>
          <span class="workflow-arrow">→</span>
          <div class="workflow-node active">
            <span class="workflow-num">STEP 03</span>
            <span class="workflow-title">Decision & Policy</span>
          </div>
          <span class="workflow-arrow">→</span>
          <div class="workflow-node">
            <span class="workflow-num">STEP 04</span>
            <span class="workflow-title">Refund Disbursement</span>
          </div>
          <span class="workflow-arrow">→</span>
          <div class="workflow-node">
            <span class="workflow-num">STEP 05</span>
            <span class="workflow-title">Vendor Recovery</span>
          </div>
          <span class="workflow-arrow">→</span>
          <div class="workflow-node">
            <span class="workflow-num">STEP 06</span>
            <span class="workflow-title">Warehouse Disposition</span>
          </div>
          <span class="workflow-arrow">→</span>
          <div class="workflow-node">
            <span class="workflow-num">STEP 07</span>
            <span class="workflow-title">Case Closed</span>
          </div>
        </div>
      </div>
    `;
  },

  // 3. CREATE RETURN & RUN AI REVIEW
  renderCreateReturn() {
    const container = document.getElementById('new-view');
    if (!container) return;

    container.innerHTML = `
      <div class="page-hero">
        <div>
          <h1>Create Return Case & AI Assessment</h1>
          <p>Capture customer return request, upload evidence, and execute real-time AI decision rules.</p>
        </div>
      </div>

      <div class="grid-split">
        <!-- Form Left -->
        <div class="card">
          <div class="card-header">
            <div>
              <div class="card-title">Return Intake Details</div>
              <div class="card-subtitle">Simulate customer, store or contact center submission</div>
            </div>
          </div>

          <form id="create-return-form" onsubmit="Pages.handleCreateReturn(event)">
            <div class="form-grid">
              <div class="form-group">
                <label class="form-label">Order ID</label>
                <input type="text" id="cr-order" class="form-control" value="ORD-${Math.floor(10000 + Math.random() * 90000)}" required>
              </div>

              <div class="form-group">
                <label class="form-label">Customer Name</label>
                <input type="text" id="cr-customer" class="form-control" value="Siddharth Malhotra" required>
              </div>

              <div class="form-group">
                <label class="form-label">Customer Email</label>
                <input type="email" id="cr-email" class="form-control" value="siddharth.m@example.in">
              </div>

              <div class="form-group">
                <label class="form-label">Product Name</label>
                <input type="text" id="cr-product" class="form-control" value="Smart Robotic Vacuum Cleaner 3000Pa" required>
              </div>

              <div class="form-group">
                <label class="form-label">Product Category</label>
                <select id="cr-category" class="form-control" onchange="Pages.triggerLiveAiEval()">
                  <option value="Home & Kitchen">Home & Kitchen</option>
                  <option value="Electronics" selected>Electronics</option>
                  <option value="Apparel">Apparel</option>
                  <option value="Footwear">Footwear</option>
                  <option value="Beauty">Beauty</option>
                </select>
              </div>

              <div class="form-group">
                <label class="form-label">Purchase Value (INR)</label>
                <input type="number" id="cr-amount" class="form-control" value="18499" required oninput="Pages.triggerLiveAiEval()">
              </div>

              <div class="form-group">
                <label class="form-label">Days Since Purchase</label>
                <input type="number" id="cr-days" class="form-control" value="12" required oninput="Pages.triggerLiveAiEval()">
              </div>

              <div class="form-group">
                <label class="form-label">Return Reason</label>
                <select id="cr-reason" class="form-control" onchange="Pages.triggerLiveAiEval()">
                  <option value="Defective Product" selected>Defective Product</option>
                  <option value="Damaged Item">Damaged Item</option>
                  <option value="Changed Mind">Changed Mind</option>
                  <option value="Wrong Product">Wrong Product</option>
                  <option value="Size/Fit Issue">Size/Fit Issue</option>
                  <option value="Missing Parts">Missing Parts</option>
                  <option value="Late Delivery">Late Delivery</option>
                  <option value="Suspected Fraud">Suspected Fraud / Empty Box</option>
                </select>
              </div>

              <div class="form-group">
                <label class="form-label">Item Condition</label>
                <select id="cr-condition" class="form-control" onchange="Pages.triggerLiveAiEval()">
                  <option value="Opened" selected>Opened</option>
                  <option value="New">New / Unopened</option>
                  <option value="Used">Used</option>
                  <option value="Damaged">Damaged</option>
                  <option value="Defective">Defective</option>
                </select>
              </div>

              <div class="form-group">
                <label class="form-label">Channel</label>
                <select id="cr-channel" class="form-control">
                  <option value="Website">Website</option>
                  <option value="Mobile App">Mobile App</option>
                  <option value="Retail Store">Retail Store</option>
                  <option value="Contact Center">Contact Center</option>
                </select>
              </div>

              <div class="form-group">
                <label class="form-label">Payment Method</label>
                <select id="cr-payment" class="form-control">
                  <option value="UPI (GooglePay)">UPI (GooglePay)</option>
                  <option value="Credit Card (HDFC)">Credit Card (HDFC)</option>
                  <option value="Net Banking (SBI)">Net Banking (SBI)</option>
                  <option value="Cash on Delivery">Cash on Delivery</option>
                </select>
              </div>

              <div class="form-group">
                <label class="form-label">Supplier / Vendor</label>
                <select id="cr-vendor" class="form-control">
                  <option value="Nova Appliances Ltd">Nova Appliances Ltd</option>
                  <option value="Acoustic Sound Labs">Acoustic Sound Labs</option>
                  <option value="SleepWell Ergonomics">SleepWell Ergonomics</option>
                  <option value="Vedic Threads Apparel">Vedic Threads Apparel</option>
                  <option value="Apex Mobile Distro">Apex Mobile Distro</option>
                </select>
              </div>

              <div class="form-group full-width">
                <label class="form-label">Customer Notes & Claim Description</label>
                <textarea id="cr-notes" class="form-control">Right wheel motor fails to rotate; lidar sensor displays error code LiDAR_04 on startup.</textarea>
              </div>

              <div class="form-group full-width">
                <label class="form-label">Simulated Evidence & Attachments</label>
                <div style="background-color: #FAFBFB; border: 1px dashed var(--border-color); border-radius: var(--radius-sm); padding: 12px; font-size: 11px;">
                  <div style="display:flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                    <span style="font-weight: 600; color: var(--secondary-slate);">Attached Files (2):</span>
                    <span class="badge badge-success">OCR Verified</span>
                  </div>
                  <div style="display: flex; gap: 8px;">
                    <span class="badge badge-neutral">📄 lidar_error_screenshot.png (1.4 MB)</span>
                    <span class="badge badge-neutral">🧾 purchase_tax_invoice.pdf (340 KB)</span>
                  </div>
                </div>
              </div>
            </div>

            <div class="hero-actions" style="margin-top: 18px;">
              <button type="button" class="btn btn-soft" onclick="Pages.triggerLiveAiEval(true)">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"></path></svg>
                Run AI Review
              </button>
              <button type="submit" class="btn btn-primary">
                Submit Return Case
              </button>
            </div>
          </form>
        </div>

        <!-- AI Review Card Right -->
        <div>
          <div class="card" id="ai-assessment-panel">
            <!-- Dynamic AI content rendered here -->
          </div>

          <div class="card">
            <div class="card-header">
              <div class="card-title">Mendix Implementation Note</div>
            </div>
            <p style="font-size: 11.5px; color: var(--text-muted); line-height: 1.6;">
              In Mendix, clicking <strong>Submit Return</strong> triggers the <code>SUB_ProcessReturnCase</code> microflow which invokes the <strong>AI Classification REST Service</strong>, executes the <strong>DMN Business Rules Table</strong>, and automatically routes the task to either the <strong>Auto-Refund Microflow</strong> or the <strong>Exceptions Workflow Task Queue</strong>.
            </p>
          </div>
        </div>
      </div>
    `;

    Pages.triggerLiveAiEval();
  },

  getCreateReturnFormData() {
    return {
      orderId: document.getElementById('cr-order')?.value || 'ORD-99100',
      customer: document.getElementById('cr-customer')?.value || 'Customer Name',
      customerEmail: document.getElementById('cr-email')?.value || 'customer@example.in',
      customerPhone: '+91 98110 99281',
      product: document.getElementById('cr-product')?.value || 'Product Name',
      category: document.getElementById('cr-category')?.value || 'Electronics',
      purchaseValue: parseFloat(document.getElementById('cr-amount')?.value) || 0,
      daysSincePurchase: parseInt(document.getElementById('cr-days')?.value) || 0,
      returnReason: document.getElementById('cr-reason')?.value || 'Defective Product',
      condition: document.getElementById('cr-condition')?.value || 'Opened',
      channel: document.getElementById('cr-channel')?.value || 'Website',
      paymentMethod: document.getElementById('cr-payment')?.value || 'UPI',
      vendor: document.getElementById('cr-vendor')?.value || 'Nova Appliances Ltd',
      customerNotes: document.getElementById('cr-notes')?.value || '',
      hasEvidence: true,
      evidenceCount: 2
    };
  },

  triggerLiveAiEval(showToastMsg = false) {
    const data = Pages.getCreateReturnFormData();
    const assessment = AiDecisionEngine.evaluate(data);
    const panel = document.getElementById('ai-assessment-panel');
    if (!panel) return;

    let badgeClass = 'badge-success';
    if (assessment.suggestedDecision.includes('MANUAL')) badgeClass = 'badge-warning';
    if (assessment.suggestedDecision.includes('REJECT') || assessment.suggestedDecision.includes('INVESTIGATION')) badgeClass = 'badge-danger';

    panel.innerHTML = `
      <div class="card-header">
        <div>
          <div class="card-title" style="display:flex; align-items:center; gap: 6px;">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--primary-teal)" stroke-width="2.5"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>
            AI Assessment & Decision Engine
          </div>
          <div class="card-subtitle">Simulated Computer Vision + DMN Rule Evaluation</div>
        </div>
        <span class="badge ${badgeClass}" style="font-size: 11px;">${assessment.suggestedDecision}</span>
      </div>

      <div style="background-color: var(--light-teal); border: 1px solid rgba(20, 125, 115, 0.2); border-radius: var(--radius-sm); padding: 12px; margin-bottom: 14px;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
          <strong style="font-size: 12px; color: var(--primary-teal);">Confidence Score: ${assessment.confidence}%</strong>
          <span style="font-size: 11px; font-weight: 600; color: var(--secondary-slate);">Risk: ${assessment.riskLevel}</span>
        </div>
        <div class="metric-bar-bg" style="background: #FFFFFF;">
          <div class="metric-bar-fill" style="width: ${assessment.confidence}%; background: var(--primary-teal);"></div>
        </div>
      </div>

      <div class="stat-row">
        <span class="stat-label">Eligibility Assessment</span>
        <span class="stat-val">${assessment.eligibility}</span>
      </div>
      <div class="stat-row">
        <span class="stat-label">Fraud Risk Metric</span>
        <span class="stat-val">${assessment.fraudRisk}</span>
      </div>
      <div class="stat-row">
        <span class="stat-label">Supplier Warranty Liability</span>
        <span class="stat-val">${assessment.vendorLiability ? 'Yes (Recovery Candidate)' : 'No'}</span>
      </div>
      <div class="stat-row">
        <span class="stat-label">Recommended Disposition</span>
        <span class="stat-val">${assessment.dispositionRecommendation}</span>
      </div>

      <div style="margin-top: 14px;">
        <strong style="font-size: 11.5px; color: var(--secondary-slate); display: block; margin-bottom: 6px;">AI Rationale & Reasoning:</strong>
        <p style="font-size: 11.5px; color: var(--text-main); background: #FAF9F6; border: 1px solid var(--border-color); border-radius: var(--radius-sm); padding: 10px; line-height: 1.5;">
          ${assessment.reasoning}
        </p>
      </div>

      <div style="margin-top: 14px;">
        <strong style="font-size: 11.5px; color: var(--secondary-slate); display: block; margin-bottom: 6px;">Enterprise Policy Criteria:</strong>
        <div style="display: flex; flex-direction: column; gap: 6px;">
          ${assessment.policyChecks.map(chk => `
            <div style="display: flex; align-items: center; gap: 6px; font-size: 11px; color: ${chk.passed ? 'var(--text-main)' : 'var(--danger)'};">
              <span style="color: ${chk.passed ? 'var(--success)' : 'var(--danger)'}; font-weight: bold;">
                ${chk.passed ? '✓' : '✗'}
              </span>
              <span>${chk.name}: <em>${chk.details}</em></span>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    if (showToastMsg) {
      UI.toast(`AI Review completed (${assessment.confidence}% confidence)`, 'info');
    }
  },

  handleCreateReturn(e) {
    e.preventDefault();
    const data = Pages.getCreateReturnFormData();
    const assessment = AiDecisionEngine.evaluate(data);

    const newCaseId = 'RET-' + (Math.floor(1050 + Math.random() * 800));
    const isAutoApproved = assessment.suggestedDecision.includes('AUTO APPROVE');
    const isHighRisk = assessment.riskLevel === 'High' || !isAutoApproved;

    const newCase = {
      id: newCaseId,
      orderId: data.orderId,
      customer: data.customer,
      customerEmail: data.customerEmail,
      customerPhone: data.customerPhone,
      product: data.product,
      category: data.category,
      purchaseValue: data.purchaseValue,
      purchaseDate: new Date(Date.now() - (data.daysSincePurchase * 86400000)).toISOString().split('T')[0],
      daysSincePurchase: data.daysSincePurchase,
      returnReason: data.returnReason,
      condition: data.condition,
      channel: data.channel,
      paymentMethod: data.paymentMethod,
      vendor: data.vendor,
      vendorSku: 'SKU-' + Math.floor(100 + Math.random() * 900),
      customerNotes: data.customerNotes,
      evidenceCount: 2,
      evidenceList: [
        { type: 'image', name: 'defect_evidence.jpg', size: '1.4 MB', note: 'Customer defect photo' },
        { type: 'pdf', name: 'retail_invoice.pdf', size: '340 KB', note: 'Original invoice' }
      ],
      riskLevel: assessment.riskLevel,
      fraudScore: assessment.fraudScore,
      aiAssessment: assessment,
      status: isAutoApproved ? 'Refund Approved' : (isHighRisk ? 'Exception' : 'Under Review'),
      assignedTo: isAutoApproved ? 'Auto Decision Engine' : 'Vikramaditya Sen',
      slaHoursLeft: isHighRisk ? 4 : 24,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: AppStore.getCurrentUser()?.username || 'cs.agent'
    };

    // Save Case
    AppStore.addItem(DB_KEYS.CASES, newCase);

    // If Exception, add to Exception Queue
    if (newCase.status === 'Exception') {
      const newExc = {
        id: 'EXC-' + (Math.floor(500 + Math.random() * 400)),
        caseId: newCase.id,
        exceptionType: assessment.eligibility,
        customer: newCase.customer,
        orderValue: newCase.purchaseValue,
        riskLevel: newCase.riskLevel,
        evidenceSummary: 'OCR verified receipt + diagnostic logs',
        slaStatus: 'Action Required (4h left)',
        slaHoursRemaining: 4,
        owner: 'Vikramaditya Sen',
        status: 'In Review',
        createdAt: new Date().toISOString()
      };
      AppStore.addItem(DB_KEYS.EXCEPTIONS, newExc);

      AppStore.createNotification(
        'New Exception Routed',
        `Case ${newCase.id} (${UI.formatINR(newCase.purchaseValue)}) routed to Returns Manager queue.`,
        'warning',
        'Returns Manager',
        'exceptions',
        newCase.id
      );
    }

    // If Auto Approved, generate Refund Record
    if (isAutoApproved) {
      const newRefund = {
        id: 'RF-' + Math.floor(2050 + Math.random() * 400),
        caseId: newCase.id,
        customer: newCase.customer,
        amount: newCase.purchaseValue,
        originalAmount: newCase.purchaseValue,
        paymentMethod: newCase.paymentMethod,
        gatewayRef: 'UPI-AUTO-' + Math.floor(100000 + Math.random() * 900000),
        status: 'Pending Finance Settlement',
        approvedBy: 'AI Auto-Decision Engine',
        approvedAt: new Date().toISOString(),
        financeApprover: null,
        financeSettledAt: null,
        notes: 'Auto-approved within policy ceiling.'
      };
      AppStore.addItem(DB_KEYS.REFUNDS, newRefund);

      AppStore.createNotification(
        'Refund Pending Settlement',
        `Auto-approved refund ${newRefund.id} (${UI.formatINR(newRefund.amount)}) awaiting Finance settlement.`,
        'info',
        'Finance',
        'finance',
        newRefund.id
      );
    }

    // If Vendor Liability
    if (assessment.vendorLiability) {
      const newClaim = {
        id: 'VR-' + Math.floor(2050 + Math.random() * 400),
        caseId: newCase.id,
        vendor: newCase.vendor,
        product: newCase.product,
        reason: `${newCase.returnReason} (Warranty Claim)`,
        claimType: 'Warranty Chargeback',
        recoveryAmount: newCase.purchaseValue,
        claimedAmount: newCase.purchaseValue,
        status: 'Claim Raised',
        evidenceSummary: 'Customer diagnostic upload',
        raisedBy: AppStore.getCurrentUser()?.name || 'Customer Service',
        raisedAt: new Date().toISOString(),
        vendorResponse: 'Awaiting supplier confirmation (48h SLA).',
        updatedAt: new Date().toISOString()
      };
      AppStore.addItem(DB_KEYS.VENDOR_CLAIMS, newClaim);
    }

    // Warehouse Disposition
    const newDsp = {
      id: 'DSP-' + Math.floor(3050 + Math.random() * 400),
      caseId: newCase.id,
      product: newCase.product,
      condition: newCase.condition,
      recommendedDisposition: assessment.dispositionRecommendation,
      selectedDisposition: assessment.dispositionRecommendation,
      warehouseLocation: 'Bengaluru Central Hub (BLR-02) - Receiving Bay 4',
      status: 'Pending Inspection',
      inventoryImpact: `Pending WMS Intake (${assessment.dispositionRecommendation})`,
      handledBy: 'Gurpreet Singh',
      notes: 'Inbound courier consignment registered.',
      updatedAt: new Date().toISOString()
    };
    AppStore.addItem(DB_KEYS.DISPOSITIONS, newDsp);

    // Audit log
    AppStore.logActivity(
      'Created Return Case',
      'Case',
      newCase.id,
      `Case ${newCase.id} created for ${newCase.customer} (${UI.formatINR(newCase.purchaseValue)}). AI Decision: ${assessment.suggestedDecision}.`
    );

    UI.toast(`Case ${newCase.id} created successfully!`, 'success');
    AppRouter.navigate(newCase.status === 'Exception' ? 'exceptions' : 'cases');
  },

  // 4. RETURN CASES PAGE
  renderCases() {
    const container = document.getElementById('cases-view');
    if (!container) return;

    const cases = AppStore.getData(DB_KEYS.CASES);

    container.innerHTML = `
      <div class="page-hero">
        <div>
          <h1>Return Cases Register</h1>
          <p>Consolidated multi-channel return transactions with complete audit history.</p>
        </div>
        <div class="hero-actions">
          ${AuthService.hasPermission('canCreateReturn') ? `<button class="btn btn-primary" onclick="AppRouter.navigate('new')">+ New Return</button>` : ''}
        </div>
      </div>

      <div class="card">
        <div style="display: flex; gap: 10px; margin-bottom: 14px; flex-wrap: wrap;">
          <input type="text" id="case-search" class="form-control" placeholder="Search case ID, order, customer, product..." style="flex: 1; min-width: 240px;" oninput="Pages.filterCasesTable()">
          <select id="case-status-filter" class="form-control" style="width: 170px;" onchange="Pages.filterCasesTable()">
            <option value="all">All Statuses</option>
            <option value="Refund Approved">Refund Approved</option>
            <option value="Settlement Approved">Settlement Approved</option>
            <option value="Exception">Exception</option>
            <option value="Escalated">Escalated</option>
            <option value="Rejected">Rejected</option>
          </select>
          <select id="case-risk-filter" class="form-control" style="width: 130px;" onchange="Pages.filterCasesTable()">
            <option value="all">All Risks</option>
            <option value="Low">Low Risk</option>
            <option value="Medium">Medium Risk</option>
            <option value="High">High Risk</option>
          </select>
        </div>

        <div class="table-container">
          <table class="table-custom">
            <thead>
              <tr>
                <th>Case ID</th>
                <th>Order</th>
                <th>Customer</th>
                <th>Product</th>
                <th>Value</th>
                <th>Reason</th>
                <th>Risk</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody id="cases-table-body">
              <!-- Rendered via filterCasesTable -->
            </tbody>
          </table>
        </div>
      </div>
    `;

    Pages.filterCasesTable();
  },

  filterCasesTable() {
    const query = (document.getElementById('case-search')?.value || '').toLowerCase();
    const statusFilter = document.getElementById('case-status-filter')?.value || 'all';
    const riskFilter = document.getElementById('case-risk-filter')?.value || 'all';
    const tbody = document.getElementById('cases-table-body');
    if (!tbody) return;

    let cases = AppStore.getData(DB_KEYS.CASES);

    cases = cases.filter(c => {
      const matchQuery = [c.id, c.orderId, c.customer, c.product, c.returnReason].join(' ').toLowerCase().includes(query);
      const matchStatus = statusFilter === 'all' || c.status === statusFilter;
      const matchRisk = riskFilter === 'all' || c.riskLevel === riskFilter;
      return matchQuery && matchStatus && matchRisk;
    });

    if (cases.length === 0) {
      tbody.innerHTML = `<tr><td colspan="9" style="text-align: center; padding: 24px; color: var(--text-muted);">No return cases matched your search.</td></tr>`;
      return;
    }

    tbody.innerHTML = cases.map(c => `
      <tr>
        <td><strong>${c.id}</strong></td>
        <td><span style="color: var(--secondary-slate);">${c.orderId}</span></td>
        <td><strong>${c.customer}</strong></td>
        <td><div style="max-width: 220px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${c.product}</div></td>
        <td><strong>${UI.formatINR(c.purchaseValue)}</strong></td>
        <td>${c.returnReason}</td>
        <td>${UI.riskBadge(c.riskLevel)}</td>
        <td>${UI.statusBadge(c.status)}</td>
        <td>
          <button class="btn btn-sm btn-outline" onclick="Pages.openCaseModal('${c.id}')">View</button>
        </td>
      </tr>
    `).join('');
  },

  openCaseModal(caseId) {
    const c = AppStore.getItemById(DB_KEYS.CASES, caseId);
    if (!c) return;

    const user = AppStore.getCurrentUser();
    const isManager = user?.role === 'Returns Manager' || user?.role === 'Administrator';

    const contentHtml = `
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 14px;">
        <div style="background: #FAF9F6; border: 1px solid var(--border-color); border-radius: var(--radius-sm); padding: 12px;">
          <strong style="font-size: 11px; text-transform: uppercase; color: var(--secondary-slate);">Customer & Order</strong>
          <div class="stat-row" style="margin-top: 6px;"><span class="stat-label">Customer</span><span class="stat-val">${c.customer}</span></div>
          <div class="stat-row"><span class="stat-label">Email</span><span>${c.customerEmail || '—'}</span></div>
          <div class="stat-row"><span class="stat-label">Order ID</span><span class="stat-val">${c.orderId}</span></div>
          <div class="stat-row"><span class="stat-label">Payment</span><span>${c.paymentMethod}</span></div>
        </div>

        <div style="background: #FAF9F6; border: 1px solid var(--border-color); border-radius: var(--radius-sm); padding: 12px;">
          <strong style="font-size: 11px; text-transform: uppercase; color: var(--secondary-slate);">Item & Reason</strong>
          <div class="stat-row" style="margin-top: 6px;"><span class="stat-label">Product</span><span class="stat-val">${c.product}</span></div>
          <div class="stat-row"><span class="stat-label">Value</span><span class="stat-val">${UI.formatINR(c.purchaseValue)}</span></div>
          <div class="stat-row"><span class="stat-label">Days Since Buy</span><span>${c.daysSincePurchase} days</span></div>
          <div class="stat-row"><span class="stat-label">Reason</span><span class="stat-val">${c.returnReason}</span></div>
        </div>
      </div>

      <div style="margin-bottom: 14px;">
        <strong style="font-size: 11.5px; color: var(--secondary-slate); display: block; margin-bottom: 4px;">Customer Notes:</strong>
        <p style="font-size: 12px; color: var(--text-main); background: #FFFFFF; border: 1px solid var(--border-color); border-radius: var(--radius-sm); padding: 10px;">
          ${c.customerNotes || 'No notes entered.'}
        </p>
      </div>

      <div style="background: var(--light-teal); border: 1px solid rgba(20, 125, 115, 0.2); border-radius: var(--radius-sm); padding: 12px; margin-bottom: 14px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
          <strong style="font-size: 12px; color: var(--primary-teal);">AI Assessment (Confidence: ${c.aiAssessment?.confidence || 90}%)</strong>
          ${UI.riskBadge(c.riskLevel)}
        </div>
        <p style="font-size: 11.5px; color: #154F48; line-height: 1.5;">
          ${c.aiAssessment?.reasoning || 'Automated evaluation completed.'}
        </p>
      </div>

      <div style="display: flex; gap: 8px; font-size: 11px; color: var(--text-muted);">
        <span>Assigned: <strong>${c.assignedTo}</strong></span> ·
        <span>Status: <strong>${c.status}</strong></span> ·
        <span>Created: <strong>${UI.formatDateTime(c.createdAt)}</strong></span>
      </div>
    `;

    let footerHtml = `<button class="btn btn-outline" onclick="UI.closeModal()">Close</button>`;
    if (isManager && c.status === 'Exception') {
      footerHtml += `
        <button class="btn btn-primary" onclick="Pages.approveCaseDirect('${c.id}')">Approve Refund</button>
        <button class="btn btn-danger" onclick="Pages.rejectCaseDirect('${c.id}')">Reject Case</button>
      `;
    }

    UI.openModal(`Return Case ${c.id} · ${c.status}`, contentHtml, footerHtml, 'md');
  },

  // Direct case approval helper
  approveCaseDirect(caseId) {
    const c = AppStore.getItemById(DB_KEYS.CASES, caseId);
    if (!c) return;

    AppStore.updateItem(DB_KEYS.CASES, caseId, { status: 'Refund Approved', assignedTo: AppStore.getCurrentUser().name });

    // Remove from exceptions
    const excs = AppStore.getData(DB_KEYS.EXCEPTIONS).filter(e => e.caseId !== caseId);
    AppStore.setData(DB_KEYS.EXCEPTIONS, excs);

    // Create refund
    const refund = {
      id: 'RF-' + Math.floor(2050 + Math.random() * 400),
      caseId: c.id,
      customer: c.customer,
      amount: c.purchaseValue,
      originalAmount: c.purchaseValue,
      paymentMethod: c.paymentMethod,
      gatewayRef: 'UPI-MGR-' + Math.floor(100000 + Math.random() * 900000),
      status: 'Pending Finance Settlement',
      approvedBy: AppStore.getCurrentUser().name,
      approvedAt: new Date().toISOString(),
      financeApprover: null,
      financeSettledAt: null,
      notes: 'Approved by Returns Manager.'
    };
    AppStore.addItem(DB_KEYS.REFUNDS, refund);

    AppStore.logActivity('Approved Refund Exception', 'Case', caseId, `Returns Manager approved ${UI.formatINR(c.purchaseValue)} refund for ${c.customer}.`);

    AppStore.createNotification(
      'Refund Awaiting Settlement',
      `Manager approved refund ${refund.id} for ${c.customer} (${UI.formatINR(c.purchaseValue)}).`,
      'info',
      'Finance',
      'finance',
      refund.id
    );

    UI.closeModal();
    UI.toast(`Case ${caseId} approved and sent to Finance!`, 'success');
    AppRouter.refreshCurrentPage();
  },

  rejectCaseDirect(caseId) {
    const c = AppStore.getItemById(DB_KEYS.CASES, caseId);
    if (!c) return;

    AppStore.updateItem(DB_KEYS.CASES, caseId, { status: 'Rejected', assignedTo: AppStore.getCurrentUser().name });

    const excs = AppStore.getData(DB_KEYS.EXCEPTIONS).filter(e => e.caseId !== caseId);
    AppStore.setData(DB_KEYS.EXCEPTIONS, excs);

    AppStore.logActivity('Rejected Return Case', 'Case', caseId, `Case ${caseId} formally rejected by Returns Manager.`);
    UI.closeModal();
    UI.toast(`Case ${caseId} rejected.`, 'warning');
    AppRouter.refreshCurrentPage();
  },

  // 5. EXCEPTION WORK QUEUE
  renderExceptions() {
    const container = document.getElementById('exceptions-view');
    if (!container) return;

    const exceptions = AppStore.getData(DB_KEYS.EXCEPTIONS);
    const highPriorityCount = exceptions.filter(e => e.riskLevel === 'High').length;

    container.innerHTML = `
      <div class="page-hero">
        <div>
          <h1>Exception Work Queue</h1>
          <p>Human-in-the-loop review workbench for complex, high-risk and policy-violating return cases.</p>
        </div>
      </div>

      <div class="grid-3" style="margin-bottom: 18px;">
        <div class="card" style="margin-bottom: 0;">
          <div class="kpi-label">Active Exceptions</div>
          <div class="kpi-value" style="color: var(--warning);">${exceptions.length}</div>
          <div class="kpi-subtext">Requires human decision</div>
        </div>
        <div class="card" style="margin-bottom: 0;">
          <div class="kpi-label">High Priority / Fraud Alerts</div>
          <div class="kpi-value" style="color: var(--danger);">${highPriorityCount}</div>
          <div class="kpi-subtext">SLA &lt; 4 hours</div>
        </div>
        <div class="card" style="margin-bottom: 0;">
          <div class="kpi-label">Average Resolution Time</div>
          <div class="kpi-value">4.2h</div>
          <div class="kpi-subtext"><span class="trend-up">Well within 24h SLA</span></div>
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <div>
            <div class="card-title">Pending Exception Cases</div>
            <div class="card-subtitle">Review attached evidence, customer telemetry and override AI recommendations</div>
          </div>
        </div>

        <div class="table-container">
          <table class="table-custom">
            <thead>
              <tr>
                <th>Case ID</th>
                <th>Exception Reason</th>
                <th>Customer</th>
                <th>Value</th>
                <th>Evidence Summary</th>
                <th>Risk</th>
                <th>SLA Countdown</th>
                <th>Owner</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              ${exceptions.length === 0 ? `<tr><td colspan="9" style="text-align:center; padding: 24px; color: var(--text-muted);">No open exceptions in the queue! Excellent job.</td></tr>` : ''}
              ${exceptions.map(e => `
                <tr>
                  <td><strong>${e.caseId}</strong></td>
                  <td><span style="font-weight: 600; color: var(--primary-navy);">${e.exceptionType}</span></td>
                  <td>${e.customer}</td>
                  <td><strong>${UI.formatINR(e.orderValue)}</strong></td>
                  <td><small style="color: var(--secondary-slate);">${e.evidenceSummary}</small></td>
                  <td>${UI.riskBadge(e.riskLevel)}</td>
                  <td>${UI.slaBadge(e.slaHoursRemaining)}</td>
                  <td>${e.owner}</td>
                  <td>
                    <button class="btn btn-sm btn-primary" onclick="Pages.openCaseModal('${e.caseId}')">Review & Decide</button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  // 6. REFUND & DECISION CENTER
  renderRefund() {
    const container = document.getElementById('refund-view');
    if (!container) return;

    const cases = AppStore.getData(DB_KEYS.CASES);

    container.innerHTML = `
      <div class="page-hero">
        <div>
          <h1>Refund & Decision Center</h1>
          <p>Execute policy rules, adjust settlement amounts, and trigger payment disbursement.</p>
        </div>
      </div>

      <div class="grid-split">
        <div class="card">
          <div class="card-header">
            <div>
              <div class="card-title">Decision Workbench</div>
              <div class="card-subtitle">Select a case to inspect policy criteria and authorize settlement</div>
            </div>
          </div>

          <div class="form-group" style="margin-bottom: 14px;">
            <label class="form-label">Select Return Case</label>
            <select id="decision-case-select" class="form-control" onchange="Pages.loadCaseDecisionDetails()">
              ${cases.map(c => `
                <option value="${c.id}">${c.id} · ${c.customer} · ${UI.formatINR(c.purchaseValue)} (${c.status})</option>
              `).join('')}
            </select>
          </div>

          <div id="decision-details-area">
            <!-- Rendered dynamically -->
          </div>
        </div>

        <div>
          <div class="card">
            <div class="card-header">
              <div class="card-title">Enterprise Decision Rule Matrix</div>
              <div class="card-subtitle">DMN Business Rules reference</div>
            </div>

            <div class="stat-row">
              <span class="stat-label">Rule 1: Return Window</span>
              <span class="stat-val">≤ 30 Days</span>
            </div>
            <div class="stat-row">
              <span class="stat-label">Rule 2: Auto-Approve Limit</span>
              <span class="stat-val">≤ ₹5,000 (Low Risk)</span>
            </div>
            <div class="stat-row">
              <span class="stat-label">Rule 3: High-Value Threshold</span>
              <span class="stat-val">≥ ₹10,000 (Manual Sign-off)</span>
            </div>
            <div class="stat-row">
              <span class="stat-label">Rule 4: Damaged / Defect</span>
              <span class="stat-val">Requires Verified Photo OCR</span>
            </div>
            <div class="stat-row">
              <span class="stat-label">Rule 5: Suspected Fraud</span>
              <span class="stat-val">Mandatory Investigation Freeze</span>
            </div>
            <div class="stat-row">
              <span class="stat-label">Rule 6: Supplier Defect</span>
              <span class="stat-val">Auto-Route Vendor Recovery</span>
            </div>
          </div>

          <div class="notice-box">
            <strong>Mendix DMN Integration:</strong> These rules map directly to Mendix Decision Tables (DMN), enabling business users to adjust value ceilings without code redeployment.
          </div>
        </div>
      </div>
    `;

    Pages.loadCaseDecisionDetails();
  },

  loadCaseDecisionDetails() {
    const select = document.getElementById('decision-case-select');
    if (!select) return;
    const caseId = select.value;
    const c = AppStore.getItemById(DB_KEYS.CASES, caseId);
    const area = document.getElementById('decision-details-area');
    if (!c || !area) return;

    area.innerHTML = `
      <div style="background-color: #FAF9F6; border: 1px solid var(--border-color); border-radius: var(--radius-sm); padding: 14px; margin-bottom: 14px;">
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
          <div><span style="color: var(--text-muted); font-size: 11px;">Customer:</span><strong style="display: block;">${c.customer}</strong></div>
          <div><span style="color: var(--text-muted); font-size: 11px;">Product:</span><strong style="display: block;">${c.product}</strong></div>
          <div><span style="color: var(--text-muted); font-size: 11px;">Original Order Value:</span><strong style="display: block;">${UI.formatINR(c.purchaseValue)}</strong></div>
          <div><span style="color: var(--text-muted); font-size: 11px;">Return Reason:</span><strong style="display: block;">${c.returnReason}</strong></div>
        </div>
      </div>

      <div class="form-group" style="margin-bottom: 14px;">
        <label class="form-label">Approved Refund Amount (INR)</label>
        <input type="number" id="dec-refund-amount" class="form-control" value="${c.purchaseValue}">
      </div>

      <div class="notice-box notice-teal" style="margin-bottom: 14px;">
        <strong>AI Recommendation:</strong> ${c.aiAssessment?.suggestedDecision || 'AUTO APPROVE'} (Confidence: ${c.aiAssessment?.confidence || 95}%)
        <div style="margin-top: 4px; font-size: 11px;">${c.aiAssessment?.reasoning || ''}</div>
      </div>

      <div class="hero-actions">
        <button class="btn btn-primary" onclick="Pages.executeDecisionApprove('${c.id}')">Approve Refund</button>
        <button class="btn btn-warning" onclick="Pages.executeDecisionReview('${c.id}')">Send to Review</button>
        <button class="btn btn-danger" onclick="Pages.executeDecisionReject('${c.id}')">Reject Refund</button>
      </div>
    `;
  },

  executeDecisionApprove(caseId) {
    const amount = parseFloat(document.getElementById('dec-refund-amount')?.value) || 0;
    const c = AppStore.getItemById(DB_KEYS.CASES, caseId);
    if (!c) return;

    AppStore.updateItem(DB_KEYS.CASES, caseId, { status: 'Refund Approved', purchaseValue: amount });

    // Remove from exceptions
    const excs = AppStore.getData(DB_KEYS.EXCEPTIONS).filter(e => e.caseId !== caseId);
    AppStore.setData(DB_KEYS.EXCEPTIONS, excs);

    // Create refund
    const refund = {
      id: 'RF-' + Math.floor(2050 + Math.random() * 400),
      caseId: c.id,
      customer: c.customer,
      amount: amount,
      originalAmount: c.purchaseValue,
      paymentMethod: c.paymentMethod,
      gatewayRef: 'UPI-DEC-' + Math.floor(100000 + Math.random() * 900000),
      status: 'Pending Finance Settlement',
      approvedBy: AppStore.getCurrentUser()?.name || 'Returns Manager',
      approvedAt: new Date().toISOString(),
      financeApprover: null,
      financeSettledAt: null,
      notes: 'Decision approved via Decision Center.'
    };
    AppStore.addItem(DB_KEYS.REFUNDS, refund);

    AppStore.logActivity('Decision Approved Refund', 'Refund', refund.id, `Refund of ${UI.formatINR(amount)} approved for Case ${c.id} (${c.customer}).`);
    
    AppStore.createNotification(
      'Refund Awaiting Settlement',
      `Refund ${refund.id} for ${c.customer} (${UI.formatINR(amount)}) awaiting Finance disbursement.`,
      'info',
      'Finance',
      'finance',
      refund.id
    );

    UI.toast(`Refund of ${UI.formatINR(amount)} approved for Case ${caseId}!`, 'success');
    Pages.loadCaseDecisionDetails();
  },

  executeDecisionReview(caseId) {
    UI.toast(`Case ${caseId} marked for senior supervisor review.`, 'warning');
  },

  executeDecisionReject(caseId) {
    AppStore.updateItem(DB_KEYS.CASES, caseId, { status: 'Rejected' });
    const excs = AppStore.getData(DB_KEYS.EXCEPTIONS).filter(e => e.caseId !== caseId);
    AppStore.setData(DB_KEYS.EXCEPTIONS, excs);

    AppStore.logActivity('Decision Rejected Return', 'Case', caseId, `Case ${caseId} rejected under policy rules.`);
    UI.toast(`Case ${caseId} rejected.`, 'danger');
    Pages.loadCaseDecisionDetails();
  },

  // 7. FINANCE APPROVAL
  renderFinance() {
    const container = document.getElementById('finance-view');
    if (!container) return;

    const refunds = AppStore.getData(DB_KEYS.REFUNDS);
    const pendingRefunds = refunds.filter(r => r.status.includes('Pending'));
    const pendingTotal = pendingRefunds.reduce((sum, r) => sum + r.amount, 0);
    const settledRefunds = refunds.filter(r => r.status === 'Settlement Approved');
    const settledTotal = settledRefunds.reduce((sum, r) => sum + r.amount, 0);

    container.innerHTML = `
      <div class="page-hero">
        <div>
          <h1>Finance Settlement & Disbursement</h1>
          <p>Authorize bank payment gateway batches, UPI transfers, and reconcile ledger accounts.</p>
        </div>
      </div>

      <div class="kpi-grid">
        <div class="kpi-card kpi-warning">
          <div class="kpi-label">Pending Finance Approvals</div>
          <div class="kpi-value">${pendingRefunds.length}</div>
          <div class="kpi-subtext">Awaiting payment release</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">Pending Refund Value</div>
          <div class="kpi-value">${UI.formatINR(pendingTotal)}</div>
          <div class="kpi-subtext">Disbursement queue</div>
        </div>
        <div class="kpi-card kpi-success">
          <div class="kpi-label">Settled Disbursements</div>
          <div class="kpi-value">${settledRefunds.length}</div>
          <div class="kpi-subtext">${UI.formatINR(settledTotal)} total cleared</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">Average Processing Time</div>
          <div class="kpi-value">1.8h</div>
          <div class="kpi-subtext"><span class="trend-up">Within banking window</span></div>
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <div>
            <div class="card-title">Refund Settlement Queue</div>
            <div class="card-subtitle">Validate bank details and release funds to customer accounts</div>
          </div>
        </div>

        <div class="table-container">
          <table class="table-custom">
            <thead>
              <tr>
                <th>Refund ID</th>
                <th>Case ID</th>
                <th>Customer</th>
                <th>Amount</th>
                <th>Payment Channel</th>
                <th>Approved By</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              ${refunds.length === 0 ? `<tr><td colspan="8" style="text-align: center; padding: 24px; color: var(--text-muted);">No refund records available.</td></tr>` : ''}
              ${refunds.map(r => `
                <tr>
                  <td><strong>${r.id}</strong></td>
                  <td>${r.caseId}</td>
                  <td><strong>${r.customer}</strong></td>
                  <td><strong style="color: var(--primary-navy);">${UI.formatINR(r.amount)}</strong></td>
                  <td><small style="color: var(--secondary-slate);">${r.paymentMethod}</small></td>
                  <td>${r.approvedBy}</td>
                  <td>${UI.statusBadge(r.status)}</td>
                  <td>
                    ${r.status.includes('Pending') ? `
                      <div style="display: flex; gap: 4px;">
                        <button class="btn btn-sm btn-success" onclick="Pages.approveFinanceSettlement('${r.id}')">Approve Settlement</button>
                        <button class="btn btn-sm btn-danger" onclick="Pages.rejectFinanceSettlement('${r.id}')">Reject</button>
                      </div>
                    ` : `
                      <span class="badge badge-neutral">Settled (${r.financeApprover || 'System'})</span>
                    `}
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  approveFinanceSettlement(refundId) {
    const r = AppStore.getItemById(DB_KEYS.REFUNDS, refundId);
    if (!r) return;

    const user = AppStore.getCurrentUser();
    AppStore.updateItem(DB_KEYS.REFUNDS, refundId, {
      status: 'Settlement Approved',
      financeApprover: user ? user.name : 'Ananya Deshmukh',
      financeSettledAt: new Date().toISOString()
    });

    // Update case status
    AppStore.updateItem(DB_KEYS.CASES, r.caseId, { status: 'Settlement Approved' });

    AppStore.logActivity(
      'Approved Finance Settlement',
      'Refund',
      refundId,
      `Finance Approver (${user?.name}) disbursed ${UI.formatINR(r.amount)} to ${r.customer} via ${r.paymentMethod}.`
    );

    AppStore.createNotification(
      'Disbursement Cleared',
      `Disbursement of ${UI.formatINR(r.amount)} for Case ${r.caseId} successfully completed.`,
      'success',
      'All',
      'cases',
      r.caseId
    );

    UI.toast(`Disbursement of ${UI.formatINR(r.amount)} approved!`, 'success');
    AppRouter.refreshCurrentPage();
  },

  rejectFinanceSettlement(refundId) {
    const r = AppStore.getItemById(DB_KEYS.REFUNDS, refundId);
    if (!r) return;

    AppStore.updateItem(DB_KEYS.REFUNDS, refundId, { status: 'Settlement Rejected' });
    AppStore.logActivity('Rejected Settlement', 'Refund', refundId, `Finance rejected settlement ${refundId}.`);
    UI.toast(`Settlement for ${refundId} rejected.`, 'warning');
    AppRouter.refreshCurrentPage();
  },

  // 8. VENDOR RECOVERY
  renderVendor() {
    const container = document.getElementById('vendor-view');
    if (!container) return;

    const claims = AppStore.getData(DB_KEYS.VENDOR_CLAIMS);
    const recoveredTotal = claims.filter(c => c.status === 'Accepted' || c.status === 'Settled').reduce((sum, c) => sum + c.recoveryAmount, 0);

    container.innerHTML = `
      <div class="page-hero">
        <div>
          <h1>Vendor Recovery & Warranty Claims</h1>
          <p>Recover financial losses on supplier-defective products through automated chargeback claims.</p>
        </div>
      </div>

      <div class="grid-split">
        <div class="card">
          <div class="card-header">
            <div>
              <div class="card-title">Active Supplier Recovery Claims</div>
              <div class="card-subtitle">Manage supplier warranty chargebacks and dispute resolution</div>
            </div>
          </div>

          <div class="table-container">
            <table class="table-custom">
              <thead>
                <tr>
                  <th>Claim ID</th>
                  <th>Vendor</th>
                  <th>Product</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                ${claims.length === 0 ? `<tr><td colspan="6" style="text-align: center; padding: 20px; color: var(--text-muted);">No vendor claims active.</td></tr>` : ''}
                ${claims.map(v => `
                  <tr>
                    <td><strong>${v.id}</strong></td>
                    <td><strong>${v.vendor}</strong></td>
                    <td><div style="max-width: 140px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${v.product}</div></td>
                    <td><strong>${UI.formatINR(v.recoveryAmount)}</strong></td>
                    <td>${UI.statusBadge(v.status)}</td>
                    <td>
                      <button class="btn btn-sm btn-outline" onclick="Pages.openVendorModal('${v.id}')">Review</button>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <div class="card">
            <div class="card-header">
              <div class="card-title">Supplier Recovery Workflow</div>
              <div class="card-subtitle">Automated chargeback pipeline</div>
            </div>

            <div class="timeline-list">
              <div class="timeline-item">
                <div class="timeline-dot">1</div>
                <div class="timeline-content">
                  <div class="timeline-title">Defect & Diagnostics Verified</div>
                  <div class="timeline-desc">Customer photos & error codes matched to supplier warranty terms.</div>
                </div>
              </div>
              <div class="timeline-item">
                <div class="timeline-dot">2</div>
                <div class="timeline-content">
                  <div class="timeline-title">Automated Chargeback Raised</div>
                  <div class="timeline-desc">Claim invoice transmitted to supplier EDI / Vendor Portal.</div>
                </div>
              </div>
              <div class="timeline-item">
                <div class="timeline-dot">3</div>
                <div class="timeline-content">
                  <div class="timeline-title">Vendor SLA Response & Settlement</div>
                  <div class="timeline-desc">Supplier accepts claim or issues credit note against invoice.</div>
                </div>
              </div>
            </div>

            <div style="margin-top: 14px; background: var(--success-bg); border: 1px solid var(--success-border); border-radius: var(--radius-sm); padding: 12px;">
              <strong style="color: var(--success); font-size: 12px;">Total Recovered YTD: ${UI.formatINR(recoveredTotal + 240000)}</strong>
              <div style="font-size: 11px; color: #2E583E; margin-top: 2px;">94% supplier recovery realization rate on eligible defects.</div>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  openVendorModal(claimId) {
    const v = AppStore.getItemById(DB_KEYS.VENDOR_CLAIMS, claimId);
    if (!v) return;

    const contentHtml = `
      <div class="stat-row"><span class="stat-label">Claim ID</span><span class="stat-val">${v.id}</span></div>
      <div class="stat-row"><span class="stat-label">Vendor Name</span><span class="stat-val">${v.vendor}</span></div>
      <div class="stat-row"><span class="stat-label">Associated Case</span><span class="stat-val">${v.caseId}</span></div>
      <div class="stat-row"><span class="stat-label">Product Defect</span><span>${v.reason}</span></div>
      <div class="stat-row"><span class="stat-label">Claimed Recovery Amount</span><span class="stat-val">${UI.formatINR(v.recoveryAmount)}</span></div>
      <div class="stat-row"><span class="stat-label">Current Status</span><span>${UI.statusBadge(v.status)}</span></div>

      <div style="margin-top: 14px;">
        <label class="form-label">Vendor Response Notes / Settlement Remarks</label>
        <textarea id="vm-response-notes" class="form-control">${v.vendorResponse || ''}</textarea>
      </div>
    `;

    const footerHtml = `
      <button class="btn btn-outline" onclick="UI.closeModal()">Cancel</button>
      <button class="btn btn-warning" onclick="Pages.updateVendorClaim('${v.id}', 'Disputed')">Flag Disputed</button>
      <button class="btn btn-success" onclick="Pages.updateVendorClaim('${v.id}', 'Accepted')">Accept & Settle Claim</button>
    `;

    UI.openModal(`Vendor Recovery Claim · ${v.id}`, contentHtml, footerHtml, 'md');
  },

  updateVendorClaim(claimId, status) {
    const notes = document.getElementById('vm-response-notes')?.value || '';
    AppStore.updateItem(DB_KEYS.VENDOR_CLAIMS, claimId, {
      status: status,
      vendorResponse: notes
    });

    AppStore.logActivity(
      'Updated Vendor Claim',
      'VendorClaim',
      claimId,
      `Vendor Claim ${claimId} marked as ${status}.`
    );

    UI.closeModal();
    UI.toast(`Claim ${claimId} updated to ${status}.`, 'success');
    AppRouter.refreshCurrentPage();
  },

  // 9. RETURN DISPOSITION
  renderDisposition() {
    const container = document.getElementById('disposition-view');
    if (!container) return;

    const items = AppStore.getData(DB_KEYS.DISPOSITIONS);

    container.innerHTML = `
      <div class="page-hero">
        <div>
          <h1>Warehouse Return Disposition</h1>
          <p>Direct physical items to restock, refurbishment, liquidation or scrap upon central hub arrival.</p>
        </div>
      </div>

      <div class="grid-split">
        <div class="card">
          <div class="card-header">
            <div>
              <div class="card-title">Pending Warehouse Inspections</div>
              <div class="card-subtitle">Assign grading, update physical inventory and sync WMS bin locations</div>
            </div>
          </div>

          <div class="table-container">
            <table class="table-custom">
              <thead>
                <tr>
                  <th>Case ID</th>
                  <th>Product</th>
                  <th>Condition</th>
                  <th>Selected Disposition</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                ${items.length === 0 ? `<tr><td colspan="6" style="text-align: center; padding: 20px; color: var(--text-muted);">No items in disposition queue.</td></tr>` : ''}
                ${items.map(d => `
                  <tr>
                    <td><strong>${d.caseId}</strong></td>
                    <td><div style="max-width: 150px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${d.product}</div></td>
                    <td><span class="badge badge-neutral">${d.condition}</span></td>
                    <td><strong>${d.selectedDisposition}</strong></td>
                    <td>${UI.statusBadge(d.status)}</td>
                    <td>
                      <button class="btn btn-sm btn-primary" onclick="Pages.openDispositionModal('${d.id}')">Process</button>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <div class="card">
            <div class="card-header">
              <div class="card-title">Disposition Distribution Mix</div>
              <div class="card-subtitle">Physical inventory recovery channels</div>
            </div>

            <div class="metric-row">
              <div class="metric-header"><span>Restock (Saleable Grade A)</span><strong>52%</strong></div>
              <div class="metric-bar-bg"><div class="metric-bar-fill" style="width: 52%; background-color: var(--success);"></div></div>
            </div>
            <div class="metric-row">
              <div class="metric-header"><span>Refurbish (Factory Repair)</span><strong>23%</strong></div>
              <div class="metric-bar-bg"><div class="metric-bar-fill" style="width: 23%; background-color: var(--primary-teal);"></div></div>
            </div>
            <div class="metric-row">
              <div class="metric-header"><span>Liquidate (B2B Bulk Auction)</span><strong>15%</strong></div>
              <div class="metric-bar-bg"><div class="metric-bar-fill" style="width: 15%; background-color: var(--warning);"></div></div>
            </div>
            <div class="metric-row">
              <div class="metric-header"><span>Scrap / E-Waste Salvage</span><strong>10%</strong></div>
              <div class="metric-bar-bg"><div class="metric-bar-fill" style="width: 10%; background-color: var(--danger);"></div></div>
            </div>

            <div class="notice-box notice-teal" style="margin-top: 14px;">
              <strong>WMS REST Integration:</strong> Once disposition is confirmed, Mendix publishes a JSON payload to Manhattan / BlueYonder WMS to adjust warehouse available-to-promise (ATP) inventory levels.
            </div>
          </div>
        </div>
      </div>
    `;
  },

  openDispositionModal(dispId) {
    const d = AppStore.getItemById(DB_KEYS.DISPOSITIONS, dispId);
    if (!d) return;

    const contentHtml = `
      <div class="stat-row"><span class="stat-label">Disposition ID</span><span class="stat-val">${d.id}</span></div>
      <div class="stat-row"><span class="stat-label">Return Case</span><span class="stat-val">${d.caseId}</span></div>
      <div class="stat-row"><span class="stat-label">Product</span><span class="stat-val">${d.product}</span></div>
      <div class="stat-row"><span class="stat-label">Intake Condition</span><span>${d.condition}</span></div>
      
      <div class="form-group" style="margin-top: 12px;">
        <label class="form-label">Physical Disposition Decision</label>
        <select id="dsp-decision" class="form-control">
          <option value="Restock" ${d.selectedDisposition === 'Restock' ? 'selected' : ''}>RESTOCK (Grade A - Full Retail)</option>
          <option value="Refurbish" ${d.selectedDisposition === 'Refurbish' ? 'selected' : ''}>REFURBISH (Factory Repackaging & Repair)</option>
          <option value="Liquidate" ${d.selectedDisposition === 'Liquidate' ? 'selected' : ''}>LIQUIDATE (B2B Salvage Auction)</option>
          <option value="Scrap" ${d.selectedDisposition === 'Scrap' ? 'selected' : ''}>SCRAP (Hazardous / E-Waste Disposal)</option>
        </select>
      </div>

      <div class="form-group" style="margin-top: 10px;">
        <label class="form-label">Warehouse Bay / Location</label>
        <input type="text" id="dsp-location" class="form-control" value="${d.warehouseLocation}">
      </div>

      <div class="form-group" style="margin-top: 10px;">
        <label class="form-label">Inspector Notes</label>
        <textarea id="dsp-notes" class="form-control">${d.notes || ''}</textarea>
      </div>
    `;

    const footerHtml = `
      <button class="btn btn-outline" onclick="UI.closeModal()">Cancel</button>
      <button class="btn btn-primary" onclick="Pages.saveDisposition('${d.id}')">Confirm WMS Inventory Update</button>
    `;

    UI.openModal(`Warehouse Disposition · ${d.id}`, contentHtml, footerHtml, 'md');
  },

  saveDisposition(dispId) {
    const decision = document.getElementById('dsp-decision')?.value || 'Restock';
    const loc = document.getElementById('dsp-location')?.value || 'Central WMS';
    const notes = document.getElementById('dsp-notes')?.value || '';

    AppStore.updateItem(DB_KEYS.DISPOSITIONS, dispId, {
      selectedDisposition: decision,
      warehouseLocation: loc,
      notes: notes,
      status: 'Inventory Updated',
      inventoryImpact: `+1 Updated in WMS (${decision})`
    });

    AppStore.logActivity(
      'Completed Return Disposition',
      'Disposition',
      dispId,
      `Disposition ${dispId} completed: ${decision} at ${loc}.`
    );

    UI.closeModal();
    UI.toast(`Disposition updated: ${decision}`, 'success');
    AppRouter.refreshCurrentPage();
  },

  // 10. ANALYTICS PAGE (PURE HTML/CSS/SVG CHARTS)
  renderAnalytics() {
    const container = document.getElementById('analytics-view');
    if (!container) return;

    container.innerHTML = `
      <div class="page-hero">
        <div>
          <h1>Returns Intelligence & Executive Analytics</h1>
          <p>Comprehensive operational, customer satisfaction and supplier quality telemetry.</p>
        </div>
      </div>

      <div class="kpi-grid">
        <div class="kpi-card kpi-success">
          <div class="kpi-label">Auto-Decision Rate</div>
          <div class="kpi-value">70%</div>
          <div class="kpi-subtext"><span class="trend-up">Target 70% achieved</span></div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">Refund Cycle Time</div>
          <div class="kpi-value">1.8d</div>
          <div class="kpi-subtext"><span class="trend-up">↓ 78% reduction</span></div>
        </div>
        <div class="kpi-card kpi-danger">
          <div class="kpi-label">Fraud Prevented</div>
          <div class="kpi-value">₹2.8L</div>
          <div class="kpi-subtext">Weight/OCR anomaly engine</div>
        </div>
        <div class="kpi-card kpi-success">
          <div class="kpi-label">Vendor Recovery</div>
          <div class="kpi-value">₹4.8L</div>
          <div class="kpi-subtext"><span class="trend-up">+22% month-over-month</span></div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">Customer CSAT Score</div>
          <div class="kpi-value">4.7 / 5.0</div>
          <div class="kpi-subtext"><span class="trend-up">+0.9 pts post-automation</span></div>
        </div>
      </div>

      <!-- Charts Grid -->
      <div class="grid-2">
        <!-- Return Reasons Bar Chart -->
        <div class="card">
          <div class="card-header">
            <div>
              <div class="card-title">Return Reason Distribution</div>
              <div class="card-subtitle">Share of total reverse logistics intake</div>
            </div>
          </div>

          <div style="display: flex; flex-direction: column; gap: 12px; margin-top: 10px;">
            <div>
              <div style="display: flex; justify-content: space-between; font-size: 11.5px; margin-bottom: 3px;">
                <span>Changed Mind (Discretionary)</span><strong>42% (538 cases)</strong>
              </div>
              <div class="metric-bar-bg"><div class="metric-bar-fill" style="width: 42%; background-color: var(--primary-teal);"></div></div>
            </div>

            <div>
              <div style="display: flex; justify-content: space-between; font-size: 11.5px; margin-bottom: 3px;">
                <span>Damaged in Transit / Courier</span><strong>19% (243 cases)</strong>
              </div>
              <div class="metric-bar-bg"><div class="metric-bar-fill" style="width: 19%; background-color: var(--warning);"></div></div>
            </div>

            <div>
              <div style="display: flex; justify-content: space-between; font-size: 11.5px; margin-bottom: 3px;">
                <span>Defective / Functional Impairment</span><strong>15% (192 cases)</strong>
              </div>
              <div class="metric-bar-bg"><div class="metric-bar-fill" style="width: 15%; background-color: #565387;"></div></div>
            </div>

            <div>
              <div style="display: flex; justify-content: space-between; font-size: 11.5px; margin-bottom: 3px;">
                <span>Wrong Product Shipped (WMS Error)</span><strong>14% (179 cases)</strong>
              </div>
              <div class="metric-bar-bg"><div class="metric-bar-fill" style="width: 14%; background-color: var(--info);"></div></div>
            </div>

            <div>
              <div style="display: flex; justify-content: space-between; font-size: 11.5px; margin-bottom: 3px;">
                <span>Size / Fit Discrepancy</span><strong>10% (128 cases)</strong>
              </div>
              <div class="metric-bar-bg"><div class="metric-bar-fill" style="width: 10%; background-color: var(--secondary-slate);"></div></div>
            </div>
          </div>
        </div>

        <!-- Monthly Intake Trend (SVG Chart) -->
        <div class="card">
          <div class="card-header">
            <div>
              <div class="card-title">Monthly Return Velocity & Auto-Decision Trend</div>
              <div class="card-subtitle">Volume intake vs Automated resolution</div>
            </div>
          </div>

          <div style="padding: 10px 0;">
            <svg viewBox="0 0 400 160" style="width: 100%; height: 160px;">
              <!-- Grid lines -->
              <line x1="30" y1="20" x2="380" y2="20" stroke="#EAEFEF" stroke-width="1" />
              <line x1="30" y1="60" x2="380" y2="60" stroke="#EAEFEF" stroke-width="1" />
              <line x1="30" y1="100" x2="380" y2="100" stroke="#EAEFEF" stroke-width="1" />
              <line x1="30" y1="140" x2="380" y2="140" stroke="#CBD5D7" stroke-width="1" />

              <!-- Area Fill -->
              <polygon points="40,120 100,105 160,90 220,70 280,50 340,35 340,140 40,140" fill="rgba(20, 125, 115, 0.12)" />

              <!-- Line -->
              <polyline points="40,120 100,105 160,90 220,70 280,50 340,35" fill="none" stroke="var(--primary-teal)" stroke-width="3" />

              <!-- Data Points -->
              <circle cx="40" cy="120" r="4" fill="var(--primary-teal)" />
              <circle cx="100" cy="105" r="4" fill="var(--primary-teal)" />
              <circle cx="160" cy="90" r="4" fill="var(--primary-teal)" />
              <circle cx="220" cy="70" r="4" fill="var(--primary-teal)" />
              <circle cx="280" cy="50" r="4" fill="var(--primary-teal)" />
              <circle cx="340" cy="35" r="4" fill="var(--primary-teal)" />

              <!-- Month Labels -->
              <text x="35" y="155" font-size="9" fill="#78888D">May</text>
              <text x="95" y="155" font-size="9" fill="#78888D">Jun</text>
              <text x="155" y="155" font-size="9" fill="#78888D">Jul</text>
              <text x="215" y="155" font-size="9" fill="#78888D">Aug</text>
              <text x="275" y="155" font-size="9" fill="#78888D">Sep</text>
              <text x="335" y="155" font-size="9" fill="#78888D">Oct</text>
            </svg>
          </div>

          <div style="display: flex; justify-content: space-between; font-size: 11px; color: var(--text-muted); border-top: 1px solid var(--border-color); padding-top: 8px;">
            <span>Automation Growth: <strong>+38% YTD</strong></span>
            <span>Manual Reviews Saved: <strong>8,420 hrs</strong></span>
          </div>
        </div>
      </div>

      <!-- Supplier Scorecard -->
      <div class="card">
        <div class="card-header">
          <div>
            <div class="card-title">Supplier Quality & Recovery Realization Scorecard</div>
            <div class="card-subtitle">Performance telemetry used in vendor contract negotiations</div>
          </div>
        </div>

        <div class="table-container">
          <table class="table-custom">
            <thead>
              <tr>
                <th>Supplier</th>
                <th>Defect Rate</th>
                <th>Avg. Dispute Turnaround</th>
                <th>Recovery Realization %</th>
                <th>Quality Rating</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Nova Appliances Ltd</strong></td>
                <td>1.4%</td>
                <td>24 hrs</td>
                <td><strong>98%</strong></td>
                <td><strong style="color: var(--success);">94 / 100</strong></td>
                <td><span class="badge badge-success">Preferred Partner</span></td>
              </tr>
              <tr>
                <td><strong>Acoustic Sound Labs</strong></td>
                <td>2.8%</td>
                <td>36 hrs</td>
                <td><strong>91%</strong></td>
                <td><strong style="color: var(--success);">88 / 100</strong></td>
                <td><span class="badge badge-success">Compliant</span></td>
              </tr>
              <tr>
                <td><strong>SleepWell Ergonomics</strong></td>
                <td>4.9%</td>
                <td>72 hrs</td>
                <td><strong>74%</strong></td>
                <td><strong style="color: var(--warning);">68 / 100</strong></td>
                <td><span class="badge badge-warning">Quality Review</span></td>
              </tr>
              <tr>
                <td><strong>Vedic Threads Apparel</strong></td>
                <td>0.8%</td>
                <td>18 hrs</td>
                <td><strong>100%</strong></td>
                <td><strong style="color: var(--success);">98 / 100</strong></td>
                <td><span class="badge badge-success">Exemplary</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Executive Value Story -->
      <div class="card" style="background-color: var(--light-teal); border: 1px solid rgba(20, 125, 115, 0.25);">
        <h3 style="font-size: 14px; font-weight: 700; color: var(--primary-teal); margin-bottom: 6px;">Executive Value Summary</h3>
        <p style="font-size: 12px; color: #124D46; line-height: 1.6;">
          <strong>70% of eligible return cases are automatically decided</strong>, eliminating manual review overhead for standard low-value claims while systematically routing high-value, suspected fraud, and damaged cases into controlled exception workflows with auditable SLA oversight.
        </p>
      </div>
    `;
  },

  // 11. NOTIFICATIONS CENTER
  renderNotifications() {
    const container = document.getElementById('notifications-view');
    if (!container) return;

    const notifs = AppStore.getData(DB_KEYS.NOTIFICATIONS);
    const currentUser = AppStore.getCurrentUser();

    container.innerHTML = `
      <div class="page-hero">
        <div>
          <h1>Operational Notifications</h1>
          <p>Actionable alerts generated across returns, exceptions, disbursements and supplier disputes.</p>
        </div>
        <div class="hero-actions">
          <button class="btn btn-outline" onclick="Pages.markAllRead()">Mark All Read</button>
        </div>
      </div>

      <div class="card">
        <div style="display: flex; flex-direction: column; gap: 8px;">
          ${notifs.length === 0 ? `<div style="text-align: center; padding: 24px; color: var(--text-muted);">No notifications.</div>` : ''}
          ${notifs.map(n => `
            <div style="display: flex; align-items: flex-start; justify-content: space-between; padding: 12px 14px; background: ${n.read ? '#FFFFFF' : 'var(--light-teal)'}; border: 1px solid ${n.read ? 'var(--border-subtle)' : 'rgba(20, 125, 115, 0.25)'}; border-radius: var(--radius-sm); gap: 12px;">
              <div style="display: flex; gap: 10px; align-items: flex-start;">
                <span class="badge ${n.type === 'danger' ? 'badge-danger' : n.type === 'warning' ? 'badge-warning' : n.type === 'success' ? 'badge-success' : 'badge-info'}" style="margin-top: 2px;">
                  ${n.type.toUpperCase()}
                </span>
                <div>
                  <strong style="font-size: 12.5px; color: var(--primary-navy); display: block;">${n.title}</strong>
                  <p style="font-size: 11.5px; color: var(--text-main); margin-top: 2px;">${n.message}</p>
                  <span style="font-size: 10px; color: var(--text-muted); display: block; margin-top: 4px;">
                    Target: <strong>${n.roleTarget}</strong> · ${UI.timeAgo(n.timestamp)}
                  </span>
                </div>
              </div>

              <div style="display: flex; gap: 6px; flex-shrink: 0;">
                ${n.linkPage ? `
                  <button class="btn btn-sm btn-soft" onclick="Pages.handleNotificationClick('${n.id}', '${n.linkPage}', '${n.linkId || ''}')">
                    Open ${n.linkPage}
                  </button>
                ` : ''}
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  },

  handleNotificationClick(notifId, page, linkId) {
    AppStore.markNotificationRead(notifId);
    AppRouter.navigate(page);
    if (linkId && page === 'cases') {
      setTimeout(() => Pages.openCaseModal(linkId), 200);
    }
  },

  markAllRead() {
    AppStore.markAllNotificationsRead();
    UI.toast('All notifications marked as read', 'info');
    AppRouter.refreshCurrentPage();
  },

  // 12. ACTIVITY LOG (AUDIT TRAIL)
  renderActivityLog() {
    const container = document.getElementById('activity-view');
    if (!container) return;

    const logs = AppStore.getData(DB_KEYS.ACTIVITY_LOG);

    container.innerHTML = `
      <div class="page-hero">
        <div>
          <h1>System Activity & Compliance Audit Log</h1>
          <p>Immutable audit trail tracking all stakeholder decisions, approvals and automated AI events.</p>
        </div>
      </div>

      <div class="card">
        <div class="table-container">
          <table class="table-custom">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>User</th>
                <th>Role</th>
                <th>Action</th>
                <th>Entity</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              ${logs.length === 0 ? `<tr><td colspan="6" style="text-align: center; padding: 20px; color: var(--text-muted);">No activity recorded.</td></tr>` : ''}
              ${logs.map(l => `
                <tr>
                  <td><small style="color: var(--text-muted);">${UI.formatDateTime(l.timestamp)}</small></td>
                  <td><strong>${l.user}</strong></td>
                  <td><span class="badge badge-neutral">${l.role}</span></td>
                  <td><strong style="color: var(--primary-navy);">${l.action}</strong></td>
                  <td><span class="badge badge-info">${l.entity} ${l.entityId ? '#' + l.entityId : ''}</span></td>
                  <td><small style="color: var(--text-main);">${l.details}</small></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  // 13. USER PROFILE
  renderProfile() {
    const container = document.getElementById('profile-view');
    if (!container) return;

    const user = AppStore.getCurrentUser();
    if (!user) return;

    container.innerHTML = `
      <div class="page-hero">
        <div>
          <h1>User Profile & Credentials</h1>
          <p>Session parameters and role permission matrix.</p>
        </div>
      </div>

      <div class="grid-split">
        <div class="card">
          <div class="card-header">
            <div class="card-title">Active User Account</div>
          </div>

          <div style="display: flex; gap: 14px; align-items: center; margin-bottom: 16px;">
            <div class="user-avatar" style="width: 48px; height: 48px; font-size: 18px; background: var(--primary-teal);">
              ${user.avatar}
            </div>
            <div>
              <h2 style="font-size: 16px; font-weight: 700; color: var(--primary-navy);">${user.name}</h2>
              <span style="font-size: 12px; color: var(--text-muted);">${user.title || user.role}</span>
            </div>
          </div>

          <div class="stat-row"><span class="stat-label">Username</span><span class="stat-val">${user.username}</span></div>
          <div class="stat-row"><span class="stat-label">Role</span><span class="badge badge-info">${user.role}</span></div>
          <div class="stat-row"><span class="stat-label">Email</span><span>${user.email || 'user@retailcorp.in'}</span></div>
          <div class="stat-row"><span class="stat-label">Authentication Mode</span><span class="badge badge-warning">LocalStorage Demo</span></div>

          <div class="hero-actions" style="margin-top: 16px;">
            <button class="btn btn-danger" onclick="AppRouter.logout()">Log Out</button>
          </div>
        </div>

        <div class="card">
          <div class="card-header">
            <div class="card-title">Role Permissions Matrix</div>
          </div>

          <p style="font-size: 11.5px; color: var(--text-muted); margin-bottom: 12px;">
            Permissions assigned to the <strong>${user.role}</strong> persona in ReturnFlow:
          </p>

          <div style="display: flex; flex-direction: column; gap: 6px; font-size: 11.5px;">
            <div class="stat-row">
              <span>Create Return Cases</span>
              <span>${AuthService.hasPermission('canCreateReturn') ? '✓ Granted' : '✗ Restricted'}</span>
            </div>
            <div class="stat-row">
              <span>Run AI Decision Engine</span>
              <span>${AuthService.hasPermission('canRunAiReview') ? '✓ Granted' : '✗ Restricted'}</span>
            </div>
            <div class="stat-row">
              <span>Approve / Override Refunds</span>
              <span>${AuthService.hasPermission('canApproveRefund') ? '✓ Granted' : '✗ Restricted'}</span>
            </div>
            <div class="stat-row">
              <span>Finance Disbursement Settlement</span>
              <span>${AuthService.hasPermission('canSettleFinance') ? '✓ Granted' : '✗ Restricted'}</span>
            </div>
            <div class="stat-row">
              <span>Supplier Warranty Claims</span>
              <span>${AuthService.hasPermission('canManageVendorClaims') ? '✓ Granted' : '✗ Restricted'}</span>
            </div>
            <div class="stat-row">
              <span>Warehouse WMS Disposition</span>
              <span>${AuthService.hasPermission('canManageDisposition') ? '✓ Granted' : '✗ Restricted'}</span>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  // 14. ADMIN / DEMO DATA MANAGEMENT
  renderAdmin() {
    const container = document.getElementById('admin-view');
    if (!container) return;

    const stateJson = AppStore.exportStateJson();

    container.innerHTML = `
      <div class="page-hero">
        <div>
          <h1>Administration & Demo Data Management</h1>
          <p>Reset prototype state, inspect raw LocalStorage entities, or export scenario data.</p>
        </div>
      </div>

      <div class="grid-split">
        <div class="card">
          <div class="card-header">
            <div class="card-title">Environment Controls</div>
          </div>

          <p style="font-size: 12px; color: var(--text-muted); margin-bottom: 16px;">
            Use these controls to reset or re-seed the prototype during executive stakeholder demonstrations.
          </p>

          <div style="display: flex; flex-direction: column; gap: 10px;">
            <button class="btn btn-danger" style="justify-content: flex-start;" onclick="Pages.handleAdminReset()">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="1 4 1 10 7 10"></polyline><polyline points="23 20 23 14 17 14"></polyline><path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"></path></svg>
              Restore Default Demo Data (Full Reset)
            </button>

            <button class="btn btn-outline" style="justify-content: flex-start;" onclick="Pages.clearActivityOnly()">
              Clear Activity Log Only
            </button>

            <button class="btn btn-outline" style="justify-content: flex-start;" onclick="Pages.clearNotificationsOnly()">
              Clear Notifications Only
            </button>
          </div>
        </div>

        <div class="card">
          <div class="card-header">
            <div class="card-title">LocalStorage Raw JSON Viewer</div>
          </div>

          <textarea class="form-control" style="height: 220px; font-family: monospace; font-size: 10.5px; white-space: pre;" readonly>${stateJson}</textarea>
        </div>
      </div>
    `;
  },

  handleAdminReset() {
    UI.confirm({
      title: 'Reset Demo Environment?',
      message: 'This will wipe all modified return cases, refunds, and logs, restoring the pristine demonstration state. You will be redirected to the login screen.',
      confirmText: 'Reset Environment',
      confirmClass: 'btn-danger',
      onConfirm: () => {
        AppStore.resetAllData();
        UI.toast('Demo environment reset to initial state.', 'info');
        AppRouter.navigate('login');
      }
    });
  },

  clearActivityOnly() {
    AppStore.setData(DB_KEYS.ACTIVITY_LOG, []);
    UI.toast('Activity log cleared.', 'info');
    AppRouter.refreshCurrentPage();
  },

  clearNotificationsOnly() {
    AppStore.setData(DB_KEYS.NOTIFICATIONS, []);
    UI.toast('Notifications cleared.', 'info');
    AppRouter.refreshCurrentPage();
  },

  // 15. DEMO GUIDE & MENDIX BLUEPRINT
  renderGuide() {
    const container = document.getElementById('guide-view');
    if (!container) return;

    container.innerHTML = `
      <div class="page-hero">
        <div>
          <h1>Executive Demonstration Script & Mendix Replication Blueprint</h1>
          <p>Step-by-step walkthrough script for business leaders and technical mapping for Mendix developers.</p>
        </div>
      </div>

      <!-- Live Script -->
      <div class="card" style="background: linear-gradient(135deg, #FFFFFF, #FAF9F6); border-color: rgba(20, 125, 115, 0.3);">
        <div class="card-header">
          <div class="card-title" style="color: var(--primary-teal); font-size: 16px;">Recommended Multi-Role Demo Sequence</div>
          <span class="badge badge-success">Live Business Script</span>
        </div>

        <p style="font-size: 12px; color: var(--text-muted); margin-bottom: 16px; line-height: 1.6;">
          Follow this 6-step multi-persona script to demonstrate how ReturnFlow unifies customer service, returns management, finance, vendor management and warehousing into a single closed-loop architecture.
        </p>

        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 12px;">
          <div style="background: #FFFFFF; border: 1px solid var(--border-color); border-radius: var(--radius-sm); padding: 12px;">
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
              <span class="badge badge-info">Step 1</span>
              <strong style="font-size: 12px;">Customer Service</strong>
            </div>
            <p style="font-size: 11px; color: var(--text-muted);">
              Login as <code>cs.agent</code>. Create a return with high purchase value (e.g. ₹18,499). Run AI Review to show instant policy checks and automatic routing.
            </p>
          </div>

          <div style="background: #FFFFFF; border: 1px solid var(--border-color); border-radius: var(--radius-sm); padding: 12px;">
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
              <span class="badge badge-warning">Step 2</span>
              <strong style="font-size: 12px;">Returns Manager</strong>
            </div>
            <p style="font-size: 11px; color: var(--text-muted);">
              Switch to <code>returns.manager</code>. Open the Exception Queue. Review damage photos and OCR verification. Click <strong>Approve Refund</strong>.
            </p>
          </div>

          <div style="background: #FFFFFF; border: 1px solid var(--border-color); border-radius: var(--radius-sm); padding: 12px;">
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
              <span class="badge badge-success">Step 3</span>
              <strong style="font-size: 12px;">Finance Approver</strong>
            </div>
            <p style="font-size: 11px; color: var(--text-muted);">
              Switch to <code>finance.approver</code>. Open Finance Settlement. Review manager-approved disbursements and click <strong>Approve Settlement</strong>.
            </p>
          </div>

          <div style="background: #FFFFFF; border: 1px solid var(--border-color); border-radius: var(--radius-sm); padding: 12px;">
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
              <span class="badge badge-info">Step 4</span>
              <strong style="font-size: 12px;">Vendor Manager</strong>
            </div>
            <p style="font-size: 11px; color: var(--text-muted);">
              Switch to <code>vendor.manager</code>. Open Vendor Recovery. View warranty chargeback against supplier and mark as <strong>Accepted</strong>.
            </p>
          </div>

          <div style="background: #FFFFFF; border: 1px solid var(--border-color); border-radius: var(--radius-sm); padding: 12px;">
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
              <span class="badge badge-neutral">Step 5</span>
              <strong style="font-size: 12px;">Warehouse Lead</strong>
            </div>
            <p style="font-size: 11px; color: var(--text-muted);">
              Switch to <code>warehouse.manager</code>. Open Disposition. Select <strong>Restock / Refurbish</strong> to update available inventory.
            </p>
          </div>

          <div style="background: #FFFFFF; border: 1px solid var(--border-color); border-radius: var(--radius-sm); padding: 12px;">
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
              <span class="badge badge-info">Step 6</span>
              <strong style="font-size: 12px;">Administrator</strong>
            </div>
            <p style="font-size: 11px; color: var(--text-muted);">
              Switch to <code>admin</code>. Inspect the immutable Activity Log and executive analytics proving 70% automated resolution.
            </p>
          </div>
        </div>
      </div>

      <!-- Mendix Replication Blueprint -->
      <div class="card" style="margin-top: 18px;">
        <div class="card-header">
          <div>
            <div class="card-title">Mendix Implementation Architecture Blueprint</div>
            <div class="card-subtitle">Direct 1:1 mapping between prototype components and Mendix Studio Pro constructs</div>
          </div>
        </div>

        <div class="table-container">
          <table class="table-custom">
            <thead>
              <tr>
                <th>Prototype Layer</th>
                <th>Target Mendix Construct</th>
                <th>Implementation Details & Microflow Logic</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>ReturnCase Entity</strong></td>
                <td>Domain Model Entity: <code>ReturnCase</code></td>
                <td>Attributes: <code>CaseId, OrderId, CustomerName, Amount, Reason, RiskLevel, Status, SLAHoursRemaining</code> with associations to <code>Customer, Order, Vendor</code>.</td>
              </tr>
              <tr>
                <td><strong>AI Decision Engine</strong></td>
                <td>Microflow + AI REST Service</td>
                <td><code>SUB_EvaluateReturnCaseWithAI</code> invokes Azure OpenAI / Claude REST endpoint with image payloads; runs Decision Table (DMN).</td>
              </tr>
              <tr>
                <td><strong>Decision Rules</strong></td>
                <td>Mendix Business Rules / DMN</td>
                <td>Decision Table assessing <code>DaysSincePurchase &lt;= 30</code>, <code>Amount &lt;= 5000</code>, and <code>FraudScore &lt; 20</code>.</td>
              </tr>
              <tr>
                <td><strong>Exception Queue</strong></td>
                <td>Mendix Workflow Engine</td>
                <td><code>Workflow_ReturnException</code> assigning user tasks to <code>ReturnsManager</code> user role with SLA escalation timers.</td>
              </tr>
              <tr>
                <td><strong>Refund Settlement</strong></td>
                <td>Payment Gateway Integration</td>
                <td><code>ACT_ProcessRefundDisbursement</code> microflow calling Razorpay / Stripe / PayU REST APIs with audit logging.</td>
              </tr>
              <tr>
                <td><strong>Vendor Recovery</strong></td>
                <td>Domain Entity: <code>VendorClaim</code></td>
                <td>Association to <code>ReturnCase</code> and <code>VendorAccount</code>. External supplier portal with restricted role permissions.</td>
              </tr>
              <tr>
                <td><strong>Warehouse Disposition</strong></td>
                <td>WMS REST Connector</td>
                <td><code>REST_SyncWMSInventory</code> microflow updating Manhattan / SAP ERP inventory balances upon receipt scan.</td>
              </tr>
              <tr>
                <td><strong>Role-Based Access</strong></td>
                <td>Mendix User Roles & Module Security</td>
                <td>Security roles: <code>CustomerService, ReturnsManager, FinanceApprover, VendorManager, WarehouseLead, Administrator</code>.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    `;
  }
};
