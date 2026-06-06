/* ==========================================
   Nexora — Course Page JavaScript
   ========================================== */

import { auth, db, onAuthStateChanged, signOut, doc, setDoc, getDoc } from './firebase-config.js';

let currentUserData = null;

document.addEventListener('DOMContentLoaded', () => {
  const rawCourseId = new URLSearchParams(window.location.search).get('id');

  // Security: Validate courseId is a valid numeric ID
  if (!rawCourseId || !/^\d+$/.test(rawCourseId) || !COURSES_DATA.find(c => c.id === parseInt(rawCourseId))) {
    window.location.href = 'index.html';
    return;
  }

  const courseId = rawCourseId;

  const course = COURSES_DATA.find(c => c.id === parseInt(courseId));

  // Set page title
  document.title = `${course.shortTitle} | Nexora`;

  // ---- Theme ----
  initTheme();
  // ---- Mobile Menu ----
  initMobileMenu();
  // ---- Particles ----
  initParticles();

  // ---- Populate Course Info ----
  populateCourseInfo(course);

  // ---- Auth Check via Firebase ----
  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      // Security: Validate redirect parameter to only allow numeric course IDs
      const rawRedirect = courseId || '';
      const safeRedirect = /^\d+$/.test(rawRedirect) ? rawRedirect : '';
      window.location.href = `login.html?redirect=${safeRedirect}`;
      return;
    }

    try {
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (userDoc.exists()) {
        currentUserData = { id: user.uid, ...userDoc.data() };
        currentUserData.name = currentUserData.name || user.displayName || 'المتعلم';
      } else {
        currentUserData = { id: user.uid, email: user.email, name: user.displayName || 'المتعلم' };
      }
    } catch(e) {
      currentUserData = { id: user.uid, name: user.displayName || 'المتعلم' };
    }

    // ---- User Bar ----
    const userNameEl = document.getElementById('userName');
    if (userNameEl) userNameEl.textContent = currentUserData.name;
    
    const logoutBtnEl = document.getElementById('logoutBtn');
    if (logoutBtnEl) {
      logoutBtnEl.addEventListener('click', async () => {
        await signOut(auth);
        window.location.href = 'index.html';
      });
    }

    // ---- Load saved progress ----
    const progress = await loadProgress(user.uid, course.id);

    // ---- Initialize Course Flow ----
    initCourseFlow(course, currentUserData, progress);
  });
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
  navLinks.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      toggle.classList.remove('active');
      navLinks.classList.remove('open');
      document.body.style.overflow = '';
    });
  });
}

/* =============================================
   PARTICLES (lightweight)
   ============================================= */
