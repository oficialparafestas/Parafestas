// admin-main.js - Arquitetura de UI modularizada
let globalData = null;

// Sistema de navegação SPA
document.addEventListener('DOMContentLoaded', () => {
  initNavigation();
  loadDashboardData();
  
  // Logout
  document.getElementById('logout-btn').addEventListener('click', async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/admin/login.html';
  });

  // Date Filter
  document.getElementById('date-filter').addEventListener('change', () => {
    loadDashboardData();
  });
});

function initNavigation() {
  const navItems = document.querySelectorAll('.nav-item[data-view]');
  navItems.forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      navItems.forEach(nav => nav.classList.remove('active'));
      e.target.classList.add('active');
      const view = e.target.getAttribute('data-view');
      renderView(view);
    });
  });
}

async function loadDashboardData() {
  const statusEl = document.getElementById('sync-status');
  statusEl.innerText = 'Sincronizando...';
  
  try {
    const res = await fetch('/api/admin/dashboard');
    if (res.status === 401 || res.status === 403) {
      window.location.href = '/admin/login.html';
      return;
    }
    
    const json = await res.json();
    if (json.success) {
      globalData = json.data;
      statusEl.innerText = `Última sincronização: ${new Date().toLocaleTimeString('pt-BR')}`;
      const activeView = document.querySelector('.nav-item.active').getAttribute('data-view');
      renderView(activeView);
    }
  } catch (err) {
    console.error(err);
    statusEl.innerText = 'Falha na conexão';
  }
}

function renderView(viewName) {
  const contentArea = document.getElementById('content-area');
  const title = document.getElementById('page-title');
  
  contentArea.innerHTML = ''; // Limpar anterior

  if (!globalData) {
    contentArea.innerHTML = '<div class="loading">Carregando dados...</div>';
    return;
  }

  switch(viewName) {
    case 'dashboard':
      title.innerText = 'Centro de Comando Parafestas';
      renderDashboard(contentArea);
      break;
    case 'analytics':
      title.innerText = 'Analytics Executivo';
      renderAnalytics(contentArea);
      break;
    case 'crm':
      title.innerText = 'Leads & CRM';
      renderCRM(contentArea);
      break;
    case 'funil':
      title.innerText = 'Funil de Conversão';
      renderFunnel(contentArea);
      break;
    case 'vendas':
      title.innerText = 'Vendas & Financeiro';
      contentArea.innerHTML = '<div class="empty-state">Integre dados de venda para habilitar esta seção.</div>';
      break;
    case 'meta_ads':
      title.innerText = 'Meta Ads - Performance';
      renderMetaAds(contentArea);
      break;
    case 'pixel_api':
      title.innerText = 'Pixel & API - Diagnóstico';
      renderDiagnostics(contentArea);
      break;
    default:
      title.innerText = viewName;
      contentArea.innerHTML = '<div class="empty-state">Módulo em construção.</div>';
  }
}

// =====================================
// COMPONENTES DE VIEW
// =====================================

function renderDashboard(container) {
  const d = globalData;
  const cpl = d.leads > 0 ? `R$ ${((d.metaSpend || 0) / d.leads).toFixed(2)}` : 'R$ 0,00';
  const convRate = d.visitors > 0 ? `${((d.leads / d.visitors) * 100).toFixed(1)}%` : '0%';

  container.innerHTML = `
    <div class="dashboard-grid">
      <div class="stat-card">
        <h3>VISITANTES</h3>
        <div class="stat-value">${d.visitors}</div>
        <div class="stat-desc">Sessões no período</div>
      </div>
      <div class="stat-card">
        <h3>LEADS GERADOS</h3>
        <div class="stat-value">${d.leads}</div>
        <div class="stat-desc">Contatos registrados</div>
      </div>
      <div class="stat-card">
        <h3>CONTATOS WHATSAPP</h3>
        <div class="stat-value">${d.whatsapp}</div>
        <div class="stat-desc">Cliques diretos</div>
      </div>
      <div class="stat-card highlight">
        <h3>LEADS QUENTES</h3>
        <div class="stat-value">${d.hotLeads}</div>
        <div class="stat-desc">Maior probabilidade de compra</div>
      </div>
      <div class="stat-card">
        <h3>INVESTIMENTO ADS</h3>
        <div class="stat-value">R$ ${(d.metaSpend || 0).toFixed(2)}</div>
        <div class="stat-desc">Meta Marketing API</div>
      </div>
      <div class="stat-card">
        <h3>CUSTO POR LEAD</h3>
        <div class="stat-value">${cpl}</div>
        <div class="stat-desc">Investimento / Leads</div>
      </div>
      <div class="stat-card">
        <h3>CONVERSÃO DO SITE</h3>
        <div class="stat-value">${convRate}</div>
        <div class="stat-desc">Leads / Sessões únicas</div>
      </div>
      <div class="stat-card disabled">
        <h3>ROAS</h3>
        <div class="stat-value">Indisponível</div>
        <div class="stat-desc">Integre dados de venda</div>
      </div>
    </div>
    
    <div class="charts-row" style="display:flex; gap:20px; margin-top:20px;">
      <div class="chart-container" style="flex:2; background:var(--admin-surface); padding:20px; border-radius:12px;">
        <h3>Origem do Tráfego</h3>
        <canvas id="trafficChart"></canvas>
      </div>
      <div class="chart-container" style="flex:1; background:var(--admin-surface); padding:20px; border-radius:12px;">
        <h3>Temperatura da Base</h3>
        <canvas id="tempChart"></canvas>
      </div>
    </div>
  `;

  // Aqui inicializaríamos os gráficos Chart.js com os dados reais...
}

