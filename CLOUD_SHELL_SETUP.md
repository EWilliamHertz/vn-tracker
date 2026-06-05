# Running Cozy Haven in Google Cloud Shell

## The Problem
When you run the app in Cloud Shell, the local development server gets a public URL like `https://8080-ewilliamhe-abcd1234.cloudshell.dev`. But authentication magic links were hardcoded to `localhost:3000`, so they didn't work.

**This is now fixed.** You just need to configure one environment variable.

## Setup Steps

### 1. Get Your Cloud Shell Public URL
When you run `npm run dev`, look at the terminal output. You'll see something like:

```
> next dev
  ▲ Next.js 16.2.7
  - Local:        http://localhost:3000
  ▲ Ready in 2.1s
```

Your public Cloud Shell URL will be:
```
https://3000-YOUR-PROJECT-ID.cloudshell.dev
```

**Replace `YOUR-PROJECT-ID` with your actual Google Cloud project ID** (visible in the Cloud Shell header or run `gcloud config get-value project`).

### 2. Update .env.local

In the root directory of the repo, create or edit `.env.local`:

```bash
# Copy from .env.example first
cp .env.example .env.local

# Then edit to add:
NEXT_PUBLIC_SITE_URL=https://3000-YOUR-PROJECT-ID.cloudshell.dev
```

Make sure you have your Supabase credentials too:
```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-anon-key
```

### 3. Configure Supabase Auth Redirect URLs

In your Supabase project dashboard:
1. Go to **Authentication** → **URL Configuration**
2. Add your Cloud Shell URL to "Redirect URLs":
   ```
   https://3000-YOUR-PROJECT-ID.cloudshell.dev/auth/callback
   ```
3. Also add for local development:
   ```
   http://localhost:3000/auth/callback
   ```
4. Save

### 4. Restart the Dev Server

```bash
npm run dev
```

Now test:
- Sign up with an email
- **You should see a green toast notification** saying "Check your email to confirm your account!"
- Click the link in the email
- **You should be redirected to your dashboard**

## Troubleshooting

### Magic link still goes to localhost
- Check that `NEXT_PUBLIC_SITE_URL` is set correctly in `.env.local`
- Restart the dev server after changing the env file
- Check Cloud Shell URL Configuration in Supabase

### "Could not authenticate" error after clicking email link
- Make sure the URL in the email matches your current Cloud Shell URL
- Check that `/auth/callback` is in your Supabase Redirect URLs
- Try signing up again (new magic link will use current URL)

### Toast notifications not showing
- Make sure you `npm install` was successful and sonner is in node_modules
- Reload the page (hard refresh with Ctrl+Shift+R or Cmd+Shift+R)

## Production Deployment

When you deploy to production (Vercel, Railway, etc.), set:
```
NEXT_PUBLIC_SITE_URL=https://your-production-domain.com
```

And add that domain to Supabase Redirect URLs.
