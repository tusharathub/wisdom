// import { ClerkClient } from "@clerk/backend";
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";




export const syncUser = mutation({
  args: {
    username: v.string(),
    email: v.string(),
    clerkId: v.string(),
    imageUrl: v.optional(v.string()),
  },
  handler: async (ctx, { username, email, clerkId, imageUrl }) => {
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", clerkId))
      .first();

    if (existingUser) return;

    return await ctx.db.insert("users", {
      username,
      email,
      clerkId,
      imageUrl,
    });
  },
});
export const updateUser = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    clerkId: v.string(),
    image: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (!existingUser) return;

    return await ctx.db.patch(existingUser._id, args);
  },
});

export const saveUser = mutation({
  args: {
    username: v.string(),
    email: v.string(),
    imageUrl: v.optional(v.string()),
  },
  handler: async (ctx, {username, email, imageUrl}) => {
    const identity = await ctx.auth.getUserIdentity();
    if(!identity ) throw new Error("user not authenticated");

    const existing = await ctx.db
    .query("users")
    .withIndex("by_email", (q) => q.eq("email", email))
    .unique();

    if(!existing) {
      await ctx.db.insert("users", {
        username,
        email,
        imageUrl,
        clerkId: identity.subject,
      })
    }
  }
})

// export const getUserById = query({
//   args: {userId : v.string()},
//   handler: async (ctx, {userId}) => {
//     const user = await ClerkClient.
//   }
// })