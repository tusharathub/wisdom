"use client"
import { useQuery } from "convex/react";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";



export default function UserProfilePage() {
    const {id} = useParams();
    const [clerkUser, setClerkUser] = useState<any>(null);

    // const { id } = useParams();
    //   if(!id || id === "null") return <p>Invalid Article ID</p>
    //   const articleId = id as Id<"articles">;
    // const article = useQuery(api.articles.getArticleById, { id: articleId });
    

    const articles = useQuery(api.articles.getArticleByUserId, {
        userId: id as string,
    })

    // useEffect(() => {
    //     async function fetchUser() {
    //         const res = await fetch(`api/`)
    //     }
    // })

    return (
        <div className="max-w-4xl mx-auto py-10">


            {/* //article  */}
            <div className="space-y-4">
                {articles ? (
                    articles.map((a) => (
                        <div key={a._id} className="border p-4 rounded bg-gray-100 shadow">
                            <h3 className=" text-xl font-bold"> {a.title} </h3>
                            <p className="text-gray-900 line-clamp-3"> {a.content} </p>
                            <p className="text-sm text-gray-700 mt-2">
                                posted on {new Date(a._creationTime).toLocaleDateString()}
                            </p>
                        </div>
                    ))
                ) : (
                    <p>Loading articles by </p>
                )}
            </div>
        </div>
    )
}