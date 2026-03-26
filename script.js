/* ==========================================
   Nexora — Landing Page JavaScript
   ========================================== */

document.addEventListener('DOMContentLoaded', () => {

  // ---- Theme Toggle ----
  initTheme();

  // ---- Particles Background ----
  initParticles();

  // ---- Navbar Scroll Effect ----
  initNavbar();

  // ---- Mobile Menu ----
  initMobileMenu();

  // ---- Scroll Reveal Animations ----
  initScrollReveal();

  // ---- 3D Robot Mouse Tracking ----
  initRobotTracking();

  // ---- Stats Counter ----
  initStatsCounter();

  // ---- Floating Chatbot ----
  initChatbot();

  // ---- Chat Preview Interaction ----
  initChatPreview();

  // ---- Smooth Scroll ----
  initSmoothScroll();
});

/* =============================================
   THEME TOGGLE
   ============================================= */
function initTheme() {
  const themeToggle = document.getElementById('themeToggle');
  if (!themeToggle) return;

  themeToggle.addEventListener('click', () => {
    const isLight = document.documentElement.getAttribute('data-theme') === 'light';
    
    if (isLight) {
      document.documentElement.removeAttribute('data-theme');
      localStorage.setItem('nexora-theme', 'dark');
    } else {
      document.documentElement.setAttribute('data-theme', 'light');
      localStorage.setItem('nexora-theme', 'light');
    }
  });
}

/* =============================================
   PARTICLES BACKGROUND
   ============================================= */
function initParticles() {
  const canvas = document.getElementById('particles-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let particles = [];
  let animationId;

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  resize();
  window.addEventListener('resize', resize);

  class Particle {
    constructor() {
      this.reset();
    }

    reset() {
      this.x = Math.random() * canvas.width;
      this.y = Math.random() * canvas.height;
      this.size = Math.random() * 2 + 0.5;
      this.speedX = (Math.random() - 0.5) * 0.5;
      this.speedY = (Math.random() - 0.5) * 0.5;
      this.opacity = Math.random() * 0.5 + 0.1;
      this.pulse = Math.random() * Math.PI * 2;
    }

    update() {
      this.x += this.speedX;
      this.y += this.speedY;
      this.pulse += 0.02;
      this.opacity = 0.1 + Math.sin(this.pulse) * 0.2;

      if (this.x < 0 || this.x > canvas.width) this.speedX *= -1;
      if (this.y < 0 || this.y > canvas.height) this.speedY *= -1;
    }

    draw() {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(0, 255, 136, ${this.opacity})`;
      ctx.fill();

      // Glow
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size * 3, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(0, 255, 136, ${this.opacity * 0.15})`;
      ctx.fill();
    }
  }

  // Create particles
  const count = Math.min(80, Math.floor(window.innerWidth / 20));
  for (let i = 0; i < count; i++) {
    particles.push(new Particle());
  }

  function connectParticles() {
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 150) {
          const op = (1 - dist / 150) * 0.08;
          ctx.beginPath();
          ctx.strokeStyle = `rgba(0, 255, 136, ${op})`;
          ctx.lineWidth = 0.5;
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.stroke();
        }
      }
    }
  }

  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach(p => {
      p.update();
      p.draw();
    });
    connectParticles();
    animationId = requestAnimationFrame(animate);
  }

  animate();
}

/* =============================================
   NAVBAR SCROLL
   ============================================= */
function initNavbar() {
  const navbar = document.getElementById('navbar');
  if (!navbar) return;

  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  });

  // Active link highlighting
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-links a:not(.nav-cta)');

  window.addEventListener('scroll', () => {
    let current = '';
    sections.forEach(section => {
      const top = section.offsetTop - 100;
      if (window.scrollY >= top) {
        current = section.getAttribute('id');
      }
    });

    navLinks.forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('href') === `#${current}`) {
        link.classList.add('active');
      }
    });
  });
}

/* =============================================
   MOBILE MENU
   ============================================= */
function initMobileMenu() {
  const toggle = document.getElementById('menuToggle');
  const navLinks = document.getElementById('navLinks');
  if (!toggle || !navLinks) return;

  toggle.addEventListener('click', () => {
    toggle.classList.toggle('active');
    navLinks.classList.toggle('open');
    document.body.style.overflow = navLinks.classList.contains('open') ? 'hidden' : '';
  });

  // Close on link click
  navLinks.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      toggle.classList.remove('active');
      navLinks.classList.remove('open');
      document.body.style.overflow = '';
    });
  });
}

