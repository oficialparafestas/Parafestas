// Configurações Globais
const WHATSAPP_NUMBER = "5594991262090";
const WHATSAPP_MESSAGE = "Olá! Vim do site da Parafestas e gostaria de solicitar um orçamento.";

import galeria1 from './IMG/GALERIA/galeria-1.webp';
import galeria2 from './IMG/GALERIA/galeria-2.webp';
import galeria3 from './IMG/GALERIA/galeria-3.webp';
import galeria4 from './IMG/GALERIA/galeria-4.webp';
import galeria5 from './IMG/GALERIA/galeria-5.webp';

// Função UUID Generator simples
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
  return null;
}

// Função auxiliar para UTMs e Scoring
function initTrackingSystem() {
  // Visitor ID (Persistente)
  let visitorId = getCookie('pf_visitor_id');
  if (!visitorId) {
    visitorId = generateUUID();
    document.cookie = `pf_visitor_id=${visitorId}; path=/; max-age=${60*60*24*365}`;
  }
  
  // Session ID (Por sessão)
  if (!sessionStorage.getItem('pf_session_id')) {
    sessionStorage.setItem('pf_session_id', generateUUID());
  }

  // FBP / FBC
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.has('fbclid')) {
    const fbclid = urlParams.get('fbclid');
    document.cookie = `_fbc=fb.1.${Date.now()}.${fbclid}; path=/; max-age=${60*60*24*90}`;
  }

  // Captura UTMs da URL
  const utms = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'];
  let currentUtms = JSON.parse(localStorage.getItem('pf_utms') || '{}');
  
  let updated = false;
  utms.forEach(utm => {
    if (urlParams.has(utm)) {
      currentUtms[utm] = urlParams.get(utm);
      updated = true;
    }
  });
  
  if (updated) {
    localStorage.setItem('pf_utms', JSON.stringify(currentUtms));
  }
}

// Retorna Score atual
function getLeadScore() {
  return parseInt(localStorage.getItem('pf_lead_score') || '0');
}

// Incrementa Score
function addScore(points) {
  let score = getLeadScore();
  score += points;
  if (score > 100) score = 100;
  localStorage.setItem('pf_lead_score', score);
}

function getTemperature(score) {
  if (score < 40) return 'Frio';
  if (score < 70) return 'Morno';
  if (score < 90) return 'Quente';
  return 'Muito quente';
}

// Função auxiliar para tracking unificado
function trackEvent(eventName, eventData = {}) {
  // Score System
  if (eventName === 'PageView') addScore(5);
  if (eventName === 'Scroll25') addScore(5);
  if (eventName === 'Scroll50') addScore(5);
  if (eventName === 'Scroll75') addScore(10);
  if (eventName === 'Scroll100') addScore(10);
  if (eventName === 'Time30') addScore(5);
  if (eventName === 'Time60') addScore(10);
  if (eventName === 'WhatsappClick') addScore(30);
  if (eventName === 'Lead') addScore(40);

  // Push to DataLayer
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ event: eventName, ...eventData });
  
  // Geração do event_id para deduplicação
  const eventId = generateUUID();
  const utms = JSON.parse(localStorage.getItem('pf_utms') || '{}');
  const metadata = { ...eventData, ...utms, score: getLeadScore(), temperature: getTemperature(getLeadScore()) };

  // 1. Enviar para Meta Pixel (Browser)
  if (typeof fbq === 'function') {
    if (eventName === 'PageView' || eventName === 'ViewContent' || eventName === 'Lead' || eventName === 'Contact') {
      fbq('track', eventName, eventData, { eventID: eventId });
    } else {
      fbq('trackCustom', eventName, eventData, { eventID: eventId });
    }
  }

  // 2. Enviar para Servidor CAPI e Banco de Dados (API Server-Side)
  fetch('/api/events', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      eventId,
      eventName,
      visitorId: getCookie('pf_visitor_id'),
      sessionId: sessionStorage.getItem('pf_session_id'),
      url: window.location.href,
      metadata,
      fbp: getCookie('_fbp'),
      fbc: getCookie('_fbc')
    })
  }).catch(err => console.error('[Tracking Error]', err));
  
  console.log(`[Tracking] ${eventName} | Score: ${getLeadScore()}`);
}

