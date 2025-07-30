import { NextApiRequest, NextApiResponse } from 'next';
import createClient from '@/utils/supabase/api';

export default async function GET(req: NextApiRequest, res: NextApiResponse) {
  console.log('Handling callback');
  console.log(req?.url, req.query);
  const { searchParams, origin } = new URL(`http://localhost:3000${req?.url}`);
  const code = searchParams.get('code');
  // if "next" is in param, use it as the redirect URL
  let next = searchParams.get('next') ?? '/';
  if (!next.toString().startsWith('/')) {
    // if "next" is not a relative URL, use the default
    next = '/';
  }

  if (code) {
    const supabase = createClient(req, res);
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const forwardedHost = req.headers['x-forwarded-host']; // original origin before load balancer
      const isLocalEnv = process.env.NODE_ENV === 'development';
      if (isLocalEnv) {
        // we can be sure that there is no load balancer in between, so no need to watch for X-Forwarded-Host
        return res.redirect(`${origin}${next}`);
      } else if (forwardedHost) {
        return res.redirect(`https://${forwardedHost}${next}`);
      } else {
        return res.redirect(`${origin}${next}`);
      }
    }
  }

  // return the user to an error page with instructions
  return res.redirect(`${origin}/auth/auth-code-error`);
}
