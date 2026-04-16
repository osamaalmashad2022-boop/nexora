import { 
  auth, 
  db, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  doc,
  setDoc,
  getDoc
} from './firebase-config.js';

// Setup Google Provider
const googleProvider = new GoogleAuthProvider();

// ---- Theme Toggle ----
const themeToggle = document.getElementById('themeToggle');
if (themeToggle) {
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

// ---- Mobile Menu ----
const menuToggle = document.getElementById('menuToggle');
const navLinks = document.getElementById('navLinks');
if (menuToggle && navLinks) {
  menuToggle.addEventListener('click', () => {
    menuToggle.classList.toggle('active');
    navLinks.classList.toggle('open');
    document.body.style.overflow = navLinks.classList.contains('open') ? 'hidden' : '';
  });
}

// ---- Password Toggle ----
window.togglePassword = function(inputId, btn) {
  const input = document.getElementById(inputId);
  const icon = btn.querySelector('i');
  if (input.type === 'password') {
    input.type = 'text';
    icon.className = 'ph ph-eye-slash';
  } else {
    input.type = 'password';
    icon.className = 'ph ph-eye';
  }
};

// ---- Tabs ----
const loginTabBtn = document.getElementById('loginTabBtn');
const registerTabBtn = document.getElementById('registerTabBtn');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const formMessage = document.getElementById('formMessage');

function clearMessage() {
  formMessage.className = 'form-message';
  formMessage.querySelector('span').textContent = '';
}

function showMessage(text, type) {
  formMessage.className = `form-message ${type}`;
  formMessage.querySelector('i').className = type === 'error' ? 'ph ph-warning-circle' : 'ph ph-check-circle';
  formMessage.querySelector('span').textContent = text;
}

loginTabBtn.addEventListener('click', () => {
  loginTabBtn.classList.add('active');
  registerTabBtn.classList.remove('active');
  loginForm.classList.add('active');
  registerForm.classList.remove('active');
  clearMessage();
});

registerTabBtn.addEventListener('click', () => {
  registerTabBtn.classList.add('active');
  loginTabBtn.classList.remove('active');
  registerForm.classList.add('active');
  loginForm.classList.remove('active');
  clearMessage();
});

// ---- Check if redirected ----
const urlParams = new URLSearchParams(window.location.search);
const redirectCourse = urlParams.get('redirect');
if (redirectCourse) {
  document.getElementById('redirectNotice').style.display = 'block';
}

// Check logged in State is normally done via onAuthStateChanged, but for login page we just redirect.
// It will handle later in script.js, but let's do a quick local check or auth state check:
auth.onAuthStateChanged((user) => {
  if (user) {
    if (redirectCourse) {
      window.location.href = `course.html?id=${redirectCourse}`;
    } else {
      window.location.href = 'index.html';
    }
  }
});


// ---- Register Form ----
registerForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  clearMessage();

  const name = document.getElementById('regName').value.trim();
  const email = document.getElementById('regEmail').value.trim();
  const password = document.getElementById('regPassword').value;
  const confirmPassword = document.getElementById('regPasswordConfirm').value;

  if (!name || !email || !password) {
    showMessage('يرجى ملء جميع الحقول', 'error');
    return;
  }

  if (password.length < 6) {
    showMessage('كلمة المرور يجب أن تكون 6 أحرف على الأقل', 'error');
    return;
  }

  if (password !== confirmPassword) {
    showMessage('كلمتا المرور غير متطابقتين', 'error');
    return;
  }

  const btn = document.getElementById('registerSubmitBtn');
  btn.classList.add('loading');

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Update Firebase Auth Profile with name
    try {
      const { updateProfile } = await import('https://www.gstatic.com/firebasejs/10.9.0/firebase-auth.js');
      await updateProfile(user, { displayName: name });
    } catch (e) {
      console.warn("Could not update auth profile:", e);
    }
    
    // Save additional data to Firestore (wrapped in try/catch to not block login on permission issues)
    try {
      await setDoc(doc(db, "users", user.uid), {
        name: name,
        email: email,
        createdAt: new Date().toISOString()
      });
    } catch (e) {
      console.warn("Could not write to Firestore (check rules):", e);
    }

    showMessage('تم إنشاء الحساب بنجاح! جارٍ التحويل...', 'success');
  } catch (error) {
    btn.classList.remove('loading');
    if (error.code === 'auth/email-already-in-use') {
      showMessage('هذا البريد الإلكتروني مسجل بالفعل', 'error');
    } else {
      showMessage('حدث خطأ أثناء التسجيل: ' + error.message, 'error');
    }
  }
});

