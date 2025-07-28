// app/all-articles/AllArticlesClient.tsx
"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function AllArticlesClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialQuery = searchParams.get("query") || "";
  const initialSort = searchParams.get("sort") || "recent";

  const [search, setSearch] = useState(initialQuery);
  const [debouncedSearch, setDebouncedSearch] = useState(initialQuery);
  const [sort, setSort] = useState<"recent" | "liked">(
    initialSort as "recent" | "liked"
  );
  const [visibleCount, setVisibleCount] = useState(10);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedSearch(search);
      const params = new URLSearchParams();
      if (search) params.set("query", search);
      else params.delete("query");
      params.set("sort", sort);
      router.push(`/all-articles?${params.toString()}`);
      setVisibleCount(10);
    }, 300);
    return () => clearTimeout(timeout);
  }, [search, sort, router]);

  const articles = useQuery(api.articles.searchArticles, {
    query: debouncedSearch,
    limit: 100,
    sort,
  });

  const visibleArticles = articles?.slice(0, visibleCount);

  return (
    <div className="min-h-screen p-8 bg-gray-100 text-gray-900">
      <h1 className="text-4xl font-bold mb-6 text-center">All Wisdom</h1>

      <div className="flex flex-col md:flex-row items-center justify-center gap-4 mb-6">
        <input
          className="px-4 py-3 border border-gray-500 text-2xl rounded-2xl w-full md:w-1/2"
          type="text"
          placeholder="Search wisdom..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <select
          className="px-4 py-3 border border-gray-500 text-lg rounded-2xl"
          value={sort}
          onChange={(e) => setSort(e.target.value as "recent" | "liked")}
        >
          <option value="recent">Most Recent</option>
          <option value="liked">Most Liked</option>
        </select>
      </div>

      <ul className="max-w-3xl mx-auto space-y-4">
        {!articles && <p className="text-center mt-8">Loading...</p>}
        {articles?.length === 0 && (
          <p className="text-center text-gray-600">
            No results found for &quot;{debouncedSearch}&quot;
          </p>
        )}
        {visibleArticles?.map((article) => (
          <li
            key={article._id}
            onClick={() => router.push(`/read/${article._id}`)}
            className="bg-white px-6 py-4 rounded-lg shadow hover:bg-gray-100 cursor-pointer transition"
          >
            <h3 className="text-2xl font-semibold">{article.title}</h3>
            <p className="text-gray-700 mt-2 line-clamp-2">{article.content}</p>
            <p className="text-sm text-gray-500 mt-1">
              👍 {article.likeCount} {article.likeCount === 1 ? "like" : "likes"}
            </p>
          </li>
        ))}
      </ul>

      {articles && visibleCount < articles.length && (
        <div className="flex justify-center mt-6">
          <button
            onClick={() => setVisibleCount((prev) => prev + 10)}
            className="px-6 py-2 text-lg font-semibold bg-black text-white rounded hover:bg-gray-800 transition"
          >
            Load More
          </button>
        </div>
      )}
    </div>
  );
}
