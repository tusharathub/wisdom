import { v } from "convex/values";
import { mutation, query } from "./_generated/server";



export const createNotification = mutation({
  args: {
    recipientId: v.string(),
    type: v.union(v.literal("like"), v.literal("comment"), v.literal("reply")),
    articleId: v.id("articles"),
    senderUsername: v.string(),
    senderId: v.optional(v.string()),
    commentId: v.optional(v.id("comments")),
    commentContent: v.optional(v.string()),
  },
  handler: async (
    ctx,
    { recipientId, type, articleId, senderUsername, senderId, commentId, commentContent }
  ) => {
    await ctx.db.insert("notification", {
      recipientId,
      type,
      articleId,
      senderUsername,
      senderId,
      commentId,
      commentContent,
      createdAt: Date.now(),
      read: false,
    });
  },
});

export const getMyNotifications = query({
    args : {userId : v.string()},
    handler: async (ctx, {userId}) => {
        return await ctx.db
        .query("notification")
        .withIndex("by_recipient", (q) => q.eq("recipientId", userId))
        .order("desc")
        .take(20)
    }
})



// export const getUnreadNotificationCount = query({
//   args: { userId: v.string() },
//   handler: async (ctx, { userId }) => {
//     console.log("🧠 getUnreadNotificationCount for userId:", userId);

//     const unread = await ctx.db
//       .query("notification")
//       .filter((q) =>
//         q.and(
//           q.eq("recipientId", userId),
//           q.eq(q.field("read"), false) // ✅ use q.field
//         )
//       )
//       .collect();

//     console.log("📦 Matching unread notifications:", unread);

//     return unread.length;
//   },
// });


// export const listAllNotifications = query({
//   handler: async (ctx) => {
//     const all = await ctx.db.query("notification").collect();

//     return all.map((n) => ({
//       id: n._id,
//       recipientId: n.recipientId,
//       articleId: n.articleId,
//       type: n.type,
//       senderUsername: n.senderUsername,
//       read: n.read,
//       createdAt: new Date(n.createdAt).toLocaleString(),
//     }));
//   },
// });


export const getAllForUserNotification = query({
  args: { userId: v.string() },
  handler: async (ctx, { userId }) => {
    return await ctx.db
      .query("notification")
      .withIndex("by_recipient", (q) => q.eq("recipientId", userId))
      .order("desc")
      .collect();
  },
});


export const markAllAsRead = mutation({
  args: { userId: v.string() },
  handler: async (ctx, { userId }) => {
    const notification = await ctx.db
      .query("notification")
      .withIndex("by_recipient", (q) => q.eq("recipientId", userId))
      .order("desc")
      .collect();

      for(const notif of notification) {
        await ctx.db.patch(notif._id, {read: true})
      }
  },
});

export const insertNotification = mutation({
  args: {
    recipientId: v.string(),
    senderId: v.string(),
    senderUsername: v.string(),
    type: v.union(v.literal("like"), v.literal("reply")),
    commentId: v.id("comments"),
    commentContent: v.string(),
    articleId: v.id("articles"),
  },
  handler: async (ctx, args) => {
    if (args.recipientId === args.senderId) return; // don't notify self

    await ctx.db.insert("notification", {
      ...args,
      createdAt: Date.now(),
      read: false,
    });
  },
});