import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const createArticle = mutation({
  args: {
    title: v.string(),
    content: v.string(),
    tags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, { title, content, tags }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    const username = user?.username ?? "Anonymous";

    await ctx.db.insert("articles", {
      title,
      content,
      createdAt: Date.now(),
      authorId: identity.subject,
      // userId: identity.subject,
      username,
      likes: [],
      tags: tags ?? [],
    });
  },
});
// export const createArticle = mutation({
//   args: {
//     title: v.string(),
//     content: v.string(),
//   },
//   handler: async ({ db, auth }, { title, content }) => {
//     const identity = await auth.getUserIdentity();
//     if (!identity) throw new Error('Not signed in');
//     return db.insert("articles", {
//       title,
//       content,
//       authorId: identity.subject,
//       likes: [],
//       createdAt: Date.now()
//     });
//   }
// });

export const getTopArticles = query(async ({ db }) => {
  return db.query("articles").order("desc").take(5);
});

export const searchArticles = query({
  args: {
    query: v.string(),
    limit: v.optional(v.number()),
    skip: v.optional(v.number()),
  },
  handler: async (ctx, { query, limit }) => {
    const all = await ctx.db.query("articles").collect();

    if (!query.trim()) {
      return all.slice(0, limit || 5);
    }

    const lower = query.toLowerCase();

    const filtered = all.filter((a) => {
      const haystack = `${a.title} ${a.content} `.toLowerCase();
      return haystack.includes(lower);
    });

    return filtered.slice(0, limit || 5);
  },
});

export const getArticleById = query({
  args: { id: v.id("articles") },
  handler: async (ctx, { id }) => {
    return await ctx.db.get(id);
  },
});

export const getMyArticles = query({
  args: {authorId : v.string()},
  handler: async (ctx, {authorId}) => {
    return await ctx.db
    .query("articles")
    .withIndex("by_authorId", (q) => q.eq("authorId", authorId))
    .order("asc")
    .collect()
  }
})

export const getMyArticlesWithStats = query({
  args : {authorId : v.string()} ,
  handler: async (ctx, {authorId}) => {

    const articles = await ctx.db
    .query("articles")
    .filter((q) => q.eq(q.field("authorId"), authorId))
    .collect()

    const withStats = await Promise.all(
      articles.map(async(article) => {

        const likes = await ctx.db
        .query("likes")
        .filter((q) => q.eq(q.field("articleId"), article._id))
        .collect();

        const comments = await ctx.db
        .query("comments")
        .filter((q)=> q.eq(q.field("articleId"), article._id))
        .collect();

        return {
          ...article,
          likeCount : likes.length,
          commentCount: comments.length,
        }
      })
    )
    return withStats;
  }
})

export const deleteArticle = mutation({
  args: {
    articleId: v.id("articles"),
  },
  handler: async (ctx, { articleId }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const article = await ctx.db.get(articleId);
    if (!article) throw new Error("Article not found");

    if (article.authorId !== identity.subject) {
      throw new Error("Unauthorized");
    }

    const comments = await ctx.db
      .query("comments")
      .withIndex("byArticle", (q) => q.eq("articleId", articleId))
      .collect();

    for (const comment of comments) {
      // delete replies to each comment
      const replies = await ctx.db
        .query("replyOnComment")
        .withIndex("by_commentId", (q) => q.eq("commentId", comment._id))
        .collect();

      for (const reply of replies) {
        await ctx.db.delete(reply._id);
      }

      await ctx.db.delete(comment._id);
    }

    // delete likes on the article
    const likes = await ctx.db
      .query("likes")
      .withIndex("byArticle", (q) => q.eq("articleId", articleId))
      .collect();

    for (const like of likes) {
      await ctx.db.delete(like._id);
    }

    //  delete the article
    await ctx.db.delete(articleId);
  },
});
