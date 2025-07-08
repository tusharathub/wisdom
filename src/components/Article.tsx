

export default function ArticleCard({ article } :any) {
  return (
    <div className="p-4 rounded-xl shadow-md bg-white">
      <h2 className="text-xl font-bold">{article.title}</h2>
      <p className="text-gray-600 line-clamp-3">{article.content}</p>
    </div>
  );
}