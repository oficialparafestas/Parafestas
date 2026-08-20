import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';
import { initDb, getDb } from './db.js';

dotenv.config();

const app = express();
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(cookieParser());

const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'secret';

// Middleware para verificar auth nas rotas /api/admin
function authenticateToken(req, res, next) {
  const token = req.cookies.admin_token;
  if (!token) return res.status(401).json({ error: 'Acesso negado. Token não fornecido.' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Token inválido ou expirado.' });
    req.user = user;
    next();
  });
}

// ==========================================
// AUTHENTICATION
// ==========================================
app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  if (username === process.env.ADMIN_USER && password === process.env.ADMIN_PASS) {
    const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: '8h' });
    res.cookie('admin_token', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production' });
    return res.json({ success: true, token });
  }
  return res.status(401).json({ success: false, error: 'Credenciais inválidas' });
});

app.post('/api/auth/logout', (req, res) => {
  res.clearCookie('admin_token');
  return res.json({ success: true });
});

app.get('/api/auth/verify', authenticateToken, (req, res) => {
  return res.json({ success: true, user: req.user });
});

// ==========================================
// TRACKING & CAPI (Frontend Facing)
// ==========================================

async function sendCAPI(eventName, eventData, eventId, reqInfo) {
  const PIXEL_ID = process.env.META_PIXEL_ID;
  const CAPI_TOKEN = process.env.META_CAPI_TOKEN;
  
  if (!PIXEL_ID || !CAPI_TOKEN) {
    return; // Log?
  }

  const payload = {
    data: [{
      event_name: eventName,
      event_time: Math.floor(Date.now() / 1000),
      event_id: eventId,
      action_source: 'website',
      event_source_url: reqInfo.url || 'https://parafestasoficial.com.br',
      user_data: {
        client_user_agent: reqInfo.userAgent,
        client_ip_address: reqInfo.ip,
        fbc: reqInfo.fbc,
        fbp: reqInfo.fbp,
      },
      custom_data: eventData
    }]
  };

  if (process.env.META_TEST_EVENT_CODE) {
    payload.test_event_code = process.env.META_TEST_EVENT_CODE;
  }

  try {
    const response = await axios.post(`https://graph.facebook.com/${process.env.META_API_VERSION || 'v19.0'}/${PIXEL_ID}/events?access_token=${CAPI_TOKEN}`, payload);
    const db = await getDb();
    await db.run('INSERT INTO integration_logs (provider, action, status, message) VALUES (?, ?, ?, ?)', ['Meta CAPI', 'Event Send', 'Success', `${eventName} - ${eventId}`]);
  } catch (err) {
    console.error('[CAPI Error]', err.response?.data || err.message);
    const db = await getDb();
    await db.run('INSERT INTO integration_logs (provider, action, status, message) VALUES (?, ?, ?, ?)', ['Meta CAPI', 'Event Error', 'Error', JSON.stringify(err.response?.data || err.message)]);
  }
}

app.post('/api/events', async (req, res) => {
  const { eventId, eventName, visitorId, sessionId, url, metadata, fbp, fbc } = req.body;
  
  if (!eventName || !eventId) {
    return res.status(400).json({ error: 'eventName e eventId obrigatórios.' });
  }

  const db = await getDb();
  
  try {
    await db.run(
      'INSERT INTO events (id, event_id, visitor_id, session_id, event_name, page_url, metadata) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [uuidv4(), eventId, visitorId, sessionId, eventName, url, JSON.stringify(metadata || {})]
    );

    // Envia assíncrono para a CAPI
    sendCAPI(eventName, metadata, eventId, {
      ip: req.ip || req.headers['x-forwarded-for'] || '',
      userAgent: req.headers['user-agent'] || '',
      url, fbc, fbp
    });

    res.json({ success: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false });
  }
});

