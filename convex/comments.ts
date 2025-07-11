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
  args: {
    articleId: v.id('articles'),
    content: v.string(),
    username: v.string(), 
  },
  handler: async (ctx, { articleId, content, username }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error('Not authenticated');

    await ctx.db.insert('comments', {
      articleId,
      content,
      userId: identity.subject,
      createdAt: Date.now(),
      username, 
    });
  },
});

export const deleteComment = mutation({
  args:{commentId : v.id("comments")},
  handler: async (ctx, {commentId})=> {
    const identity = await ctx.auth.getUserIdentity();
    if(!identity) throw new Error ("Not authenticated");

    const comment = await ctx.db.get(commentId);
    if(!comment) throw new Error ("Comment not found");

    if(comment.userId !== identity.subject){
      throw new Error("You cannot delete other's comment");
    }

    await ctx.db.delete(commentId);
  }
})