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

import { api } from "./_generated/api";
import { Doc } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const getLikes = query({
  args: { articleId: v.id("articles") },
  handler: async (ctx, { articleId }) => {
    const likes = await ctx.db
      .query("likes")
      .withIndex("byArticle", (q) => q.eq("articleId", articleId))
      .collect();
    return likes.length;
  },
});

export const hasLiked = query({
  args: { articleId: v.id("articles") },
  handler: async (ctx, { articleId }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return false;

    const like = await ctx.db
      .query("likes")
      .withIndex("byUserArticle", (q) =>
        q.eq("userId", identity.subject).eq("articleId", articleId)
      )
      .unique();

    return !!like;
  },
});
export const like = mutation({
  args: { articleId: v.id("articles") },
  handler: async (ctx, { articleId }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const alreadyLiked = await ctx.db
      .query("likes")
      .withIndex("byUserArticle", (q) =>
        q.eq("userId", identity.subject).eq("articleId", articleId)
      )
      .unique();

    if (!alreadyLiked) {
      await ctx.db.insert("likes", {
        articleId,
        userId: identity.subject,
      });

      const user = await ctx.db
        .query("users")
        .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
        .unique();

      const username = user?.username ?? "Anonymous";

      const article = await ctx.db.get(articleId);
      if (!article) throw new Error("Article not found");

      if (article.authorId !== identity.subject) {
        await ctx.runMutation(api.notification.createNotification, {
          recipientId: article.authorId,
          type: "like",
          articleId,
          senderUsername: username,
        });
      }
    } else {
      await ctx.db.delete(alreadyLiked._id);
    }
  },
});


export const getLikedArticlesByUser = query({
  args: { userId: v.string() },
  handler: async (ctx, { userId }) => {
    // Step 1: Fetch all likes for this user on articles
    const likes = await ctx.db
      .query("likes")
      .withIndex("byUserArticle", (q) => q.eq("userId", userId))
      .collect();

    const articleIds = likes.map((like) => like.articleId);

    // Step 2: Fetch the articles themselves
    const articles = await Promise.all(
      articleIds.map((id) => ctx.db.get(id))
    );

    // Step 3: Filter out any deleted/null articles and attach like/comment counts
    const enrichedArticles = await Promise.all(
      articles
        .filter((a): a is Doc<"articles"> => a !== null)
        .map(async (article) => {
          const [likeCount, commentCount] = await Promise.all([
            ctx.db
              .query("likes")
              .withIndex("byArticle", (q) => q.eq("articleId", article._id))
              .collect()
              .then((res) => res.length),
            ctx.db
              .query("comments")
              .withIndex("byArticle", (q) => q.eq("articleId", article._id))
              .collect()
              .then((res) => res.length),
          ]);

          return {
            ...article,
            likeCount,
            commentCount,
          };
        })
    );

    return enrichedArticles;
  },
});

export const toggleLike = mutation({
  args: { articleId: v.id("articles") },
  handler: async (ctx, { articleId }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const userId = identity.subject;

    const article = await ctx.db.get(articleId);
    if (!article) throw new Error("Article not found");

    // Check if like already exists
    const existingLike = await ctx.db
      .query("likes")
      .withIndex("byUserArticle", (q) =>
        q.eq("userId", userId).eq("articleId", articleId)
      )
      .unique();

    let liked: boolean;

    if (existingLike) {
      // If already liked → remove the like (unlike)
      await ctx.db.delete(existingLike._id);
      liked = false;
    } else {
      // Insert a new like
      await ctx.db.insert("likes", {
        articleId,
        userId,
      });
      liked = true;

      // Optional: Send notification to author
      if (article.authorId !== userId) {
        const user = await ctx.db
          .query("users")
          .withIndex("by_clerk_id", (q) => q.eq("clerkId", userId))
          .unique();

        const username = user?.username || "Anonymous";

        await ctx.runMutation(api.notification.createNotification, {
          recipientId: article.authorId,
          type: "like",
          articleId,
          senderUsername: username,
        });
      }
    }

    // Optionally return status
    return { liked };
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

export const getCommentLikes =  query({
  args: {commentId : v.id("comments")},
  handler : async (ctx, {commentId}) => {
    return await ctx.db
    .query("likesOnComment")
    .withIndex("by_comment_user", (q) => q.eq("commentId", commentId))
    .collect();
  }
})

export const getAllCommentLikes = query({
  args: { articleId: v.id("articles") },
  handler: async (ctx, { articleId }) => {
    const comments = await ctx.db
      .query("comments")
      .withIndex("byArticle", (q) => q.eq("articleId", articleId))
      .collect();

    const likes = await ctx.db.query("likesOnComment").collect();

    return likes.filter((l) => comments.some((c) => c._id === l.commentId));
  },
});

