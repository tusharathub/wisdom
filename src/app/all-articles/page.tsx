'use client';
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function AllArticlesPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState(search);
  const [visibleCount, setVisibleCount] = useState(10); 

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedSearch(search);
      setVisibleCount(10); 
    }, 300);
    return () => clearTimeout(timeout);
  }, [search]);

  const articles = useQuery(api.articles.searchArticles, {
    query: debouncedSearch,
    limit: 100,
  });

  const visibleArticles = articles?.slice(0, visibleCount);

  return (
    <div className="min-h-screen p-8 bg-gray-100 text-gray-900">
      <h1 className="text-4xl font-bold mb-6 text-center">All Wisdom</h1>

      <div className="flex justify-center mb-4 gap-4 relative">
        <input
          className="px-4 py-3 border border-gray-500 text-2xl rounded-2xl w-1/2"
          type="text"
          placeholder="Search wisdom..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <ul className="max-w-3xl mx-auto space-y-4">
        {!articles && <p className="text-center mt-8">Loading...</p>}
        {articles?.length === 0 && (
          <p className="text-center text-gray-600">
            No results found for "{search}"
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
