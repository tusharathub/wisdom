"use client";

import Link from "next/link";
import { UserButton, useUser } from "@clerk/nextjs";

export default function Navbar() {
  const { user } = useUser();

  return (
    <nav className="w-full px-6 py-4 flex justify-between items-center bg-white shadow">
      <div>
        <Link href="/" className="text-xl font-bold">Wisdom Finder</Link>
      </div>
      <div className="flex gap-4 items-center">
        <Link href="/all-articles" className="hover:underline">Articles</Link>

        {user && (
          <Link href="/dashboard" className="hover:underline font-medium">
            Dashboard
          </Link>
        )}

        {!user ? (
          <Link href="/sign-in" className="hover:underline text-blue-600">
            Sign In
          </Link>
        ) : (
          <Link href="/sign-out" className="hover:underline text-red-500">
            Sign Out
          </Link>
        )}
        <UserButton/>
      </div>
    </nav>
  );
}
