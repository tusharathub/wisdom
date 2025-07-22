import { api } from "./_generated/api";
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const getComments = query({
  args: {
    articleId: v.id("articles"),
    limit: v.optional(v.string()),
    cursor: v.optional(v.string()),
  },
  handler: async (ctx, { articleId }) => {
    const allElements = await ctx.db
      .query("comments")
      .withIndex("byArticle", (q) => q.eq("articleId", articleId))
      .order("asc")
      .collect();

      return allElements;
  },
});

export const addComment = mutation({
  args: {
    articleId: v.id("articles"),
    content: v.string(),
    username: v.optional(v.string()),
    parentCommentId : v.optional(v.id("comments")),
  },
  handler: async (ctx, { articleId, content, parentCommentId }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    const username = user?.username ?? "Anonymous";
    const newComment = await ctx.db.insert("comments", {
      articleId,
      content,
      userId: identity.subject,
      createdAt: Date.now(),
      username,
      parentCommentId,
    });

    const article = await ctx.db.get(articleId);
    if (!article) throw new Error("Article not found");

    if(!parentCommentId && article.authorId !== identity.subject){ 
          await ctx.db.insert("notification", {
            type: "comment",
            articleId,
            commentId: newComment,
            recipientId: article.authorId,
            senderId: identity.subject,
            senderUsername: username,
            commentContent: content,
            createdAt: Date.now(),
            read: false,
          });
        }
        return newComment;
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

export const replyToComment = mutation({
  args: {
    articleId: v.id("articles"),
    parentCommentId: v.id("comments"),
    content: v.string(),
    // username: v.string(),
  },
  handler: async (ctx, { articleId, parentCommentId, content }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    const username = user?.username ?? "Anonymous";

    const parentComment = await ctx.db.get(parentCommentId);
    if (!parentComment) throw new Error("Parent comment not found");

    const reply = await ctx.db.insert("comments", {
      articleId,
      parentCommentId,
      content,
      userId: identity.subject,
      createdAt: Date.now(),
      username,
    });

    if (parentComment.userId !== identity.subject) {
      await ctx.db.insert("notification", {
        type: "reply",
        articleId,
        commentId: parentCommentId,
        recipientId: parentComment.userId,
        senderId: identity.subject,
        senderUsername: username,
        commentContent: content,
        createdAt: Date.now(),
        read: false,
      });
    }

    return reply;
  },
});

export const getReply = query({
  args: { commentId: v.id("comments") },
  handler: async (ctx, { commentId }) => {
    return await ctx.db
      .query("replyOnComment")
      .withIndex("by_commentId", (q) => q.eq("parentCommentId", commentId))
      .order("asc")
      .collect();
  },
});

export const getRepliesByArticle = query({
  args: { articleId: v.id("articles") },
  handler: async (ctx, { articleId }) => {
    const comments = await ctx.db
      .query("comments")
      .withIndex("byArticle", (q) => q.eq("articleId", articleId))
      .collect();

    const replies = await ctx.db.query("replyOnComment").collect();

    return replies.filter((r) =>
      comments.some((c) => c._id === r.parentCommentId)
    );
  },
});

export const deleteReply = mutation({
  args: { replyId: v.id("replyOnComment") },
  handler: async (ctx, { replyId }) => {
    await ctx.db.delete(replyId);
  },
});
