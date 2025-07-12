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