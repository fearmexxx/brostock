Here is the step-by-step deployment guide for hosting your frontend on Vercel.

  Prerequisites
   - Ensure your backend is deployed (e.g., on Render or Railway) so you have a live API URL (e.g.,
     https://your-backend.onrender.com).
   - Your latest code is pushed to GitHub (we just did this).

  1. Import Project to Vercel
   1. Log in to your Vercel Dashboard (https://vercel.com/dashboard).
   2. Click "Add New..." -> "Project".
   3. Select your GitHub repository (brostock).

  2. Configure Project Settings
  Vercel will detect the project, but you need to tell it where the frontend code lives.

   * Framework Preset: Select Next.js.
   * Root Directory: Click "Edit" and select the frontend folder.
       * This is crucial because your `package.json` is inside `frontend/`, not the root.

  3. Set Environment Variables
  Expand the "Environment Variables" section and add:

   * Key: NEXT_PUBLIC_API_URL
   * Value: Your deployed Backend URL (e.g., https://brostock-backend.onrender.com or
     http://your-vps-ip:8000).
       * Do not use `localhost` here.
       * Do not add a trailing slash `/` at the end.

  4. Deploy
   1. Click "Deploy".
   2. Vercel will build your application. Since we fixed the build errors locally, it should pass.
   3. Once finished, you will get a live URL (e.g., https://brostock-frontend.vercel.app).

  Troubleshooting
   * CORS Issues: If the frontend loads but data is missing, ensure your Backend (main.py) allows the
     Vercel domain in CORSMiddleware.
       * Quick Fix: Allow all origins in backend: allow_origins=["*"].
   * Mixed Content: If your backend is on http (not secure) and Vercel is on https, the browser will
     block requests. Ensure your backend has SSL (Render/Railway provide this automatically).