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

// export const searchArticles = query(async ({ db }, { keyword } : any) => {
//   return db.query("articles")
//     .filter(q => q.eq("tags", keyword))
//     .take(5);
// });


export const searchArticles = query({
  args: {
    query: v.string(),
    limit: v.optional(v.number()),
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


// export const seedArticles = mutation(async ({ db }) => {
    
//   const dummyArticles = [
//     {
//       title: "The Day I Quit My Job Without a Backup Plan",
//       content:
//         "Walking out that office door was terrifying. But that moment taught me more about risk, resilience, and resourcefulness than any MBA ever could.",
//       tags: ["career", "risk", "life"],
//     },
//     {
//       title: "How I Beat My Phone Addiction in 30 Days",
//       content:
//         "I deleted all social media and started using a dumbphone. It wasn’t easy, but it changed how I experience time, relationships, and even food.",
//       tags: ["focus", "habits", "addiction"],
//     },
//     {
//       title: "Lessons from My Grandfather’s Funeral",
//       content:
//         "As we shared stories about him, I realized legacy isn't built in big moments — it’s built in the small, consistent ways we show up for people.",
//       tags: ["family", "death", "legacy"],
//     },
//     {
//       title: "What 100 Days of Meditation Did to My Brain",
//       content:
//         "I didn’t become a monk. But I became less reactive, more focused, and surprisingly kinder. Silence really is a superpower.",
//       tags: ["mindfulness", "habits", "mental health"],
//     },
//     {
//       title: "The Day I Lost My Startup",
//       content:
//         "I spent 2 years building it. One investor pull-out and a legal mistake later, it was over. But it taught me more than success ever could.",
//       tags: ["failure", "entrepreneurship", "growth"],
//     },
//     {
//       title: "Why I Woke Up at 5AM for a Year",
//       content:
//         "Productivity was great, but the real win was the silence. The space to think, reflect, and create before the world woke up.",
//       tags: ["discipline", "habits", "focus"],
//     },
//     {
//       title: "How Reading One Book a Week Changed My Thinking",
//       content:
//         "It wasn’t about the number. It was about perspective. Every book expanded my mental models and gave me better questions to ask.",
//       tags: ["learning", "reading", "perspective"],
//     },
//     {
//       title: "The Hardest Conversation I Ever Had With My Father",
//       content:
//         "We hadn’t talked in years. One honest phone call later, decades of silence turned into healing. Vulnerability takes courage.",
//       tags: ["family", "healing", "communication"],
//     },
//     {
//       title: "Living Alone for the First Time at 30",
//       content:
//         "I thought it would be lonely. Instead, it was liberating. Solitude taught me who I really was without anyone around.",
//       tags: ["solitude", "self-discovery", "independence"],
//     },
//     {
//       title: "How I Recovered from Burnout After Working 80-Hour Weeks",
//       content:
//         "I used to wear hustle like a badge. Then I crashed. Recovery wasn’t just physical — it was emotional and spiritual too.",
//       tags: ["burnout", "mental health", "work"],
//     },
//   ];

//   for (const article of dummyArticles) {
    
//     await db.insert("articles", {
//       ...article,
//       authorId: "dev-user", 
//       likes: [],
//       createdAt: Date.now(),
//     });
//   }

//   return "Seed complete";
// });

