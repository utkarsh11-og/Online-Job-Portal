/**
 * JobSphere - Enterprise Job Portal Web App
 */

const BACKEND_PORT = '8081';
const IS_CROSS_ORIGIN = window.location.protocol === 'file:' || (window.location.port && window.location.port !== BACKEND_PORT);
const API_BASE = IS_CROSS_ORIGIN ? `http://localhost:${BACKEND_PORT}/api` : '/api';

const app = {
  token: localStorage.getItem('token') || null,
  currentUser: JSON.parse(localStorage.getItem('currentUser') || 'null'),
  currentChatUserId: null,
  currentChatUserRole: null,
  activityWebSocket: null, // Add this
  activityStompClient: null, // If using STOMP
  activityCallbacks: [], // Callbacks for activity updates

  init() {
    this.initTheme();
    this.initLanguage();
    this.updateNavAuth();
    this.loadPublicJobs();

    // Auto-load dashboard if user was already logged in
    if (this.currentUser) {
      this.openDashboard();
    }

    // Close mobile nav when clicking outside
    document.addEventListener('click', (e) => {
      const navbar = document.getElementById('topNavbar');
      if (navbar && navbar.classList.contains('menu-open')) {
        if (!navbar.contains(e.target)) {
          this.closeMobileMenu();
        }
      }
    });

    // Close modals on backdrop click
    document.addEventListener('click', (e) => {
      if (e.target && e.target.classList.contains('modal-backdrop')) {
        this.closeModals();
      }
    });

    // Close modals & language menu on Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.closeModals();
        const langMenu = document.getElementById('footerLangMenu');
        if (langMenu) langMenu.classList.remove('show');
      }
    });

    // Close dropdowns when clicking outside
    document.addEventListener('click', (e) => {
      const langDropdown = document.querySelector('.footer-language-dropdown');
      const langMenu = document.getElementById('footerLangMenu');
      if (langDropdown && langMenu && langMenu.classList.contains('show')) {
        if (!langDropdown.contains(e.target)) {
          langMenu.classList.remove('show');
        }
      }
      const employerDropdown = document.getElementById('employerDropdown');
      if (employerDropdown && employerDropdown.classList.contains('show')) {
        const empContainer = employerDropdown.closest('.dropdown-container');
        if (empContainer && !empContainer.contains(e.target)) {
          employerDropdown.classList.remove('show');
        }
      }
    });
  },

  handleNewsletterSubscribe() {
    const input = document.getElementById('footerSubscribeEmail');
    if (input && input.value) {
      const email = input.value;
      this.showToast(`Thank you! Weekly job alerts confirmed for ${email}`, 'success');
      input.value = '';
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
    if (!val && val !== 0) return 'Rs 0';
    const num = Number(val);
    if (isNaN(num)) return `Rs ${val}`;
    return 'Rs ' + new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(num);
  },

  formatDate(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' });
  },

  currentTheme: localStorage.getItem('jobsphere_theme') || 'linen',

  initTheme() {
    this.applyTheme(this.currentTheme);
  },

  applyTheme(theme) {
    this.currentTheme = theme;
    localStorage.setItem('jobsphere_theme', theme);
    const label = document.getElementById('themeToggleText');
    const toggleBtn = document.getElementById('themeToggleBtn');
    if (theme === 'black-hole') {
      document.documentElement.setAttribute('data-theme', 'black-hole');
      if (label) label.textContent = 'Dark';
      if (toggleBtn) {
        toggleBtn.setAttribute('aria-checked', 'true');
        toggleBtn.title = 'Switch to Light mode (Sustainable Linen)';
      }
    } else {
      document.documentElement.removeAttribute('data-theme');
      if (label) label.textContent = 'Light';
      if (toggleBtn) {
        toggleBtn.setAttribute('aria-checked', 'false');
        toggleBtn.title = 'Switch to Dark mode (Black Hole)';
      }
    }
  },

  toggleTheme() {
    const nextTheme = this.currentTheme === 'black-hole' ? 'linen' : 'black-hole';
    this.applyTheme(nextTheme);
    this.initChartDefaults();
    // Re-render open dashboard charts if active
    if (this.currentView === 'admin' && this.currentAdminTab === 'stats') {
      this.loadAdminStats();
    } else if (this.currentView === 'employer' && this.currentEmployerTab === 'stats') {
      this.loadEmployerStats();
    }
  },

  initChartDefaults() {
    if (typeof Chart === 'undefined') return;
    const isDark = this.currentTheme === 'black-hole';
    Chart.defaults.color = isDark ? '#F5E7C6' : '#4A463D';
    Chart.defaults.borderColor = isDark ? 'rgba(245, 231, 198, 0.12)' : 'rgba(34, 34, 34, 0.08)';
    Chart.defaults.font.family = "'Plus Jakarta Sans', sans-serif";
    if (Chart.defaults.plugins && Chart.defaults.plugins.legend) {
      Chart.defaults.plugins.legend.labels.usePointStyle = true;
      Chart.defaults.plugins.legend.labels.boxWidth = 10;
    }
  },

  renderChart(canvasId, config) {
    if (typeof Chart === 'undefined') return null;
    this.initChartDefaults();
    this.charts = this.charts || {};
    if (this.charts[canvasId]) {
      this.charts[canvasId].destroy();
    }
    const canvas = document.getElementById(canvasId);
    if (!canvas) return null;
    this.charts[canvasId] = new Chart(canvas, config);
    return this.charts[canvasId];
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
    const host = IS_CROSS_ORIGIN ? `localhost:${BACKEND_PORT}` : window.location.host;
    const wsUrl = `${protocol}//${host}/ws/activity`;

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

    const views = ['viewJobs', 'viewAdminDashboard', 'viewEmployerDashboard', 'viewSeekerDashboard', 'viewAbout'];
    views.forEach(v => {
      const el = document.getElementById(v);
      if (el) el.style.display = 'none';
    });

    document.getElementById('navJobsBtn')?.classList.remove('active');
    document.getElementById('navDashboardBtn')?.classList.remove('active');

    if (viewName === 'jobs') {
      document.getElementById('viewJobs').style.display = 'block';
      document.getElementById('navJobsBtn')?.classList.add('active');
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
    } else if (viewName === 'about') {
      document.getElementById('viewAbout').style.display = 'block';
      window.scrollTo({ top: 0, behavior: 'smooth' });
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
  openAuthModal(mode = 'login', role = 'JOB_SEEKER') {
    const modal = document.getElementById('authModal');
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const title = document.getElementById('authModalTitle');

    const regRoleSelect = document.getElementById('regRole');
    if (regRoleSelect) {
      regRoleSelect.value = role;
      // Optionally disable changing if role is specifically employer
      regRoleSelect.style.display = 'none';
      const roleLabel = regRoleSelect.previousElementSibling;
      if (roleLabel) roleLabel.style.display = 'none';
    }

    if (mode === 'login') {
      loginForm.style.display = 'block';
      registerForm.style.display = 'none';
      title.innerText = role === 'EMPLOYER' ? 'Sign In as Employer' : 'Sign In to JobSphere';
      // Also update the link at bottom of login to switch to register keeping the role
      const registerLink = loginForm.querySelector('p a');
      if (registerLink) registerLink.setAttribute('onclick', `app.openAuthModal('register', '${role}')`);
    } else {
      loginForm.style.display = 'none';
      registerForm.style.display = 'block';
      title.innerText = role === 'EMPLOYER' ? 'Create Employer Account' : 'Create JobSphere Account';
      const loginLink = registerForm.querySelector('p a');
      if (loginLink) loginLink.setAttribute('onclick', `app.openAuthModal('login', '${role}')`);
    }
    modal.classList.add('show');
  },

  openDemoModal() {
    this.closeMobileMenu();
    this.closeModals();
    const modal = document.getElementById('demoModal');
    if (modal) {
      modal.classList.add('show');
    }
  },

  closeModals() {
    document.querySelectorAll('.modal-backdrop').forEach(m => m.classList.remove('show'));
  },

  toggleDropdown(id) {
    const el = document.getElementById(id);
    if (el) {
      el.classList.toggle('show');
    }
  },

  currentLanguage: 'en-IN',

  translations: {
    'en-IN': {
      nav_dashboard: 'Dashboard',
      nav_signin: 'Sign In',
      nav_register: 'Register',
      nav_for_employers: 'For Employers',
      nav_employer_login: 'Employer Login',
      nav_employer_register: 'Employer Register',
      nav_logout: 'Logout',
      nav_quick_demo: 'Quick Demo',
      hero_title_lead: 'Discover Your Next',
      hero_title_highlight: 'Career Milestone',
      hero_subtitle: 'Connect with high-growth companies, verified employers, and cutting-edge engineering roles across India and remote.',
      search_keyword_placeholder: 'Job title, skills, or company...',
      search_location_placeholder: 'Bengaluru, Hyderabad, Pune, Remote...',
      all_job_types: 'All Job Types',
      job_type_fulltime: 'Full-time',
      job_type_parttime: 'Part-time',
      job_type_contract: 'Contract',
      job_type_remote: 'Remote',
      search_jobs_btn: 'Search Jobs',
      featured_opportunities: 'Featured Opportunities',
      cta_title: 'Ready to Experience JobSphere?',
      cta_desc: 'Explore open requisitions, post your first role, or test each persona with our instant demo switcher.',
      cta_explore_jobs: 'Explore Jobs',
      cta_try_demo: 'Try Instant Demo',
      footer_general: 'General',
      footer_browse: 'Browse JobSphere',
      footer_business_solutions: 'Business Solutions',
      footer_directories: 'Directories',
      footer_about: 'About',
      footer_signup: 'Sign Up',
      footer_help_center: 'Help Center',
      footer_careers: 'Careers',
      footer_developers: 'Developers',
      footer_learning: 'Learning & Skills',
      footer_jobs: 'Jobs',
      footer_engineering: 'Engineering',
      footer_remote: 'Remote Opportunities',
      footer_employer_login: 'Employer Login',
      footer_post_job: 'Post a Job',
      footer_hiring_solutions: 'Hiring Solutions',
      footer_talent_hub: 'Talent Hub',
      footer_enterprise_sales: 'Enterprise Sales',
      footer_demo_dialog: 'Quick Demo Dialog',
      footer_select_lang: 'Select Language',
      apply_now: 'Apply Now'
    },
    'hi': {
      nav_dashboard: 'डैशबोर्ड',
      nav_signin: 'लॉग इन',
      nav_register: 'पंजीकरण',
      nav_for_employers: 'नियोक्ताओं के लिए',
      nav_employer_login: 'नियोक्ता लॉगिन',
      nav_employer_register: 'नियोक्ता पंजीकरण',
      nav_logout: 'लॉग आउट',
      nav_quick_demo: 'त्वरित डेमो',
      hero_title_lead: 'अपना अगला',
      hero_title_highlight: 'करियर मुकाम खोजें',
      hero_subtitle: 'बेंगलुरु, मुंबई, दिल्ली-एनसीआर, हैदराबाद और रिमोट में शीर्ष कंपनियों और सत्यापित नियोक्ताओं से जुड़ें।',
      search_keyword_placeholder: 'पद, कौशल या कंपनी...',
      search_location_placeholder: 'बेंगलुरु, हैदराबाद, पुणे, रिमोट...',
      all_job_types: 'सभी प्रकार',
      job_type_fulltime: 'पूर्णकालिक',
      job_type_parttime: 'अंशकालिक',
      job_type_contract: 'अनुबंध',
      job_type_remote: 'रिमोट',
      search_jobs_btn: 'नौकरियां खोजें',
      featured_opportunities: 'प्रमुख नौकरियां',
      cta_title: 'JobSphere का अनुभव लेने के लिए तैयार हैं?',
      cta_desc: 'उपलब्ध नौकरियां देखें, अपनी पहली नौकरी पोस्ट करें, या हमारे डेमो स्विचर से तुरंत परीक्षण करें।',
      cta_explore_jobs: 'नौकरियां देखें',
      cta_try_demo: 'डेमो आज़माएं',
      footer_general: 'सामान्य',
      footer_browse: 'JobSphere ब्राउज़ करें',
      footer_business_solutions: 'व्यावसायिक समाधान',
      footer_directories: 'निर्देशिकाएं',
      footer_about: 'हमारे बारे में',
      footer_signup: 'साइन अप',
      footer_help_center: 'सहायता केंद्र',
      footer_careers: 'करियर',
      footer_developers: 'डेवलपर्स',
      footer_learning: 'सीखना और कौशल',
      footer_jobs: 'नौकरियां',
      footer_engineering: 'इंजीनियरिंग',
      footer_remote: 'रिमोट अवसर',
      footer_employer_login: 'नियोक्ता लॉगिन',
      footer_post_job: 'नौकरी पोस्ट करें',
      footer_hiring_solutions: 'हायरिंग समाधान',
      footer_talent_hub: 'टैलेंट हब',
      footer_enterprise_sales: 'एंटरप्राइज बिक्री',
      footer_demo_dialog: 'त्वरित डेमो डायलॉग',
      footer_select_lang: 'भाषा चुनें',
      apply_now: 'आवेदन करें'
    }
  },

  t(key, fallback = '') {
    const dict = this.translations[this.currentLanguage] || this.translations['en-IN'] || {};
    if (dict[key] !== undefined) return dict[key];
    const defaultDict = this.translations['en-IN'] || {};
    return defaultDict[key] !== undefined ? defaultDict[key] : fallback;
  },

  applyTranslations(langCode) {
    this.currentLanguage = langCode || 'en-IN';
    document.documentElement.lang = this.currentLanguage;

    // Update text content of data-i18n elements
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      const val = this.t(key);
      if (val) {
        el.textContent = val;
      }
    });

    // Update placeholder attributes
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      const key = el.getAttribute('data-i18n-placeholder');
      const val = this.t(key);
      if (val) {
        el.setAttribute('placeholder', val);
      }
    });

    // Localize apply buttons on already rendered job cards
    document.querySelectorAll('.job-card .btn-primary').forEach(btn => {
      const attr = btn.getAttribute('onclick');
      if (attr && attr.includes('openApplyModal')) {
        btn.textContent = this.t('apply_now', 'Apply Now');
      }
    });
  },

  initLanguage() {
    try {
      let saved = JSON.parse(localStorage.getItem('jobportal_lang') || 'null');
      if (!saved || (saved.code !== 'en-IN' && saved.code !== 'hi')) {
        saved = { code: 'en-IN', name: 'English (India)' };
        localStorage.setItem('jobportal_lang', JSON.stringify(saved));
      }
      this.currentLanguage = saved.code || 'en-IN';
      const label = document.getElementById('selectedLanguageText');
      if (label && saved.name) label.textContent = saved.name;
      document.querySelectorAll('.footer-lang-item').forEach(item => {
        const isMatch = item.getAttribute('data-lang') === this.currentLanguage;
        item.classList.toggle('active', isMatch);
        let check = item.querySelector('.footer-lang-check');
        if (isMatch && !check) {
          check = document.createElement('span');
          check.className = 'footer-lang-check';
          check.textContent = '✓';
          item.appendChild(check);
        } else if (!isMatch && check) {
          check.remove();
        }
      });
      this.applyTranslations(this.currentLanguage);
    } catch (e) {
      console.warn('Could not restore saved language preference', e);
      this.applyTranslations('en-IN');
    }
  },

  selectLanguage(code, name) {
    if (code !== 'en-IN' && code !== 'hi') {
      code = 'en-IN';
      name = 'English (India)';
    }
    this.currentLanguage = code;
    localStorage.setItem('jobportal_lang', JSON.stringify({ code, name }));
    const label = document.getElementById('selectedLanguageText');
    if (label) {
      label.textContent = name;
    }
    document.querySelectorAll('.footer-lang-item').forEach(item => {
      const isMatch = item.getAttribute('data-lang') === code;
      item.classList.toggle('active', isMatch);
      let check = item.querySelector('.footer-lang-check');
      if (isMatch && !check) {
        check = document.createElement('span');
        check.className = 'footer-lang-check';
        check.textContent = '✓';
        item.appendChild(check);
      } else if (!isMatch && check) {
        check.remove();
      }
    });
    const menu = document.getElementById('footerLangMenu');
    if (menu) {
      menu.classList.remove('show');
    }
    this.applyTranslations(code);
    this.showToast(`Language set to ${name}`, 'success');
  },

  toggleMobileMenu() {
    const navbar = document.getElementById('topNavbar');
    if (navbar) {
      navbar.classList.toggle('menu-open');
      const isExpanded = navbar.classList.contains('menu-open');
      const btn = document.getElementById('mobileMenuBtn');
      if (btn) btn.setAttribute('aria-expanded', isExpanded);
    }
  },

  closeMobileMenu() {
    const navbar = document.getElementById('topNavbar');
    if (navbar && navbar.classList.contains('menu-open')) {
      navbar.classList.remove('menu-open');
      const btn = document.getElementById('mobileMenuBtn');
      if (btn) btn.setAttribute('aria-expanded', 'false');
    }
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
    const roleEl = document.getElementById('regRole');
    const role = roleEl ? roleEl.value : 'JOB_SEEKER';

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
      this.openAuthModal('login', role);
      document.getElementById('loginEmail').value = email;
    } catch (err) {
      this.showToast('Error registering account', 'error');
    }
  },

  async demoLogin(email, password) {
    this.closeModals();
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
              <span class="chip">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
                ${job.location || 'Remote'}
              </span>
              <span class="chip">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                ${job.jobType || 'Full-time'}
              </span>
              <span class="chip salary">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg>
                ${salary} / yr
              </span>
            </div>
            <p class="job-desc">${job.description}</p>
            <div class="job-requirements">
              <strong>Key Requirements:</strong> ${job.requirements}
            </div>
          </div>
          <div class="job-card-footer">
            <span style="font-size:0.75rem; color:var(--text-muted);">Posted ${this.formatDate(job.createdAt)}</span>
            <button class="btn-primary" style="padding:0.5rem 1.1rem; font-size:0.88rem;" onclick="app.openApplyModal(${job.id}, '${escape(job.title)}', '${escape(company)}')">
              ${this.t('apply_now', 'Apply Now')}
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
    if (tabName === 'stats') this.loadAdminStats();
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
        <div class="stat-card cyan">
          <div class="stat-label">Daily Active Users</div>
          <div class="stat-value">${stats.dailyActiveUsers || 0}</div>
          <div class="stat-subtext">${stats.weeklyActiveUsers || 0} active this week (WAU)</div>
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
        <div class="stat-card">
          <div class="stat-label">Activities Today</div>
          <div class="stat-value">${stats.activitiesToday || 0}</div>
          <div class="stat-subtext">Real-time system events logged</div>
        </div>
      `;

      document.getElementById('adminPendingBadge').innerText = stats.pendingJobs || 0;

      // Render Admin Visual Breakdown & Chart.js Charts
      const chartsContainer = document.getElementById('adminStatsCharts');
      chartsContainer.innerHTML = `
        <div class="chart-card">
          <h4>7-Day Platform Activity Trends</h4>
          <p>Real-time activity volume and engagement across the last 7 days</p>
          <div class="chart-wrapper">
            <canvas id="adminActivityTrendsChart"></canvas>
          </div>
        </div>

        <div class="chart-card">
          <h4>Application Funnel Distribution</h4>
          <p>Candidate pipeline across review, shortlist, and hiring stages</p>
          <div class="chart-wrapper">
            <canvas id="adminAppStatusChart"></canvas>
          </div>
        </div>

        <div class="chart-card">
          <h4>System Events & Engagement Breakdown</h4>
          <p>Distribution of user actions and administrative operations</p>
          <div class="chart-wrapper">
            <canvas id="adminActionBreakdownChart"></canvas>
          </div>
        </div>

        <div class="chart-card">
          <h4>Job Moderation Status</h4>
          <p>Status of employer job postings submitted for review</p>
          <div class="chart-wrapper">
            <canvas id="adminJobStatusChart"></canvas>
          </div>
        </div>
      `;

      // 1. Activity Trends Line Chart
      const trendLabels = Object.keys(stats.activityTrends || {}).map(d => {
        const parts = d.split('-');
        return parts.length === 3 ? `${parts[1]}/${parts[2]}` : d;
      });
      const trendValues = Object.values(stats.activityTrends || {});

      this.renderChart('adminActivityTrendsChart', {
        type: 'line',
        data: {
          labels: trendLabels,
          datasets: [{
            label: 'Activities',
            data: trendValues,
            borderColor: '#FF6D1F',
            backgroundColor: 'rgba(255, 109, 31, 0.16)',
            borderWidth: 2.5,
            tension: 0.35,
            fill: true,
            pointBackgroundColor: '#FF6D1F',
            pointBorderColor: '#FAF3E1',
            pointRadius: 4,
            pointHoverRadius: 6
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false }
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: { precision: 0 },
              grid: { color: this.currentTheme === 'black-hole' ? 'rgba(245, 231, 198, 0.08)' : 'rgba(34, 34, 34, 0.06)' }
            },
            x: {
              grid: { display: false }
            }
          }
        }
      });

      // 2. Application Status Doughnut Chart
      const appCounts = [
        stats.pendingApplications || 0,
        stats.shortlistedApplications || 0,
        stats.acceptedApplications || 0,
        stats.rejectedApplications || 0
      ];
      this.renderChart('adminAppStatusChart', {
        type: 'doughnut',
        data: {
          labels: ['Pending Review', 'Shortlisted', 'Accepted / Hired', 'Rejected'],
          datasets: [{
            data: appCounts,
            backgroundColor: ['#F5E7C6', '#FF6D1F', '#222222', '#B91C1C'],
            borderWidth: 0
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: '68%',
          plugins: {
            legend: {
              position: 'bottom',
              labels: { padding: 16 }
            }
          }
        }
      });

      // 3. Action Breakdown Horizontal Bar Chart
      const breakdownEntries = Object.entries(stats.actionBreakdown || {});
      const actionLabels = breakdownEntries.map(([k]) => k.replace(/_/g, ' '));
      const actionValues = breakdownEntries.map(([, v]) => v);

      this.renderChart('adminActionBreakdownChart', {
        type: 'bar',
        data: {
          labels: actionLabels.length ? actionLabels : ['No recent activity'],
          datasets: [{
            label: 'Actions',
            data: actionValues.length ? actionValues : [0],
            backgroundColor: '#FF6D1F',
            borderRadius: 6
          }]
        },
        options: {
          indexAxis: 'y',
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false }
          },
          scales: {
            x: {
              beginAtZero: true,
              ticks: { precision: 0 },
              grid: { color: 'rgba(255, 255, 255, 0.05)' }
            },
            y: {
              grid: { display: false }
            }
          }
        }
      });

      // 4. Job Moderation Status Bar Chart
      this.renderChart('adminJobStatusChart', {
        type: 'bar',
        data: {
          labels: ['Approved', 'Pending', 'Rejected'],
          datasets: [{
            label: 'Jobs',
            data: [stats.approvedJobs || 0, stats.pendingJobs || 0, stats.rejectedJobs || 0],
            backgroundColor: ['#222222', '#FF6D1F', '#F5E7C6'],
            borderRadius: 6
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false }
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: { precision: 0 },
              grid: { color: 'rgba(255, 255, 255, 0.05)' }
            },
            x: {
              grid: { display: false }
            }
          }
        }
      });

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
            <div style="display:flex; gap:0.4rem;">
              <button class="btn-secondary" style="padding:0.35rem 0.65rem;" onclick="app.openEditUserModal(${u.id})">Edit</button>
              <button class="btn-danger" style="padding:0.35rem 0.65rem;" onclick="app.deleteUser(${u.id})">Delete</button>
            </div>
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
    document.getElementById('adminCreateUserName').value = '';
    document.getElementById('adminCreateUserEmail').value = '';
    document.getElementById('adminCreateUserRole').value = 'JOB_SEEKER';
    document.getElementById('adminCreateUserPassword').value = '';
    document.getElementById('adminCreateUserHeadline').value = '';
    document.getElementById('adminCreateUserPhone').value = '';
    document.getElementById('adminUserCreateModal').classList.add('show');
  },

  async submitAdminUserCreate(e) {
    e.preventDefault();
    const name = document.getElementById('adminCreateUserName').value;
    const email = document.getElementById('adminCreateUserEmail').value;
    const role = document.getElementById('adminCreateUserRole').value;
    const password = document.getElementById('adminCreateUserPassword').value;
    const headline = document.getElementById('adminCreateUserHeadline').value;
    const phone = document.getElementById('adminCreateUserPhone').value;

    try {
      const res = await this.api('/admin/users', {
        method: 'POST',
        body: JSON.stringify({ name, email, role, password, headline, phone })
      });
      const data = await res.json();
      if (res.ok) {
        this.closeModals();
        this.showToast(data.message || 'User created successfully', 'success');
        this.loadAdminUsers();
        this.loadAdminStats();
      } else {
        this.showToast(data.error || 'Failed to create user', 'error');
      }
    } catch (err) {
      this.showToast('Error creating user account', 'error');
    }
  },

  async openEditUserModal(id) {
    try {
      const res = await this.api(`/admin/users/${id}`);
      if (!res.ok) {
        this.showToast('Could not load user data', 'error');
        return;
      }
      const user = await res.json();
      document.getElementById('adminEditUserId').value = user.id;
      document.getElementById('adminEditUserName').value = user.name || '';
      document.getElementById('adminEditUserEmail').value = user.email || '';
      document.getElementById('adminEditUserRole').value = user.role || 'JOB_SEEKER';
      document.getElementById('adminEditUserPassword').value = '';
      document.getElementById('adminEditUserHeadline').value = user.headline || '';
      document.getElementById('adminEditUserPhone').value = user.phone || '';
      document.getElementById('adminEditUserSkills').value = user.skills || '';
      document.getElementById('adminUserEditModal').classList.add('show');
    } catch (err) {
      this.showToast('Error loading user details', 'error');
    }
  },

  async submitAdminUserUpdate(e) {
    e.preventDefault();
    const id = document.getElementById('adminEditUserId').value;
    const name = document.getElementById('adminEditUserName').value;
    const email = document.getElementById('adminEditUserEmail').value;
    const role = document.getElementById('adminEditUserRole').value;
    const password = document.getElementById('adminEditUserPassword').value;
    const headline = document.getElementById('adminEditUserHeadline').value;
    const phone = document.getElementById('adminEditUserPhone').value;
    const skills = document.getElementById('adminEditUserSkills').value;

    const payload = { name, email, role, headline, phone, skills };
    if (password && password.trim().length > 0) {
      payload.password = password.trim();
    }

    try {
      const res = await this.api(`/admin/users/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok) {
        this.closeModals();
        this.showToast(data.message || 'User updated successfully', 'success');
        this.loadAdminUsers();
        this.loadAdminStats();
      } else {
        this.showToast(data.error || 'Failed to update user', 'error');
      }
    } catch (err) {
      this.showToast('Error updating user', 'error');
    }
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
    if (tabName === 'analytics') this.loadEmployerStats();
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
      charts.innerHTML = `
        <div class="chart-card">
          <h4>Applicant Status Funnel</h4>
          <p>Distribution of candidate applications across review stages</p>
          <div class="chart-wrapper">
            <canvas id="employerStatusFunnelChart"></canvas>
          </div>
        </div>

        <div class="chart-card">
          <h4>Applications Received by Job Posting</h4>
          <p>Candidate volume received per active or published job</p>
          <div class="chart-wrapper">
            <canvas id="employerJobsBreakdownChart"></canvas>
          </div>
        </div>
      `;

      // 1. Candidate Status Funnel Doughnut Chart
      const empStatusCounts = [
        stats.pendingReview || 0,
        stats.shortlisted || 0,
        stats.accepted || 0,
        stats.rejected || 0
      ];

      this.renderChart('employerStatusFunnelChart', {
        type: 'doughnut',
        data: {
          labels: ['Under Review', 'Shortlisted', 'Hired / Accepted', 'Declined'],
          datasets: [{
            data: empStatusCounts,
            backgroundColor: ['#F5E7C6', '#FF6D1F', '#222222', '#B91C1C'],
            borderWidth: 0
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: '68%',
          plugins: {
            legend: {
              position: 'bottom',
              labels: { padding: 16 }
            }
          }
        }
      });

      // 2. Applications by Position Bar Chart
      const applicantsPerJob = stats.applicantsPerJob || {};
      const jobTitles = Object.keys(applicantsPerJob);
      const applicantCounts = Object.values(applicantsPerJob);

      this.renderChart('employerJobsBreakdownChart', {
        type: 'bar',
        data: {
          labels: jobTitles.length ? jobTitles : ['No applications yet'],
          datasets: [{
            label: 'Applicants',
            data: applicantCounts.length ? applicantCounts : [0],
            backgroundColor: '#FF6D1F',
            borderRadius: 6
          }]
        },
        options: {
          indexAxis: 'y',
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false }
          },
          scales: {
            x: {
              beginAtZero: true,
              ticks: { precision: 0 },
              grid: { color: 'rgba(255, 255, 255, 0.05)' }
            },
            y: {
              grid: { display: false }
            }
          }
        }
      });

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
      document.getElementById('jobLocationInput').value = 'Bengaluru, Karnataka / Remote';
      document.getElementById('jobTypeInput').value = 'Full-time';
      document.getElementById('jobSalaryInput').value = '1200000';
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
            <div style="font-size:0.75rem; color:var(--accent-primary); font-weight:600; margin-top:2px;">${a.jobSeeker.skills || ''}</div>
          </td>
          <td style="max-width:240px;">
            <div style="font-size:0.82rem; font-style:italic; margin-bottom:4px;">"${a.coverLetter || ''}"</div>
            ${a.resumeUrl ? `<a href="${a.resumeUrl}" target="_blank" style="font-size:0.8rem; color:var(--accent-primary); text-decoration:underline;">📄 View Resume</a>` : '<span style="color:var(--text-muted); font-size:0.75rem;">No resume attached</span>'}
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
          <td style="color:var(--accent-primary); font-weight:700;">${a.jobListing.companyName || (a.jobListing.employer ? a.jobListing.employer.name : 'Employer')}</td>
          <td style="color:var(--text-muted); font-size:0.85rem;">${this.formatDate(a.appliedAt)}</td>
          <td><span class="status-badge ${a.status.toLowerCase()}">${a.status}</span></td>
          <td>
            ${a.resumeUrl ? `<a href="${a.resumeUrl}" target="_blank" style="color:var(--accent-primary); text-decoration:underline; font-size:0.85rem;">📄 Attached Resume</a>` : '<span style="color:var(--text-muted);">Profile CV</span>'}
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
window.app = app;

window.addEventListener('DOMContentLoaded', () => app.init());

window.addEventListener('click', function(e) {
  if (!e.target.closest('.dropdown-container')) {
    document.querySelectorAll('.dropdown-menu.show').forEach(menu => {
      menu.classList.remove('show');
    });
  }
});