// Save Lead to DB (Server-Side)
export async function saveLeadToDB(leadData) {
  const utms = JSON.parse(localStorage.getItem('pf_utms') || '{}');
  const score = getLeadScore();
  
  try {
    await fetch('/api/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        visitorId: getCookie('pf_visitor_id'),
        name: leadData.name || '',
        email: leadData.email || '',
        phone: leadData.phone || leadData.whatsapp || '',
        source: utms.utm_source || 'orgânico',
        medium: utms.utm_medium || '',
        campaign: utms.utm_campaign || '',
        score: score,
        temperature: getTemperature(score)
      })
    });
  } catch (err) {
    console.error('Falha ao salvar lead', err);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  initTrackingSystem();
  
  initClickTracking();
  initHeaderScroll();
  initMobileMenu();
  initCounters();
  initCarousel();
  initGallery();
  initFAQ();
  initWeb3Forms();
  initScrollTracking();
  initTimeTracking();
  
  trackEvent('PageView');
});

// 1. Click Tracking (WhatsApp, Instagram, etc)
function initClickTracking() {
  // O href agora é nativo no HTML para não perder cliques.
  // Apenas rastreia o clique.
  
  document.querySelectorAll('[data-action="whatsapp"]').forEach(el => {
    el.addEventListener('click', () => {
      trackEvent('WhatsappClick');
    });
  });

  document.querySelectorAll('[data-action="hero-cta"]').forEach(el => {
    el.addEventListener('click', () => {
      trackEvent('HeroCTA');
    });
  });

  document.querySelectorAll('a[href*="instagram.com"]').forEach(el => {
    el.addEventListener('click', () => {
      trackEvent('InstagramClick');
    });
  });
}

// 2. Header Scroll Effect
function initHeaderScroll() {
  const header = document.getElementById('header');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  });
}

// 2.5 Mobile Menu Toggle
function initMobileMenu() {
  const btn = document.getElementById('mobile-menu-btn');
  const nav = document.querySelector('.nav-desktop');
  
  if(btn && nav) {
    btn.addEventListener('click', () => {
      const isVisible = nav.style.display === 'flex';
      if (isVisible) {
        nav.style.display = 'none';
        btn.classList.remove('active');
      } else {
        nav.style.display = 'flex';
        nav.style.flexDirection = 'column';
        nav.style.position = 'absolute';
        nav.style.top = '80px';
        nav.style.left = '0';
        nav.style.width = '100%';
        nav.style.background = 'var(--glass-bg)';
        nav.style.backdropFilter = 'blur(10px)';
        nav.style.padding = '20px';
        nav.style.boxShadow = '0 10px 15px rgba(0,0,0,0.05)';
        btn.classList.add('active');
      }
    });

    // Fechar ao clicar em link
    nav.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        if(window.innerWidth <= 768) {
          nav.style.display = 'none';
          btn.classList.remove('active');
        }
      });
    });
    
    // Reset estilo no resize
    window.addEventListener('resize', () => {
      if(window.innerWidth > 768) {
        nav.style.display = 'flex';
        nav.style.flexDirection = 'row';
        nav.style.position = 'static';
        nav.style.background = 'transparent';
        nav.style.padding = '0';
        nav.style.boxShadow = 'none';
      } else {
        nav.style.display = 'none';
        btn.classList.remove('active');
      }
    });
  }
}

// 3. Animated Counters
function initCounters() {
  const counters = document.querySelectorAll('.counter');
  const speed = 200;

  const animate = (counter) => {
    const target = +counter.getAttribute('data-target');
    const count = +counter.innerText.replace('+', '');
    const inc = target / speed;

    if (count < target) {
      counter.innerText = '+' + Math.ceil(count + inc);
      setTimeout(() => animate(counter), 10);
    } else {
      // Add formatting for thousands (e.g. 20.000)
      if (target >= 1000) {
        counter.innerText = '+' + target.toLocaleString('pt-BR');
      } else {
        counter.innerText = '+' + target;
      }
    }
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        animate(entry.target);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });

  counters.forEach(counter => observer.observe(counter));
}

// 4. Social Proof Carousel
function initCarousel() {
  // Migrado para HTML/CSS estático para melhor LCP e usabilidade nativa no mobile.
}

// 5. Dynamic Gallery (Pinterest Layout)
function initGallery() {
  const grid = document.getElementById('pinterest-grid');
  const images = [
    { url: galeria1 },
    { url: galeria2 },
    { url: galeria3 },
    { url: galeria4 },
    { url: galeria5 }
  ];

  if (grid) {
    let html = '';
    images.forEach(img => {
      html += `
        <div class="gallery-item">
          <img src="${img.url}" loading="lazy">
        </div>
      `;
    });
    grid.innerHTML = html;

    // Track Gallery View when scrolled into view
    const observer = new IntersectionObserver((entries) => {
      if(entries[0].isIntersecting) {
        trackEvent('GalleryView');
        observer.disconnect();
      }
    });
    observer.observe(grid);
  }
}

