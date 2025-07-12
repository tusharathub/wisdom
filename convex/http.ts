import { httpRouter } from "convex/server";
import { WebhookEvent } from "@clerk/nextjs/server";
import { Webhook } from "svix";
import { api } from "./_generated/api";
import { httpAction } from "./_generated/server";

const http = httpRouter();
const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;

http.route({
  path: "/clerk-webhook",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    if (!webhookSecret) {
      throw new Error("did not get CLERK_WEBHOOK_SECRET");
    }

    const svix_id = request.headers.get("svix-id") ?? "";
    const svix_signature = request.headers.get("svix-signature") ?? "";
    const svix_timestamp = request.headers.get("svix-timestamp") ?? "";

    if (!svix_id || !svix_signature || !svix_timestamp) {
      return new Response("No svix headers found", {
        status: 400,
      });
    }

    const payload = await request.json();
    const body = JSON.stringify(payload);

    // const body = await request.text();
    const sivx = new Webhook(webhookSecret);
    let evt: WebhookEvent;

    // let msg;

    try {
      evt = sivx.verify(body, {
        "svix-id": svix_id,
        "svix-timestamp": svix_timestamp,
        "svix-signature": svix_signature,
      }) as WebhookEvent;
    } catch (err) {
        console.error("error in verifying the webHook ", err)
        return new Response("error happened", {status: 400});
    }



    const eventType = evt.type;
    console.log(evt);

  if (eventType === "user.created") {
  const { id, first_name, last_name, image_url, email_addresses } = evt.data;
  const email = email_addresses[0].email_address;

  const username = evt.data.username || "Anonymous";

    

  try {
    await ctx.runMutation(api.users.syncUser, {
      email,
      username,
      imageUrl: image_url,
      clerkId: id,
    });
  } catch (error) {
    console.log("error in creating user", error);
    return new Response("error in creating user", { status: 500 });
  }
}


    return new Response("webhooks processed successfully", { status: 200 });
  }),
});

export default http;