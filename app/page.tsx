import Landing from "./components/Landing";
import { pageMetadata } from "./lib/seo";

export const metadata = pageMetadata({
  path: "/",
  title: "Magic Invoice | AI GST Invoice Generator for India",
  description:
    "Type one sentence and get a GST invoice with line items, SAC codes and the CGST, SGST or IGST split worked out. Free for Indian freelancers and small businesses.",
});

export default function Home() {
  return <Landing />;
}
