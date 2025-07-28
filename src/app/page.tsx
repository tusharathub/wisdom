'use client';

import { useEffect, useState } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';

interface Article {
  _id: string;
  title: string;
  content: string;
}

function ArticleCard({ article, onClick }: { article: Article; onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      className="cursor-pointer bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow transition min-h-[90px] flex flex-col justify-between"
    >
      <h3 className="text-lg font-semibold text-gray-900 line-clamp-1">{article.title}</h3>
      <p className="text-gray-700 mt-1 line-clamp-2">{article.content}</p>
    </div>
  );
}

function FeaturedQuote() {
  return (
    <div className="relative bg-gray-50 border border-gray-200 rounded-2xl shadow px-6 py-5 mb-10 mx-auto max-w-2xl flex items-center gap-5 justify-center ">
      <div>
        <p className="italic text-lg text-gray-700">&quot;The only true wisdom is in knowing you know nothing.&quot;</p>
        <span className="block text-gray-400 text-sm mt-1">– Socrates</span>
      </div>
      <div className="absolute top-2 right-4 text-3xl text-gray-100 select-none pointer-events-none">“</div>
    </div>
  );
}

function ArticleStatsBar({ totalArticles = 0 }: { totalArticles: number }) {
  return (
    <div className="flex items-center gap-6 justify-center py-2 mb-10">
      <div className="flex flex-col items-center">
        <span className="text-xl font-bold text-gray-900">{totalArticles}</span>
        <span className="uppercase text-xs tracking-wider text-gray-400">Articles</span>
      </div>
      <span className="w-px h-6 bg-gray-200" aria-hidden="true"></span>
      <div className="flex flex-col items-center">
        <span className="text-xl font-semibold text-gray-700">∞</span>
        <span className="uppercase text-xs tracking-wider text-gray-400">Wisdom</span>
      </div>
    </div>
  );
}

export default function Home() {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const { isLoaded, isSignedIn } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedQuery(query.trim()), 350);
    return () => clearTimeout(handler);
  }, [query]);

  const articles = useQuery(api.articles.searchArticles, { query: debouncedQuery, limit: 5 });
  const allArticles = useQuery(api.articles.searchArticles, { query: '', limit: 100 });

  const totalArticles = allArticles?.length || 0;

  const handleViewAllClick = () => {
    if (!isLoaded) return;
    router.push(isSignedIn ? '/all-articles' : '/sign-in');
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-white via-gray-50 to-gray-100 text-gray-900 px-4 sm:px-8 py-10">
      <FeaturedQuote />
      <ArticleStatsBar totalArticles={totalArticles} />

      <section className="text-center max-w-3xl mx-auto mb-7">
        <h1 className="text-4xl sm:text-5xl font-bold mb-1 text-gray-900">
          Discover Timeless Wisdom
        </h1>
        <p className="text-lg text-gray-700 max-w-xl mx-auto mt-2">
          Real experiences, life lessons, and practical reflections from people like YOU.
        </p>
      </section>
      <div className="flex justify-center mt-5 mb-10">
        <div className="relative w-full max-w-lg">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search wisdom…"
            className="w-full px-6 py-3 border border-gray-300 bg-white rounded-full text-base text-gray-900 shadow focus:outline-none focus:ring-2 focus:ring-gray-300"
          />
          {query && (
            <button
              className="absolute right-2 top-2.5 text-gray-400 hover:text-black text-xl font-bold rounded-full p-1 bg-white"
              onClick={() => setQuery('')}
              title="Clear"
              type="button"
            >×</button>
          )}
        </div>
      </div>

      <section className="max-w-2xl mx-auto">
        {(debouncedQuery.length > 0) ? (
          <div className="bg-white rounded-2xl shadow p-7 border border-gray-100 mt-1">
            {!articles
              ? <h1>Searching..</h1>
              : (articles.length === 0
                ?   <p className="text-gray-500 font-medium text-center">No wisdom found.<br/>Try another keyword.</p>
                : (
                  <ul className="space-y-5">
                    {articles.map((article: Article) => (
                      <li key={article._id}>
                        <ArticleCard article={article} onClick={() => router.push(`/read/${article._id}`)} />
                      </li>
                    ))}
                  </ul>
                )
              )
            }
          </div>
        ) :null}
      </section>
      <div className="text-center mt-10">
        <button
          onClick={handleViewAllClick}
          disabled={!isLoaded}
          className="border border-gray-300 bg-gray-100 text-gray-900 text-lg px-7 py-3 rounded-full shadow hover:bg-white disabled:opacity-50 font-semibold tracking-wide transition"
        >
          View All Articles 
        </button>
      </div>
      <div className="fixed inset-x-0 bottom-0 -z-10 select-none opacity-30 pointer-events-none">
        <div className="w-full h-[60px] bg-gradient-to-t from-gray-100 to-transparent" />
      </div>
    </main>
  );
}
