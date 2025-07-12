"use client";
import { useUser } from "@clerk/nextjs";
import { useMutation } from "convex/react";
import { useRouter } from "next/navigation";
import { api } from "../../../convex/_generated/api";
import React, { useState } from "react";

export default function createPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const createArticle = useMutation(api.articles.createArticle);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [error, setError] = useState("");

  if (!isLoaded) return <p className="p-6">loading..</p>;

  if (!user) {
    return (
      <p className="p-6 text-xl">You must login to create Articles here</p>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !content.trim) {
      setError("Title and Content both are required");
      return;
    }

    const articleId = await createArticle({ title, content });
    router.push(`/read/${articleId}`);
  }

  return (
    <div className="max-w-2xl mx-auto p-8 bg-white shadow mt-10 rounded">
      <h1 className="text-4xl font-bold mb-6">Share your wisdom</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <p className="text-red-700"> {error} </p>}
        <input
          type="text"
          className="w-full border px-4 py-2 rounded"
          placeholder="Title here"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <textarea
          className="w-full border px-4 py-2 rounded h-48"
          placeholder="Share your wisdom..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />

        <button
          type="submit"
          className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
        >
          Post Article
        </button>
      </form>
    </div>
  );
}
