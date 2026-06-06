/* ==========================================
   Nexora — Landing Page JavaScript
   ========================================== */

import { auth, db, onAuthStateChanged, signOut, doc, getDoc, collection, getDocs } from './firebase-config.js';

let currentUserData = null; // Store fetched user details globally within this module

/* ---- Course Navigation with Auth Check ---- */
window.navigateToCourse = function(courseId) {
  // Security: Validate courseId is a valid number
  const safeId = parseInt(courseId);
  if (isNaN(safeId) || safeId < 1 || safeId > 10) return;
  
  if (auth.currentUser) {
    window.location.href = `course.html?id=${safeId}`;
  } else {
    window.location.href = `login.html?redirect=${safeId}`;
  }
};

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
  // initChatbot(); // Now handled globally in js/chatbot.js

  // ---- Chat Preview Interaction ----
  initChatPreview();

  // ---- Smooth Scroll ----
  initSmoothScroll();

  // ---- Auth Status in Navbar ----
  initAuthStatus();
});

/* =============================================
   AUTH STATUS IN NAVBAR
   ============================================= */
function initAuthStatus() {
  const userProfile = document.getElementById('userProfile');
  const userNameDisplay = document.getElementById('userNameDisplay');
  const navLoginBtn = document.getElementById('navLoginBtn');
  const navLogoutBtn = document.getElementById('navLogoutBtn');

  onAuthStateChanged(auth, async (user) => {
    if (user) {
      if (navLoginBtn) navLoginBtn.style.display = 'none';
      if (userProfile) userProfile.style.display = 'flex';
      
      // Fetch user name from Firestore
      try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          currentUserData = { id: user.uid, ...userDoc.data() };
          if (userNameDisplay) {
            userNameDisplay.textContent = currentUserData.name || user.displayName || 'المتعلم';
          }
        } else {
          currentUserData = { id: user.uid, email: user.email };
          if (userNameDisplay) userNameDisplay.textContent = user.displayName || 'المتعلم';
        }
      } catch (e) {
        console.error("Error fetching user data:", e);
        currentUserData = { id: user.uid, email: user.email };
        if (userNameDisplay) userNameDisplay.textContent = user.displayName || 'المتعلم';
      }

      // Load Certificates
      loadUserCertificates(user.uid);
      
      // Show Navbar Link
      const navCertLink = document.getElementById('navCertLink');
      if (navCertLink) navCertLink.style.display = 'inline-flex';
    } else {
      currentUserData = null;
      if (navLoginBtn) navLoginBtn.style.display = 'inline-flex';
      if (userProfile) userProfile.style.display = 'none';
      
      // Hide Navbar Link
      const navCertLink = document.getElementById('navCertLink');
      if (navCertLink) navCertLink.style.display = 'none';

      // Hide Certificates Section
      const certSection = document.getElementById('myCertificates');
      if (certSection) certSection.style.display = 'none';
    }
  });

  if (navLogoutBtn) {
    navLogoutBtn.addEventListener('click', async () => {
      await signOut(auth);
      window.location.reload();
    });
  }
}

/* =============================================
   LOAD AND RENDER CERTIFICATES
   ============================================= */
