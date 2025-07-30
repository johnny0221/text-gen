# Next.js + Supabase Boilerplate

A modern boilerplate for building full-stack applications with Next.js and Supabase.

## Features

- 🔐 Email/Password & Google OAuth authentication
- 🛡️ Protected routes with server-side auth
- 🎨 Beautiful UI with Tailwind CSS
- 📱 Responsive design
- 🚀 Next.js 15 + TypeScript

## Quick Start

1. **Clone & install**

   ```bash
   git clone <your-repo-url>
   cd next-supabase
   npm install
   ```

2. **Environment variables**
   Create `.env.local`:

   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

3. **Run**
   ```bash
   npm run dev
   ```

## Setup Supabase

1. Create project at [supabase.com](https://supabase.com)
2. Copy URL and anon key from Settings > API
3. Enable Google OAuth in Authentication > Providers (optional)

## Project Structure

```
├── pages/
│   ├── login.tsx          # Login with OAuth
│   ├── private.tsx        # Protected page
│   └── index.tsx          # Home page
├── utils/supabase/        # Supabase clients
└── styles/globals.css     # Tailwind styles
```

## Usage

### Protected Pages

```typescript
export async function getServerSideProps(context) {
  const supabase = createClient(context);
  const { data } = await supabase.auth.getUser();

  if (!data.user) {
    return { redirect: { destination: '/login' } };
  }

  return { props: { user: data.user } };
}
```

### Supabase Client

```typescript
import { createClient } from '@/utils/supabase/component';
const supabase = createClient();
```

## Deploy

1. Push to GitHub
2. Connect to Vercel
3. Add environment variables
4. Deploy!

## License

MIT