// ==========================================
// LEADS (Frontend Facing)
// ==========================================
app.post('/api/leads', async (req, res) => {
  const { eventId, visitorId, name, email, phone, source, medium, campaign, score, temperature } = req.body;
  const db = await getDb();
  
  try {
    const leadId = uuidv4();
    await db.run(
      'INSERT INTO leads (id, visitor_id, name, email, phone, source, medium, campaign, score, temperature) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [leadId, visitorId, name, email, phone, source, medium, campaign, score || 0, temperature || 'Frio']
    );

    // Registra evento CAPI de Lead também se desejar (ou deixa para ser disparado pelo frontend/trackEvent)
    res.json({ success: true, leadId });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false });
  }
});

// ==========================================
// ADMIN API (Protected routes)
// ==========================================
app.get('/api/admin/dashboard', authenticateToken, async (req, res) => {
  const db = await getDb();
  
  try {
    const totalVisitors = await db.get('SELECT COUNT(DISTINCT visitor_id) as count FROM sessions');
    const totalLeads = await db.get('SELECT COUNT(*) as count FROM leads');
    const totalWhatsapp = await db.get('SELECT COUNT(*) as count FROM events WHERE event_name = ?', ['WhatsappClick']);
    const hotLeads = await db.get('SELECT COUNT(*) as count FROM leads WHERE temperature IN (?, ?)', ['Quente', 'Muito quente']);
    
    // Resumo dos últimos leads
    const recentLeads = await db.all('SELECT * FROM leads ORDER BY created_at DESC LIMIT 10');
    
    // Contagem de eventos para gráficos
    const eventsBreakdown = await db.all('SELECT event_name, COUNT(*) as count FROM events GROUP BY event_name');
    
    res.json({
      success: true,
      data: {
        visitors: totalVisitors.count,
        leads: totalLeads.count,
        whatsapp: totalWhatsapp.count,
        hotLeads: hotLeads.count,
        recentLeads,
        eventsBreakdown
      }
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, error: 'Database error' });
  }
});

// ==========================================
// META ADS API (Admin Dashboard)
// ==========================================
app.get('/api/meta/sync', authenticateToken, async (req, res) => {
  const AD_ACCOUNT = process.env.META_AD_ACCOUNT_ID;
  const TOKEN = process.env.META_MARKETING_ACCESS_TOKEN;
  const VERSION = process.env.META_API_VERSION || 'v19.0';
  
  if (!AD_ACCOUNT || !TOKEN) {
    return res.status(400).json({ success: false, error: 'Meta Ads config missing in .env' });
  }

  try {
    const url = `https://graph.facebook.com/${VERSION}/act_${AD_ACCOUNT}/insights?fields=campaign_id,campaign_name,spend,impressions,reach,clicks,ctr,cpc,cpm,actions&date_preset=last_30d&level=campaign&access_token=${TOKEN}`;
    const response = await axios.get(url);
    
    const db = await getDb();
    
    for (const item of response.data.data) {
      // Upsert
      await db.run(`
        INSERT INTO meta_campaign_metrics 
        (campaign_id, campaign_name, date, spend, impressions, reach, clicks, ctr, cpc, cpm) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(campaign_id) DO UPDATE SET
        campaign_name=excluded.campaign_name, spend=excluded.spend, impressions=excluded.impressions,
        reach=excluded.reach, clicks=excluded.clicks, ctr=excluded.ctr, cpc=excluded.cpc, cpm=excluded.cpm, updated_at=CURRENT_TIMESTAMP
      `, [
        item.campaign_id, item.campaign_name, item.date_start, 
        item.spend, item.impressions, item.reach, item.clicks, 
        item.ctr, item.cpc, item.cpm
      ]);
    }

    res.json({ success: true, data: response.data.data });
  } catch (e) {
    console.error('[Meta Ads Error]', e.response?.data || e.message);
    res.status(500).json({ success: false, error: 'Error fetching Meta Ads data' });
  }
});

// ==========================================
// INICIALIZAÇÃO
// ==========================================
initDb().then(() => {
  app.listen(PORT, () => {
    console.log(`[SERVER] API rodando na porta ${PORT}`);
  });
}).catch(err => {
  console.error('[DB] Erro de inicialização', err);
});
