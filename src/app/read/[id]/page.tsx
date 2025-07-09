"use client"
import { useQuery } from 'convex/react';
import { notFound } from 'next/navigation';
import { api } from '../../../../convex/_generated/api';
import { Id } from '../../../../convex/_generated/dataModel';

interface Props {
  params: {
    id: string;
  };
}

export default function ArticleDetail({ params }: Props) {
  const article = useQuery(api.articles.getArticleById, {
     id: params.id as Id<"articles"> });

  if (article === undefined) return <p className="p-8">Loading...</p>;
  if (article === null) return notFound();

  return (
    <div className="max-w-4xl mx-auto p-10 mt-10 bg-white rounded shadow">
      <h1 className="text-4xl font-bold mb-4">{article.title}</h1>
      <p className="text-gray-700 whitespace-pre-wrap text-lg">{article.content}</p>
    </div>
  );
}
