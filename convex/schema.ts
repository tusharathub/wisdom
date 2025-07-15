import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    username: v.string(),
    email: v.string(),
    imageUrl: v.optional(v.string()),
    clerkId: v.string(),
  })
    .index("by_clerk_id", ["clerkId"])
    .index("by_email", ["email"]),

  articles: defineTable({
    title: v.string(),
    content: v.string(),
    createdAt: v.number(),
    authorId: v.string(),
    // userId: v.string(),
    username: v.string(),
    likes: v.array(v.string()),
    tags: v.optional(v.array(v.string())),
  }).index("by_authorId", ["authorId"]),

  likes: defineTable({
    articleId: v.id("articles"),
    commentId : v.optional(v.id("comments")),
    userId: v.string(),
  })
    .index("byArticle", ["articleId"])
    .index("byCommentsId", ["commentId"])
    .index("byUserArticle", ["userId", "articleId"])
    .index("byUserComment", ["userId", "commentId"]),

  comments: defineTable({
    articleId: v.id("articles"),
    userId: v.string(),
    content: v.string(),
    createdAt: v.number(),
    username: v.optional(v.string()),
  }).index("byArticle", ["articleId"]),
  // .index("by_articleId", ["articleId"]),

  replyOnComment: defineTable({
    commentId: v.id("comments"),
    userId: v.string(),
    content: v.string(),
    createdAt: v.number(),
    username: v.optional(v.string()),
  })
  // .index("byComment", ["commentId"])
  .index("by_commentId", ["commentId"]),

  likesOnComment: defineTable({
    commentId: v.id("comments"),
    userId: v.string(),
    createdAt: v.number(),
  }).index("by_comment_user", ["commentId", "userId"]),

  notification : defineTable({
    recipientId : v.string(), //userId of article owner
    articleId : v.id("articles"),
    type: v.union(v.literal("like"), v.literal("comment")) ,
    senderUsername: v.string(),
    createdAt: v.number(),
    read: v.boolean(),
  })
  .index("by_recipient", ["recipientId"])
});
