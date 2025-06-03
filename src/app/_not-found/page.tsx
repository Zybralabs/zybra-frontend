// app/_not-found/page.js

export const dynamic = 'force-dynamic'; // Allow server-side rendering for this route

export default function NotFoundPage() {
  return <h1>Page Not Found</h1>;
}
