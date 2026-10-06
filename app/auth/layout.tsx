import { privateMetadata } from "../lib/seo";

export const metadata = privateMetadata("Signing in");

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
