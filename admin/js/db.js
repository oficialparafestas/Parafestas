// Mock Database using LocalStorage
const DB_KEYS = {
  USERS: 'pf_users',
  LEADS: 'pf_leads',
  EVENTS: 'pf_events'
};

export const DB = {
  init() {
    if (!localStorage.getItem(DB_KEYS.USERS)) {
      localStorage.setItem(DB_KEYS.USERS, JSON.stringify([
        { email: 'admin@parafestas.com', password: 'parafestas2026', role: 'ADMIN' },
        { email: 'gestor@parafestas.com', password: 'parafestas2026', role: 'GESTOR' },
        { email: 'comercial@parafestas.com', password: 'parafestas2026', role: 'COMERCIAL' }
      ]));
    }
    if (!localStorage.getItem(DB_KEYS.LEADS)) {
      localStorage.setItem(DB_KEYS.LEADS, JSON.stringify([]));
    }
    if (!localStorage.getItem(DB_KEYS.EVENTS)) {
      localStorage.setItem(DB_KEYS.EVENTS, JSON.stringify([]));
    }
  },

  // Auth
  login(email, password) {
    const users = JSON.parse(localStorage.getItem(DB_KEYS.USERS));
    const user = users.find(u => u.email === email && u.password === password);
    if (user) {
      const session = { email: user.email, role: user.role, token: 'mock-token-' + Date.now() };
      localStorage.setItem('pf_session', JSON.stringify(session));
      return session;
    }
    return null;
  },
  
  logout() {
    localStorage.removeItem('pf_session');
  },

  getSession() {
    const session = localStorage.getItem('pf_session');
    return session ? JSON.parse(session) : null;
  },

  // Leads
  getLeads() {
    return JSON.parse(localStorage.getItem(DB_KEYS.LEADS));
  },

  addLead(leadData) {
    const leads = this.getLeads();
    leadData.id = Date.now().toString();
    leadData.date = new Date().toISOString();
    leads.push(leadData);
    localStorage.setItem(DB_KEYS.LEADS, JSON.stringify(leads));
  },

  // Events
  getEvents() {
    return JSON.parse(localStorage.getItem(DB_KEYS.EVENTS));
  },

  addEvent(eventData) {
    const events = this.getEvents();
    eventData.id = Date.now().toString();
    eventData.date = new Date().toISOString();
    events.push(eventData);
    localStorage.setItem(DB_KEYS.EVENTS, JSON.stringify(events));
  }
};

DB.init();
