import { DB } from './db.js';

let currentSession = null;

document.addEventListener('DOMContentLoaded', () => {
  currentSession = DB.getSession();
  
  if (!currentSession) {
    window.location.href = '/admin/login.html';
    return;
  }

  document.getElementById('user-email').textContent = currentSession.email;
  document.getElementById('user-role').textContent = `Perfil: ${currentSession.role}`;

  document.getElementById('logout-btn').addEventListener('click', () => {
    DB.logout();
    window.location.href = '/admin/login.html';
  });

  initNavigation();
  loadView('dashboard'); // view inicial
});

function initNavigation() {
  const navItems = document.querySelectorAll('.nav-item');
  
  // Controle de acesso básico
  if (currentSession.role === 'COMERCIAL') {
    // Ocultar nav de config e analytics
    document.querySelector('[data-view="config"]').style.display = 'none';
    document.querySelector('[data-view="analytics"]').style.display = 'none';
  }
  if (currentSession.role === 'GESTOR') {
    document.querySelector('[data-view="config"]').style.display = 'none';
  }

  navItems.forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      navItems.forEach(n => n.classList.remove('active'));
      item.classList.add('active');
      const view = item.getAttribute('data-view');
      loadView(view);
    });
  });
}

function loadView(viewName) {
  const contentArea = document.getElementById('content-area');
  const pageTitle = document.getElementById('page-title');

  // Proteção de rota
  if (currentSession.role === 'COMERCIAL' && viewName !== 'leads') {
    viewName = 'leads';
  }

  if (viewName === 'dashboard') {
    pageTitle.textContent = 'Dashboard';
    renderDashboard(contentArea);
  } else if (viewName === 'leads') {
    pageTitle.textContent = 'Leads & Contatos';
    renderLeads(contentArea);
  } else if (viewName === 'analytics') {
    pageTitle.textContent = 'Analytics & Eventos';
    renderAnalytics(contentArea);
  } else if (viewName === 'config') {
    pageTitle.textContent = 'Configurações';
    contentArea.innerHTML = `<h3>Configurações do Sistema</h3><p>Área restrita ao administrador.</p>`;
  }
}

function renderDashboard(container) {
  const leads = DB.getLeads();
  const events = DB.getEvents();
  
  const totalLeads = leads.length;
  const totalVisitors = new Set(events.filter(e => e.eventName === 'PageView').map(e => e.sessionId)).size || 0;
  
  const wppClicks = events.filter(e => e.eventName === 'WhatsappClick').length;
  const instClicks = events.filter(e => e.eventName === 'InstagramClick').length;
  
  const convRate = totalVisitors > 0 ? ((totalLeads / totalVisitors) * 100).toFixed(1) + '%' : '0%';

  container.innerHTML = `
    <div class="dashboard-grid">
      <div class="stat-card">
        <div class="stat-title">Visitantes Totais</div>
        <div class="stat-value">${totalVisitors}</div>
      </div>
      <div class="stat-card">
        <div class="stat-title">Leads Captados</div>
        <div class="stat-value">${totalLeads}</div>
      </div>
      <div class="stat-card">
        <div class="stat-title">Taxa de Conversão</div>
        <div class="stat-value">${convRate}</div>
      </div>
      <div class="stat-card">
        <div class="stat-title">Cliques WhatsApp</div>
        <div class="stat-value">${wppClicks}</div>
      </div>
      <div class="stat-card">
        <div class="stat-title">Cliques Instagram</div>
        <div class="stat-value">${instClicks}</div>
      </div>
    </div>
    <div class="charts-grid">
      <div class="chart-card">
        <h3 style="margin-bottom: 15px; color: var(--admin-text-light); font-size: 14px;">Eventos por Dia (Últimos 7 dias)</h3>
        <canvas id="eventsChart"></canvas>
      </div>
      <div class="chart-card">
        <h3 style="margin-bottom: 15px; color: var(--admin-text-light); font-size: 14px;">Leads por Tipo de Evento</h3>
        <canvas id="leadsChart"></canvas>
      </div>
    </div>
  `;

  // Render Charts
  setTimeout(() => {
    const ctx1 = document.getElementById('eventsChart');
    if(ctx1) {
      // Gerar últimos 7 dias
      const last7Days = [...Array(7)].map((_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - i);
        return d.toLocaleDateString('pt-BR', { weekday: 'short' });
      }).reverse();

      const visitsPerDay = last7Days.map(day => {
        return events.filter(e => {
          if (e.eventName !== 'PageView') return false;
          const ed = new Date(e.date).toLocaleDateString('pt-BR', { weekday: 'short' });
          return ed === day;
        }).length;
      });

      new Chart(ctx1, {
        type: 'line',
        data: {
          labels: last7Days,
          datasets: [{
            label: 'Visitas (PageView)',
            data: visitsPerDay,
            borderColor: '#38bdf8',
            tension: 0.4
          }]
        },
        options: { responsive: true, maintainAspectRatio: false }
      });
    }

    const ctx2 = document.getElementById('leadsChart');
    if(ctx2) {
      // Aggregate leads by event_type
      const typeCounts = leads.reduce((acc, l) => {
        acc[l.event_type] = (acc[l.event_type] || 0) + 1;
        return acc;
      }, {});

      new Chart(ctx2, {
        type: 'doughnut',
        data: {
          labels: Object.keys(typeCounts).length ? Object.keys(typeCounts) : ['Sem dados'],
          datasets: [{
            data: Object.values(typeCounts).length ? Object.values(typeCounts) : [1],
            backgroundColor: ['#38bdf8', '#818cf8', '#34d399', '#fbbf24', '#f87171']
          }]
        },
        options: { responsive: true, maintainAspectRatio: false }
      });
    }
  }, 100);
}

