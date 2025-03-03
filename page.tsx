"use client";

import { useSession, signIn, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation'; // Updated import for App Router
import React, { useEffect } from 'react';

const HomePage = () => {
  const { data: session, status } = useSession();
  const router = useRouter();

  console.log(session);

  // Redirect to /todo if authenticated
  useEffect(() => {
    if (status === 'authenticated') {
      router.push('/todo');
    }
  }, [status, router]);

  if (status === 'loading') {
    return <p>Loading...</p>;
  }

  if (status === 'unauthenticated') {
    return (
      <div>
        <p>You are not authorized. Please sign in.</p>
        <button onClick={() => signIn('google')}>Sign In with Google</button>
      </div>
    );
  }

  // If authenticated, this will not render because of the redirect
  return null;
};

export default HomePage;