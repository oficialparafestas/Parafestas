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
  } else if (viewName === 'crm') {
    pageTitle.textContent = 'CRM Completo';
    renderCRM(contentArea);
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
  requestAnimationFrame(() => {
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
            backgroundColor: (Object.keys(typeCounts).length ? Object.keys(typeCounts) : ['Sem dados']).map((_, i) => \`hsl(${(i * 137.5) % 360}, 70%, 60%)\`)
          }]
        },
        options: { responsive: true, maintainAspectRatio: false }
      });
    }
  });
}

function getBadgeClass(score) {
  if (score >= 151) return 'badge-muito-quente';
  if (score >= 81) return 'badge-quente';
  if (score >= 31) return 'badge-morno';
  if (score >= 16) return 'badge-frio';
  return 'badge-muito-frio';
}

function getScoreLabel(score) {
  if (score >= 151) return 'Muito Quente';
  if (score >= 81) return 'Quente';
  if (score >= 31) return 'Morno';
  if (score >= 16) return 'Frio';
  return 'Muito Frio';
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
}

function exportToCSV(leads) {
  const headers = ['Data', 'Nome', 'Email', 'WhatsApp', 'Evento', 'Origem (Source)', 'Campanha', 'Gênero', 'Idade', 'Interesses', 'Score', 'Status'];
  const rows = leads.map(l => {
    return [
      new Date(l.date).toLocaleString('pt-BR'),
      l.name || '',
      l.email || '',
      l.whatsapp || '',
      l.event_type || '',
      l.utm_source || 'orgânico',
      l.utm_campaign || '-',
      l.gender || 'N/A',
      l.age || 'N/A',
      l.interests || 'N/A',
      l.score || 0,
      getScoreLabel(l.score || 0)
    ].map(field => `"${String(field).replace(/"/g, '""')}"`).join(',');
  });

  const csvContent = [headers.join(','), ...rows].join('\n');
  const blob = new Blob(["\ufeff" + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.setAttribute('href', url);
  a.setAttribute('download', 'crm_leads.csv');
  a.click();
  URL.revokeObjectURL(url);
}

function renderCRM(container) {
  const leads = DB.getLeads().reverse();
  
  let rows = '';
  if (leads.length === 0) {
    rows = '<tr><td colspan="9" style="text-align:center;">Nenhum registro encontrado</td></tr>';
  } else {
    leads.forEach(l => {
      const date = new Date(l.date).toLocaleDateString('pt-BR');
      const score = l.score || 0;
      
      // Simular Gênero, Idade, Interesses se não existirem (já que o form atual não os captura nativamente)
      // Apenas mockaremos dados provisórios para demonstração até que o formulário real colete isso.
      const gender = l.gender || '-';
      const age = l.age || '-';
      const interests = l.interests || '-';

      rows += `
        <tr>
          <td>${date}</td>
          <td>${l.name}<br><small>${l.email}</small></td>
          <td>${l.whatsapp}</td>
          <td>${gender}</td>
          <td>${age}</td>
          <td><span style="font-size:12px;color:var(--admin-text-light)">${interests}</span></td>
          <td>${l.event_type}</td>
          <td><span class="badge ${getBadgeClass(score)}">${getScoreLabel(score)}</span></td>
        </tr>
      `;
    });
  }

  container.innerHTML = `
    <div style="margin-bottom: 20px; display: flex; justify-content: space-between;">
      <h3 style="margin: 0; color: var(--admin-text);">Base de CRM Enriquecida</h3>
      <button class="btn-primary" style="width: auto; padding: 10px 20px;" id="export-crm-csv">Exportar Base Completa CSV</button>
    </div>
    <div class="table-card">
      <table class="admin-table">
        <thead>
          <tr>
            <th>Data</th>
            <th>Lead / Email</th>
            <th>WhatsApp</th>
            <th>Gênero</th>
            <th>Idade</th>
            <th>Interesses (Tags)</th>
            <th>Evento Base</th>
            <th>Termômetro</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
    </div>
  `;

  document.getElementById('export-crm-csv').addEventListener('click', () => {
    exportToCSV(leads);
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
