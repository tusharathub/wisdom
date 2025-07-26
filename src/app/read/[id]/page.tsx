"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
import Link from "next/link";

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

function buildCommentTree(comments: any[]) {
  const map: Record<string, any> = {};
  const roots: any[] = [];

  comments.forEach((c) => {
    map[c._id] = { ...c, children: [], depth: 0 };
  });

  comments.forEach((c) => {
    if (c.parentCommentId) {
      const parent = map[c.parentCommentId];
      if (parent) {
        map[c._id].depth = (parent.depth || 0) + 1;
        parent.children.push(map[c._id]);
      }
    } else {
      roots.push(map[c._id]);
    }
  });

  return roots;
}

function CommentNode({
  comment,
  articleId,
  user,
  addReply,
  deleteComment,
  toggleCommentLike,
  likes,
  replyInputs,
  setReplyInputs,
  showReplyBoxes,
  setShowReplyBoxes,
}: any) {
  const isOwner = user?.id === comment.userId;
  const likeCount = likes?.filter(
    (l: any) => l.commentId === comment._id
  )?.length;

  return (
    <div
      className={`pl-${comment.depth * 4 || 4} border-l border-gray-300 my-2`}
    >
      <div className="bg-white p-2 rounded shadow-sm">
        <div className="flex justify-between items-center">
          <Link
            href={`/user/${comment.userId}`}
            className="text-sm font-semibold text-blue-700 hover:underline"
          >
            @{comment.username || "Anonymous"}
          </Link>
          <div className="flex gap-2 items-center">
            <span className="text-xs text-gray-500">
              {formatTimeAgo(comment.createdAt)}
            </span>
            {isOwner && (
              <button
                onClick={() => {
                  if (confirm("Delete this comment?")) {
                    deleteComment({ commentId: comment._id });
                  }
                }}
                className="text-xs text-red-500 hover:underline"
              >
                Delete
              </button>
            )}
          </div>
        </div>

        <p className="text-gray-800 text-sm mt-1">{comment.content}</p>

        <div className="flex gap-4 text-sm mt-1">
          <button
            onClick={() => toggleCommentLike({ commentId: comment._id })}
            className="text-pink-600 hover:underline"
          >
            Like
          </button>
          <span className="text-gray-700">
            {likeCount ?? 0} {likeCount === 1 ? "like" : "likes"}
          </span>
          <button
            onClick={() =>
              setShowReplyBoxes((prev: any) => ({
                ...prev,
                [comment._id]: !prev[comment._id],
              }))
            }
            className="text-blue-600 hover:underline"
          >
            Reply
          </button>
        </div>

        {showReplyBoxes[comment._id] && (
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const content = replyInputs[comment._id]?.trim();
              if (!content) return;
              await addReply({
                articleId,
                parentCommentId: comment._id,
                content,
              });
              setReplyInputs((prev: any) => ({
                ...prev,
                [comment._id]: "",
              }));
              setShowReplyBoxes((prev: any) => ({
                ...prev,
                [comment._id]: false,
              }));
            }}
            className="mt-2"
          >
            <textarea
              value={replyInputs[comment._id] || ""}
              onChange={(e) =>
                setReplyInputs((prev: any) => ({
                  ...prev,
                  [comment._id]: e.target.value,
                }))
              }
              className="w-full p-2 border rounded text-sm"
              rows={2}
              placeholder="Reply..."
            />
            <button
              type="submit"
              className="bg-blue-500 text-white px-3 py-1 rounded text-sm mt-1"
            >
              Post Reply
            </button>
          </form>
        )}
      </div>

      {comment.children?.length > 0 && (
        <div className="ml-4">
          {comment.children.map((child: any) => (
            <CommentNode
              key={child._id}
              comment={child}
              articleId={articleId}
              user={user}
              addReply={addReply}
              deleteComment={deleteComment}
              toggleCommentLike={toggleCommentLike}
              likes={likes}
              replyInputs={replyInputs}
              setReplyInputs={setReplyInputs}
              showReplyBoxes={showReplyBoxes}
              setShowReplyBoxes={setShowReplyBoxes}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function ArticleDetailPage() {
  const { id } = useParams();
  const articleId = id as Id<"articles">;
  const { user } = useUser();

  const [sortBy, setSortBy] = useState<"recent" | "liked">("recent");
  const [limit, setLimit] = useState(10);
  const [commentInput, setCommentInput] = useState("");
  const [replyInputs, setReplyInputs] = useState<Record<string, string>>({});
  const [showReplyBoxes, setShowReplyBoxes] = useState<Record<string, boolean>>({});

  const article = useQuery(api.articles.getArticleById, { id: articleId });
  const likeCount = useQuery(api.likes.getLikes, { articleId });
  const hasLiked = useQuery(api.likes.hasLiked, { articleId });
  const commentLikes = useQuery(api.likes.getAllCommentLikes, { articleId });

  const commentsResult =
    sortBy === "recent"
      ? useQuery(api.comments.getCommentsByRecent, { articleId, limit })
      : useQuery(api.comments.getCommentsByLikes, { articleId, limit });

  const comments = Array.isArray(commentsResult)
    ? commentsResult
    : commentsResult?.comments || [];

  const toggleLike = useMutation(api.likes.toggleLike);
  const addComment = useMutation(api.comments.addComment);
  const deleteComment = useMutation(api.comments.deleteComment);
  const toggleCommentLike = useMutation(api.likes.toggleCommentLike);
  const addReply = useMutation(api.comments.replyToComment);

  if (!article || !comments) return <p className="p-6">Loading...</p>;

  const commentTree = buildCommentTree(comments);

  return (
    <div className="max-w-4xl mx-auto p-10 mt-10 bg-white rounded shadow">
      <h1 className="text-4xl font-bold mb-4">{article.title}</h1>
      <p className="text-gray-500 text-xl mb-6">
        by{" "}
        <Link href={`/user/${article.authorId}`} className="hover:underline">
          @{article.username}
        </Link>
      </p>

      <p className="text-gray-700 whitespace-pre-wrap text-lg mb-8">
        {article.content}
      </p>

      <div className="mb-8 flex items-center gap-4">
        <button
          onClick={() => toggleLike({ articleId })}
          disabled={!user}
          className="text-white bg-black px-4 py-2 rounded disabled:opacity-60"
        >
          {hasLiked ? "Unlike" : "Like"}
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
              className="bg-black text-white px-4 py-2 rounded hover:bg-black"
            >
              Post Comment
            </button>
          </form>
        ) : (
          <p className="text-gray-500 mb-6">Log in to leave a comment.</p>
        )}

        <div className="flex gap-4 mb-4">
          <button
            onClick={() => setSortBy("recent")}
            className={`px-3 py-1 rounded ${
              sortBy === "recent" ? "bg-black text-white" : "bg-gray-100"
            }`}
          >
            Most Recent
          </button>
          <button
            onClick={() => setSortBy("liked")}
            className={`px-3 py-1 rounded ${
              sortBy === "liked" ? "bg-black text-white" : "bg-gray-100"
            }`}
          >
            Most Liked
          </button>
        </div>

        <div className="space-y-4">
          {commentTree.length === 0 ? (
            <p className="text-gray-500">No comments yet. Be the first!</p>
          ) : (
            commentTree.map((comment: any) => (
              <CommentNode
                key={comment._id}
                comment={comment}
                articleId={articleId}
                user={user}
                addReply={addReply}
                deleteComment={deleteComment}
                toggleCommentLike={toggleCommentLike}
                likes={commentLikes}
                replyInputs={replyInputs}
                setReplyInputs={setReplyInputs}
                showReplyBoxes={showReplyBoxes}
                setShowReplyBoxes={setShowReplyBoxes}
              />
            ))
          )}
        </div>

        {sortBy === "recent" && commentTree.length >= limit && (
          <div className="text-center mt-6">
            <button
              onClick={() => setLimit((prev) => prev + 10)}
              className="text-black hover:underline"
            >
              Load more comments
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
