import { Doc } from "./_generated/dataModel";
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

    const articleId = await ctx.db.insert("articles", {
      title,
      content,
      createdAt: Date.now(),
      authorId: identity.subject,
      username,
      likes: [],
      tags: tags ?? [],
    });

    return articleId; 
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
    sort: v.optional(v.union(v.literal("recent"), v.literal("liked"))),
  },
  handler: async (ctx, { query, limit = 100, sort = "recent" }) => {
    const articles = await ctx.db.query("articles").collect();

    const filtered = query.trim()
      ? articles.filter((a) =>
          `${a.title} ${a.content}`.toLowerCase().includes(query.toLowerCase())
        )
      : articles;

    const improved = await Promise.all(
      filtered.map(async (article) => {
        const likes = await ctx.db
          .query("likes")
          .withIndex("byArticle", (q) => q.eq("articleId", article._id))
          .collect();

        return {
          ...article,
          likeCount: likes.length,
        };
      })
    );

    const sorted =
      sort === "liked"
        ? improved.sort((a, b) => b.likeCount - a.likeCount)
        : improved.sort((a, b) => b.createdAt - a.createdAt);

    return sorted.slice(0, limit);
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
        .withIndex("by_commentId", (q) => q.eq("parentCommentId", comment._id))
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

export const getArticleByUserId = query({
  args: {userId : v.string()},
  handler: async (ctx, args) => {
    return await ctx.db
    .query("articles")
    .withIndex("by_authorId", (q) => q.eq("authorId", args.userId))
    .order("desc")
    .collect();
  }
})
export const getLikedArticlesByUser = query({
  args: { userId: v.string() },
  handler: async (ctx, { userId }) => {
    const likes = await ctx.db
      .query("likes")
      .withIndex("byUserArticle", (q) => q.eq("userId", userId))
      .collect();

    const articleIds = likes.map((like) => like.articleId);
    const articles = await Promise.all(
      articleIds.map((id) => ctx.db.get(id))
    );

    const enriched = await Promise.all(
      articles
        .filter((a): a is Doc<"articles"> => !!a)
        .map(async (a) => {
          const [likeCount, commentCount] = await Promise.all([
            ctx.db
              .query("likes")
              .withIndex("byArticle", (q) => q.eq("articleId", a._id))
              .collect()
              .then((l) => l.length),
            ctx.db
              .query("comments")
              .withIndex("byArticle", (q) => q.eq("articleId", a._id))
              .collect()
              .then((c) => c.length),
          ]);
          return { ...a, likeCount, commentCount };
        })
    );

    return enriched;
  },
});

