import type { User } from '@supabase/supabase-js';
import type { GetServerSidePropsContext } from 'next';
import { useRouter } from 'next/router';

import { createClient } from '@/utils/supabase/server-props';
import { createClient as createClientComponent } from '@/utils/supabase/component';

export default function PrivatePage({ user }: { user: User }) {
  const router = useRouter();
  const supabase = createClientComponent();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <div className='min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center px-4 sm:px-6 lg:px-8'>
      <div className='max-w-md w-full space-y-8'>
        <div className='bg-white rounded-lg shadow-xl p-8'>
          <div className='text-center mb-8'>
            <div className='mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4'>
              <svg
                className='h-6 w-6 text-green-600'
                fill='none'
                viewBox='0 0 24 24'
                stroke='currentColor'>
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M5 13l4 4L19 7'
                />
              </svg>
            </div>
            <h2 className='text-3xl font-bold text-gray-900 mb-2'>Welcome!</h2>
            <p className='text-gray-600'>You have successfully authenticated</p>
          </div>

          <div className='bg-gray-50 rounded-lg p-4 mb-6'>
            <h3 className='text-sm font-medium text-gray-700 mb-2'>
              User Information
            </h3>
            <p className='text-sm text-gray-600'>
              <span className='font-medium'>Email:</span>{' '}
              {user.email || 'No email provided'}
            </p>
            <p className='text-sm text-gray-600'>
              <span className='font-medium'>User ID:</span> {user.id}
            </p>
            <p className='text-sm text-gray-600'>
              <span className='font-medium'>Last Sign In:</span>{' '}
              {user.last_sign_in_at
                ? new Date(user.last_sign_in_at).toLocaleString()
                : 'Unknown'}
            </p>
          </div>

          <div className='space-y-3'>
            <button
              onClick={() => (window.location.href = '/')}
              className='w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors'>
              Go to Home
            </button>

            <button
              onClick={handleLogout}
              className='w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors'>
              <svg
                className='w-4 h-4 mr-2'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'>
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1'
                />
              </svg>
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const supabase = createClient(context);

  const { data, error } = await supabase.auth.getUser();

  console.log('data', data);
  console.log('error', error);

  if (error || !data) {
    return {
      redirect: {
        destination: '/',
        permanent: false,
      },
    };
  }

  return {
    props: {
      user: data.user,
    },
  };
}