function renderAnalytics(container) {
  // Mock view for execution
  container.innerHTML = `<div style="color:var(--admin-text)">Analytics em Desenvolvimento. Aqui mostraremos dados profundos de sessão e pageviews.</div>`;
}

function renderCRM(container) {
  const leads = globalData.recentLeads || [];
  
  let rows = '';
  if (leads.length === 0) {
    rows = '<tr><td colspan="7" style="text-align:center;">Nenhum lead encontrado no período</td></tr>';
  } else {
    rows = leads.map(l => `
      <tr>
        <td>${l.name}</td>
        <td>${l.phone || l.email}</td>
        <td>${l.source}</td>
        <td>${l.campaign}</td>
        <td>${l.score}</td>
        <td><span class="badge badge-${(l.temperature||'frio').toLowerCase().replace(' ', '-')}">${l.temperature}</span></td>
        <td><button class="btn-primary" style="padding: 4px 10px; font-size:12px;">Ver</button></td>
      </tr>
    `).join('');
  }

  container.innerHTML = `
    <div class="table-card">
      <table class="admin-table">
        <thead>
          <tr>
            <th>Nome</th>
            <th>Contato</th>
            <th>Origem</th>
            <th>Campanha</th>
            <th>Score</th>
            <th>Temperatura</th>
            <th>Ação</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `;
}

function renderFunnel(container) {
  const v = globalData.visitors || 1;
  const l = globalData.leads || 0;
  const w = globalData.whatsapp || 0;
  
  container.innerHTML = `
    <div style="background:var(--admin-surface); padding: 40px; border-radius: 12px; text-align: center;">
      <div style="margin-bottom:20px;">
        <h3>Visitantes</h3>
        <div style="font-size:24px; font-weight:bold;">${v}</div>
      </div>
      <div style="margin-bottom:20px;">
        <h3>Cliques WhatsApp (${((w/v)*100).toFixed(1)}%)</h3>
        <div style="font-size:24px; font-weight:bold;">${w}</div>
      </div>
      <div style="margin-bottom:20px;">
        <h3>Leads Gerados (${((l/v)*100).toFixed(1)}%)</h3>
        <div style="font-size:24px; font-weight:bold;">${l}</div>
      </div>
    </div>
  `;
}

function renderMetaAds(container) {
  container.innerHTML = `
    <div style="display:flex; justify-content:space-between; margin-bottom: 20px;">
      <h3>Sincronização de Campanhas Meta</h3>
      <button class="btn-primary" id="btn-sync-meta">Sincronizar Agora</button>
    </div>
    <div id="meta-results" class="table-card">
      <p style="padding: 20px;">Clique em sincronizar para puxar os dados da Meta Marketing API.</p>
    </div>
  `;
  
  document.getElementById('btn-sync-meta').addEventListener('click', async () => {
    const resEl = document.getElementById('meta-results');
    resEl.innerHTML = '<p style="padding: 20px;">Sincronizando com Meta Graph API...</p>';
    try {
      const res = await fetch('/api/meta/sync');
      const json = await res.json();
      if (json.success) {
        let rows = json.data.map(c => `<tr><td>${c.campaign_name}</td><td>R$ ${c.spend}</td><td>${c.impressions}</td><td>${c.clicks}</td></tr>`).join('');
        resEl.innerHTML = `
          <table class="admin-table">
            <thead><tr><th>Campanha</th><th>Gasto</th><th>Impressões</th><th>Cliques</th></tr></thead>
            <tbody>${rows}</tbody>
          </table>
        `;
      } else {
        resEl.innerHTML = `<p style="padding: 20px; color:red;">Erro: ${json.error}</p>`;
      }
    } catch(e) {
      resEl.innerHTML = '<p style="padding: 20px; color:red;">Erro de conexão.</p>';
    }
  });
}

function renderDiagnostics(container) {
  container.innerHTML = `
    <div class="dashboard-grid">
      <div class="stat-card">
        <h3>Meta Pixel (Navegador)</h3>
        <div class="stat-value" style="color:#10b981;">ATIVO</div>
      </div>
      <div class="stat-card">
        <h3>Conversions API (Servidor)</h3>
        <div class="stat-value" style="color:#10b981;">ATIVA</div>
      </div>
      <div class="stat-card">
        <h3>Marketing API</h3>
        <div class="stat-value" style="color:#f59e0b;">AGUARDANDO</div>
      </div>
    </div>
  `;
}
