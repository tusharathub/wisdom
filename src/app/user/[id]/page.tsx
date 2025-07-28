"use client"
import { useQuery } from "convex/react";
import { useParams, useRouter } from "next/navigation";
import { api } from "../../../../convex/_generated/api";

export default function UserProfilePage() {
  const { id } = useParams();
  const router = useRouter();
  const articles = useQuery(api.articles.getArticleByUserId, {
    userId: id as string,
  });

  if (!id || id === "null") return <p>Invalid user ID</p>;



  return (
    <div className="max-w-4xl mx-auto py-10">
      <div className="mb-10 bg-gray-100 shadow rounded p-6">
        <h1 className="text-3xl font-bold mb-4">
           @{articles?.[0]?.username || "Unknown"}
        </h1>
    
        <p className="text-gray-700">Total Articles: {articles?.length || 0}</p>
      </div>

      {/* Articles list */}
      
      <div className="space-y-4">
        {articles ? (
          articles.map((a) => (
            <div 
            key={a._id} 
            className="border p-4 rounded bg-gray-100 shadow hover:bg-gray-200 transition cursor-pointer"
            onClick={() => router.push(`/read/${a._id}`)}>
              <h3 className="text-xl font-bold">{a.title}</h3>
              <p className="text-gray-900 line-clamp-2">{a.content}</p>
              <p className="text-sm text-gray-700 mt-2">
                posted on {new Date(a._creationTime).toLocaleDateString()}
              </p>
            </div>
          ))
        ) : (
          <p>Loading articles...</p>
        )}
      </div>
    </div>
  );
}
