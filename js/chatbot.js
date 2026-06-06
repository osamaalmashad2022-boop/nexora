/* =============================================
   Nexora — Global Floating Chatbot
   ============================================= */

// GEMINI API INTEGRATION
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

// ---- Security Helper ----
function sanitizeInput(input) {
  if (!input) return input;
  return input.toString().replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// ---- Chat Persistence Helpers ----
const CHAT_STORAGE_KEY = 'nexora-chat-history';
const CHAT_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours

function saveChatToStorage(messagesContainer) {
  if (!messagesContainer) return;
  try {
    const messages = [];
    messagesContainer.querySelectorAll('.chat-message').forEach(msg => {
      messages.push({
        role: msg.classList.contains('user') ? 'user' : 'bot',
        text: msg.textContent.trim()
      });
    });
    localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify({
      messages: messages,
      conversationHistory: conversationHistory,
      timestamp: Date.now()
    }));
  } catch (e) {
    console.warn('Could not save chat history:', e);
  }
}

function loadChatFromStorage() {
  try {
    const stored = localStorage.getItem(CHAT_STORAGE_KEY);
    if (!stored) return null;
    const data = JSON.parse(stored);
    // Expire after 24 hours
    if (Date.now() - data.timestamp > CHAT_EXPIRY_MS) {
      localStorage.removeItem(CHAT_STORAGE_KEY);
      return null;
    }
    return data;
  } catch (e) {
    console.warn('Could not load chat history:', e);
    return null;
  }
}

function restoreMessages(messagesContainer, typingEl) {
  const stored = loadChatFromStorage();
  if (!stored || !stored.messages || stored.messages.length === 0) return;

  // Restore conversation history for API context
  if (stored.conversationHistory) {
    conversationHistory = stored.conversationHistory;
  }

  // Clear existing messages (except the default welcome)
  const existingMsgs = messagesContainer.querySelectorAll('.chat-message');
  existingMsgs.forEach(msg => msg.remove());

  // Restore messages
  stored.messages.forEach(msg => {
    const div = document.createElement('div');
    div.className = `chat-message ${msg.role === 'user' ? 'user' : 'bot'}`;
    div.textContent = msg.text;
    messagesContainer.insertBefore(div, typingEl);
  });
}

window.generateGeminiResponse = async function(userMessage) {
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

document.addEventListener('DOMContentLoaded', () => {
  // Inject HTML if it doesn't exist (it exists in index.html, so we check first)
  if (!document.getElementById('chatbotFab')) {
    const chatHtml = `
      <!-- Floating Chatbot Button -->
      <button class="chatbot-fab" id="chatbotFab" aria-label="Open AI Chatbot">
        <img src="assets/images/avatar.png" alt="Robot Avatar" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">
      </button>

      <!-- Floating Chat Panel -->
      <div class="chatbot-panel" id="chatbotPanel">
        <div class="chat-header">
          <div class="chat-avatar">
            <img src="assets/images/avatar.png" alt="Robot Avatar" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">
          </div>
          <div class="chat-header-info">
            <h4>المرشد الذكي</h4>
            <span>● متصل الآن</span>
          </div>
          <button class="chat-close-btn" id="chatCloseBtn" aria-label="Close chat">
            <i class="ph ph-x"></i>
          </button>
        </div>
        <div class="chat-messages" id="floatingChatMessages">
          <div class="chat-message bot">
            مرحبًا! 👋 كيف يمكنني مساعدتك في رحلتك التعليمية؟
          </div>
          <div class="typing-indicator" id="floatingTyping">
            <span></span><span></span><span></span>
          </div>
        </div>
        <div class="chat-input">
          <input type="text" placeholder="اكتب سؤالك..." id="floatingChatInput">
          <button class="chat-send-btn" id="floatingChatSend">
            <i class="ph ph-paper-plane-tilt"></i>
          </button>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', chatHtml);
  }

  // Initialize Chatbot logic
  const fab = document.getElementById('chatbotFab');
  const panel = document.getElementById('chatbotPanel');
  const input = document.getElementById('floatingChatInput');
  const sendBtn = document.getElementById('floatingChatSend');
  const messages = document.getElementById('floatingChatMessages');
  const closeBtn = document.getElementById('chatCloseBtn');
  const typingEl = document.getElementById('floatingTyping');
  const footerBtn = document.getElementById('footerAiMentorBtn');
  if (!fab || !panel) return;

  // Restore persisted messages
  if (messages && typingEl) {
    restoreMessages(messages, typingEl);
  }

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
    const rawText = input.value.trim();
    const text = sanitizeInput(rawText);

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
      const response = await window.generateGeminiResponse(text);
      
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

      // Persist chat after bot responds
      saveChatToStorage(messages);
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

      // Persist even error messages
      saveChatToStorage(messages);
    }
    scrollToBottom();
  }

  if (sendBtn) sendBtn.addEventListener('click', sendMessage);
  if (input) {
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') sendMessage();
    });
  }
});
