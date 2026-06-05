# 🔑 إجراء أمني مؤجل — إبطال مفاتيح API المُسرّبة

> **الحالة:** ⏳ مؤجل — ينفذ بعد التأكد من عمل المنصة بالكامل

---

## الخطوات المطلوبة

### 1. إبطال المفتاح القديم المُسرّب في Git
- اذهب إلى [Google AI Studio - API Keys](https://aistudio.google.com/app/apikey)
- ابحث عن المفتاح: `AQ.Ab8RN6JBxwmPdoerYOEiYc57fLIo3znXSaXasVc1VnwrAG19YQ`
- اضغط "Delete" أو "Revoke" لإبطاله

### 2. إبطال المفتاح الحالي (إذا تم رفع المستودع علنياً)
- تحقق إذا كان المستودع على GitHub عام (public)
- إذا كان عام: أبطل المفتاح الحالي في `js/config.js` أيضاً
- إذا كان خاص (private): يمكنك الاحتفاظ بالمفتاح الحالي

### 3. إنشاء مفتاح جديد
- من نفس صفحة Google AI Studio، أنشئ مفتاح جديد
- حدّث الملف المحلي `js/config.js`:
```javascript
const CONFIG = {
    GEMINI_API_KEY: "المفتاح_الجديد_هنا"
};
```

### 4. تحديث متغير البيئة على Vercel
- اذهب إلى لوحة تحكم Vercel → المشروع → Settings → Environment Variables
- حدّث قيمة `GEMINI_API_KEY` بالمفتاح الجديد
- أعد النشر (Redeploy) لتفعيل التغيير

### 5. تنظيف تاريخ Git (اختياري)
```bash
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch config.js" \
  --prune-empty --tag-name-filter cat -- --all
git push origin --force --all
```

---

## لماذا هذا الإجراء مهم؟
- المفتاح القديم مكشوف في commit `67510ef` في تاريخ Git
- أي شخص يستنسخ المستودع يمكنه استخراجه واستخدامه
- قد يؤدي ذلك لاستهلاك حصتك (quota) أو تكاليف مالية غير متوقعة