function getBadgeClass(score) {
  if (score >= 151) return 'badge-muito-quente';
  if (score >= 81) return 'badge-quente';
  if (score >= 31) return 'badge-morno';
  return 'badge-frio';
}

function getScoreLabel(score) {
  if (score >= 151) return 'M. Quente';
  if (score >= 81) return 'Quente';
  if (score >= 31) return 'Morno';
  return 'Frio';
}

function renderLeads(container) {
  const leads = DB.getLeads().reverse(); // Mais novos primeiro
  
  let rows = '';
  if (leads.length === 0) {
    rows = '<tr><td colspan="8" style="text-align:center;">Nenhum lead encontrado</td></tr>';
  } else {
    leads.forEach(l => {
      const date = new Date(l.date).toLocaleDateString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      const score = l.score || 0;
      rows += `
        <tr>
          <td>${date}</td>
          <td><strong>${l.name}</strong><br><small>${l.email}</small></td>
          <td>${l.whatsapp}</td>
          <td>${l.event_type}</td>
          <td>${l.utm_source || '-'} / ${l.utm_campaign || '-'}</td>
          <td><span class="badge ${getBadgeClass(score)}">${score} pts (${getScoreLabel(score)})</span></td>
          <td>Novo</td>
        </tr>
      `;
    });
  }

  container.innerHTML = `
    <div style="margin-bottom: 20px; display: flex; justify-content: space-between;">
      <input type="text" placeholder="Buscar leads..." style="padding: 10px; width: 300px; border-radius: 6px; border: 1px solid var(--admin-border); background: var(--admin-surface); color: var(--admin-text);">
      <button class="btn-primary" style="width: auto; padding: 10px 20px;" id="export-csv">Exportar CSV</button>
    </div>
    <div class="table-card">
      <table class="admin-table">
        <thead>
          <tr>
            <th>Data</th>
            <th>Contato</th>
            <th>WhatsApp</th>
            <th>Evento</th>
            <th>Origem (UTM)</th>
            <th>Score</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
    </div>
  `;

  document.getElementById('export-csv').addEventListener('click', () => {
    alert('Função de exportação CSV será implementada em breve.');
  });
}

function renderAnalytics(container) {
  const events = DB.getEvents().reverse().slice(0, 50); // ultimos 50
  
  let rows = '';
  if (events.length === 0) {
    rows = '<tr><td colspan="4" style="text-align:center;">Nenhum evento registrado</td></tr>';
  } else {
    events.forEach(e => {
      const date = new Date(e.date).toLocaleTimeString('pt-BR');
      rows += `
        <tr>
          <td>${date}</td>
          <td><strong>${e.eventName}</strong></td>
          <td>${e.url || '-'}</td>
          <td><pre style="font-size:11px; margin:0; max-width: 200px; overflow:hidden; text-overflow:ellipsis;">${JSON.stringify(e.data || {})}</pre></td>
        </tr>
      `;
    });
  }

  container.innerHTML = `
    <div class="table-card">
      <div class="table-header"><h3>Últimos Eventos (Log)</h3></div>
      <table class="admin-table">
        <thead>
          <tr>
            <th>Hora</th>
            <th>Evento</th>
            <th>Página</th>
            <th>Dados (JSON)</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
    </div>
  `;
}