/* =============================================
   SCROLL REVEAL
   ============================================= */
function initScrollReveal() {
  const reveals = document.querySelectorAll('.reveal');
  if (!reveals.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.15,
    rootMargin: '0px 0px -50px 0px'
  });

  reveals.forEach(el => observer.observe(el));
}

/* =============================================
   3D ROBOT MOUSE TRACKING
   ============================================= */
function initRobotTracking() {
  const modelViewer = document.getElementById('robot3d');
  if (!modelViewer || modelViewer.tagName !== 'MODEL-VIEWER') return;

  // Mouse-based orbit interaction: rotate the model slightly based on mouse position
  let isUserInteracting = false;

  modelViewer.addEventListener('camera-change', () => {
    // Let model-viewer handle its own camera
  });

  document.addEventListener('mousemove', (e) => {
    if (isUserInteracting) return;

    const deltaX = (e.clientX / window.innerWidth - 0.5) * 30;
    const deltaY = (e.clientY / window.innerHeight - 0.5) * 15;

    const theta = deltaX;
    const phi = 75 + deltaY;
    const radius = modelViewer.getCameraOrbit().radius;

    modelViewer.cameraOrbit = `${theta}deg ${phi}deg ${radius}`;
  });

  modelViewer.addEventListener('pointerdown', () => { isUserInteracting = true; });
  modelViewer.addEventListener('pointerup', () => {
    setTimeout(() => { isUserInteracting = false; }, 2000);
  });
}

/* =============================================
   STATS COUNTER ANIMATION
   ============================================= */
function initStatsCounter() {
  const statNumbers = document.querySelectorAll('.stat-item h3[data-count]');
  if (!statNumbers.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target;
        const target = parseInt(el.getAttribute('data-count'));
        animateCounter(el, target);
        observer.unobserve(el);
      }
    });
  }, { threshold: 0.5 });

  statNumbers.forEach(el => observer.observe(el));
}

function animateCounter(el, target) {
  let current = 0;
  const step = Math.ceil(target / 40);
  const suffix = el.textContent.includes('+') ? '+' : '';

  const timer = setInterval(() => {
    current += step;
    if (current >= target) {
      current = target;
      clearInterval(timer);
    }
    el.textContent = current + suffix;
  }, 40);
}

/* =============================================
   FLOATING CHATBOT
   ============================================= */
function initChatbot() {
  const fab = document.getElementById('chatbotFab');
  const panel = document.getElementById('chatbotPanel');
  const input = document.getElementById('floatingChatInput');
  const sendBtn = document.getElementById('floatingChatSend');
  const messages = document.getElementById('floatingChatMessages');
  const closeBtn = document.getElementById('chatCloseBtn');
  const typingEl = document.getElementById('floatingTyping');
  if (!fab || !panel) return;

  fab.addEventListener('click', () => {
    panel.classList.toggle('open');
    if (panel.classList.contains('open') && input) {
      setTimeout(() => input.focus(), 300);
    }
  });

  // Close button
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      panel.classList.remove('open');
    });
  }

  // Close panel when clicking outside
  document.addEventListener('click', (e) => {
    if (!panel.contains(e.target) && !fab.contains(e.target) && panel.classList.contains('open')) {
      panel.classList.remove('open');
    }
  });

  function scrollToBottom() {
    if (!messages) return;
    messages.scrollTo({ top: messages.scrollHeight, behavior: 'smooth' });
  }

  // Send message
  async function sendMessage() {
    if (!input || !input.value.trim() || !messages) return;
    const text = input.value.trim();

    // User message
    const userMsg = document.createElement('div');
    userMsg.className = 'chat-message user';
    userMsg.textContent = text;
    messages.insertBefore(userMsg, typingEl);

    input.value = '';
    scrollToBottom();

    // Show typing indicator
    if (typingEl) typingEl.classList.add('active');
    scrollToBottom();

    try {
      // Call Gemini API
      const response = await generateGeminiResponse(text);
      if (typingEl) typingEl.classList.remove('active');
      const botMsg = document.createElement('div');
      botMsg.className = 'chat-message bot';
      
      // Basic formatting for Markdown-like response
      let formattedRes = response.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      formattedRes = formattedRes.replace(/\n/g, '<br>');
      
      botMsg.innerHTML = formattedRes;
      messages.insertBefore(botMsg, typingEl);
    } catch (error) {
      if (typingEl) typingEl.classList.remove('active');
      const botMsg = document.createElement('div');
      botMsg.className = 'chat-message bot';
      botMsg.textContent = "عذراً، حدث خطأ أثناء الاتصال بالمرشد الذكي. يرجى المحاولة مرة أخرى لاحقاً.";
      messages.insertBefore(botMsg, typingEl);
    }
    scrollToBottom();
  }

  if (sendBtn) sendBtn.addEventListener('click', sendMessage);
  if (input) {
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') sendMessage();
    });
  }
}