// 6. FAQ Accordion
function initFAQ() {
  const container = document.getElementById('faq-accordion');
  const faqs = [
    { q: "Como faço para solicitar um orçamento completo?", a: "Basta preencher nosso formulário de captação acima ou clicar no botão do WhatsApp. Um de nossos especialistas montará um orçamento personalizado para a sua necessidade." },
    { q: "Vocês trabalham com personalizados?", a: "Sim! Criamos lembrancinhas e caixas exclusivas seguindo a identidade visual e o tema do seu evento." },
    { q: "Quais as formas de pagamento aceitas?", a: "Aceitamos Cartões de Crédito (com parcelamento), PIX, Transferência Bancária e Dinheiro." },
    { q: "Qual a antecedência ideal para pedir os artigos de festa?", a: "Para garantir todos os produtos em estoque e os itens personalizados, recomendamos solicitar o orçamento com no mínimo 15 a 30 dias de antecedência do evento." }
  ];

  if (container) {
    let html = '';
    faqs.forEach((faq, index) => {
      html += `
        <div class="accordion-item" data-index="${index}">
          <div class="accordion-header">
            ${faq.q}
            <span class="accordion-icon">+</span>
          </div>
          <div class="accordion-content">
            <p>${faq.a}</p>
          </div>
        </div>
      `;
    });
    container.innerHTML = html;

    document.querySelectorAll('.accordion-header').forEach(header => {
      header.addEventListener('click', () => {
        const item = header.parentElement;
        const isActive = item.classList.contains('active');
        
        // Fechar todos
        document.querySelectorAll('.accordion-item').forEach(el => {
          el.classList.remove('active');
          el.querySelector('.accordion-icon').innerText = '+';
        });

        if (!isActive) {
          item.classList.add('active');
          item.querySelector('.accordion-icon').innerText = '-';
          trackEvent('FAQInteraction', { question: faqs[item.getAttribute('data-index')].q });
        }
      });
    });
  }
}

// 7. Web3Forms Integration & Tracking
function initWeb3Forms() {
  const form = document.getElementById('lead-form');
  const formSuccess = document.getElementById('form-success');
  let formStarted = false;

  if (form) {
    // Track Form Start
    form.addEventListener('input', () => {
      if (!formStarted) {
        formStarted = true;
        trackEvent('FormStart');
      }
    }, { once: true });

    form.addEventListener('submit', async function(e) {
      e.preventDefault();
      
      const submitBtn = form.querySelector('.btn-submit');
      const originalText = submitBtn.innerText;
      submitBtn.innerText = 'Enviando...';
      submitBtn.disabled = true;

      trackEvent('FormSubmit');

      // Web3Forms Submit
      const formData = new FormData(form);
      const object = Object.fromEntries(formData);
      const json = JSON.stringify(object);

      try {
        const response = await fetch('https://api.web3forms.com/submit', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: json
        });
        
        const result = await response.json();
        if (response.status == 200) {
          // Success
          form.classList.add('hidden');
          formSuccess.classList.remove('hidden');
          
          // Fire Lead Event
          trackEvent('Lead', {
            event_type: object.event_type,
            budget: object.budget || 'N/A'
          });

          // Save Lead to DB
          saveLeadToDB(object);

        } else {
          console.error(result);
          alert('Ocorreu um erro ao enviar. Por favor, tente pelo WhatsApp.');
        }
      } catch (error) {
        console.error(error);
        alert('Ocorreu um erro na conexão. Por favor, chame no WhatsApp.');
      } finally {
        submitBtn.innerText = originalText;
        submitBtn.disabled = false;
        form.reset();
        formStarted = false; // reset for next time
      }
    });

    // Form Back Button
    document.getElementById('form-back').addEventListener('click', () => {
      formSuccess.classList.add('hidden');
      form.classList.remove('hidden');
    });
  }
}

// 8. Scroll Depth Tracking
function initScrollTracking() {
  const depths = [25, 50, 75, 100];
  const tracked = new Set();

  window.addEventListener('scroll', () => {
    const scrollPercent = Math.round((window.scrollY + window.innerHeight) / document.documentElement.scrollHeight * 100);
    
    depths.forEach(depth => {
      if (scrollPercent >= depth && !tracked.has(depth)) {
        tracked.add(depth);
        trackEvent(`Scroll${depth}`);
      }
    });
  });
}

// 9. Time on Page Tracking
function initTimeTracking() {
  const timers = [
    { time: 30000, event: 'Time30', fired: false },
    { time: 60000, event: 'Time60', fired: false }
  ];

  timers.forEach(t => {
    setTimeout(() => {
      if (!t.fired) {
        t.fired = true;
        trackEvent(t.event);
      }
    }, t.time);
  });
}
