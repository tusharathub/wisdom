'use client';

import { UserButton } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';

export default function Navbar() {
  const router = useRouter();

  return (
    <nav className="w-full bg-white border-b shadow px-6 py-4 flex justify-between items-center">
      <div className="text-2xl font-bold text-red-500 cursor-pointer" onClick={() => router.push('/')}>
        Wisdom Finder
      </div>
      <div className="flex space-x-6 text-lg font-medium">
        <button onClick={() => router.push('/')} className="hover:text-red-500 cursor-pointer">Home</button>
        <button onClick={() => router.push('/all-articles')} className="hover:text-red-500 cursor-pointer">All Articles</button>
        <button onClick={() => router.push('/create')} className="hover:text-red-500 cursor-pointer">Create Articles</button>
        <button onClick={() => router.push('/sign-in')} className="hover:text-red-500 cursor-pointer">Sign In</button>
        <button onClick={() => router.push('/sign-up')} className="hover:text-red-500 cursor-pointer">Sign Up</button>
        <div>
          <UserButton/>
        </div>
      </div>
    </nav>
  );
}
