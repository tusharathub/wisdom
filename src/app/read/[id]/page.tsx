"use client";

import { useQuery, useMutation } from "convex/react";
import { useParams } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { useState } from "react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";

function formatTimeAgo(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return `Just now`;
}

export default function ArticleDetailPage() {
  const { id } = useParams();
  const articleId = id as Id<"articles">;

  const { user } = useUser();

  const article = useQuery(api.articles.getArticleById, { id: articleId });
  const likeCount = useQuery(api.likes.getLikes, { articleId });
  const hasLiked = useQuery(api.likes.hasLiked, { articleId });
  const comments = useQuery(api.comments.getComments, { articleId });

  const like = useMutation(api.likes.like);
  const addComment = useMutation(api.comments.addComment);
  const deleteComment = useMutation(api.comments.deleteComment);

  const [commentInput, setCommentInput] = useState("");

  if (!article) return <p className="p-6">Loading article...</p>;

  return (
    <div className="max-w-4xl mx-auto p-10 mt-10 bg-white rounded shadow">
      <h1 className="text-4xl font-bold mb-4">{article.title}</h1>
      <p className="text-gray-700 whitespace-pre-wrap text-lg mb-8">
        {article.content}
      </p>

      <div className="mb-8 flex items-center gap-4">
        <button
          onClick={() => like({ articleId })}
          disabled={hasLiked || !user}
          className="text-white bg-pink-600 px-4 py-2 rounded disabled:opacity-60"
        >
          {hasLiked ? "Liked ❤️" : "Like ❤️"}
        </button>
        <span className="text-gray-700 text-lg">
          {likeCount ?? 0} {likeCount === 1 ? "like" : "likes"}
        </span>
      </div>

      <div>
        <h2 className="text-2xl font-semibold mb-4">Comments</h2>

        {user ? (
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (!commentInput.trim()) return;
              await addComment({
                articleId,
                content: commentInput,
                username: user?.fullName || "anonymous",
              });
              setCommentInput("");
            }}
            className="mb-6"
          >
            <textarea
              value={commentInput}
              onChange={(e) => setCommentInput(e.target.value)}
              placeholder="Write a comment..."
              className="w-full border p-3 rounded mb-2"
              rows={3}
            />
            <button
              type="submit"
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Post Comment
            </button>
          </form>
        ) : (
          <p className="text-gray-500 mb-6">Log in to leave a comment.</p>
        )}

        <div className="space-y-4">
          {comments?.length === 0 && (
            <p className="text-gray-500">No comments yet, be the first!</p>
          )}

          {comments?.map((c) => {
            const isOwner = c.userId === user?.id;
            const timeAgo = formatTimeAgo(c.createdAt);

            return (
              <div key={c._id} className="bg-gray-100 p-4 rounded relative">
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-semibold text-gray-800">
                    {c.username || "Anonymous"}
                  </span>
                  <span className="text-xs text-gray-500">{timeAgo}</span>
                </div>

                <p className="text-gray-900">{c.content}</p>

                {isOwner && (
                  <button
                    onClick={async () => {
                      if (confirm("Delete this comment?")) {
                        await deleteComment({ commentId: c._id });
                      }
                    }}
                    className="absolute top-2 right-2 text-red-500 text-xs hover:underline"
                  >
                    Delete
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
