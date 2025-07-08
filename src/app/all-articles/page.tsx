'use client';

import {  useConvexAuth, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function AllArticlesPage() {
  

  const articles = useQuery(api.articles.searchArticles, {
    query: "",
    limit: 100, // or omit 'limit' if your query supports returning all
  });

  if (!articles) return <p className="text-center mt-8">Loading...</p>;

  return (
    <div className="min-h-screen p-8 bg-gray-100 text-gray-900">
      <h1 className="text-4xl font-bold mb-6 text-center">All Wisdom</h1>
      <ul className="max-w-3xl mx-auto space-y-4">
        {articles.map((article) => (
          <li
            key={article._id}
            className="bg-white px-6 py-4 rounded-lg shadow hover:bg-gray-50 transition"
          >
            <h3 className="text-2xl font-semibold">{article.title}</h3>
            <p className="text-gray-700 mt-2">{article.content}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
