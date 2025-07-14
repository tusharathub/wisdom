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
  const toggleCommentLike = useMutation(api.likes.toggleCommentLike);
  const addReply = useMutation(api.comments.addReply);

  const replies = useQuery(api.comments.getRepliesByArticle, { articleId });
  const commentLikes = useQuery(api.likes.getAllCommentLikes, { articleId });

  // const getReplies = useQuery(api.comments.getReply, { commentId: c._id });

  const [commentInput, setCommentInput] = useState("");
  const [replyInputs, setReplyInputs] = useState<Record<string, string>>({});
  const [showReplyBoxes, setShowReplyBoxes] = useState<Record<string, boolean>>({});

  if (!article) return <p className="p-6">Loading article...</p>;

  return (
    <div className="max-w-4xl mx-auto p-10 mt-10 bg-white rounded shadow">
      <h1 className="text-4xl font-bold mb-4">{article.title}</h1>
      <p className="text-gray-500 text-sm mb-6">by {article.username}</p>

      <p className="text-gray-700 whitespace-pre-wrap text-lg mb-8">
        {article.content}{" "}
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
              await addComment({ articleId, content: commentInput });
              setCommentInput("");
            }}
            className="mb-6"
          >
            <textarea
              value={commentInput}
              onChange={(e) => setCommentInput(e.target.value)}
              placeholder="Write your thoughts..."
              className="w-full border p-3 rounded mb-2"
              rows={2}
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
            const commentReplies = replies?.filter(
              (r) => r.commentId === c._id
            );
            const likesOnComment = commentLikes?.filter(
              (l) => l.commentId === c._id
            );
            const repliesForComment =
              replies?.filter((r) => r.commentId === c._id) ?? [];

            return (
              <div key={c._id} className="bg-gray-100 p-4 rounded relative">
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-semibold text-gray-800">
                    {c.username || "Anonymous"}
                  </span>
                  <span className="text-xs text-gray-500">{timeAgo}</span>
                </div>

                <p className="text-gray-900">{c.content}</p>

                {/* like / reply/ delete */}
                <div className=" felx gap-4 items-center text-sm">
                  <button
                    onClick={() => toggleCommentLike({ commentId: c._id })}
                    className="text-pink-800 hover:underline"
                  >
                    Like
                  </button>
                  <span className="text-gray-700">
                    {likesOnComment ? likesOnComment.length : 0}{" "}
                    {likesOnComment?.length === 1 ? "like" : "likes"}
                  </span>
                  <button
                    onClick={() =>
                      setShowReplyBoxes((prev) => ({
                        ...prev,
                        [c._id]: !prev[c._id],
                      }))
                    }
                    className="text-blue-900 hover:underline"
                  >
                    Reply
                  </button>
                </div>

                {isOwner && (
                  <button
                    onClick={async () => {
                      if (confirm("Are you sure?")) {
                        await deleteComment({ commentId: c._id });
                      }
                    }}
                    className="absolute top-2 right-2 text-red-500 text-xs hover:underline"
                  >
                    Delete
                  </button>
                )}

                {/* reply box */}
                {showReplyBoxes[c._id] && user && (
                  <form
                    onSubmit={async (e) => {
                      if (!replyInputs[c._id]?.trim()) return;
                      await addReply({
                        commentId: c._id,
                        content: replyInputs[c._id],
                        username: user.username || "anonymous reply",
                      });
                      setReplyInputs((prev) => ({ ...prev, [c._id]: "" }));
                    }}
                    className="mt-3"
                  >
                    <textarea
                      value={replyInputs[c._id] || ""}
                      onChange={(e) =>
                        setReplyInputs((prev) => ({
                          ...prev,
                          [c._id]: e.target.value,
                        }))
                      }
                      placeholder="repy to this..."
                      className="w-full p-2 border rounded mb-2"
                      rows={2}
                    />
                    <button
                      type="submit"
                      className="bg-blue-500 text-white px-3 py-1 rounded text-sm"
                    >
                      Post Reply
                    </button>
                  </form>
                )}

                {/* replies  */}
                {repliesForComment.length > 0 && (
                  <div className="mt-4 pl-4 border-l-2 border-gray-300 space-y-3">
                    {repliesForComment.map((r) => (
                      <div
                        key={r._id}
                        className="bg-white p-2 rounded shadow-sm"
                      >
                        <div className="flex justify-between">
                          <span className="text-sm font-semibold text-gray-800">
                            {r.username || "Anonymous"}
                          </span>
                          <span className="text-xs text-gray-500">
                            {formatTimeAgo(r.createdAt)}
                          </span>
                        </div>
                        <p className="text-gray-800 text-sm mt-1">
                          {r.content}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
