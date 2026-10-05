/**
 * JobSphere - Enterprise Job Portal Web App
 */

const API_BASE = '/api';

const app = {
  token: localStorage.getItem('token') || null,
  currentUser: JSON.parse(localStorage.getItem('currentUser') || 'null'),
  currentChatUserId: null,
  currentChatUserRole: null,
  activityWebSocket: null, // Add this
  activityStompClient: null, // If using STOMP
  activityCallbacks: [], // Callbacks for activity updates

  init() {
    this.updateNavAuth();
    this.loadPublicJobs();

    // Auto-load dashboard if user was already logged in
    if (this.currentUser) {
      this.openDashboard();
    }
  },

  // HTTP Helper with Bearer token
  async api(endpoint, options = {}) {
    const headers = options.headers || {};
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    if (!(options.body instanceof FormData) && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }

    try {
      const res = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });
      if (res.status === 401) {
        this.logout();
        this.showToast('Session expired. Please log in again.', 'error');
        throw new Error('Unauthorized');
      }
      return res;
    } catch (err) {
      console.error('API Error:', err);
      throw err;
    }
  },

  showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        ${type === 'success' 
          ? '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>'
          : '<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>'}
      </svg>
      <span>${message}</span>
    `;
    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(100%)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3800);
  },

  formatCurrency(val) {
    if (!val) return '$0';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);
  },

  formatDate(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  },

  // WEBSOCKET CONNECTION METHODS
  connectActivityWebSocket() {
    if (!this.currentUser || this.currentUser.role !== 'ADMIN') {
      return; // Only admins need activity feed
    }

    // Check if WebSocket is supported
    if (!('WebSocket' in window)) {
      console.warn('WebSocket not supported, falling back to polling');
      this.setupActivityPolling();
      return;
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws/activity`;

    try {
      this.activityWebSocket = new WebSocket(wsUrl);

      this.activityWebSocket.onopen = () => {
        console.log('Connected to activity WebSocket');
        // Optionally send a heartbeat or initial message
      };

      this.activityWebSocket.onmessage = (event) => {
        try {
          const activity = JSON.parse(event.data);
          this.handleActivityUpdate(activity);
        } catch (e) {
          console.error('Error parsing activity WebSocket message:', e);
        }
      };

      this.activityWebSocket.onclose = () => {
        console.log('Disconnected from activity WebSocket');
        // Attempt to reconnect after delay
        setTimeout(() => this.connectActivityWebSocket(), 5000);
      };

      this.activityWebSocket.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
    } catch (e) {
      console.error('Failed to create WebSocket connection:', e);
      // Fallback to polling will handle this case
      this.setupActivityPolling();
    }
  },

  disconnectActivityWebSocket() {
    if (this.activityWebSocket) {
      this.activityWebSocket.close();
      this.activityWebSocket = null;
    }
  },

  handleActivityUpdate(activity) {
    // Add activity to feed (similar to how loadAdminActivities works)
    // This will be called whenever a new activity arrives via WebSocket
    const feed = document.getElementById('adminActivityFeed');
    if (!feed) return;

    const activityElement = document.createElement('div');
    activityElement.className = 'activity-item';
    activityElement.innerHTML = `
      <div class="activity-icon-box">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
      </div>
      <div class="activity-content">
        <div class="activity-title">${activity.details}</div>
        <div class="activity-meta">
          <span><strong>${activity.userEmail || 'System'}</strong></span>
          ${activity.userRole ? `• <span class="role-tag ${activity.userRole.toLowerCase()}">${activity.userRole}</span>` : ''}
          • <span>${this.formatDate(activity.timestamp)}</span>
        </div>
      </div>
    `;

    // Prepend to feed (newest first)
    feed.insertBefore(activityElement, feed.firstChild);

    // Limit feed to last 50 activities for performance
    while (feed.children.length > 50) {
      feed.removeChild(feed.lastChild);
    }
  },

  // Fallback polling method for older browsers or when WebSocket fails
  setupActivityPolling() {
    // Clear any existing interval
    if (this.activityPollingInterval) {
      clearInterval(this.activityPollingInterval);
    }

    // Poll every 10 seconds
    this.activityPollingInterval = setInterval(() => {
      this.loadAdminActivities(); // This will try to reconnect WebSocket
    }, 10000);
  },

  // Cleanup methods
  cleanupActivityConnections() {
    this.disconnectActivityWebSocket();
    if (this.activityPollingInterval) {
      clearInterval(this.activityPollingInterval);
      this.activityPollingInterval = null;
    }
  },

  // VIEW NAVIGATION
  showView(viewName) {
    // Clean up activity connections when leaving admin dashboard
    if (viewName !== 'admin') {
      this.cleanupActivityConnections();
    }

    const views = ['viewJobs', 'viewAdminDashboard', 'viewEmployerDashboard', 'viewSeekerDashboard'];
    views.forEach(v => {
      const el = document.getElementById(v);
      if (el) el.style.display = 'none';
    });

    document.getElementById('navJobsBtn').classList.remove('active');
    document.getElementById('navDashboardBtn').classList.remove('active');

    if (viewName === 'jobs') {
      document.getElementById('viewJobs').style.display = 'block';
      document.getElementById('navJobsBtn').classList.add('active');
      this.loadPublicJobs();
    } else if (viewName === 'admin') {
      document.getElementById('viewAdminDashboard').style.display = 'block';
      document.getElementById('navDashboardBtn').classList.add('active');
      this.loadAdminData();
    } else if (viewName === 'employer') {
      document.getElementById('viewEmployerDashboard').style.display = 'block';
      document.getElementById('navDashboardBtn').classList.add('active');
      this.loadEmployerData();
    } else if (viewName === 'seeker') {
      document.getElementById('viewSeekerDashboard').style.display = 'block';
      document.getElementById('navDashboardBtn').classList.add('active');
      this.loadSeekerData();
    }
  },

  openDashboard() {
    if (!this.currentUser) {
      this.openAuthModal('login');
      return;
    }
    const role = this.currentUser.role ? this.currentUser.role.toUpperCase() : '';
    if (role === 'ADMIN') {
      this.showView('admin');
    } else if (role === 'EMPLOYER') {
      this.showView('employer');
    } else {
      this.showView('seeker');
    }
  },

  updateNavAuth() {
    const loggedOutNav = document.getElementById('loggedOutNav');
    const loggedInNav = document.getElementById('loggedInNav');
    const navDashboardBtn = document.getElementById('navDashboardBtn');
    const navDashboardText = document.getElementById('navDashboardText');

    if (this.currentUser) {
      loggedOutNav.style.display = 'none';
      loggedInNav.style.display = 'flex';
      navDashboardBtn.style.display = 'flex';

      const role = this.currentUser.role.toUpperCase();
      navDashboardText.innerText = role === 'ADMIN' ? 'Admin Panel' : (role === 'EMPLOYER' ? 'Employer Hub' : 'My Dashboard');

      document.getElementById('navUserName').innerText = this.currentUser.name;
      document.getElementById('navUserAvatar').innerText = this.currentUser.name ? this.currentUser.name.charAt(0).toUpperCase() : 'U';

      const roleTag = document.getElementById('navUserRole');
      roleTag.innerText = role.replace('_', ' ');
      roleTag.className = `role-tag ${role.toLowerCase()}`;
    } else {
      loggedOutNav.style.display = 'flex';
      loggedInNav.style.display = 'none';
      navDashboardBtn.style.display = 'none';
    }
  },

  // AUTHENTICATION
  openAuthModal(mode = 'login') {
    const modal = document.getElementById('authModal');
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const title = document.getElementById('authModalTitle');

    if (mode === 'login') {
      loginForm.style.display = 'block';
      registerForm.style.display = 'none';
      title.innerText = 'Sign In to JobSphere';
    } else {
      loginForm.style.display = 'none';
      registerForm.style.display = 'block';
      title.innerText = 'Create JobSphere Account';
    }
    modal.classList.add('show');
  },

  closeModals() {
    document.querySelectorAll('.modal-backdrop').forEach(m => m.classList.remove('show'));
  },

  async submitLogin(e) {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!res.ok) {
        this.showToast(data.error || 'Login failed', 'error');
        return;
      }

      this.token = data.token;
      this.currentUser = data.user;
      localStorage.setItem('token', this.token);
      localStorage.setItem('currentUser', JSON.stringify(this.currentUser));

      this.closeModals();
      this.updateNavAuth();
      this.showToast(`Welcome back, ${this.currentUser.name}!`, 'success');
      this.openDashboard();
    } catch (err) {
      this.showToast('Network error during login', 'error');
    }
  },

  async submitRegister(e) {
    e.preventDefault();
    const name = document.getElementById('regName').value;
    const email = document.getElementById('regEmail').value;
    const password = document.getElementById('regPassword').value;
    const role = document.getElementById('regRole').value;

    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, role })
      });
      const data = await res.json();
      if (!res.ok) {
        this.showToast(data.error || 'Registration failed', 'error');
        return;
      }

      this.showToast('Account created successfully! Please sign in.', 'success');
      this.openAuthModal('login');
      document.getElementById('loginEmail').value = email;
    } catch (err) {
      this.showToast('Error registering account', 'error');
    }
  },

  async demoLogin(email, password) {
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (res.ok) {
        this.token = data.token;
        this.currentUser = data.user;
        localStorage.setItem('token', this.token);
        localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
        this.updateNavAuth();
        this.showToast(`Logged in as ${this.currentUser.name} (${this.currentUser.role})`, 'success');
        this.openDashboard();
      } else {
        this.showToast(data.error || 'Demo login failed', 'error');
      }
    } catch (err) {
      this.showToast('Could not reach backend', 'error');
    }
  },

  logout() {
    this.token = null;
    this.currentUser = null;
    localStorage.removeItem('token');
    localStorage.removeItem('currentUser');
    this.updateNavAuth();
    this.showView('jobs');
    this.showToast('You have been logged out.');
  },

  // PUBLIC JOB BROWSING & SEARCH
  async loadPublicJobs(keyword = '', location = '', jobType = '') {
    const countLabel = document.getElementById('jobCountLabel');
    countLabel.innerText = 'Searching opportunities...';

    let url = `${API_BASE}/jobs/public`;
    if (keyword || location || jobType) {
      const params = new URLSearchParams();
      if (keyword) params.append('keyword', keyword);
      if (location) params.append('location', location);
      if (jobType) params.append('jobType', jobType);
      url = `${API_BASE}/jobs/search?${params.toString()}`;
    }

    try {
      const res = await fetch(url);
      const jobs = await res.json();
      this.renderJobsGrid(jobs, 'publicJobsGrid');
      countLabel.innerText = `${jobs.length} open position${jobs.length === 1 ? '' : 's'} available`;
    } catch (err) {
      countLabel.innerText = 'Unable to fetch jobs';
    }
  },

  searchJobs() {
    const keyword = document.getElementById('searchKeyword').value;
    const location = document.getElementById('searchLocation').value;
    const jobType = document.getElementById('searchJobType').value;
    this.loadPublicJobs(keyword, location, jobType);
  },

  renderJobsGrid(jobs, containerId) {
    const grid = document.getElementById(containerId);
    if (!grid) return;

    if (!jobs || jobs.length === 0) {
      grid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align:center; padding: 4rem 1rem; color:var(--text-muted);">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="margin-bottom:1rem; opacity:0.6;"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
          <h3>No matching job opportunities found</h3>
          <p style="margin-top:0.5rem; font-size:0.9rem;">Try adjusting your keywords, job filters, or check back later!</p>
        </div>
      `;
      return;
    }

    grid.innerHTML = jobs.map(job => {
      const company = job.companyName || (job.employer ? job.employer.name : 'Verified Employer');
      const salary = this.formatCurrency(job.salary);
      const isJobSeeker = this.currentUser && this.currentUser.role === 'JOB_SEEKER';

      return `
        <div class="job-card">
          <div class="job-card-top">
            <div class="job-company">${company}</div>
            <h3 class="job-title">${job.title}</h3>
            <div class="job-meta-chips">
              <span class="chip">${job.location || 'Remote'}</span>
              <span class="chip">${job.jobType || 'Full-time'}</span>
              <span class="chip salary">${salary} / yr</span>
            </div>
            <p class="job-desc">${job.description}</p>
            <div class="job-requirements">
              <strong>Key Requirements:</strong> ${job.requirements}
            </div>
          </div>
          <div class="job-card-footer">
            <span style="font-size:0.75rem; color:var(--text-muted);">Posted ${this.formatDate(job.createdAt)}</span>
            <button class="btn-primary" style="padding:0.5rem 1.1rem; font-size:0.88rem;" onclick="app.openApplyModal(${job.id}, '${escape(job.title)}', '${escape(company)}')">
              Apply Now
            </button>
          </div>
        </div>
      `;
    }).join('');
  },

  // JOB APPLICATION MODAL
  openApplyModal(jobId, jobTitle, companyName) {
    if (!this.currentUser) {
      this.openAuthModal('login');
      this.showToast('Please sign in as a Job Seeker to apply.', 'info');
      return;
    }
    if (this.currentUser.role !== 'JOB_SEEKER') {
      this.showToast('Only Job Seeker accounts can submit applications.', 'error');
      return;
    }

    document.getElementById('applyJobId').value = jobId;
    document.getElementById('applyModalJobTitle').innerText = unescape(jobTitle);
    document.getElementById('applyModalCompany').innerText = unescape(companyName);
    document.getElementById('applyCoverLetter').value = '';
    document.getElementById('applyResumeUrl').value = this.currentUser.resumeUrl || '';
    document.getElementById('applyResumeStatus').innerText = this.currentUser.resumeUrl ? '✓ Using profile resume' : '';

    document.getElementById('applyModal').classList.add('show');
  },

  async uploadApplicationResume(e) {
    const file = e.target.files[0];
    if (!file) return;

    const statusEl = document.getElementById('applyResumeStatus');
    statusEl.innerText = 'Uploading document...';

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await this.api('/files/upload', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (res.ok) {
        document.getElementById('applyResumeUrl').value = data.fileUrl;
        statusEl.innerText = `✓ Uploaded: ${file.name}`;
      } else {
        statusEl.innerText = 'Upload failed';
      }
    } catch (err) {
      statusEl.innerText = 'Upload failed';
    }
  },

  async submitJobApplication(e) {
    e.preventDefault();
    const jobId = document.getElementById('applyJobId').value;
    const coverLetter = document.getElementById('applyCoverLetter').value;
    const resumeUrl = document.getElementById('applyResumeUrl').value;

    try {
      const res = await this.api('/applications', {
        method: 'POST',
        body: JSON.stringify({
          jobListingId: jobId,
          coverLetter,
          resumeUrl
        })
      });
      const data = await res.json();
      if (!res.ok) {
        this.showToast(data.error || 'Application failed', 'error');
        return;
      }

      this.closeModals();
      this.showToast('Application successfully submitted! You can track its status in your dashboard.', 'success');
      if (this.currentUser && this.currentUser.role === 'JOB_SEEKER') {
        this.loadSeekerApplications();
      }
    } catch (err) {
      this.showToast('Could not submit application', 'error');
    }
  },

  // ----------------------------------------------------
  // ADMIN DASHBOARD
  // ----------------------------------------------------
  async loadAdminData() {
    await this.loadAdminStats();
    await this.loadAdminUsers();
    await this.loadAdminApprovals();
    await this.loadAdminSettings();
    await this.loadAdminActivities();
  },

  setAdminTab(tabName, btn) {
    const tabs = ['adminTabUsers', 'adminTabApprovals', 'adminTabSettings', 'adminTabStats', 'adminTabActivities'];
    tabs.forEach(t => document.getElementById(t).style.display = 'none');
    document.querySelectorAll('#viewAdminDashboard .tab-btn').forEach(b => b.classList.remove('active'));

    const tabMap = {
      users: 'adminTabUsers',
      approvals: 'adminTabApprovals',
      settings: 'adminTabSettings',
      stats: 'adminTabStats',
      activities: 'adminTabActivities'
    };

    document.getElementById(tabMap[tabName]).style.display = 'block';
    if (btn) btn.classList.add('active');

    if (tabName === 'approvals') this.loadAdminApprovals();
    if (tabName === 'activities') this.loadAdminActivities();
  },

  async loadAdminStats() {
    try {
      const res = await this.api('/admin/stats');
      const stats = await res.json();

      const grid = document.getElementById('adminStatsGrid');
      grid.innerHTML = `
        <div class="stat-card">
          <div class="stat-label">Total Users</div>
          <div class="stat-value">${stats.totalUsers || 0}</div>
          <div class="stat-subtext">${stats.totalJobSeekers || 0} Candidates • ${stats.totalEmployers || 0} Employers</div>
        </div>
        <div class="stat-card purple">
          <div class="stat-label">Active Job Postings</div>
          <div class="stat-value">${stats.activeJobs || 0}</div>
          <div class="stat-subtext">${stats.totalJobs || 0} total listings cataloged</div>
        </div>
        <div class="stat-card amber">
          <div class="stat-label">Pending Approvals</div>
          <div class="stat-value">${stats.pendingJobs || 0}</div>
          <div class="stat-subtext">Awaiting administrative review</div>
        </div>
        <div class="stat-card emerald">
          <div class="stat-label">Applications Filed</div>
          <div class="stat-value">${stats.totalApplications || 0}</div>
          <div class="stat-subtext">${stats.shortlistedApplications || 0} Shortlisted • ${stats.acceptedApplications || 0} Accepted</div>
        </div>
      `;

      document.getElementById('adminPendingBadge').innerText = stats.pendingJobs || 0;

      // Render Admin visual breakdown charts
      const chartsContainer = document.getElementById('adminStatsCharts');
      const totalApps = stats.totalApplications || 1;
      const totalJobs = stats.totalJobs || 1;

      chartsContainer.innerHTML = `
        <div>
          <h4 style="font-weight:700; margin-bottom:1rem;">Application Funnel Distribution</h4>
          <div class="chart-bar-container">
            <div class="chart-bar-header"><span>Pending Review</span><span>${stats.pendingApplications || 0} (${Math.round(((stats.pendingApplications || 0)/totalApps)*100)}%)</span></div>
            <div class="chart-bar-track"><div class="chart-bar-fill" style="width:${Math.min(100, Math.round(((stats.pendingApplications || 0)/totalApps)*100))}%; background:#fbbf24;"></div></div>
          </div>
          <div class="chart-bar-container">
            <div class="chart-bar-header"><span>Shortlisted</span><span>${stats.shortlistedApplications || 0} (${Math.round(((stats.shortlistedApplications || 0)/totalApps)*100)}%)</span></div>
            <div class="chart-bar-track"><div class="chart-bar-fill" style="width:${Math.min(100, Math.round(((stats.shortlistedApplications || 0)/totalApps)*100))}%; background:#60a5fa;"></div></div>
          </div>
          <div class="chart-bar-container">
            <div class="chart-bar-header"><span>Accepted / Hired</span><span>${stats.acceptedApplications || 0} (${Math.round(((stats.acceptedApplications || 0)/totalApps)*100)}%)</span></div>
            <div class="chart-bar-track"><div class="chart-bar-fill" style="width:${Math.min(100, Math.round(((stats.acceptedApplications || 0)/totalApps)*100))}%; background:#34d399;"></div></div>
          </div>
          <div class="chart-bar-container">
            <div class="chart-bar-header"><span>Rejected</span><span>${stats.rejectedApplications || 0} (${Math.round(((stats.rejectedApplications || 0)/totalApps)*100)}%)</span></div>
            <div class="chart-bar-track"><div class="chart-bar-fill" style="width:${Math.min(100, Math.round(((stats.rejectedApplications || 0)/totalApps)*100))}%; background:#fb7185;"></div></div>
          </div>
        </div>

        <div>
          <h4 style="font-weight:700; margin-bottom:1rem;">Job Approval Metrics</h4>
          <div class="chart-bar-container">
            <div class="chart-bar-header"><span>Approved & Published</span><span>${stats.approvedJobs || 0}</span></div>
            <div class="chart-bar-track"><div class="chart-bar-fill" style="width:${Math.min(100, Math.round(((stats.approvedJobs || 0)/totalJobs)*100))}%; background:#34d399;"></div></div>
          </div>
          <div class="chart-bar-container">
            <div class="chart-bar-header"><span>Pending Moderation</span><span>${stats.pendingJobs || 0}</span></div>
            <div class="chart-bar-track"><div class="chart-bar-fill" style="width:${Math.min(100, Math.round(((stats.pendingJobs || 0)/totalJobs)*100))}%; background:#fbbf24;"></div></div>
          </div>
          <div class="chart-bar-container">
            <div class="chart-bar-header"><span>Rejected Postings</span><span>${stats.rejectedJobs || 0}</span></div>
            <div class="chart-bar-track"><div class="chart-bar-fill" style="width:${Math.min(100, Math.round(((stats.rejectedJobs || 0)/totalJobs)*100))}%; background:#fb7185;"></div></div>
          </div>
        </div>
      `;
    } catch (err) {
      console.error(err);
    }
  },

  async loadAdminUsers() {
    try {
      const res = await this.api('/admin/users');
      const users = await res.json();
      const tbody = document.getElementById('adminUsersTableBody');

      tbody.innerHTML = users.map(u => `
        <tr>
          <td><code style="color:var(--text-muted);">#${u.id}</code></td>
          <td style="font-weight:600;">${u.name}</td>
          <td>${u.email}</td>
          <td><span class="role-tag ${u.role ? u.role.toLowerCase() : ''}">${u.role}</span></td>
          <td style="color:var(--text-secondary); max-width:200px; text-overflow:ellipsis; overflow:hidden; white-space:nowrap;">
            ${u.headline || '—'}
          </td>
          <td style="color:var(--text-muted); font-size:0.85rem;">${this.formatDate(u.createdAt)}</td>
          <td>
            <button class="btn-danger" onclick="app.deleteUser(${u.id})">Delete</button>
          </td>
        </tr>
      `).join('');
    } catch (err) {
      console.error(err);
    }
  },

  async deleteUser(id) {
    if (!confirm('Are you sure you want to permanently delete this user account?')) return;
    try {
      const res = await this.api(`/admin/users/${id}`, { method: 'DELETE' });
      if (res.ok) {
        this.showToast('User deleted successfully', 'success');
        this.loadAdminUsers();
        this.loadAdminStats();
      }
    } catch (err) {
      this.showToast('Failed to delete user', 'error');
    }
  },

  openAddUserModal() {
    this.openAuthModal('register');
  },

  async loadAdminApprovals() {
    try {
      const res = await this.api('/admin/jobs/pending');
      const pendingJobs = await res.json();
      const tbody = document.getElementById('adminApprovalsTableBody');

      if (pendingJobs.length === 0) {
        tbody.innerHTML = `
          <tr>
            <td colspan="6" style="text-align:center; padding:2rem; color:var(--text-muted);">
              ✓ All job listings are approved! No items in moderation queue.
            </td>
          </tr>
        `;
        return;
      }

      tbody.innerHTML = pendingJobs.map(j => `
        <tr>
          <td style="font-weight:600;">${j.title}</td>
          <td>${j.companyName || (j.employer ? j.employer.name : 'Employer')}</td>
          <td>${j.location || 'Remote'} • ${j.jobType || 'Full-time'}</td>
          <td style="color:#34d399; font-weight:600;">${this.formatCurrency(j.salary)}</td>
          <td><span class="status-badge pending">PENDING</span></td>
          <td>
            <div style="display:flex; gap:0.5rem;">
              <button class="btn-success" onclick="app.updateJobApproval(${j.id}, 'APPROVED')">Approve</button>
              <button class="btn-danger" onclick="app.updateJobApproval(${j.id}, 'REJECTED')">Reject</button>
            </div>
          </td>
        </tr>
      `).join('');
    } catch (err) {
      console.error(err);
    }
  },

  async updateJobApproval(id, status) {
    try {
      const res = await this.api(`/admin/jobs/${id}/approval`, {
        method: 'PUT',
        body: JSON.stringify({ approvalStatus: status })
      });
      if (res.ok) {
        this.showToast(`Job listing marked as ${status}`, 'success');
        this.loadAdminApprovals();
        this.loadAdminStats();
      }
    } catch (err) {
      this.showToast('Failed to update job approval status', 'error');
    }
  },

  async loadAdminSettings() {
    try {
      const res = await this.api('/settings');
      const settings = await res.json();
      const container = document.getElementById('adminSettingsContainer');

      container.innerHTML = settings.map(s => `
        <div style="background:rgba(255,255,255,0.02); padding:1.25rem; border-radius:var(--radius-md); border:1px solid var(--border-glass);">
          <label style="font-weight:700; font-size:0.88rem; display:block; margin-bottom:0.25rem;">${s.settingKey}</label>
          <p style="font-size:0.78rem; color:var(--text-muted); margin-bottom:0.6rem;">${s.description || ''}</p>
          <input type="text" class="form-control admin-setting-input" data-key="${s.settingKey}" value="${s.settingValue}">
        </div>
      `).join('');
    } catch (err) {
      console.error(err);
    }
  },

  async saveSystemSettings() {
    const inputs = document.querySelectorAll('.admin-setting-input');
    const settings = {};
    inputs.forEach(inp => {
      settings[inp.dataset.key] = inp.value;
    });

    try {
      const res = await this.api('/settings/bulk', {
        method: 'POST',
        body: JSON.stringify(settings)
      });
      if (res.ok) {
        this.showToast('System configuration settings saved successfully!', 'success');
        this.loadAdminActivities();
      }
    } catch (err) {
      this.showToast('Failed to save settings', 'error');
    }
  },

  async loadAdminActivities() {
    try {
      // Connect to WebSocket for real-time updates
      this.connectActivityWebSocket();

      // Still fetch initial activities for baseline
      const res = await this.api('/admin/activities');
      const activities = await res.json();
      const feed = document.getElementById('adminActivityFeed');

      if (!activities || activities.length === 0) {
        feed.innerHTML = `<div style="text-align:center; padding:2rem; color:var(--text-muted);">No activity logged yet.</div>`;
        return;
      }

      feed.innerHTML = activities.slice(0, 30).map(a => `
        <div class="activity-item">
          <div class="activity-icon-box">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
          </div>
          <div class="activity-content">
            <div class="activity-title">${a.details}</div>
            <div class="activity-meta">
              <span><strong>${a.userEmail || 'System'}</strong></span>
              ${a.userRole ? `• <span class="role-tag ${a.userRole.toLowerCase()}">${a.userRole}</span>` : ''}
              • <span>${this.formatDate(a.timestamp)}</span>
            </div>
          </div>
        </div>
      `).join('');
    } catch (err) {
      console.error(err);
      // Fallback to polling if WebSocket fails
      this.setupActivityPolling();
    }
  },

  // ----------------------------------------------------
  // EMPLOYER DASHBOARD
  // ----------------------------------------------------
  async loadEmployerData() {
    await this.loadEmployerStats();
    await this.loadEmployerJobs();
    await this.loadEmployerApplications();
    await this.loadEmployerContacts();
  },

  setEmployerTab(tabName, btn) {
    const tabs = ['employerTabJobs', 'employerTabApplications', 'employerTabMessages', 'employerTabAnalytics'];
    tabs.forEach(t => document.getElementById(t).style.display = 'none');
    document.querySelectorAll('#viewEmployerDashboard .tab-btn').forEach(b => b.classList.remove('active'));

    const tabMap = {
      jobs: 'employerTabJobs',
      applications: 'employerTabApplications',
      messages: 'employerTabMessages',
      analytics: 'employerTabAnalytics'
    };

    document.getElementById(tabMap[tabName]).style.display = 'block';
    if (btn) btn.classList.add('active');

    if (tabName === 'messages') this.loadEmployerContacts();
  },

  async loadEmployerStats() {
    try {
      const res = await this.api('/jobs/employer/stats');
      const stats = await res.json();
      const grid = document.getElementById('employerStatsGrid');

      grid.innerHTML = `
        <div class="stat-card">
          <div class="stat-label">Active Listings</div>
          <div class="stat-value">${stats.activeJobs || 0}</div>
          <div class="stat-subtext">${stats.totalJobs || 0} total listings created</div>
        </div>
        <div class="stat-card purple">
          <div class="stat-label">Total Applications</div>
          <div class="stat-value">${stats.totalApplications || 0}</div>
          <div class="stat-subtext">${stats.pendingReview || 0} awaiting your review</div>
        </div>
        <div class="stat-card emerald">
          <div class="stat-label">Shortlisted Candidates</div>
          <div class="stat-value">${stats.shortlisted || 0}</div>
          <div class="stat-subtext">${stats.accepted || 0} candidate(s) hired</div>
        </div>
        <div class="stat-card amber">
          <div class="stat-label">Pending Approval</div>
          <div class="stat-value">${stats.pendingApprovalJobs || 0}</div>
          <div class="stat-subtext">Waiting for platform admin approval</div>
        </div>
      `;

      document.getElementById('employerAppBadge').innerText = stats.pendingReview || 0;

      // Employer Analytics Charts
      const charts = document.getElementById('employerAnalyticsCharts');
      const totalApps = stats.totalApplications || 1;

      charts.innerHTML = `
        <div>
          <h4 style="font-weight:700; margin-bottom:1rem;">Applicant Status Funnel</h4>
          <div class="chart-bar-container">
            <div class="chart-bar-header"><span>Under Review</span><span>${stats.pendingReview || 0}</span></div>
            <div class="chart-bar-track"><div class="chart-bar-fill" style="width:${Math.round(((stats.pendingReview||0)/totalApps)*100)}%; background:#fbbf24;"></div></div>
          </div>
          <div class="chart-bar-container">
            <div class="chart-bar-header"><span>Shortlisted</span><span>${stats.shortlisted || 0}</span></div>
            <div class="chart-bar-track"><div class="chart-bar-fill" style="width:${Math.round(((stats.shortlisted||0)/totalApps)*100)}%; background:#60a5fa;"></div></div>
          </div>
          <div class="chart-bar-container">
            <div class="chart-bar-header"><span>Accepted / Hired</span><span>${stats.accepted || 0}</span></div>
            <div class="chart-bar-track"><div class="chart-bar-fill" style="width:${Math.round(((stats.accepted||0)/totalApps)*100)}%; background:#34d399;"></div></div>
          </div>
          <div class="chart-bar-container">
            <div class="chart-bar-header"><span>Declined</span><span>${stats.rejected || 0}</span></div>
            <div class="chart-bar-track"><div class="chart-bar-fill" style="width:${Math.round(((stats.rejected||0)/totalApps)*100)}%; background:#fb7185;"></div></div>
          </div>
        </div>

        <div>
          <h4 style="font-weight:700; margin-bottom:1rem;">Applications by Position</h4>
          ${Object.entries(stats.applicantsPerJob || {}).map(([title, count]) => `
            <div class="chart-bar-container">
              <div class="chart-bar-header"><span>${title}</span><span>${count} candidate(s)</span></div>
              <div class="chart-bar-track"><div class="chart-bar-fill" style="width:${Math.min(100, count * 20)}%;"></div></div>
            </div>
          `).join('') || '<p style="color:var(--text-muted);">No applications received yet.</p>'}
        </div>
      `;
    } catch (err) {
      console.error(err);
    }
  },

  async loadEmployerJobs() {
    try {
      const res = await this.api('/jobs/my');
      const jobs = await res.json();
      const tbody = document.getElementById('employerJobsTableBody');

      tbody.innerHTML = jobs.map(j => `
        <tr>
          <td style="font-weight:600;">${j.title}</td>
          <td>${j.location || 'Remote'} • ${j.jobType || 'Full-time'}</td>
          <td style="color:#34d399; font-weight:600;">${this.formatCurrency(j.salary)}</td>
          <td><span class="status-badge ${j.status.toLowerCase()}">${j.status}</span></td>
          <td><span class="status-badge ${j.approvalStatus.toLowerCase()}">${j.approvalStatus}</span></td>
          <td style="color:var(--text-muted); font-size:0.85rem;">${this.formatDate(j.createdAt)}</td>
          <td>
            <div style="display:flex; gap:0.4rem;">
              <button class="btn-secondary" style="padding:0.35rem 0.65rem;" onclick="app.editJob(${j.id})">Edit</button>
              <button class="btn-danger" onclick="app.deleteJob(${j.id})">Delete</button>
            </div>
          </td>
        </tr>
      `).join('');
    } catch (err) {
      console.error(err);
    }
  },

  openJobModal(jobId = null) {
    document.getElementById('jobEditId').value = jobId || '';
    document.getElementById('jobModalTitle').innerText = jobId ? 'Edit Job Posting' : 'Post New Job Listing';

    if (jobId) {
      document.getElementById('jobStatusGroup').style.display = 'block';
    } else {
      document.getElementById('jobTitleInput').value = '';
      document.getElementById('jobCompanyInput').value = this.currentUser ? this.currentUser.name : '';
      document.getElementById('jobLocationInput').value = 'San Francisco, CA / Remote';
      document.getElementById('jobTypeInput').value = 'Full-time';
      document.getElementById('jobSalaryInput').value = '120000';
      document.getElementById('jobRequirementsInput').value = '';
      document.getElementById('jobDescriptionInput').value = '';
      document.getElementById('jobStatusGroup').style.display = 'none';
    }
    document.getElementById('jobModal').classList.add('show');
  },

  async editJob(id) {
    try {
      const res = await this.api(`/jobs/${id}`);
      const job = await res.json();

      document.getElementById('jobEditId').value = job.id;
      document.getElementById('jobTitleInput').value = job.title;
      document.getElementById('jobCompanyInput').value = job.companyName || '';
      document.getElementById('jobLocationInput').value = job.location || '';
      document.getElementById('jobTypeInput').value = job.jobType || 'Full-time';
      document.getElementById('jobSalaryInput').value = job.salary;
      document.getElementById('jobRequirementsInput').value = job.requirements;
      document.getElementById('jobDescriptionInput').value = job.description;
      document.getElementById('jobStatusSelect').value = job.status;

      this.openJobModal(job.id);
    } catch (err) {
      this.showToast('Could not load job details', 'error');
    }
  },

  async submitJobPosting(e) {
    e.preventDefault();
    const id = document.getElementById('jobEditId').value;
    const title = document.getElementById('jobTitleInput').value;
    const companyName = document.getElementById('jobCompanyInput').value;
    const location = document.getElementById('jobLocationInput').value;
    const jobType = document.getElementById('jobTypeInput').value;
    const salary = parseFloat(document.getElementById('jobSalaryInput').value);
    const requirements = document.getElementById('jobRequirementsInput').value;
    const description = document.getElementById('jobDescriptionInput').value;

    const payload = { title, companyName, location, jobType, salary, requirements, description };
    if (id) {
      payload.status = document.getElementById('jobStatusSelect').value;
    }

    try {
      const res = await this.api(id ? `/jobs/${id}` : '/jobs', {
        method: id ? 'PUT' : 'POST',
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        this.closeModals();
        this.showToast(`Job ${id ? 'updated' : 'posted'} successfully!`, 'success');
        this.loadEmployerJobs();
        this.loadEmployerStats();
      } else {
        this.showToast('Failed to save job posting', 'error');
      }
    } catch (err) {
      this.showToast('Error saving job posting', 'error');
    }
  },

  async deleteJob(id) {
    if (!confirm('Are you sure you want to delete this job listing?')) return;
    try {
      const res = await this.api(`/jobs/${id}`, { method: 'DELETE' });
      if (res.ok) {
        this.showToast('Job listing deleted', 'success');
        this.loadEmployerJobs();
        this.loadEmployerStats();
      }
    } catch (err) {
      this.showToast('Could not delete job', 'error');
    }
  },

  async loadEmployerApplications() {
    try {
      const res = await this.api('/applications/employer');
      const apps = await res.json();
      const tbody = document.getElementById('employerApplicationsTableBody');

      if (apps.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:2rem; color:var(--text-muted);">No candidate applications received yet.</td></tr>`;
        return;
      }

      tbody.innerHTML = apps.map(a => `
        <tr>
          <td>
            <div style="font-weight:600;">${a.jobSeeker.name}</div>
            <div style="font-size:0.78rem; color:var(--text-muted);">${a.jobSeeker.email}</div>
          </td>
          <td><strong>${a.jobListing.title}</strong></td>
          <td style="max-width:200px;">
            <div style="font-size:0.8rem; color:var(--text-secondary);">${a.jobSeeker.headline || '—'}</div>
            <div style="font-size:0.75rem; color:#60a5fa; margin-top:2px;">${a.jobSeeker.skills || ''}</div>
          </td>
          <td style="max-width:240px;">
            <div style="font-size:0.82rem; font-style:italic; margin-bottom:4px;">"${a.coverLetter || ''}"</div>
            ${a.resumeUrl ? `<a href="${a.resumeUrl}" target="_blank" style="font-size:0.8rem; color:#38bdf8; text-decoration:underline;">📄 View Resume</a>` : '<span style="color:var(--text-muted); font-size:0.75rem;">No resume attached</span>'}
          </td>
          <td><span class="status-badge ${a.status.toLowerCase()}">${a.status}</span></td>
          <td>
            <select class="form-control" style="padding:0.35rem 0.5rem; font-size:0.82rem;" onchange="app.updateApplicationStatus(${a.id}, this.value)">
              <option value="PENDING" ${a.status === 'PENDING' ? 'selected' : ''}>Pending</option>
              <option value="REVIEWED" ${a.status === 'REVIEWED' ? 'selected' : ''}>Reviewed</option>
              <option value="SHORTLISTED" ${a.status === 'SHORTLISTED' ? 'selected' : ''}>Shortlisted</option>
              <option value="ACCEPTED" ${a.status === 'ACCEPTED' ? 'selected' : ''}>Accepted</option>
              <option value="REJECTED" ${a.status === 'REJECTED' ? 'selected' : ''}>Rejected</option>
            </select>
          </td>
          <td>
            <button class="btn-secondary" style="padding:0.35rem 0.65rem;" onclick="app.startChatWithUser(${a.jobSeeker.id}, '${escape(a.jobSeeker.name)}', 'JOB_SEEKER')">
              Message
            </button>
          </td>
        </tr>
      `).join('');
    } catch (err) {
      console.error(err);
    }
  },

  async updateApplicationStatus(id, status) {
    try {
      const res = await this.api(`/applications/${id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        this.showToast(`Candidate status updated to ${status}`, 'success');
        this.loadEmployerStats();
        this.loadEmployerApplications();
      }
    } catch (err) {
      this.showToast('Could not update status', 'error');
    }
  },

  async loadEmployerContacts() {
    try {
      const res = await this.api('/messages/contacts');
      const contacts = await res.json();
      const list = document.getElementById('employerContactsList');

      if (!contacts || contacts.length === 0) {
        list.innerHTML = `<div style="padding:1rem; font-size:0.82rem; color:var(--text-muted);">No active chats yet. Click 'Message' on any applicant to begin chatting!</div>`;
        return;
      }

      list.innerHTML = contacts.map(c => `
        <div class="contact-item ${this.currentChatUserId === c.id ? 'active' : ''}" onclick="app.startChatWithUser(${c.id}, '${escape(c.name)}', '${c.role}')">
          <div class="user-avatar" style="width:30px; height:30px; font-size:0.75rem;">${c.name.charAt(0).toUpperCase()}</div>
          <div class="contact-info">
            <div class="name">${c.name}</div>
            <div class="role">${c.role.replace('_', ' ')}</div>
          </div>
        </div>
      `).join('');
    } catch (err) {
      console.error(err);
    }
  },

  startChatWithUser(userId, userName, role) {
    this.currentChatUserId = userId;
    this.currentChatUserRole = role;

    const activeUserEl = document.getElementById(this.currentUser.role === 'EMPLOYER' ? 'chatActiveUser' : 'seekerChatActiveUser');
    activeUserEl.innerHTML = `<strong>Chatting with:</strong> ${unescape(userName)} <span class="role-tag ${role.toLowerCase()}">${role}</span>`;

    if (this.currentUser.role === 'EMPLOYER') {
      this.setEmployerTab('messages');
      this.loadConversation('chatMessagesStream');
    } else {
      this.setSeekerTab('messages');
      this.loadConversation('seekerChatMessagesStream');
    }
  },

  async loadConversation(streamId) {
    if (!this.currentChatUserId) return;
    try {
      const res = await this.api(`/messages/conversation/${this.currentChatUserId}`);
      const messages = await res.json();
      const stream = document.getElementById(streamId);

      if (messages.length === 0) {
        stream.innerHTML = `<div style="text-align:center; padding:2rem; color:var(--text-muted); font-size:0.85rem;">Say hello to initiate communication!</div>`;
        return;
      }

      stream.innerHTML = messages.map(m => {
        const isOutgoing = m.sender.id === this.currentUser.id;
        return `
          <div class="message-bubble ${isOutgoing ? 'outgoing' : 'incoming'}">
            <div>${m.content}</div>
            <div class="message-time">${this.formatDate(m.sentAt)}</div>
          </div>
        `;
      }).join('');
      stream.scrollTop = stream.scrollHeight;
    } catch (err) {
      console.error(err);
    }
  },

  async sendChatMessage() {
    const input = document.getElementById('chatMessageInput');
    const content = input.value.trim();
    if (!content || !this.currentChatUserId) return;

    try {
      const res = await this.api('/messages', {
        method: 'POST',
        body: JSON.stringify({
          receiverId: this.currentChatUserId,
          content
        })
      });
      if (res.ok) {
        input.value = '';
        this.loadConversation('chatMessagesStream');
      }
    } catch (err) {
      this.showToast('Could not send message', 'error');
    }
  },

  async sendSeekerChatMessage() {
    const input = document.getElementById('seekerChatMessageInput');
    const content = input.value.trim();
    if (!content || !this.currentChatUserId) return;

    try {
      const res = await this.api('/messages', {
        method: 'POST',
        body: JSON.stringify({
          receiverId: this.currentChatUserId,
          content
        })
      });
      if (res.ok) {
        input.value = '';
        this.loadConversation('seekerChatMessagesStream');
      }
    } catch (err) {
      this.showToast('Could not send message', 'error');
    }
  },

  // ----------------------------------------------------
  // JOB SEEKER DASHBOARD
  // ----------------------------------------------------
  async loadSeekerData() {
    await this.loadSeekerStats();
    await this.loadSeekerApplications();
    await this.loadSeekerRecommendations();
    await this.loadSeekerProfile();
    await this.loadSeekerContacts();
  },

  setSeekerTab(tabName, btn) {
    const tabs = ['seekerTabApplications', 'seekerTabRecommendations', 'seekerTabProfile', 'seekerTabMessages'];
    tabs.forEach(t => document.getElementById(t).style.display = 'none');
    document.querySelectorAll('#viewSeekerDashboard .tab-btn').forEach(b => b.classList.remove('active'));

    const tabMap = {
      applications: 'seekerTabApplications',
      recommendations: 'seekerTabRecommendations',
      profile: 'seekerTabProfile',
      messages: 'seekerTabMessages'
    };

    document.getElementById(tabMap[tabName]).style.display = 'block';
    if (btn) btn.classList.add('active');

    if (tabName === 'recommendations') this.loadSeekerRecommendations();
    if (tabName === 'messages') this.loadSeekerContacts();
  },

  async loadSeekerStats() {
    try {
      const res = await this.api('/jobs/seeker/stats');
      const stats = await res.json();
      const grid = document.getElementById('seekerStatsGrid');

      grid.innerHTML = `
        <div class="stat-card">
          <div class="stat-label">Applications Submitted</div>
          <div class="stat-value">${stats.totalApplied || 0}</div>
          <div class="stat-subtext">Positions you are actively pursuing</div>
        </div>
        <div class="stat-card amber">
          <div class="stat-label">Under Review</div>
          <div class="stat-value">${stats.pending || 0}</div>
          <div class="stat-subtext">Currently being screened by hiring teams</div>
        </div>
        <div class="stat-card emerald">
          <div class="stat-label">Shortlisted & Offers</div>
          <div class="stat-value">${(stats.shortlisted || 0) + (stats.accepted || 0)}</div>
          <div class="stat-subtext">${stats.shortlisted || 0} Shortlisted • ${stats.accepted || 0} Accepted</div>
        </div>
        <div class="stat-card purple">
          <div class="stat-label">Available Opportunities</div>
          <div class="stat-value">${stats.availableJobs || 0}</div>
          <div class="stat-subtext">Approved positions ready for application</div>
        </div>
      `;
    } catch (err) {
      console.error(err);
    }
  },

  async loadSeekerApplications() {
    try {
      const res = await this.api('/applications/seeker');
      const apps = await res.json();
      const tbody = document.getElementById('seekerApplicationsTableBody');

      if (!apps || apps.length === 0) {
        tbody.innerHTML = `
          <tr>
            <td colspan="6" style="text-align:center; padding:2.5rem; color:var(--text-muted);">
              You haven't applied to any roles yet! Explore our job listings and apply.
            </td>
          </tr>
        `;
        return;
      }

      tbody.innerHTML = apps.map(a => `
        <tr>
          <td style="font-weight:600;">${a.jobListing.title}</td>
          <td style="color:#60a5fa;">${a.jobListing.companyName || (a.jobListing.employer ? a.jobListing.employer.name : 'Employer')}</td>
          <td style="color:var(--text-muted); font-size:0.85rem;">${this.formatDate(a.appliedAt)}</td>
          <td><span class="status-badge ${a.status.toLowerCase()}">${a.status}</span></td>
          <td>
            ${a.resumeUrl ? `<a href="${a.resumeUrl}" target="_blank" style="color:#38bdf8; text-decoration:underline; font-size:0.85rem;">📄 Attached Resume</a>` : '<span style="color:var(--text-muted);">Profile CV</span>'}
          </td>
          <td>
            <button class="btn-secondary" style="padding:0.35rem 0.75rem;" onclick="app.startChatWithUser(${a.jobListing.employer.id}, '${escape(a.jobListing.companyName || a.jobListing.employer.name)}', 'EMPLOYER')">
              Contact Employer
            </button>
          </td>
        </tr>
      `).join('');
    } catch (err) {
      console.error(err);
    }
  },

  async loadSeekerRecommendations() {
    try {
      const res = await this.api('/jobs/recommendations');
      const recommendations = await res.json();
      const grid = document.getElementById('seekerRecommendationsGrid');

      if (!recommendations || recommendations.length === 0) {
        grid.innerHTML = `<div style="grid-column:1/-1; text-align:center; padding:2rem; color:var(--text-muted);">Update your skills in the Profile tab to get personalized suggestions!</div>`;
        return;
      }

      grid.innerHTML = recommendations.map(job => {
        const company = job.companyName || (job.employer ? job.employer.name : 'Verified Employer');
        return `
          <div class="job-card">
            <div class="job-card-top">
              <div style="display:flex; justify-content:space-between; align-items:center;">
                <div class="job-company">${company}</div>
                <span class="chip match-score">✨ High Match</span>
              </div>
              <h3 class="job-title">${job.title}</h3>
              <div class="job-meta-chips">
                <span class="chip">${job.location || 'Remote'}</span>
                <span class="chip">${job.jobType || 'Full-time'}</span>
                <span class="chip salary">${this.formatCurrency(job.salary)}</span>
              </div>
              <p class="job-desc">${job.description}</p>
              <div class="job-requirements">
                <strong>Skills Match:</strong> ${job.requirements}
              </div>
            </div>
            <div class="job-card-footer">
              <span style="font-size:0.75rem; color:var(--text-muted);">Posted ${this.formatDate(job.createdAt)}</span>
              <button class="btn-primary" style="padding:0.5rem 1.1rem; font-size:0.88rem;" onclick="app.openApplyModal(${job.id}, '${escape(job.title)}', '${escape(company)}')">
                Apply Now
              </button>
            </div>
          </div>
        `;
      }).join('');
    } catch (err) {
      console.error(err);
    }
  },

  async loadSeekerProfile() {
    try {
      const res = await this.api('/users/me');
      const user = await res.json();

      document.getElementById('profileName').value = user.name || '';
      document.getElementById('profileHeadline').value = user.headline || '';
      document.getElementById('profileSkills').value = user.skills || '';
      document.getElementById('profilePhone').value = user.phone || '';
      document.getElementById('profileResumeUrl').value = user.resumeUrl || '';

      const resumeDisplay = document.getElementById('currentResumeDisplay');
      const resumeLink = document.getElementById('currentResumeLink');
      if (user.resumeUrl) {
        resumeDisplay.style.display = 'block';
        resumeLink.href = user.resumeUrl;
      } else {
        resumeDisplay.style.display = 'none';
      }
    } catch (err) {
      console.error(err);
    }
  },

  async uploadResumeFile(e) {
    const file = e.target.files[0];
    if (!file) return;

    const indicator = document.getElementById('resumeStatusIndicator');
    indicator.innerText = 'Uploading...';

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await this.api('/files/upload', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (res.ok) {
        document.getElementById('profileResumeUrl').value = data.fileUrl;
        indicator.innerText = `✓ Uploaded ${file.name}`;

        const resumeDisplay = document.getElementById('currentResumeDisplay');
        const resumeLink = document.getElementById('currentResumeLink');
        resumeDisplay.style.display = 'block';
        resumeLink.href = data.fileUrl;

        this.showToast('Resume uploaded! Click "Save Profile Changes" to persist.', 'success');
      } else {
        indicator.innerText = 'Upload failed';
      }
    } catch (err) {
      indicator.innerText = 'Upload error';
    }
  },

  async saveProfile(e) {
    e.preventDefault();
    const name = document.getElementById('profileName').value;
    const headline = document.getElementById('profileHeadline').value;
    const skills = document.getElementById('profileSkills').value;
    const phone = document.getElementById('profilePhone').value;
    const resumeUrl = document.getElementById('profileResumeUrl').value;

    try {
      const res = await this.api('/users/profile', {
        method: 'PUT',
        body: JSON.stringify({ name, headline, skills, phone, resumeUrl })
      });
      const updated = await res.json();
      if (res.ok) {
        this.currentUser = updated;
        localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
        this.updateNavAuth();
        this.showToast('Profile and resume saved successfully!', 'success');
        this.loadSeekerRecommendations();
      } else {
        this.showToast('Failed to save profile', 'error');
      }
    } catch (err) {
      this.showToast('Error saving profile', 'error');
    }
  },

  async loadSeekerContacts() {
    try {
      const res = await this.api('/messages/contacts');
      const contacts = await res.json();
      const list = document.getElementById('seekerContactsList');

      if (!contacts || contacts.length === 0) {
        list.innerHTML = `<div style="padding:1rem; font-size:0.82rem; color:var(--text-muted);">No messages from employers yet.</div>`;
        return;
      }

      list.innerHTML = contacts.map(c => `
        <div class="contact-item ${this.currentChatUserId === c.id ? 'active' : ''}" onclick="app.startChatWithUser(${c.id}, '${escape(c.name)}', '${c.role}')">
          <div class="user-avatar" style="width:30px; height:30px; font-size:0.75rem;">${c.name.charAt(0).toUpperCase()}</div>
          <div class="contact-info">
            <div class="name">${c.name}</div>
            <div class="role">${c.role.replace('_', ' ')}</div>
          </div>
        </div>
      `).join('');
    } catch (err) {
      console.error(err);
    }
  }
};

window.addEventListener('DOMContentLoaded', () => app.init());
