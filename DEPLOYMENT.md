# Deployment Guide

Use three services:

- Render: hosts the FastAPI backend
- Vercel: hosts the React frontend
- Namecheap: connects your custom domain

## 1. Deploy Backend On Render

1. Go to Render.
2. Create a new Web Service.
3. Connect your GitHub repo: `malgarigayatri26/studymate-ai`.
4. Use these settings:

```text
Root Directory: backend
Build Command: pip install -r requirements.txt
Start Command: uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

5. Add this environment variable:

```text
FRONTEND_URL=https://your-vercel-url.vercel.app
```

Render will give you a backend URL like:

```text
https://studymate-ai-backend.onrender.com
```

## 2. Deploy Frontend On Vercel

1. Go to Vercel.
2. Import the same GitHub repo.
3. Use these settings:

```text
Root Directory: frontend
Build Command: npm run build
Output Directory: dist
```

4. Add this environment variable:

```text
VITE_API_URL=https://your-render-backend-url.onrender.com
```

## 3. Connect Namecheap Domain

In Vercel:

1. Open your frontend project.
2. Go to Settings.
3. Go to Domains.
4. Add your Namecheap domain.
5. Vercel will show DNS records.

In Namecheap:

1. Open Domain List.
2. Click Manage.
3. Open Advanced DNS.
4. Add the DNS records Vercel gives you.

Common setup:

```text
Type: A
Host: @
Value: 76.76.21.21

Type: CNAME
Host: www
Value: cname.vercel-dns.com
```

After DNS updates, your site can take a few minutes to a few hours to work.

## Important

After Vercel gives the final frontend URL, update the Render environment variable:

```text
FRONTEND_URL=https://your-final-domain.com
```