function initParticles() {
  const canvas = document.getElementById('particles-canvas');
  if (!canvas) return;
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
  const count = Math.min(40, Math.floor(window.innerWidth / 30));
  for (let i = 0; i < count; i++) particles.push(new Particle());
  function connectParticles() {
    particles.forEach((p1, i) => {
      particles.slice(i + 1).forEach(p2 => {
        const dx = p1.x - p2.x;
        const dy = p1.y - p2.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 150) {
          ctx.beginPath();
          ctx.strokeStyle = `rgba(0, 255, 136, ${(1 - dist / 150) * 0.08})`;
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
    particles.forEach(p => { p.update(); p.draw(); });
    connectParticles();
    requestAnimationFrame(animate);
  }
  animate();
}

/* =============================================
   POPULATE COURSE INFO
   ============================================= */
function populateCourseInfo(course) {
  document.getElementById('courseIcon').querySelector('i').className = `ph ${course.icon}`;
  document.getElementById('courseTitle').textContent = course.title;
  document.getElementById('courseDesc').textContent = course.description;
  document.getElementById('courseDuration').textContent = course.duration;
  document.getElementById('courseLessons').textContent = `${course.lessons} دروس`;
  // Security: Validate iframe source domain before setting
  const ALLOWED_IFRAME_DOMAINS = ['app.mindsmith.ai'];
  try {
    const iframeUrl = new URL(course.mindsmithUrl);
    if (ALLOWED_IFRAME_DOMAINS.includes(iframeUrl.hostname)) {
      document.getElementById('courseIframe').src = course.mindsmithUrl;
    } else {
      console.error('Blocked unauthorized iframe source:', iframeUrl.hostname);
      document.getElementById('courseIframe').src = 'about:blank';
    }
  } catch (e) {
    console.error('Invalid iframe URL:', e);
    document.getElementById('courseIframe').src = 'about:blank';
  }
}

/* =============================================
   PROGRESS MANAGEMENT (Firestore)
   ============================================= */
async function loadProgress(userId, courseId) {
  try {
    const progRef = doc(db, "users", userId, "progress", String(courseId));
    const progSnap = await getDoc(progRef);
    if (progSnap.exists()) {
      return progSnap.data();
    }
  } catch (e) {
    console.error("Error loading progress from Firestore", e);
  }
  
  return {
    preTestDone: false,
    preTestScore: null,
    contentDone: false,
    postTestDone: false,
    postTestScore: null,
    postTestAttempts: 0,
    certificateIssued: false
  };
}

async function saveProgress(userId, courseId, progress) {
  try {
    const progRef = doc(db, "users", userId, "progress", String(courseId));
    await setDoc(progRef, progress, { merge: true });
  } catch(e) {
    console.error("Error saving progress to Firestore", e);
  }
}

/* =============================================
   COURSE FLOW MANAGER
   ============================================= */
function initCourseFlow(course, user, progress) {
  const steps = ['pre-test', 'content', 'post-test', 'stats', 'certificate'];
  const sections = {
    'pre-test': document.getElementById('preTestSection'),
    'content': document.getElementById('contentSection'),
    'post-test': document.getElementById('postTestSection'),
    'stats': document.getElementById('statsSection'),
    'certificate': document.getElementById('certificateSection')
  };

  const urlParams = new URLSearchParams(window.location.search);
  const jumpTo = urlParams.get('jump');

  // Determine current step based on progress
  let currentStep = 'pre-test';
  console.log("Initializing flow. JumpTo:", jumpTo, "Progress Issued:", progress.certificateIssued);

  if (jumpTo === 'certificate' && progress.certificateIssued) {
    currentStep = 'certificate';
  } else if (jumpTo === 'certificate') {
    // If we specifically requested a certificate but database says no, 
    // maybe it's a sync issue. Let's check if they finished the post test.
    if (progress.postTestDone && (Math.round((progress.postTestScore / course.questions.length) * 100) >= 60)) {
       console.log("Sync delay detected, forcing certificate step");
       currentStep = 'certificate';
    }
  } else {
    if (progress.preTestDone && !progress.contentDone) currentStep = 'content';
    if (progress.contentDone && !progress.postTestDone) currentStep = 'post-test';
    if (progress.postTestDone) currentStep = 'stats';
  }

  // Update flow step indicators
  function updateFlowUI(step) {
    const stepElements = document.querySelectorAll('.flow-step');
    const connectors = document.querySelectorAll('.flow-connector');
    const stepIndex = steps.indexOf(step);

    stepElements.forEach((el, i) => {
      el.classList.remove('active', 'completed');
      if (i < stepIndex) el.classList.add('completed');
      if (i === stepIndex) el.classList.add('active');
    });

    connectors.forEach((c, i) => {
      c.classList.toggle('completed', i < stepIndex);
    });
  }

  function showSection(step) {
    console.log("Showing section:", step);
    currentStep = step;
    Object.values(sections).forEach(s => s && s.classList.remove('active'));
    if (sections[step]) {
      sections[step].classList.add('active');
      try {
        if (step === 'certificate') populateCertificate(user, course, progress);
        if (step === 'stats') updateStatsDashboard(progress, course);
      } catch (err) {
        console.error("Error populating section:", step, err);
      }
    } else {
      console.warn("Section not found:", step);
    }
    updateFlowUI(step);
    window.scrollTo({ top: 300, behavior: 'smooth' });
  }

  // Initialize flow
  if (currentStep) {
    updateFlowUI(currentStep);
    showSection(currentStep);
  }

  // ---- PRE-TEST ----
  if (!progress.preTestDone) {
    initQuiz('pre', course.questions, (score) => {
      progress.preTestScore = score;
      progress.preTestDone = true;
      saveProgress(user.id, course.id, progress);

      // Show result
      showQuizResult('pre', score, course.questions.length, () => {
        showSection('content');
      });
    });
  } else {
    // Pre-test already done, show result summary
    showCompletedQuizSummary('pre', progress.preTestScore, course.questions.length, () => {
      showSection('content');
    });
  }

  // ---- CONTENT ----
  document.getElementById('finishContentBtn').addEventListener('click', () => {
    progress.contentDone = true;
    saveProgress(user.id, course.id, progress);
    showSection('post-test');
    if (!progress.postTestDone) {
      initQuiz('post', course.questions, (score) => {
        progress.postTestScore = score;
        progress.postTestDone = true;
        progress.postTestAttempts++;
        saveProgress(user.id, course.id, progress);

        showQuizResult('post', score, course.questions.length, () => {
          showSection('stats');
          updateStatsDashboard(progress, course);

          // Check certificate eligibility
          const percentage = Math.round((score / course.questions.length) * 100);
          if (percentage >= 60) {
            progress.certificateIssued = true;
            saveProgress(user.id, course.id, progress);
            
            // Save certificate metadata to DB with safeguard
            try {
              const uId = user.id || user.uid || 'UNKNOWN';
              const certId = `CERT-${course.id}-${String(uId).slice(-6)}-${Date.now().toString(36).toUpperCase()}`;
              console.log(`Certificate earned! ID: ${certId}`);
              saveCertificateMetadata(uId, course, score, percentage, certId);
            } catch (certErr) {
              console.error("Critical error in certificate generation:", certErr);
            }
          }
        }, () => {
          // Retry callback
          function retryPostTest() {
            progress.postTestDone = false;
            saveProgress(user.id, course.id, progress);
            document.getElementById('postTestResult').style.display = 'none';
            document.getElementById('postTestQuestions').innerHTML = '';
            initQuiz('post', course.questions, (retryScore) => {
              progress.postTestScore = retryScore;
              progress.postTestDone = true;
              progress.postTestAttempts++;
              saveProgress(user.id, course.id, progress);

              showQuizResult('post', retryScore, course.questions.length, () => {
                showSection('stats');
                updateStatsDashboard(progress, course);

                const retryPercentage = Math.round((retryScore / course.questions.length) * 100);
                if (retryPercentage >= 60) {
                  progress.certificateIssued = true;
                  saveProgress(user.id, course.id, progress);
                  
                  // Save certificate metadata on retry pass
                  const certId = `CERT-${course.id}-${user.id.slice(-6)}-${Date.now().toString(36).toUpperCase()}`;
                  saveCertificateMetadata(user.id, course, retryScore, retryPercentage, certId);
                }
              }, retryPostTest);
            });
          }
          retryPostTest();
        });
      });
    }
  });

  // If post-test already done, set up stats
  if (progress.postTestDone) {
    updateStatsDashboard(progress, course);
  }

  // ---- STATS ACTIONS ----
  function updateStatsDashboard(prog, crs) {
    const prePercent = Math.round((prog.preTestScore / crs.questions.length) * 100);
    const postPercent = Math.round((prog.postTestScore / crs.questions.length) * 100);
    const improvement = postPercent - prePercent;

    document.getElementById('statPreScore').textContent = prePercent + '%';
    document.getElementById('statPostScore').textContent = postPercent + '%';
    document.getElementById('statImprovement').textContent = (improvement >= 0 ? '+' : '') + improvement + '%';
    document.getElementById('statStatus').textContent = postPercent >= 60 ? 'ناجح ✓' : 'لم يجتز';
    document.getElementById('statStatus').style.color = postPercent >= 60 ? '' : '#ff5252';

    // Chart bars
    const maxHeight = 200;
    const preBarHeight = Math.max(20, (prePercent / 100) * maxHeight);
    const postBarHeight = Math.max(20, (postPercent / 100) * maxHeight);

    setTimeout(() => {
      document.getElementById('chartPreBar').style.height = preBarHeight + 'px';
      document.getElementById('chartPostBar').style.height = postBarHeight + 'px';
      document.getElementById('chartPreValue').textContent = prePercent + '%';
      document.getElementById('chartPostValue').textContent = postPercent + '%';
    }, 300);

    // Improvement badge
    const improvementText = document.getElementById('improvementText');
    if (improvement > 0) {
      improvementText.textContent = `تحسن بنسبة ${improvement}% — أحسنت! 🎉`;
    } else if (improvement === 0) {
      improvementText.textContent = 'نفس المستوى — استمر في التعلم!';
    } else {
      improvementText.textContent = `تراجع بنسبة ${Math.abs(improvement)}% — حاول مراجعة المحتوى`;
    }

    // Stats actions
    const statsActions = document.getElementById('statsActions');
    statsActions.innerHTML = '';

    if (postPercent >= 60) {
      const certBtn = document.createElement('button');
      certBtn.className = 'quiz-btn quiz-btn-next';
      certBtn.innerHTML = '<i class="ph ph-certificate"></i> احصل على الشهادة';
      certBtn.addEventListener('click', () => {
        showSection('certificate');
        populateCertificate(user, crs, prog);
        
        // Always ensure certificate is saved when claiming it
        if (!prog.certificateIssued) {
          prog.certificateIssued = true;
          saveProgress(user.id, crs.id, prog);
        }
        try {
          const uId = user.id || 'UNKNOWN';
          const certId = `CERT-${crs.id}-${String(uId).slice(-6)}-${Date.now().toString(36).toUpperCase()}`;
          console.log(`Saving certificate on claim: ${certId}`);
          saveCertificateMetadata(uId, crs, prog.postTestScore, postPercent, certId);
        } catch (e) {
          console.error("Error saving certificate on claim:", e);
        }
      });
      statsActions.appendChild(certBtn);
    }

    const retryBtn = document.createElement('button');
    retryBtn.className = 'quiz-btn quiz-btn-prev';
    retryBtn.innerHTML = '<i class="ph ph-arrow-clockwise"></i> إعادة الاختبار البعدي';
    retryBtn.addEventListener('click', () => {
      progress.postTestDone = false;
      saveProgress(user.id, crs.id, progress);
      showSection('post-test');
      
      const questionsContainer = document.getElementById('postTestQuestions');
      const resultContainer = document.getElementById('postTestResult');
      const quizContainer = questionsContainer.closest('.quiz-container');
      const progressEl = quizContainer ? quizContainer.querySelector('.quiz-progress') : null;
      const navEl = quizContainer ? quizContainer.querySelector('.quiz-nav') : null;

      resultContainer.style.display = 'none';
      questionsContainer.style.display = '';
      questionsContainer.innerHTML = '';
      if (progressEl) progressEl.style.display = '';
      if (navEl) navEl.style.display = '';

      initQuiz('post', crs.questions, (retryScore) => {
        progress.postTestScore = retryScore;
        progress.postTestDone = true;
        progress.postTestAttempts++;
        saveProgress(user.id, crs.id, progress);

        showQuizResult('post', retryScore, crs.questions.length, () => {
          showSection('stats');
          updateStatsDashboard(progress, crs);

          const rp = Math.round((retryScore / crs.questions.length) * 100);
          if (rp >= 60) {
            progress.certificateIssued = true;
            saveProgress(user.id, crs.id, progress);
            
            // Save certificate metadata on retry pass from stats
            try {
              const uId = user.id || user.uid || 'UNKNOWN';
              const certId = `CERT-${crs.id}-${String(uId).slice(-6)}-${Date.now().toString(36).toUpperCase()}`;
              saveCertificateMetadata(uId, crs, retryScore, rp, certId);
            } catch (certErr) {
              console.error("Failed to save retry certificate metadata:", certErr);
            }
          }
        });
      });
    });
    statsActions.appendChild(retryBtn);

    const backBtn = document.createElement('a');
    backBtn.href = 'index.html#courses';
    backBtn.className = 'quiz-btn quiz-btn-prev';
    backBtn.innerHTML = '<i class="ph ph-arrow-right"></i> العودة للكورسات';
    statsActions.appendChild(backBtn);
  }

  // ---- SAVE CERTIFICATE TO FIREBASE ----
  async function saveCertificateMetadata(userId, crs, score, percentage, certId) {
    try {
      const now = new Date();
      const dateStr = now.toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' });
      const progRef = doc(db, "users", userId, "progress", String(crs.id));
      
      // Save certificate metadata INSIDE the existing progress document
      await setDoc(progRef, {
        certificateIssued: true,
        certMeta: {
          courseId: crs.id,
          courseTitle: crs.title,
          courseIcon: crs.icon,
          score: percentage,
          rawScore: score,
          totalQuestions: crs.questions.length,
          date: dateStr,
          certificateId: certId,
          timestamp: now.getTime()
        }
      }, { merge: true });
      console.log("✅ Certificate metadata saved successfully to progress doc");
    } catch (e) {
      console.error("❌ Error saving certificate metadata:", e);
    }
  }

  // ---- CERTIFICATE ----
  function populateCertificate(usr, crs, prog) {
    console.log("Populating certificate for:", usr.name, "Progress:", prog);
    
    let preScore = prog.preTestScore || 0;
    let totalQ = crs.questions.length || 10;
    
    let postPercent = 0;
    let prePercent = Math.round((preScore / totalQ) * 100);

    // Use certMeta as the ultimate source of truth if it exists
    if (prog.certMeta) {
      postPercent = prog.certMeta.score || 0;
    } else {
      let postScore = prog.postTestScore || 0;
      postPercent = Math.round((postScore / totalQ) * 100);
    }

    const improvement = postPercent - prePercent;

    const studentNameEl = document.getElementById('certStudentName');
    const courseNameEl = document.getElementById('certCourseName');
    const scoreEl = document.getElementById('certScore');
    const improvementEl = document.getElementById('certImprovement');
    const dateEl = document.getElementById('certDate');
    const idEl = document.getElementById('certId');

    if (studentNameEl) studentNameEl.textContent = usr.name || usr.displayName || 'طالب Nexora';
    if (courseNameEl) courseNameEl.textContent = crs.title;
    if (scoreEl) scoreEl.textContent = postPercent + '%';
    if (improvementEl) improvementEl.textContent = (improvement >= 0 ? '+' : '') + improvement + '%';

    const now = new Date();
    // Use the actual issue date if available
    const dateStr = (prog.certMeta && prog.certMeta.date) ? prog.certMeta.date : now.toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' });
    if (dateEl) dateEl.textContent = dateStr;

    // Generate unique certificate ID or use existing from prog if available (from metadata)
    const storedId = (prog.certMeta && prog.certMeta.certificateId) ? prog.certMeta.certificateId : null;
    const uId = usr.id || 'STU-' + Math.random().toString(36).slice(-6).toUpperCase();
    const certId = storedId || `CERT-${crs.id}-${uId.slice(-6)}-${now.getTime().toString(36).toUpperCase()}`;
    
    if (idEl) idEl.textContent = certId;
    console.log("Certificate populated successfully ID:", certId, "Score:", postPercent);
  }

  // ---- Click on flow steps to navigate (if completed) ----
  document.querySelectorAll('.flow-step').forEach(el => {
    el.addEventListener('click', () => {
      const step = el.getAttribute('data-step');
      const stepIndex = steps.indexOf(step);
      const currentIndex = steps.indexOf(currentStep);

      // Can only go back to completed steps
      if (el.classList.contains('completed') || el.classList.contains('active')) {
        if (step === 'stats' && progress.postTestDone) {
          showSection('stats');
          updateStatsDashboard(progress, course);
        } else if (step === 'certificate' && progress.certificateIssued) {
          showSection('certificate');
          populateCertificate(user, course, progress);
        } else if (step === 'content' && progress.preTestDone) {
          showSection('content');
        } else if (step === 'pre-test') {
          showSection('pre-test');
        }
      }
    });
  });
}

/* =============================================
   QUIZ ENGINE
   ============================================= */
function initQuiz(type, questions, onComplete) {
  const prefix = type; // 'pre' or 'post'
  const questionsContainer = document.getElementById(`${prefix}TestQuestions`);
  const progressFill = document.getElementById(`${prefix}ProgressFill`);
  const progressText = document.getElementById(`${prefix}ProgressText`);
  const prevBtn = document.getElementById(`${prefix}PrevBtn`);
  const nextBtn = document.getElementById(`${prefix}NextBtn`);
  const resultContainer = document.getElementById(`${prefix}TestResult`);

  let currentQ = 0;
  const totalQ = questions.length;
  const answers = new Array(totalQ).fill(null);
  const labels = ['أ', 'ب', 'ج', 'د'];

  // Security: Use DOM API instead of innerHTML to prevent XSS
  function renderQuestion(index) {
    const q = questions[index];
    questionsContainer.innerHTML = '';

    const card = document.createElement('div');
    card.className = 'question-card';

    const qNumber = document.createElement('span');
    qNumber.className = 'question-number';
    qNumber.textContent = `السؤال ${index + 1} من ${totalQ}`;
    card.appendChild(qNumber);

    const qText = document.createElement('div');
    qText.className = 'question-text';
    qText.textContent = q.q;
    card.appendChild(qText);

    const optionsList = document.createElement('div');
    optionsList.className = 'options-list';

    q.options.forEach((opt, i) => {
      const btn = document.createElement('button');
      btn.className = `option-btn${answers[index] === i ? ' selected' : ''}`;
      btn.setAttribute('data-index', i);

      const labelSpan = document.createElement('span');
      labelSpan.className = 'option-label';
      labelSpan.textContent = labels[i];
      btn.appendChild(labelSpan);

      const textSpan = document.createElement('span');
      textSpan.textContent = opt;
      btn.appendChild(textSpan);

      btn.addEventListener('click', () => {
        answers[index] = i;
        renderQuestion(index);
        nextBtn.disabled = false;
      });

      optionsList.appendChild(btn);
    });

    card.appendChild(optionsList);
    questionsContainer.appendChild(card);

    // Update progress
    const answeredCount = answers.filter(a => a !== null).length;
    progressFill.style.width = `${(answeredCount / totalQ) * 100}%`;
    progressText.textContent = `${answeredCount} / ${totalQ}`;

    // Navigation visibility
    prevBtn.style.visibility = index > 0 ? 'visible' : 'hidden';
    nextBtn.disabled = answers[index] === null;

    if (index === totalQ - 1) {
      nextBtn.innerHTML = '<span>إنهاء الاختبار</span> <i class="ph ph-check-circle"></i>';
    } else {
      nextBtn.innerHTML = '<span>التالي</span> <i class="ph ph-arrow-left"></i>';
    }
  }

  // Event listeners
  nextBtn.onclick = () => {
    if (currentQ < totalQ - 1) {
      currentQ++;
      renderQuestion(currentQ);
    } else {
      // Calculate score
      let score = 0;
      answers.forEach((a, i) => {
        if (a === questions[i].correct) score++;
      });
      onComplete(score);
    }
  };

  prevBtn.onclick = () => {
    if (currentQ > 0) {
      currentQ--;
      renderQuestion(currentQ);
    }
  };

  renderQuestion(0);
}

/* =============================================
   QUIZ RESULT DISPLAY
   ============================================= */
function showQuizResult(type, score, total, onContinue, onRetry) {
  const prefix = type;
  const questionsContainer = document.getElementById(`${prefix}TestQuestions`);
  const resultContainer = document.getElementById(`${prefix}TestResult`);
  const progressEl = questionsContainer.closest('.quiz-container').querySelector('.quiz-progress');
  const navEl = questionsContainer.closest('.quiz-container').querySelector('.quiz-nav');

  // Hide quiz elements
  questionsContainer.style.display = 'none';
  if (progressEl) progressEl.style.display = 'none';
  if (navEl) navEl.style.display = 'none';

  const percentage = Math.round((score / total) * 100);
  const passed = percentage >= 60;
  const circumference = 2 * Math.PI * 70; // radius = 70

  // Security: Build result UI with DOM API instead of innerHTML
  resultContainer.innerHTML = '';

  const resultDiv = document.createElement('div');
  resultDiv.className = 'quiz-result';

  // Score Ring (SVG)
  const ringDiv = document.createElement('div');
  ringDiv.className = 'result-score-ring';
  const svgNS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(svgNS, 'svg');
  svg.setAttribute('viewBox', '0 0 160 160');
  const circleBg = document.createElementNS(svgNS, 'circle');
  circleBg.setAttribute('class', 'ring-bg');
  circleBg.setAttribute('cx', '80'); circleBg.setAttribute('cy', '80'); circleBg.setAttribute('r', '70');
  const circleFill = document.createElementNS(svgNS, 'circle');
  circleFill.setAttribute('class', `ring-fill${!passed ? ' fail' : ''}`);
  circleFill.setAttribute('cx', '80'); circleFill.setAttribute('cy', '80'); circleFill.setAttribute('r', '70');
  circleFill.style.strokeDasharray = circumference;
  circleFill.style.strokeDashoffset = circumference;
  circleFill.id = `${prefix}RingFill`;
  svg.appendChild(circleBg);
  svg.appendChild(circleFill);
  ringDiv.appendChild(svg);
  const scoreText = document.createElement('div');
  scoreText.className = `result-score-text${!passed ? ' fail' : ''}`;
  scoreText.textContent = `${percentage}%`;
  ringDiv.appendChild(scoreText);
  resultDiv.appendChild(ringDiv);

  // Title
  const h3 = document.createElement('h3');
  h3.textContent = type === 'pre' ? 'نتيجة الاختبار القبلي' : (passed ? '🎉 أحسنت! نتيجة ممتازة' : '😔 حاول مرة أخرى');
  resultDiv.appendChild(h3);

  // Description
  const p = document.createElement('p');
  p.textContent = type === 'pre'
    ? 'هذا هو مستواك الحالي. تابع دراسة المحتوى لتحسين درجتك في الاختبار البعدي!'
    : (passed
      ? 'لقد اجتزت الاختبار بنجاح. يمكنك الآن الاطلاع على إحصائياتك والحصول على شهادتك!'
      : 'لم تحقق درجة النجاح (60%). يمكنك إعادة المحاولة بعد مراجعة المحتوى.');
  resultDiv.appendChild(p);

  // Details
  const detailsDiv = document.createElement('div');
  detailsDiv.className = 'result-details';
  const detailItems = [
    { value: score, label: 'إجابات صحيحة' },
    { value: total - score, label: 'إجابات خاطئة' },
    { value: total, label: 'إجمالي الأسئلة' }
  ];
  detailItems.forEach(item => {
    const detailItem = document.createElement('div');
    detailItem.className = 'result-detail-item';
    const valDiv = document.createElement('div');
    valDiv.className = 'detail-value';
    valDiv.textContent = item.value;
    const lblDiv = document.createElement('div');
    lblDiv.className = 'detail-label';
    lblDiv.textContent = item.label;
    detailItem.appendChild(valDiv);
    detailItem.appendChild(lblDiv);
    detailsDiv.appendChild(detailItem);
  });
  resultDiv.appendChild(detailsDiv);

  // Actions
  const actionsDiv = document.createElement('div');
  actionsDiv.className = 'result-actions';

  const continueBtn = document.createElement('button');
  continueBtn.className = 'quiz-btn quiz-btn-next';
  continueBtn.id = `${prefix}ContinueBtn`;
  continueBtn.textContent = type === 'pre' ? 'انتقل إلى المحتوى التعليمي' : 'عرض الإحصائيات';
  const arrowIcon = document.createElement('i');
  arrowIcon.className = 'ph ph-arrow-left';
  continueBtn.appendChild(arrowIcon);
  actionsDiv.appendChild(continueBtn);

  if (type === 'post' && !passed) {
    const retryBtnEl = document.createElement('button');
    retryBtnEl.className = 'quiz-btn quiz-btn-prev';
    retryBtnEl.id = `${prefix}RetryBtn`;
    const retryIcon = document.createElement('i');
    retryIcon.className = 'ph ph-arrow-clockwise';
    retryBtnEl.appendChild(retryIcon);
    retryBtnEl.appendChild(document.createTextNode(' إعادة الاختبار'));
    actionsDiv.appendChild(retryBtnEl);
  }

  resultDiv.appendChild(actionsDiv);
  resultContainer.appendChild(resultDiv);
  resultContainer.style.display = 'block';

  // Animate ring
  setTimeout(() => {
    const ringFill = document.getElementById(`${prefix}RingFill`);
    if (ringFill) {
      const offset = circumference - (percentage / 100) * circumference;
      ringFill.style.strokeDashoffset = offset;
    }
  }, 100);

  // Continue button
  document.getElementById(`${prefix}ContinueBtn`).addEventListener('click', onContinue);

  // Retry button (post-test only)
  const retryBtn = document.getElementById(`${prefix}RetryBtn`);
  if (retryBtn && onRetry) {
    retryBtn.addEventListener('click', () => {
      resultContainer.style.display = 'none';
      questionsContainer.style.display = '';
      if (progressEl) progressEl.style.display = '';
      if (navEl) navEl.style.display = '';
      onRetry();
    });
  }
}

/* =============================================
   COMPLETED QUIZ SUMMARY (if already done)
   ============================================= */
function showCompletedQuizSummary(type, score, total, onContinue) {
  const prefix = type;
  const questionsContainer = document.getElementById(`${prefix}TestQuestions`);
  const resultContainer = document.getElementById(`${prefix}TestResult`);
  const progressEl = questionsContainer.closest('.quiz-container').querySelector('.quiz-progress');
  const navEl = questionsContainer.closest('.quiz-container').querySelector('.quiz-nav');

  questionsContainer.style.display = 'none';
  if (progressEl) progressEl.style.display = 'none';
  if (navEl) navEl.style.display = 'none';

  const percentage = Math.round((score / total) * 100);
  const circumference = 2 * Math.PI * 70;

  // Security: Build summary UI with DOM API instead of innerHTML
  resultContainer.innerHTML = '';

  const resultDiv = document.createElement('div');
  resultDiv.className = 'quiz-result';

  // Score Ring (SVG)
  const ringDiv = document.createElement('div');
  ringDiv.className = 'result-score-ring';
  const svgNS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(svgNS, 'svg');
  svg.setAttribute('viewBox', '0 0 160 160');
  const circleBg = document.createElementNS(svgNS, 'circle');
  circleBg.setAttribute('class', 'ring-bg');
  circleBg.setAttribute('cx', '80'); circleBg.setAttribute('cy', '80'); circleBg.setAttribute('r', '70');
  const circleFill = document.createElementNS(svgNS, 'circle');
  circleFill.setAttribute('class', 'ring-fill');
  circleFill.setAttribute('cx', '80'); circleFill.setAttribute('cy', '80'); circleFill.setAttribute('r', '70');
  circleFill.style.strokeDasharray = circumference;
  circleFill.style.strokeDashoffset = circumference;
  circleFill.id = `${prefix}RingFillSummary`;
  svg.appendChild(circleBg);
  svg.appendChild(circleFill);
  ringDiv.appendChild(svg);
  const scoreText = document.createElement('div');
  scoreText.className = 'result-score-text';
  scoreText.textContent = `${percentage}%`;
  ringDiv.appendChild(scoreText);
  resultDiv.appendChild(ringDiv);

  const h3 = document.createElement('h3');
  h3.textContent = '✅ تم إكمال الاختبار القبلي مسبقاً';
  resultDiv.appendChild(h3);

  const p = document.createElement('p');
  p.textContent = `درجتك: ${score} من ${total} — يمكنك الانتقال مباشرة إلى المحتوى التعليمي`;
  resultDiv.appendChild(p);

  const actionsDiv = document.createElement('div');
  actionsDiv.className = 'result-actions';
  const continueBtn = document.createElement('button');
  continueBtn.className = 'quiz-btn quiz-btn-next';
  continueBtn.id = `${prefix}ContinueSummaryBtn`;
  continueBtn.textContent = 'انتقل إلى المحتوى التعليمي';
  const arrowIcon = document.createElement('i');
  arrowIcon.className = 'ph ph-arrow-left';
  continueBtn.appendChild(arrowIcon);
  actionsDiv.appendChild(continueBtn);
  resultDiv.appendChild(actionsDiv);

  resultContainer.appendChild(resultDiv);
  resultContainer.style.display = 'block';

  setTimeout(() => {
    const ring = document.getElementById(`${prefix}RingFillSummary`);
    if (ring) {
      ring.style.strokeDashoffset = circumference - (percentage / 100) * circumference;
    }
  }, 100);

  document.getElementById(`${prefix}ContinueSummaryBtn`).addEventListener('click', onContinue);
}
