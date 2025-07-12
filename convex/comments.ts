import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const getComments = query({
  args: {
    articleId: v.id("articles"),
    limit: v.optional(v.string()),
    cursor: v.optional(v.string()),
  },
  handler: async (ctx, { articleId, limit = 5, cursor }) => {
    return await ctx.db
      .query("comments")
      .withIndex("byArticle", (q) => q.eq("articleId", articleId))
      .order("desc")
      .collect();
  },
});

export const addComment = mutation({
  args: {
    articleId: v.id("articles"),
    content: v.string(),
    // username: v.string(),
  },
  handler: async (ctx, { articleId, content }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
    .query("users")
    .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
    .unique();

    const username = user?.username ?? "Anonymous"

    await ctx.db.insert("comments", {
      articleId,
      content,
      userId: identity.subject,
      createdAt: Date.now(),
      username,
    });
  },
});

export const deleteComment = mutation({
  args: { commentId: v.id("comments") },
  handler: async (ctx, { commentId }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const comment = await ctx.db.get(commentId);
    if (!comment) throw new Error("Comment not found");

    if (comment.userId !== identity.subject) {
      throw new Error("You cannot delete other's comment");
    }

    await ctx.db.delete(commentId);
  },
});
