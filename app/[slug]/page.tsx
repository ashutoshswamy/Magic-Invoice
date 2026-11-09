import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import TopNav from "../components/TopNav";
import Footer from "../components/Footer";
import { GUIDES } from "../lib/guides";
import { pageMetadata, SITE_URL } from "../lib/seo";

export const dynamicParams = false;
export const generateStaticParams = () => GUIDES.map((g) => ({ slug: g.slug }));

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const g = GUIDES.find((x) => x.slug === slug);
  return g ? pageMetadata({ path: `/${g.slug}`, title: g.title, description: g.description }) : {};
}

const body = { fontSize: 15, color: "var(--text-2)", lineHeight: 1.75 } as const;

export default async function GuidePage({ params }: Props) {
  const { slug } = await params;
  const g = GUIDES.find((x) => x.slug === slug);
  if (!g) notFound();
  const ld = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Magic Invoice", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: g.title, item: `${SITE_URL}/${g.slug}` },
    ],
  };
  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <TopNav />
      <main style={{ maxWidth: 760, margin: "0 auto", padding: "64px 24px 96px" }}>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
        <h1 style={{ fontFamily: "var(--font-display), serif", fontWeight: 600, fontSize: "clamp(28px, 5vw, 42px)", color: "var(--text)", margin: "0 0 16px", letterSpacing: "-0.02em" }}>
          {g.h1}
        </h1>
        <p style={{ ...body, fontSize: 17 }}>{g.intro}</p>
        {g.sections.map((s) => (
          <section key={s.h} style={{ padding: "28px 0", borderBottom: "1px solid var(--line)" }}>
            <h2 style={{ fontFamily: "var(--font-display), serif", fontWeight: 600, fontSize: 20, color: "var(--text)", margin: "0 0 12px" }}>{s.h}</h2>
            {s.p?.map((t) => <p key={t} style={{ ...body, margin: "0 0 10px" }}>{t}</p>)}
            {s.list && (
              <ul style={{ margin: 0, paddingLeft: 20, display: "flex", flexDirection: "column", gap: 8 }}>
                {s.list.map((t) => <li key={t} style={body}>{t}</li>)}
              </ul>
            )}
          </section>
        ))}
        <p style={{ ...body, marginTop: 32 }}>
          <Link href="/signup" style={{ color: "var(--accent)", fontWeight: 600 }}>Create your first invoice free</Link>
        </p>
        <nav aria-label="More guides" style={{ marginTop: 24, display: "flex", flexDirection: "column", gap: 6 }}>
          {GUIDES.filter((x) => x.slug !== g.slug).map((x) => (
            <Link key={x.slug} href={`/${x.slug}`} style={{ color: "var(--accent)", fontSize: 14 }}>{x.title}</Link>
          ))}
        </nav>
      </main>
      <Footer />
    </div>
  );
}
