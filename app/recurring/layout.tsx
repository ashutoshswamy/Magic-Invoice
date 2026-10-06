import { privateMetadata } from "../lib/seo";

export const metadata = privateMetadata("Recurring invoices");

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
