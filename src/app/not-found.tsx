import Link from 'next/link';

/**
 * The page for an address the app does not have. Next's own is a bare white
 * "404 / This page could not be found." that looks broken (test-app grades,
 * November 2026). It answers with status 404; replace the words, keep that.
 */
export default function NotFound() {
  return (
    <main className="starter">
      <h1>This page is not here</h1>
      <p>The address may be mistyped, or the page may have moved.</p>
      <p>
        <Link href="/">Go to the home page</Link>
      </p>
    </main>
  );
}
