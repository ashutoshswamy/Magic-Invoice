import AuthForm from "../components/AuthForm";
import { pageMetadata } from "../lib/seo";

export const metadata = pageMetadata({
  path: "/signup",
  title: "Create a free account",
  description: "Sign up for Magic Invoice and send your first GST invoice in minutes. Free, with every feature and no card needed.",
});

export default function SignupPage() {
  return <AuthForm mode="signup" />;
}
