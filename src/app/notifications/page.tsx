"use client";

import { useUser } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import Link from "next/link";
import { useEffect } from "react";

function formatTimeAgo(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return "Just now";
}

export default function NotificationPage() {
  const { user } = useUser();

  const notifications = useQuery(api.notification.getMyNotifications, {
    userId: user?.id ?? "",
  });

  const markAllAsRead = useMutation(api.notification.markAllAsRead);

  useEffect(() => {
    if (user?.id) {
      markAllAsRead({ userId: user.id });
    }
  }, [user?.id]);

  if (!user) return <p className="p-6">Login to get notifications</p>;
  if (!notifications) return <p className="p-6">Loading...</p>;

  return (
    <div className="max-w-3xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">Notifications</h1>

      {notifications.length === 0 ? (
        <p>You have no notifications yet.</p>
      ) : (
        <ul className="space-y-4">
          {notifications.map((n) => (
            <li key={n._id} className="bg-gray-100 p-4 rounded shadow">
              <p>
                <Link href={`/user/${n.senderId}`} className="hover:underline">
                <strong>{n.senderUsername}</strong>{" "}
                </Link>
                {n.type === "like" && "liked your article"}
                {n.type === "comment" && "commented on your article"}
                {n.type === "reply" && "replied to your comment"}
              </p>

              {/* Show comment content only for comments/replies */}
              {(n.type === "comment" || n.type === "reply") && (
                <p className="text-sm text-gray-700 mt-1 italic">
                  “{n.commentContent || "No comment content"}”
                </p>
              )}

              <Link
                className="text-blue-800 underline text-sm"
                href={`/read/${n.articleId}`}
              >
                Visit Article
              </Link>

              <span className="block text-xs text-black mt-1">
                {formatTimeAgo(n.createdAt)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
