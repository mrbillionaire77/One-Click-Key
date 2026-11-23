# Deploying One-Click Key

**One-Click Key** is a 100% static, zero-backend Progressive Web App. Anyone who forks or clones the repository can deploy their own independent instance in under two minutes.

---

## Option 1: Automated Deployment on GitHub Pages (Recommended)

This repository includes a ready-to-use GitHub Actions workflow at `.github/workflows/deploy.yml` that runs `typecheck`, `lint`, `test`, and `build` before publishing on every push to `main`.

### Step-by-Step Setup

1. **Fork or Push the Repository**
   - Fork `https://github.com/mrbillionaire77/One-Click-Key` (or push this codebase to your own GitHub repository).
2. **Enable GitHub Pages via GitHub Actions**
   - Open your repository on GitHub → **Settings** → **Pages**.
   - Under **Build and deployment** → **Source**, select **GitHub Actions**.
3. **Trigger Your First Deployment**
   - Push any commit to the `main` branch, or open the **Actions** tab → select **Deploy One-Click Key to GitHub Pages** → click **Run workflow**.
4. **Automatic Subpath & PWA Handling**
   - You do **not** need to edit `vite.config.ts` manually.
   - The workflow automatically detects your repository name and sets `VITE_BASE_PATH="/<your-repo-name>/"` (or `"/"` if your repository is named `<username>.github.io` or includes `public/CNAME`).
   - Vite and `vite-plugin-pwa` automatically align all asset URLs, favicon links, Service Worker scope, and Web App Manifest `start_url`, `scope`, and icon paths to match your subpath.

### Verify Your Live GitHub Pages Build

1. Open your published URL (for example, `https://<username>.github.io/<repo-name>/`).
2. Open browser **DevTools** → **Elements** → inspect `<head>` to verify the production `<meta http-equiv="Content-Security-Policy" ... connect-src 'none' ...>` tag is active.
3. Open **DevTools** → **Application** → **Service Workers** and confirm the Service Worker is registered under your repository subpath.
4. Switch **Network** throttling to **Offline**, reload the page, and generate a test keystore to confirm 0 outbound network requests.

---

## Option 2: Custom Domain on GitHub Pages

If you bind a custom domain to GitHub Pages (e.g., `keys.example.com`):

1. Configure your custom domain in **Settings** → **Pages** → **Custom domain**.
2. Either add your domain to `public/CNAME` or create a repository variable in **Settings** → **Secrets and variables** → **Actions** → **Variables**:
   - Name: `VITE_BASE_PATH`
   - Value: `/`
3. Re-run the deployment workflow so assets and PWA manifest resolve from `/`.

---

## Option 3: Cloudflare Pages (Full HTTP Security Headers)

If you prefer full HTTP response headers (`frame-ancestors 'none'`, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: no-referrer`, and `Permissions-Policy`) in addition to the built-in `<meta>` CSP:

1. Connect your repository in the **Cloudflare Pages** dashboard.
2. Set the **Build command** to `npm run build` and **Build output directory** to `dist`.
3. Cloudflare Pages automatically applies `public/_headers` to every response.

---

<div dir="rtl" lang="ar">

## ملخص النشر السريع على GitHub Pages (العربية)

1. انسخ المستودع (Fork) إلى حسابك على GitHub.
2. افتح إعدادات المستودع: **Settings ← Pages** ثم اختر **GitHub Actions** من قائمة **Source**.
3. عند أي تحديث على فرع `main` (أو عبر تشغيل المسار يدوياً من تبويب **Actions**)، سيقوم النظام تلقائياً بتشغيل اختبارات التحقق وبناء التطبيق ونشره مع ضبط مسار الاستضافة الفرعي (`/<repo-name>/`) وملفات الـ PWA وسياسة `connect-src 'none'` تلقائياً دون أي تعديل يدوي.
4. لدعم ترويسات HTTP الكاملة (`public/_headers`) يمكنك أيضاً النشر مباشرة على **Cloudflare Pages** باستخدام أمر البناء `npm run build` ومجلد الإخراج `dist`.

</div>
