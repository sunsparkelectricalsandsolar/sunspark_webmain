"use client";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body>
        <main style={{ display: "grid", minHeight: "100vh", placeItems: "center", padding: "24px", fontFamily: "Arial, sans-serif" }}>
          <section style={{ maxWidth: "420px", textAlign: "center" }}>
            <h1>Something needs another try</h1>
            <p>The page could not be loaded right now.</p>
            <button onClick={reset} type="button">Try again</button>
          </section>
        </main>
      </body>
    </html>
  );
}
