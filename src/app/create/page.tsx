import { auth } from "@clerk/nextjs/server";

export default function Create() {
  const { userId } : any = auth();

  if (!userId) {
    return <p className="p-6 text-xl">You must be logged in to write an article.</p>;
  }

  return <div className="p-10">Write your article here...</div>;
}
