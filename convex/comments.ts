// import { v } from "convex/values";
// import { mutation, query } from "./_generated/server";


// export const getComments = query({
//     args: {articleId : v.id("articles")},
//     handler: async(ctx, {articleId}) => {
//         return await ctx.db
//         .query("comments")
//         .withIndex("byArticle", (q) => q.eq("articleId", articleId))
//         .order("desc")
//         .collect();
//     }
// })

// export const addComments = mutation({
//     args : {articleId : v.id("articles"), content : v.string()},
//     handler : async (ctx, {articleId, content}) =>{ 
//         const identity = await ctx.auth.getUserIdentity();
//         if(!identity) throw new Error ("sign-in to comment")

//             await ctx.db.insert("comments", {
//                 articleId,
//                 content,
//                 userId: identity.subject,
//                 createdAt: Date.now(),
//             })
//     }
// })

import { mutation, query } from './_generated/server';
import { v } from 'convex/values';

export const getComments = query({
  args: { articleId: v.id('articles') },
  handler: async (ctx, { articleId }) => {
    return await ctx.db
      .query('comments')
      .withIndex('byArticle', (q) => q.eq('articleId', articleId))
      .order('desc')
      .collect();
  },
});

export const addComment = mutation({
  args: { articleId: v.id('articles'), content: v.string() },
  handler: async (ctx, { articleId, content }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error('Not authenticated');

    const userName = identity.name || identity.email || identity.subject;

    await ctx.db.insert('comments', {
      articleId,
      content,
      userId: identity.subject,
      createdAt: Date.now(),
      userName,
    });
  },
});
