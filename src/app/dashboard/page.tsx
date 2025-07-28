"use client";

import { useUser } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import Link from "next/link";
import { Id } from "../../../convex/_generated/dataModel";
import { useState } from "react";

export default function DashboardPage() {
  const { user } = useUser();
  const [selectedTab, setSelectedTab] = useState<"articles" | "liked">("articles");

  const articlesWithStats = useQuery(api.articles.getMyArticlesWithStats, {
    authorId: user?.id || "",
  });

  const likedArticles = useQuery(api.articles.getLikedArticlesByUser, {
    userId: user?.id || "",
  });

  const deleteArticle = useMutation(api.articles.deleteArticle);

  const handleDelete = async (articleId: Id<"articles">) => {
    const confirmed = confirm("Are you sure you want to delete this article?");
    if (!confirmed) return;

    try {
      await deleteArticle({ articleId });
    } catch (err: unknown) {
      if(err instanceof Error ){
        alert("Failed to delete article : " + err.message);
      }else{
        alert("failed to delete article: Unknown Error")
      };
    }
  };

  if (!user) {
    return (
      <p className="p-6 text-lg">You must be logged in to view this page.</p>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">
        Welcome, {user.username || "Teacher"}
      </h1>

      <div className="flex gap-4 mb-6">
        <button
          onClick={() => setSelectedTab("articles")}
          className={`px-4 py-2 rounded ${
            selectedTab === "articles"
              ? "bg-black text-white"
              : "bg-gray-200 text-gray-700"
          }`}
        >
          Your Articles
        </button>
        <button
          onClick={() => setSelectedTab("liked")}
          className={`px-4 py-2 rounded ${
            selectedTab === "liked"
              ? "bg-black text-white"
              : "bg-gray-200 text-gray-700"
          }`}
        >
          Your Liked Posts
        </button>
      </div>

      {selectedTab === "articles" && (
        <>
          <h2 className="text-2xl font-semibold mb-4">Your Articles</h2>

          {!articlesWithStats ? (
            <p>Loading articles...</p>
          ) : articlesWithStats.length === 0 ? (
            <p>You haven’t posted anything yet</p>
          ) : (
            <div className="space-y-4">
              {articlesWithStats.map((article) => (
                <div
                  key={article._id}
                  className="bg-white shadow p-4 rounded hover:bg-gray-50"
                >
                  <Link href={`/read/${article._id}`}>
                    <h3 className="text-xl font-medium">{article.title}</h3>
                    <p className="text-gray-600 line-clamp-2">{article.content}</p>
                  </Link>
                  <div className="mt-2 text-sm text-gray-500 flex gap-4 justify-between items-center">
                    <div className="flex gap-4">
                      <span>👍 {article.likeCount} likes</span>
                      <span>💬 {article.commentCount} comments</span>
                    </div>
                    <button
                      onClick={() => handleDelete(article._id)}
                      className="text-red-600 hover:underline text-sm"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {selectedTab === "liked" && (
        <>
          <h2 className="text-2xl font-semibold mb-4">Your Liked Posts</h2>

          {!likedArticles ? (
            <p>Loading liked articles...</p>
          ) : likedArticles.length === 0 ? (
            <p>You haven’t liked any posts yet.</p>
          ) : (
            <div className="space-y-4">
              {likedArticles.map((article) => (
                <div
                  key={article._id}
                  className="bg-white shadow p-4 rounded hover:bg-gray-50"
                >
                  <Link href={`/read/${article._id}`}>
                    <h3 className="text-xl font-medium">{article.title}</h3>
                    <p className="text-gray-600 line-clamp-2">{article.content}</p>
                  </Link>
                  <div className="mt-2 text-sm text-gray-500 flex gap-4 justify-between items-center">
                    <div className="flex gap-4">
                      <span>👍 {article.likeCount} likes</span>
                      <span>💬 {article.commentCount} comments</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
