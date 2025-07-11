import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    name: v.string(),
    email: v.string(),
    image: v.optional(v.string()),
    clerkId: v.string(),
  }).index("by_clerk_id", ["clerkId"]),

  articles: defineTable({
    title: v.string(),
    content: v.string(),
    authorId: v.string(),
    tags: v.array(v.string()),
    likes: v.array(v.string()),
    createdAt: v.number(),
  }),

  likes: defineTable({
    articleId: v.id("articles"),
    userId: v.string(),
  })
    .index("byArticle", ["articleId"])
    .index("byUserArticle", ["userId", "articleId"]),

  comments: defineTable({
    articleId: v.id("articles"),
    userId: v.string(),
    content: v.string(),
    createdAt: v.number(),
    username: v.optional(v.string()),
  }).index("byArticle", ["articleId"]),
});
