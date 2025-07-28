"use client";

import Link from "next/link";
import { UserButton, useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

export default function Navbar() {
  const { user } = useUser();

  const notifications = useQuery(api.notification.getAllForUserNotification, {
    userId: user?.id ?? "",
  });

  return (
    <nav className="w-full px-6 py-4 flex justify-between items-center bg-white shadow">
      <div>
        <Link href="/" className="text-xl font-bold">
          Wisdom Finder
        </Link>
      </div>
      <div className="relative flex gap-4 items-center">
        <Link href="/all-articles" className="hover:underline">
          Articles
        </Link>

        {user && (
          <>
            <Link href="/create" className="hover:underline font-medium">
              Create
            </Link>

            <Link
              href="/notifications"
              className="relative hover:underline font-medium"
            >
              Notifications
              {notifications && notifications.some((n) => !n.read) && (
                <span className="absolute top-0 right-[-8px] h-2 w-2 bg-red-600 rounded-full" />
              )}
            </Link>

            <Link href="/dashboard" className="hover:underline font-medium">
              Dashboard
            </Link>
          </>
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
        <UserButton />
      </div>
    </nav>
  );
}
