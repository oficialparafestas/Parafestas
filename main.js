// Configurações Globais
const WHATSAPP_NUMBER = "5594991262090";
const WHATSAPP_MESSAGE = "Olá! Vim do site da Parafestas e gostaria de solicitar um orçamento.";

import galeria1 from './IMG/GALERIA/galeria-1.jpeg';
import galeria2 from './IMG/GALERIA/galeria-2.jpeg';
import galeria3 from './IMG/GALERIA/galeria-3.jpeg';
import galeria4 from './IMG/GALERIA/galeria-4.jpeg';
import galeria5 from './IMG/GALERIA/galeria-5.jpeg';

// Função auxiliar para tracking
function trackEvent(eventName, eventData = {}) {
  // Push to DataLayer
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ event: eventName, ...eventData });
  
  // Push to Meta Pixel
  if (typeof fbq === 'function') {
    if (eventName === 'PageView' || eventName === 'ViewContent' || eventName === 'Lead') {
      fbq('track', eventName, eventData);
    } else {
      fbq('trackCustom', eventName, eventData);
    }
  }
  
  console.log(`[Tracking] ${eventName}`, eventData); // Apenas para debug no console
}

document.addEventListener('DOMContentLoaded', () => {
  initWhatsAppLinks();
  initHeaderScroll();
  initMobileMenu();
  initCounters();
  initCarousel();
  initGallery();
  initFAQ();
  initWeb3Forms();
  initScrollTracking();
  
  // Track ViewContent on load
  trackEvent('ViewContent');
});

// 1. WhatsApp Links Formatter
function initWhatsAppLinks() {
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  const waBaseUrl = isMobile ? 'whatsapp://send' : 'https://web.whatsapp.com/send';
  const finalUrl = `${waBaseUrl}?phone=${WHATSAPP_NUMBER}&text=${encodeURIComponent(WHATSAPP_MESSAGE)}`;
  
  document.querySelectorAll('[data-action="whatsapp"]').forEach(el => {
    el.href = finalUrl;
    if(!isMobile) el.target = "_blank";
    
    el.addEventListener('click', () => {
      trackEvent('WhatsappClick');
    });
  });

  document.querySelectorAll('[data-action="hero-cta"]').forEach(el => {
    el.addEventListener('click', () => {
      trackEvent('HeroCTA');
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
  const track = document.getElementById('carousel-track');
  const reviews = [
    { name: "Mariana Souza", role: "Mãe", text: "Fiz o aniversário de 5 anos do meu filho e encontrei tudo na Parafestas! Os balões personalizados ficaram perfeitos e o atendimento via WhatsApp foi super rápido. Recomendo muito!", stars: "★★★★★" },
    { name: "Camila Rodrigues", role: "Assessora de Eventos", text: "Como organizadora de casamentos, preciso de fornecedores pontuais e com produtos premium. A Parafestas sempre entrega com excelência. Os descartáveis de luxo são um sucesso.", stars: "★★★★★" },
    { name: "Juliana Mendes", role: "Noiva", text: "Comprei os itens para o meu Chá Bar e a qualidade impressionou todos os convidados. O orçamento foi feito na hora e a entrega foi impecável.", stars: "★★★★★" },
    { name: "Roberto Silva", role: "RH / Corporativo", text: "Todo final de ano compramos os artigos da festa da empresa com eles. A variedade e o custo-benefício são incomparáveis na região.", stars: "★★★★★" }
  ];

  // Duplicar para loop infinito suave
  const items = [...reviews, ...reviews];
  
  let html = '';
  items.forEach(review => {
    html += `
      <div class="review-card">
        <div class="review-stars">${review.stars}</div>
        <p class="review-text">"${review.text}"</p>
        <div class="review-author">
          <div class="author-avatar">${review.name.charAt(0)}</div>
          <div>
            <div class="author-name">${review.name}</div>
            <div class="author-role">${review.role}</div>
          </div>
        </div>
      </div>
    `;
  });
  
  if (track) {
    track.innerHTML = html;
    
    // Animação CSS-based via JS para controle preciso
    let position = 0;
    const speed = 1; // pixels por frame
    
    function step() {
      position -= speed;
      // Se rolou metade (os itens originais), reseta para loop infinito
      if (Math.abs(position) >= track.scrollWidth / 2) {
        position = 0;
      }
      track.style.transform = `translateX(${position}px)`;
      requestAnimationFrame(step);
    }
    
    // Pausar no hover
    track.addEventListener('mouseenter', () => track.style.animationPlayState = 'paused');
    track.addEventListener('mouseleave', () => track.style.animationPlayState = 'running');
    
    requestAnimationFrame(step);
  }
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
