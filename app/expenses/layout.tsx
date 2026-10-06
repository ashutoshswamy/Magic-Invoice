import { privateMetadata } from "../lib/seo";

export const metadata = privateMetadata("Expenses");

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
