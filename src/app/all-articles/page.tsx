// app/all-articles/page.tsx
import { Suspense } from "react";
import AllArticlesClient from "./AllArticlesClient";

export default function AllArticlesPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Loading articles...</div>}>
      <AllArticlesClient />
    </Suspense>
  );
}
