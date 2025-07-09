import { mutation, query } from "./_generated/server";
import { v } from "convex/values";


export const createArticle = mutation({
  args: {
    title: v.string(),
    content: v.string(),
    tags: v.array(v.string())
  },
  handler: async ({ db, auth }, { title, content, tags }) => {
    const identity = await auth.getUserIdentity();
    if (!identity) throw new Error('Not signed in');
    return db.insert("articles", {
      title,
      content,
      tags,
      authorId: identity.subject,
      likes: [],
      createdAt: Date.now()
    });
  }
});


export const getTopArticles = query(async ({ db }) => {
  return db.query("articles")
    .order("desc")
    .take(5);
});

export const searchArticles = query({
  args: {
    query: v.string(),
    limit: v.optional(v.number()),
    skip: v.optional(v.number()),
  },
  handler: async (ctx, { query, limit }) => {
    const all = await ctx.db.query('articles').collect();

    if (!query.trim()) {
      return all.slice(0, limit || 5);
    }

    const lower = query.toLowerCase();

    const filtered = all.filter((a) => {
      const haystack = `${a.title} ${a.content} ${a.tags.join(' ')}`.toLowerCase();
      return haystack.includes(lower);
    });

    return filtered.slice(0, limit || 5);
  },
});

export const getArticleById = query({
  args : { id: v.id("articles")},
  handler: async (ctx, {id}) => {
    return await ctx.db.get(id);
  }
})