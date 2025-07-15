"use client"
import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import Link from "next/link";


export default function NotificationPage() {
    const {user} = useUser();

    const notifications = useQuery(api.notification.getMyNotifications, {
        userId : user?.id ?? "",
    })

    if(!user) return <p className="p-6">Login to get notifications</p>;
    if(!notifications) return <p className="p-6"> Loading ...</p>

    return( 
        <div className="max-w-3xl mx-auto p-8">
            <h1 className="text-3xl font-bold mb-6"> Notifications</h1>
            {notifications.length ===0 ? (
                <p>You have no notifications, yet</p>
            ) : (
                <ul className="space-y-4">
                    {notifications.map((n)=> (
                        <li key={n._id} className="bg-gray-100 p-4 rounded shadow">
                            <p>
                                <strong> {n.senderUsername} </strong>
                                {n.type === "like" ? "liked" : "commented on "} your article
                            </p>
                            <Link 
                            className="text-blue-800 underline text-sm"
                            href={`/read/${n.articleId}`}>
                                Visit Article
                            </Link>
                            <span className="block text-xs text-black mt-1">
                                {new Date(n.createdAt).toLocaleString()}
                            </span>
                        </li>
                    ))}
                </ul>
            ) }
        </div>
    )
}