'use client';

import { useQuery, useMutation } from 'convex/react';
import { useParams } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { useState } from 'react';
import { api } from '../../../../convex/_generated/api';
import { Id } from '../../../../convex/_generated/dataModel'; 

export default function ArticleDetailPage() {
  const { id } = useParams();
  const articleId = id as Id<'articles'>; 

  const { user } = useUser();

  const article = useQuery(api.articles.getArticleById, { id: articleId });
  const likeCount = useQuery(api.likes.getLikes, { articleId });
  const hasLiked = useQuery(api.likes.hasLiked, { articleId });
  const comments = useQuery(api.comments.getComments, { articleId });

  const like = useMutation(api.likes.like);
  const addComment = useMutation(api.comments.addComment);

  const [commentInput, setCommentInput] = useState('');

  if (!article) return <p className="p-6">Loading...</p>;

  return (
    <div className="max-w-4xl mx-auto p-10 mt-10 bg-white rounded shadow">
      <h1 className="text-4xl font-bold mb-4">{article.title}</h1>
      <p className="text-gray-700 whitespace-pre-wrap text-lg mb-8">
        {article.content}
      </p>

      {/* Likes */}
      <div className="mb-6">
        <button
          onClick={() => like({ articleId })}
          disabled={hasLiked || !user}
          className="text-white bg-pink-600 px-4 py-2 rounded disabled:opacity-60"
        >
          {hasLiked ? 'Liked ❤️' : 'Like ❤️'}
        </button>
        <span className="ml-4 text-gray-700">
          {likeCount ?? 0} {likeCount === 1 ? 'like' : 'likes'}
        </span>
      </div>

      {/* Comments */}
      <div>
        <h2 className="text-2xl font-semibold mb-4">Comments</h2>

        {user ? (
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (!commentInput.trim()) return;
              await addComment({ articleId, content: commentInput });
              setCommentInput('');
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
          <p className="text-gray-500 mb-4">Login to leave a comment.</p>
        )}

        <div className="space-y-4">
          {comments?.map((c) => (
            <div key={c._id} className="bg-gray-100 p-3 rounded">
              <p className="text-gray-800">{c.content}</p>
            </div>
          ))}
        </div>
        <div className='space-y-4'>
          {comments?.map((c)=> (
            <div key={c._id} className='bg-gray-200 p-3 rounded'>
              <p className='text-sm text-black font-semibold mb-1'>
                {c.userName || "anonymous"}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
