"use client"
import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import Link from "next/link";


export default function DashBoardPage() {
    const { user} = useUser();

    const myArticles = useQuery(api.articles.getMyArticles, {
        authorId : user?.id || "",
    })

    if(!user) {
        return <p className="p-6 text-lg">You must log-in to access this page</p>
    }

    return (
        <div className="max-w-5xl mx-auto p-8">
            <h1 className="text-3xl font-bold mb-6"> Welcome, {user.username || "teacher" } </h1>

            {/* <div className="flex items-center gap-4 mb-8">
                <div>
                    <p className="text-lg font-semibold"> {user.username} </p>
                    <p className="text-gray-800"> {user.firstName} </p>
                </div>
            </div> */}

            <h2 className="text-2xl font-semibold mb-4"> Your Articles</h2>

            {!myArticles? (
                <p> Loading articles....</p>
            ): myArticles.length === 0 ?(
                <p>You haven't shared your Wisdom yet</p>
            ) :(
                <div className="space-y-4">
                    {myArticles.map((article) => (
                        <Link
                        key={article._id}
                        className="block bg-gray-100 shadow p-4 rounded hover:bg-gray-50"
                        href={`/read/${article._id}`}
                        >
                            <h3 className="text-xl font-medium"> {article.title} </h3>
                            <p className="text-gray-600 line-clamp-2"> {article.content} </p>
                        </Link>
                    ))}
                </div>
            )

            }
        </div>
    )
}