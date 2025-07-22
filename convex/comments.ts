import { paginationOptsValidator } from "convex/server";
import { api } from "./_generated/api";
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";


export const listComments = query({
  args: { paginationOpts: paginationOptsValidator, articleId: v.id("articles") },
  handler: async (ctx, { paginationOpts, articleId }) => {
    return await ctx.db
      .query("comments")
      .withIndex("byArticle", q => q.eq("articleId", articleId))
      .order("desc")
      .paginate(paginationOpts);
  },
});

export const listReplies = query({
  args: { paginationOpts: paginationOptsValidator, parentCommentId: v.id("comments") },
  handler: async (ctx, { paginationOpts, parentCommentId }) => {
    return await ctx.db
      .query("comments")
      .withIndex("byParent", q => q.eq("parentCommentId", parentCommentId))
      .order("asc")
      .paginate(paginationOpts);
  },
});

export const getPaginatedComments = query({
  args: {
    paginationOpts: paginationOptsValidator,
    articleId: v.id("articles"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("comments")
      .withIndex("byArticle", (q) => q.eq("articleId", args.articleId))
      .filter((q) => q.eq(q.field("parentCommentId"), undefined)) // top-level only
      .order("desc")
      .paginate(args.paginationOpts);
  },
});

export const getPaginatedReplies = query({
  args: {
    paginationOpts: paginationOptsValidator,
    parentCommentId: v.id("comments"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("comments")
      .filter((q) => q.eq(q.field("parentCommentId"), args.parentCommentId))
      .order("asc")
      .paginate(args.paginationOpts);
  },
});


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

// export const getReplies = query({
//   args: {
//     parentCommentId: v.id("comments"),
//     cursor: v.optional(v.string()),
//     limit: v.optional(v.number()),
//   },
//   handler: async (ctx, { parentCommentId, cursor, limit = 5 }) => {
//     let q = ctx.db
//       .query("comments")
//       .withIndex("byParent", (q) => q.eq("parentCommentId", parentCommentId))
//       .order("asc");

//     const paginationResult = await q.paginate({ cursor : cursor ?? null, }, 10);

//     const replies = await q.take(limit);

//     return {
//       replies: paginationResult.page,
//       nextCursor: paginationResult.continueCursor ?? null,
//     };
//   },
// });


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

export const getAllCommentsWithLikes = query({
  args: { articleId: v.id("articles") },
  handler: async (ctx, { articleId }) => {
    const comments = await ctx.db
      .query("comments")
      .withIndex("byArticle", q => q.eq("articleId", articleId))
      .collect();

    const allLikes = await ctx.db.query("likesOnComment").collect();

    const likedComments = comments.map(comment => {
      const likeCount = allLikes.filter(l => l.commentId === comment._id).length;
      return { ...comment, likeCount };
    });

    return likedComments;
  },
});

export const getCommentsByRecent = query({
  args: {
    articleId: v.id("articles"),
    limit: v.number(),
  },
  handler: async (ctx, { articleId }) => {
    const comments = await ctx.db
      .query("comments")
      .withIndex("byArticle", (q) => q.eq("articleId", articleId))
      .order("desc")
      .collect();

    return comments;
  },
});

export const getCommentsByLikes = query({
  args: {
    articleId: v.id("articles"),
    limit: v.number(),
    cursor: v.optional(v.string()), 
  },
  handler: async (ctx, { articleId, limit, cursor }) => {
    const allComments = await ctx.db
      .query("comments")
      .withIndex("byArticle", (q) => q.eq("articleId", articleId))
      .collect();

    const topLevelComments = allComments.filter(
      (comment) => comment.parentCommentId === undefined
    );

    const commentIds = topLevelComments.map((c) => c._id);
    const allLikes = await ctx.db.query("likesOnComment").collect();

    const likeCounts: Record<string, number> = {};
    for (const like of allLikes) {
      const id = like.commentId;
      likeCounts[id] = (likeCounts[id] || 0) + 1;
    }

    const sorted = topLevelComments.sort((a, b) => {
      const likeDiff =
        (likeCounts[b._id] || 0) - (likeCounts[a._id] || 0);
      if (likeDiff !== 0) return likeDiff;
      return b.createdAt - a.createdAt;
    });

    let start = 0;
    if (cursor) {
      const index = sorted.findIndex((c) => c._id === cursor);
      if (index !== -1) start = index + 1;
    }

    const paginated = sorted.slice(start, start + limit);
    const nextCursor =
      paginated.length === limit
        ? paginated[paginated.length - 1]._id
        : null;

    return {
      comments: paginated,
      nextCursor,
    };
  },
});