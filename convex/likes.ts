// import { v } from "convex/values";
// import { mutation, query } from "./_generated/server";


// export const getLikes = query({
//   args: {articleId : v.id("articles")},
//   handler: async (ctx, {articleId}) => {
//     const likes = await ctx.db
//     .query("likes")
//     .withIndex("byArticle", (q)=> q.eq("articleId", articleId) )
//     .collect();
//     return likes.length;
//   }  
// });

// export const hasLiked = query({
//   args: {
//     articleId: v.id("articles"),
//   },
//   handler: async (ctx, { articleId }) => {
//     const identity = await ctx.auth.getUserIdentity();
//     if (!identity) return false;

//     const userId = identity.subject;

//     const existing = await ctx.db
//       .query("likes")
//       .withIndex("byUserArticle", (q) =>
//         q.eq("userId", userId).eq("articleId", articleId)
//       )
//       .first();

//     return !!existing;
//   },
// });

// export const like = mutation({
//   args: {articleId : v.id("articles")},
//   handler: async (ctx, {articleId}) => {
//     const identity = await ctx.auth.getUserIdentity();
//     console.log("identity:", identity);
//     if(!identity) throw new Error("you are not authenticated");

//     const alreadyLiked = await ctx.db
//     .query("likes")
//     .withIndex("byUserArticle", (q) => q.eq("userId", identity.subject).eq("articleId", articleId))
//     .unique();

//     if(!alreadyLiked) {
//       await ctx.db.insert("likes", {
//         articleId,
//         userId: identity.subject,
//       })
//     }
//   }
// })


import { mutation, query } from './_generated/server';
import { v } from 'convex/values';

export const getLikes = query({
  args: { articleId: v.id('articles') },
  handler: async (ctx, { articleId }) => {
    const likes = await ctx.db
      .query('likes')
      .withIndex('byArticle', (q) => q.eq('articleId', articleId))
      .collect();
    return likes.length;
  },
});

export const hasLiked = query({
  args: { articleId: v.id('articles') },
  handler: async (ctx, { articleId }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return false;

    const like = await ctx.db
      .query('likes')
      .withIndex('byUserArticle', (q) =>
        q.eq('userId', identity.subject).eq('articleId', articleId)
      )
      .unique();

    return !!like;
  },
});

export const like = mutation({
  args: { articleId: v.id('articles') },
  handler: async (ctx, { articleId }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error('Still Not authenticated');

    const alreadyLiked = await ctx.db
      .query('likes')
      .withIndex('byUserArticle', (q) =>
        q.eq('userId', identity.subject).eq('articleId', articleId)
      )
      .unique();

    if (!alreadyLiked) {
      await ctx.db.insert('likes', {
        articleId,
        userId: identity.subject,
      });
    }
  },
});

export const toggleCommentLike = mutation({
  args: { commentId: v.id("comments") },
  handler: async (ctx, { commentId }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const existing = await ctx.db
      .query("likesOnComment")
      .withIndex("by_comment_user", (q) =>
        q.eq("commentId", commentId).eq("userId", identity.subject)
      )
      .first();

    if (existing) {
      await ctx.db.delete(existing._id);
    } else {
      await ctx.db.insert("likesOnComment", {
        commentId,
        userId: identity.subject,
        createdAt: Date.now(),
      });
    }
  },
});

// export const getCommentLikes =  query({
//   args: {commentId : v.id("comments")},
//   handler : async (ctx, {commentId}) => {
//     return await ctx.db
//     .query("likesOnComment")
//     .withIndex("by_comment_user", (q) => q.eq("commentId", commentId))
//     .collect();
//   }
// })


export const getAllCommentLikes = query({
  args: { articleId: v.id("articles") },
  handler: async (ctx, { articleId }) => {
    const comments = await ctx.db
      .query("comments")
      .withIndex("byArticle", (q) => q.eq("articleId", articleId))
      .collect();

    const likes = await ctx.db
      .query("likesOnComment")
      .collect();

    return likes.filter((l) =>
      comments.some((c) => c._id === l.commentId)
    );
  },
});

