import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";


export default defineSchema({
    user: defineTable({
        name: v.string(),
        email: v.string(),
        imageUrl: v.string(),
    }),

    articles: defineTable({
        title: v.string(),
        content: v.string(),
        authorId: v.string(),
        tags: v.array(v.string()) ,
        likes: v.array(v.string()) ,
        createdAt: v.number(),
    }),

    comments : defineTable({
        articleId : v.string(),
        authorId: v.string(),
        content: v.string(),
        createdAt: v.number(),
    })
})