// ---- Login Form ----
loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  clearMessage();

  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;

  if (!email || !password) {
    showMessage('يرجى ملء جميع الحقول', 'error');
    return;
  }

  const btn = document.getElementById('loginSubmitBtn');
  btn.classList.add('loading');

  try {
    await signInWithEmailAndPassword(auth, email, password);
    showMessage('تم تسجيل الدخول بنجاح! جارٍ التحويل...', 'success');
  } catch (error) {
    btn.classList.remove('loading');
    if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
      showMessage('البريد الإلكتروني أو كلمة المرور غير صحيحة', 'error');
    } else {
      showMessage('حدث خطأ أثناء تسجيل الدخول: ' + error.message, 'error');
    }
  }
});

// ---- Google Sign-in ----
const googleLoginBtn = document.getElementById('googleLoginBtn');
if (googleLoginBtn) {
  googleLoginBtn.addEventListener('click', async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      // Store in users collection if not exists
      try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (!userDoc.exists()) {
          await setDoc(doc(db, "users", user.uid), {
            name: user.displayName || 'مستخدم جوجل',
            email: user.email,
            createdAt: new Date().toISOString()
          });
        }
      } catch (e) {
        console.warn("Could not check/write to Firestore (check rules):", e);
      }

      showMessage('تم تسجيل الدخول بجوجل بنجاح! جارٍ التحويل...', 'success');
      // Wait for onAuthStateChanged to do redirect
    } catch (error) {
      console.error(error);
      showMessage('حدث خطأ أثناء تسجيل الدخول بجوجل: ' + error.message, 'error');
    }
  });
}

// ---- Particles Background (minimal) ----
const canvas = document.getElementById('particles-canvas');
if (canvas) {
  const ctx = canvas.getContext('2d');
  let particles = [];
  function resize() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
  resize();
  window.addEventListener('resize', resize);
  class Particle {
    constructor() { this.reset(); }
    reset() {
      this.x = Math.random() * canvas.width; this.y = Math.random() * canvas.height;
      this.size = Math.random() * 2 + 0.5;
      this.speedX = (Math.random() - 0.5) * 0.5; this.speedY = (Math.random() - 0.5) * 0.5;
      this.opacity = Math.random() * 0.5 + 0.1; this.pulse = Math.random() * Math.PI * 2;
    }
    update() {
      this.x += this.speedX; this.y += this.speedY; this.pulse += 0.02;
      this.opacity = 0.1 + Math.sin(this.pulse) * 0.2;
      if (this.x < 0 || this.x > canvas.width) this.speedX *= -1;
      if (this.y < 0 || this.y > canvas.height) this.speedY *= -1;
    }
    draw() {
      ctx.beginPath(); ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(0, 255, 136, ${this.opacity})`; ctx.fill();
      ctx.beginPath(); ctx.arc(this.x, this.y, this.size * 3, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(0, 255, 136, ${this.opacity * 0.15})`; ctx.fill();
    }
  }
  const count = Math.min(50, Math.floor(window.innerWidth / 25));
  for (let i = 0; i < count; i++) particles.push(new Particle());
  function connectParticles() {
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x, dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 150) {
          ctx.beginPath(); ctx.strokeStyle = `rgba(0, 255, 136, ${(1 - dist / 150) * 0.08})`;
          ctx.lineWidth = 0.5; ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y); ctx.stroke();
        }
      }
    }
  }
  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach(p => { p.update(); p.draw(); });
    connectParticles();
    requestAnimationFrame(animate);
  }
  animate();
}
