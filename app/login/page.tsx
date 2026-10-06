import AuthForm from "../components/AuthForm";
import { privateMetadata } from "../lib/seo";

export const metadata = privateMetadata("Sign in");

export default function LoginPage() {
  return <AuthForm mode="login" />;
}
