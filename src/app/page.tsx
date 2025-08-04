'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the setup flow with a small delay to ensure proper hydration
    const timer = setTimeout(() => {
      router.push('/setup');
    }, 100);

    return () => clearTimeout(timer);
  }, [router]);

    return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-[#0081A7] mb-4">KanKan</h1>
        <p className="text-[#00AFB9]">Loading...</p>
      </div>
    </div>
  );
}