/* =============================================
   GEMINI API INTEGRATION
   ============================================= */
const GEMINI_API_KEY = "AIzaSyByED0etQHnokzG8OCRX3QnBy2miXwViEo";
const SYSTEM_PROMPT = `أنت مرشد ذكي في منصة "Nexora" المخصصة لتنمية المهارات الرقمية في إنتاج مصادر التعلم. 
الكورسات المتاحة في المنصة حاليًا: 
1) الإطار المفاهيمي
2) الإنفوجرافيك
3) الاختبارات الإلكترونية
4) الألعاب الإلكترونية

مهمتك:
- أجب دائماً باللغة العربية.
- استخدم أسلوباً محفزاً، ودوداً، واحترافياً.
- اجعل إجاباتك مختصرة ومفيدة ومباشرة وفي صلب الموضوع.
- شجع المتعلم على استكشاف دورات المنصة عندما يكون ذلك مناسباً.`;

// Conversation history buffer to maintain context
let conversationHistory = [];

async function generateGeminiResponse(userMessage) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;
  
  // Add user message to history
  conversationHistory.push({ role: "user", parts: [{ text: userMessage }] });
  
  // Keep history short (last 10 messages)
  if (conversationHistory.length > 10) {
    conversationHistory = conversationHistory.slice(conversationHistory.length - 10);
  }

  const payload = {
    system_instruction: {
      parts: [{ text: SYSTEM_PROMPT }]
    },
    contents: conversationHistory,
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 500,
    }
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error('API Request failed');
  }

  const data = await response.json();
  const botAnswer = data.candidates[0].content.parts[0].text;
  
  // Add bot response to history
  conversationHistory.push({ role: "model", parts: [{ text: botAnswer }] });
  
  return botAnswer;
}

/* =============================================
   CHAT PREVIEW INTERACTION
   ============================================= */
function initChatPreview() {
  const input = document.getElementById('chatInput');
  const sendBtn = document.getElementById('chatSendBtn');
  const messages = document.getElementById('chatMessages');
  const typingEl = document.getElementById('chatTyping');
  if (!input || !messages) return;

  function scrollToBottom() {
    messages.scrollTo({ top: messages.scrollHeight, behavior: 'smooth' });
  }

  async function sendPreviewMessage() {
    if (!input.value.trim()) return;
    const text = input.value.trim();

    const userMsg = document.createElement('div');
    userMsg.className = 'chat-message user';
    userMsg.textContent = text;
    messages.insertBefore(userMsg, typingEl);

    input.value = '';
    scrollToBottom();

    // Show typing indicator
    if (typingEl) typingEl.classList.add('active');
    scrollToBottom();

    try {
      // Call Gemini API
      const response = await generateGeminiResponse(text);
      if (typingEl) typingEl.classList.remove('active');
      const botMsg = document.createElement('div');
      botMsg.className = 'chat-message bot';
      
      // Basic formatting
      let formattedRes = response.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      formattedRes = formattedRes.replace(/\n/g, '<br>');
      
      botMsg.innerHTML = formattedRes;
      messages.insertBefore(botMsg, typingEl);
    } catch (error) {
      if (typingEl) typingEl.classList.remove('active');
      const botMsg = document.createElement('div');
      botMsg.className = 'chat-message bot';
      botMsg.textContent = "عذراً، حدث خطأ أثناء الاتصال بالمرشد الذكي.";
      messages.insertBefore(botMsg, typingEl);
    }
    scrollToBottom();
  }

  if (sendBtn) sendBtn.addEventListener('click', sendPreviewMessage);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') sendPreviewMessage();
  });
}

/* =============================================
   SMOOTH SCROLL
   ============================================= */
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      e.preventDefault();
      const target = document.querySelector(anchor.getAttribute('href'));
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });
}