async function loadUserCertificates(userId) {
  const certSection = document.getElementById('myCertificates');
  const certGrid = document.getElementById('certificatesGrid');
  if (!certSection || !certGrid) return;

  // Show section immediately with loading state
  certSection.style.display = 'block';
  certGrid.innerHTML = `
    <div style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--text-muted);">
      <i class="ph ph-circle-notch ph-spin" style="font-size: 2rem; margin-bottom: 12px; display: block;"></i>
      جاري تحميل شهاداتك...
    </div>
  `;

  try {
    // Read certificates from progress documents (same path that already works)
    const progressSnapshot = await getDocs(collection(db, "users", userId, "progress"));
    const certs = [];
    
    progressSnapshot.forEach(pDoc => {
      const pData = pDoc.data();
      
      if (pData.certificateIssued) {
        // Check for new format (certMeta saved alongside progress)
        if (pData.certMeta) {
          certs.push(pData.certMeta);
        } else {
          // Fallback: Build cert card from progress data + course data
          const courseId = parseInt(pDoc.id);
          // Access COURSES_DATA from global scope (loaded via script tag)
          const coursesArr = (typeof COURSES_DATA !== 'undefined') ? COURSES_DATA : [];
          const crs = coursesArr.find(c => c.id == courseId);
          if (crs) {
            const pct = pData.postTestScore ? Math.round((pData.postTestScore / crs.questions.length) * 100) : '—';
            certs.push({
              courseId: crs.id,
              courseTitle: crs.title,
              courseIcon: crs.icon,
              score: pct,
              date: 'سجل سابق',
              certificateId: 'REC-' + courseId,
              timestamp: 0
            });
          }
        }
      }
    });

    console.log(`Found ${certs.length} certificates from progress documents.`);

    if (certs.length === 0) {
      certGrid.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 60px 20px; background: rgba(0, 255, 136, 0.02); border: 1px dashed var(--border-color); border-radius: var(--radius-lg);">
          <i class="ph ph-certificate" style="font-size: 3rem; color: var(--text-muted); margin-bottom: 20px; display: block;"></i>
          <h3 style="margin-bottom: 12px; font-weight: 700;">لا توجد شهادات حتى الآن</h3>
          <p style="color: var(--text-secondary); margin-bottom: 24px;">ابدأ رحلتك التعليمية الآن واجتز الاختبارات لتحصل على شهاداتك المعتمدة</p>
          <div style="display: flex; gap: 12px; justify-content: center;">
            <button class="btn-primary" onclick="window.location.reload()">
              تحديث البيانات
            </button>
            <button class="btn-secondary" onclick="document.getElementById('courses').scrollIntoView({behavior:'smooth'})">
              استكشف الكورسات
            </button>
          </div>
        </div>
      `;
      return;
    }

    // Sort: newest first
    certs.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

    certGrid.innerHTML = '';
    
    certs.forEach(cert => {
      const card = document.createElement('div');
      card.className = 'certificate-card';
      
      const iconDiv = document.createElement('div');
      iconDiv.className = 'cert-card-icon';
      const iconI = document.createElement('i');
      // Ensure courseIcon doesn't contain malicious classes
      const safeIcon = (cert.courseIcon || 'ph-certificate').split(' ')[0];
      iconI.className = `ph ${safeIcon}`;
      iconDiv.appendChild(iconI);
      
      const contentDiv = document.createElement('div');
      contentDiv.className = 'cert-card-content';
      
      const headerDiv = document.createElement('div');
      headerDiv.className = 'cert-card-header';
      const h3 = document.createElement('h3');
      h3.textContent = cert.courseTitle || 'شهادة إتمام';
      const scoreSpan = document.createElement('span');
      scoreSpan.className = 'cert-card-score';
      scoreSpan.textContent = `${cert.score}${cert.score !== '—' ? '%' : ''}`;
      headerDiv.appendChild(h3);
      headerDiv.appendChild(scoreSpan);
      
      const dateP = document.createElement('p');
      dateP.className = 'cert-card-date';
      dateP.textContent = `تاريخ الإنجاز: ${cert.date || 'غير محدد'}`;
      
      const footerDiv = document.createElement('div');
      footerDiv.className = 'cert-card-footer';
      const idSpan = document.createElement('span');
      idSpan.className = 'cert-card-id';
      idSpan.textContent = String(cert.certificateId || '').startsWith('REC') ? 'شهادة مسجلة' : 'ID: ' + String(cert.certificateId || '').split('-').slice(0, 3).join('-') + '...';
      
      const viewBtn = document.createElement('a');
      // Ensure courseId is URL safe
      viewBtn.href = `course.html?id=${encodeURIComponent(cert.courseId || '')}&jump=certificate`;
      viewBtn.className = 'cert-view-btn';
      viewBtn.textContent = 'عرض الشهادة ';
      const arrowI = document.createElement('i');
      arrowI.className = 'ph ph-arrow-left';
      viewBtn.appendChild(arrowI);
      
      footerDiv.appendChild(idSpan);
      footerDiv.appendChild(viewBtn);
      
      contentDiv.appendChild(headerDiv);
      contentDiv.appendChild(dateP);
      contentDiv.appendChild(footerDiv);
      
      card.appendChild(iconDiv);
      card.appendChild(contentDiv);
      
      certGrid.appendChild(card);
    });

    // Force section visibility and trigger reveal animations
    certSection.style.display = 'block';
    const navCertLink = document.getElementById('navCertLink');
    if (navCertLink) navCertLink.style.display = 'inline-block';
    
    // Help the "reveal" observer see the newly shown section
    if (typeof reveal === 'function') reveal();
    
    console.log("UI Updated: Certificate section should now be visible.");

  } catch (e) {
    console.error("CRITICAL: Error loading certificates:", e);
    certGrid.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; color: #ff5252; padding: 40px;">
        <p>حدث خطأ أثناء تحميل الشهادات. يرجى المحاولة مرة أخرى.</p>
        <button class="btn-primary" style="margin-top: 16px;" onclick="window.location.reload()">إعادة تحميل</button>
      </div>
    `;
  }
}

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
    particles.forEach((p1, i) => {
      particles.slice(i + 1).forEach(p2 => {
        const dx = p1.x - p2.x;
        const dy = p1.y - p2.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 150) {
          const op = (1 - dist / 150) * 0.08;
          ctx.beginPath();
          ctx.strokeStyle = `rgba(0, 255, 136, ${op})`;
          ctx.lineWidth = 0.5;
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.stroke();
        }
      });
    });
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
  const footerBtn = document.getElementById('footerAiMentorBtn');
  if (!fab || !panel) return;

  fab.addEventListener('click', () => {
    panel.classList.toggle('open');
    if (panel.classList.contains('open') && input) {
      setTimeout(() => input.focus(), 300);
    }
  });

  if (footerBtn) {
    footerBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (!panel.classList.contains('open')) {
        panel.classList.add('open');
        if (input) setTimeout(() => input.focus(), 300);
      }
    });
  }

  // Close button
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      panel.classList.remove('open');
    });
  }

  // Close panel when clicking outside
  document.addEventListener('click', (e) => {
    const isFooterClick = footerBtn && footerBtn.contains(e.target);
    if (!panel.contains(e.target) && !fab.contains(e.target) && !isFooterClick && panel.classList.contains('open')) {
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
      if (typingEl) typingEl.classList.add('active'); // Keep indicator until response is processed
      
      if (typingEl) typingEl.classList.remove('active');
      const botMsg = document.createElement('div');
      botMsg.className = 'chat-message bot';
      
      // Use DOM manipulation to avoid innerHTML and prevent XSS
      const lines = response.split('\n');
      lines.forEach((line, index) => {
        const parts = line.split(/\*\*(.*?)\*\*/g);
        parts.forEach((part, i) => {
          if (i % 2 === 1) {
            const strong = document.createElement('strong');
            strong.textContent = part;
            botMsg.appendChild(strong);
          } else if (part) {
            botMsg.appendChild(document.createTextNode(part));
          }
        });
        if (index < lines.length - 1) {
          botMsg.appendChild(document.createElement('br'));
        }
      });
      messages.insertBefore(botMsg, typingEl);
    } catch (error) {
      console.error("Chatbot Error:", error);
      if (typingEl) typingEl.classList.remove('active');
      const botMsg = document.createElement('div');
      botMsg.className = 'chat-message bot';
      
      let errorText = "عذراً، حدث خطأ أثناء الاتصال بالمرشد الذكي.";
      if (error.message.includes('429')) {
        errorText = "عذراً، تم تجاوز حد الطلبات المسموح به حالياً. يرجى المحاولة بعد قليل.";
      } else if (error.message.includes('401') || error.message.includes('403')) {
        errorText = "هناك مشكلة في صلاحية الوصول (API Key). يرجى التحقق من الإعدادات.";
      } else if (error.message.includes('Failed to fetch')) {
        errorText = "تعذر الاتصال بالخادم. تأكد من اتصالك بالإنترنت وأنك لا تشغل الملف مباشرة (استخدم Live Server).";
      }
      
      botMsg.textContent = errorText + " (تفاصيل الخطأ في الـ Console)";
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
const GEMINI_API_KEY = typeof CONFIG !== 'undefined' ? CONFIG.GEMINI_API_KEY : "";
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
  // Check if we are running locally or on Vercel
  const isLocal = window.location.hostname === 'localhost' || 
                  window.location.hostname === '127.0.0.1' || 
                  window.location.protocol === 'file:';
  
  const url = isLocal ? 
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent` : 
    `/api/chat`;
  
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
      maxOutputTokens: 2048,
    }
  };

  try {
    const fetchOptions = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    };

    // Only add the API key header if running locally
    if (isLocal) {
        fetchOptions.headers['X-goog-api-key'] = GEMINI_API_KEY;
    }

    const response = await fetch(url, fetchOptions);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("Gemini API Error Detail:", errorData);
      throw new Error(`API Request failed with status ${response.status}: ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    if (!data.candidates || data.candidates.length === 0) {
      throw new Error('No response candidates returned from Gemini');
    }
    
    const botAnswer = data.candidates[0].content.parts[0].text;
    
    // Add bot response to history
    conversationHistory.push({ role: "model", parts: [{ text: botAnswer }] });
    
    return botAnswer;
  } catch (error) {
    console.error("Detailed Fetch Error:", error);
    throw error;
  }
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

  const PREVIEW_CHAT_KEY = 'nexora-preview-chat';
  const CHAT_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours

  function savePreviewChat() {
    try {
      const msgs = [];
      messages.querySelectorAll('.chat-message').forEach(msg => {
        msgs.push({
          role: msg.classList.contains('user') ? 'user' : 'bot',
          text: msg.textContent.trim()
        });
      });
      localStorage.setItem(PREVIEW_CHAT_KEY, JSON.stringify({
        messages: msgs,
        timestamp: Date.now()
      }));
    } catch (e) { /* ignore */ }
  }

  function restorePreviewChat() {
    try {
      const stored = localStorage.getItem(PREVIEW_CHAT_KEY);
      if (!stored) return;
      const data = JSON.parse(stored);
      if (Date.now() - data.timestamp > CHAT_EXPIRY_MS) {
        localStorage.removeItem(PREVIEW_CHAT_KEY);
        return;
      }
      if (!data.messages || data.messages.length === 0) return;

      // Clear existing demo messages
      messages.querySelectorAll('.chat-message').forEach(msg => msg.remove());

      // Restore
      data.messages.forEach(msg => {
        const div = document.createElement('div');
        div.className = `chat-message ${msg.role === 'user' ? 'user' : 'bot'}`;
        div.textContent = msg.text;
        messages.insertBefore(div, typingEl);
      });
    } catch (e) { /* ignore */ }
  }

  // Restore on init
  restorePreviewChat();

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
      
      // Use DOM manipulation to avoid innerHTML and prevent XSS
      const lines = response.split('\n');
      lines.forEach((line, index) => {
        const parts = line.split(/\*\*(.*?)\*\*/g);
        parts.forEach((part, i) => {
          if (i % 2 === 1) {
            const strong = document.createElement('strong');
            strong.textContent = part;
            botMsg.appendChild(strong);
          } else if (part) {
            botMsg.appendChild(document.createTextNode(part));
          }
        });
        if (index < lines.length - 1) {
          botMsg.appendChild(document.createElement('br'));
        }
      });
      messages.insertBefore(botMsg, typingEl);

      // Persist chat
      savePreviewChat();
    } catch (error) {
      console.error("Chat Preview Error:", error);
      if (typingEl) typingEl.classList.remove('active');
      const botMsg = document.createElement('div');
      botMsg.className = 'chat-message bot';
      botMsg.textContent = "عذراً، حدث خطأ في النظام. تفاصيل الخطأ تظهر في الـ Console.";
      messages.insertBefore(botMsg, typingEl);
      savePreviewChat();
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
