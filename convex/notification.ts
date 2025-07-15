import { v } from "convex/values";
import { mutation, query } from "./_generated/server";


export const createNotification = mutation({
    args: {
        recipientId : v.string(),
        type: v.union(v.literal("like"), v.literal("comment")),
        articleId : v.id("articles"),
        senderUsername: v.string(),
    },
    handler: async (ctx, {recipientId, type, articleId, senderUsername}) => {
        await ctx.db.insert("notification", {
            recipientId,
            type,
            articleId,
            senderUsername,
            createdAt: Date.now(),
            read: false,
        })
    }
})

export const getMyNotifications = query({
    args : {userId : v.string()},
    handler: async (ctx, {userId}) => {
        return await ctx.db
        .query("notification")
        .withIndex("by_recipient", (q) => q.eq("recipientId", userId))
        .order("desc")
        .take(20)
    }
})