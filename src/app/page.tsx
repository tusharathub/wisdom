'use client';

import { useEffect, useState } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@clerk/nextjs';


export default function Home() {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const router = useRouter();
  const {isLoaded, isSignedIn} = useAuth();

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(query.trim());
    }, 400);

    return () => clearTimeout(handler);
  }, [query]);

  const articles = useQuery(api.articles.searchArticles, {
    query: debouncedQuery,
    limit: 5,
  });

  const handeViewAllClick = () => {
    if(!isLoaded) return;

    if(isSignedIn) {
      router.push("/all-articles")
    }else {
      router.push("sign-in");
    }
  }
  return (
    <div className="min-h-screen p-8 bg-gray-100 text-gray-900">
      <h1 className="text-5xl font-bold mb-6 mt-8 text-center">
        Choose the Wisdom that YOU Desire
      </h1>

      <div className="flex justify-center mb-4 gap-4 relative">
        <input
          className="px-4 py-3 border border-gray-500 text-2xl rounded-2xl w-1/2"
          type="text"
          placeholder="Search wisdom..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {debouncedQuery.length > 0 && (
        <div className="max-w-2xl mx-auto mt-4 bg-white rounded-xl shadow px-6 py-4">
          {!articles ? (
            <p className="text-center text-gray-500">Searching...</p>
          ) : articles.length === 0 ? (
            <p className="text-center text-red-500">No wisdom found </p>
          ) : (
            <ul className="space-y-4">
              {articles.map((article) => (
                <li
                  key={article._id}
                  className="hover:bg-gray-100 px-4 py-2 rounded cursor-pointer transition"
                  onClick={() => {
                    alert(`Selected: ${article.title}`);
                  }}
                >
                  <h3 className="text-xl font-medium">{article.title}</h3>
                  <p className="text-gray-600 line-clamp-2 text-sm">
                    {article.content}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {articles && articles.length > 0 && (
        <div className='text-center mt-6'>
        <button 
        onClick={handeViewAllClick}
        disabled={!isLoaded}
        className='bg-blue-600 text-white px-6 py-3 rounded-lg text-lg hover:bg-blue-500 '
        >
          View all
        </button>
         
        </div>
      )

      }
    </div>
  );
}
