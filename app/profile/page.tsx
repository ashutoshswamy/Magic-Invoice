"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Eye,
  EyeOff,
  KeyRound,
  Link2,
  LogOut,
  Save,
  UserRound,
} from "lucide-react";
import TopNav from "../components/TopNav";
import { isSupabaseConfigured, supabase } from "../lib/supabaseClient";

export default function ProfilePage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [isOauthProvider, setIsOauthProvider] = useState(false);
  const [identities, setIdentities] = useState<
    Array<{ id: string; identityId: string; provider: string }>
  >([]);
  const [providers, setProviders] = useState<string[]>([]);
  const [hasPassword, setHasPassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [isLinking, setIsLinking] = useState<"google" | "github" | null>(null);
  const [isUnlinking, setIsUnlinking] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const isUuid = (value: string) =>
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      value,
    );

  const deriveHasPassword = (
    passwordFlag: boolean,
    providerList: string[],
    linkedIdentities: Array<{ provider: string }>,
    existingFlag: boolean,
  ) =>
    passwordFlag ||
    existingFlag ||
    providerList.includes("email") ||
    linkedIdentities.some((identity) => identity.provider === "email");

  useEffect(() => {
    const loadProfile = async () => {
      if (!isSupabaseConfigured) {
        setStatus("Connect your workspace to load profile.");
        return;
      }
      const { data } = await supabase.auth.getUser();
      if (data?.user) {
        const provider = data.user.app_metadata?.provider;
        const providerList =
          (data.user.app_metadata?.providers as string[]) ?? [];
        const passwordFlag = Boolean(data.user.user_metadata?.has_password);
        const linkedIdentities = (data.user.identities ?? []).map(
          (identity) => ({
            id: identity.id,
            identityId:
              (identity as { identity_id?: string }).identity_id ?? identity.id,
            provider: identity.provider,
          }),
        );
        setIsOauthProvider(provider === "github" || provider === "google");
        setIdentities(linkedIdentities);
        setProviders(providerList);
        setHasPassword(
          deriveHasPassword(
            passwordFlag,
            providerList,
            linkedIdentities,
            false,
          ),
        );
        setEmail(data.user.email ?? "");
        setName((data.user.user_metadata?.full_name as string) ?? "");
      }
    };
    loadProfile();
  }, []);

  const refreshIdentities = async () => {
    const { data } = await supabase.auth.getUser();
    if (!data?.user) return;
    const providerList = (data.user.app_metadata?.providers as string[]) ?? [];
    const passwordFlag = Boolean(data.user.user_metadata?.has_password);
    const linkedIdentities = (data.user.identities ?? []).map((identity) => ({
      id: identity.id,
      identityId:
        (identity as { identity_id?: string }).identity_id ?? identity.id,
      provider: identity.provider,
    }));
    setIdentities(linkedIdentities);
    setProviders(providerList);
    setHasPassword(
      deriveHasPassword(
        passwordFlag,
        providerList,
        linkedIdentities,
        hasPassword,
      ),
    );
  };

  const handleSave = async () => {
    if (!isSupabaseConfigured) {
      setStatus("Connect your workspace to save profile.");
      return;
    }
    setIsSaving(true);
    setStatus(null);
    try {
      if (isOauthProvider) {
        setStatus("Name updates are managed by your OAuth provider.");
        return;
      }
      const { error } = await supabase.auth.updateUser({
        data: { full_name: name },
      });
      if (error) throw error;
      setStatus("Profile updated.");
    } catch (error) {
      setStatus("Unable to update profile.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    setStatus(null);
    try {
      await supabase.auth.signOut();
      router.replace("/");
    } catch (error) {
      setStatus("Unable to sign out.");
    }
  };

  const handleLinkProvider = async (provider: "google" | "github") => {
    if (!isSupabaseConfigured) {
      setStatus("Connect your workspace to link accounts.");
      return;
    }
    setIsLinking(provider);
    setStatus(null);
    try {
      const { error } = await supabase.auth.linkIdentity({
        provider,
        options: { redirectTo: `${window.location.origin}/profile` },
      });
      if (error) throw error;
      setStatus("Continue in the provider window to finish linking.");
    } catch (error) {
      setStatus("Unable to link account.");
    } finally {
      setIsLinking(null);
    }
  };

  const handleUnlinkProvider = async (provider: "google" | "github") => {
    if (!isSupabaseConfigured) {
      setStatus("Connect your workspace to unlink accounts.");
      return;
    }
    const connectedProviders =
      providers.length > 0
        ? providers
        : identities.map((identity) => identity.provider);
    const remainingProviders = connectedProviders.filter(
      (item) => item !== provider,
    );
    if (remainingProviders.length === 0) {
      setStatus("You must keep at least one connected account.");
      return;
    }
    let identity = identities.find((item) => item.provider === provider);
    if (!identity) {
      const { data } = await supabase.auth.getUser();
      const fetchedIdentity = (data?.user?.identities ?? []).find(
        (item) => item.provider === provider,
      );
      if (fetchedIdentity) {
        identity = {
          id: fetchedIdentity.id,
          identityId:
            (fetchedIdentity as { identity_id?: string }).identity_id ??
            fetchedIdentity.id,
          provider: fetchedIdentity.provider,
        };
      }
    }
    if (!identity) {
      setStatus("Account is not connected.");
      return;
    }
    const identityId = identity.identityId ?? "";
    if (!identityId || !isUuid(identityId)) {
      setStatus(
        "Unable to disconnect. Please sign out and sign back in to refresh linked accounts.",
      );
      return;
    }
    setIsUnlinking(identity.id);
    setStatus(null);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData?.user?.id;
      if (!userId || !userData?.user) {
        setStatus(
          "Unable to disconnect. Please sign out and sign back in to refresh linked accounts.",
        );
        return;
      }
      const rawIdentity = (userData.user.identities ?? []).find((item) => {
        const itemIdentityId = (item as { identity_id?: string }).identity_id;
        return (
          item.provider === provider &&
          (itemIdentityId
            ? itemIdentityId === identityId
            : item.id === identityId)
        );
      });
      if (!rawIdentity) {
        setStatus(
          "Unable to disconnect. Please sign out and sign back in to refresh linked accounts.",
        );
        return;
      }
      const { error } = await supabase.auth.unlinkIdentity(rawIdentity);
      if (error) throw error;
      await refreshIdentities();
      setStatus("Account disconnected.");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to disconnect account.";
      setStatus(message);
    } finally {
      setIsUnlinking(null);
    }
  };

  const handleUpdatePassword = async () => {
    if (!isSupabaseConfigured) {
      setStatus("Connect your workspace to update password.");
      return;
    }
    if (!newPassword || newPassword.length < 8) {
      setStatus("Password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setStatus("Passwords do not match.");
      return;
    }
    setIsUpdatingPassword(true);
    setStatus(null);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
        data: { has_password: true },
      });
      if (error) throw error;
      setHasPassword(true);
      setNewPassword("");
      setConfirmPassword("");
      await refreshIdentities();
      setStatus("Password updated.");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to update password.";
      setStatus(message);
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      <TopNav />
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-6 pb-16 pt-10">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-200">
            Profile
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-white">
            Account details
          </h1>
        </div>

        <motion.div
          className="glass rounded-3xl p-6"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center gap-3 text-sm text-emerald-200">
            <UserRound className="h-4 w-4" />
            Profile details
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <label className="rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-3 text-sm">
              <span className="text-xs text-slate-300">Full name</span>
              <input
                className="mt-2 w-full bg-transparent text-white outline-none disabled:cursor-not-allowed disabled:text-slate-400"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Your name"
                disabled={isOauthProvider}
              />
              {isOauthProvider ? (
                <span className="mt-2 block text-xs text-slate-400">
                  Name is managed by your OAuth provider.
                </span>
              ) : null}
            </label>
            <label className="rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-3 text-sm">
              <span className="text-xs text-slate-300">Email</span>
              <input
                className="mt-2 w-full bg-transparent text-white outline-none disabled:cursor-not-allowed disabled:text-slate-400"
                value={email}
                placeholder="you@company.com"
                disabled
              />
              <span className="mt-2 block text-xs text-slate-400">
                Email updates are disabled for all accounts.
              </span>
            </label>
          </div>
          <div className="mt-5 flex items-center gap-3">
            <button
              onClick={handleSave}
              disabled={isSaving || isOauthProvider}
              className="flex items-center gap-2 rounded-full bg-emerald-400 px-5 py-2 text-sm font-semibold text-slate-900 transition hover:bg-emerald-300 disabled:opacity-60"
            >
              <Save className="h-4 w-4" />
              {isSaving ? "Saving..." : "Save changes"}
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 rounded-full border border-white/20 px-4 py-2 text-sm font-semibold text-white transition hover:border-white/50"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
            {status ? (
              <span className="text-xs text-emerald-200">{status}</span>
            ) : null}
          </div>
        </motion.div>

        <motion.div
          className="glass rounded-3xl p-6"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center gap-3 text-sm text-emerald-200">
            <Link2 className="h-4 w-4" />
            Connected accounts
          </div>
          <div className="mt-4 space-y-3 text-sm text-slate-300">
            {(
              [
                { label: "Google", provider: "google" as const },
                { label: "GitHub", provider: "github" as const },
              ] as const
            ).map((item) => {
              const connectedProviders =
                providers.length > 0
                  ? providers
                  : identities.map((identity) => identity.provider);
              const connected = connectedProviders.includes(item.provider);
              const remainingProviders = connectedProviders.filter(
                (provider) => provider !== item.provider,
              );
              const canDisconnect = remainingProviders.length > 0;
              return (
                <div
                  key={item.provider}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-semibold text-white">
                      {item.label}
                    </p>
                    <p className="text-xs text-slate-400">
                      {connected ? "Connected" : "Not connected"}
                    </p>
                  </div>
                  {connected ? (
                    <button
                      onClick={() => handleUnlinkProvider(item.provider)}
                      disabled={!canDisconnect || isUnlinking !== null}
                      className="rounded-full border border-rose-400/40 px-4 py-2 text-xs font-semibold text-rose-100 transition hover:border-rose-300 disabled:opacity-60"
                    >
                      {isUnlinking ? "Disconnecting..." : "Disconnect"}
                    </button>
                  ) : (
                    <button
                      onClick={() => handleLinkProvider(item.provider)}
                      disabled={isLinking === item.provider}
                      className="rounded-full border border-white/20 px-4 py-2 text-xs font-semibold text-white transition hover:border-white/50 disabled:opacity-60"
                    >
                      {isLinking === item.provider
                        ? "Connecting..."
                        : "Connect"}
                    </button>
                  )}
                </div>
              );
            })}
            <p className="text-xs text-amber-200">
              You must keep at least one connected account.
            </p>
          </div>
        </motion.div>

        <motion.div
          className="glass rounded-3xl p-6"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center gap-3 text-sm text-emerald-200">
            <KeyRound className="h-4 w-4" />
            Password
            <span
              className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                hasPassword
                  ? "bg-emerald-400/20 text-emerald-200"
                  : "bg-amber-400/20 text-amber-200"
              }`}
            >
              {hasPassword ? "Password set" : "No password"}
            </span>
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <label className="rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-3 text-sm">
              <span className="text-xs text-slate-300">New password</span>
              <div className="mt-2 flex items-center gap-3">
                <input
                  type={showNewPassword ? "text" : "password"}
                  className="w-full bg-transparent text-white outline-none"
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  placeholder="At least 8 characters"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword((prev) => !prev)}
                  className="text-slate-300 transition hover:text-white"
                  aria-label={
                    showNewPassword ? "Hide password" : "Show password"
                  }
                >
                  {showNewPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </label>
            <label className="rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-3 text-sm">
              <span className="text-xs text-slate-300">Confirm password</span>
              <div className="mt-2 flex items-center gap-3">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  className="w-full bg-transparent text-white outline-none"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  placeholder="Repeat password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  className="text-slate-300 transition hover:text-white"
                  aria-label={
                    showConfirmPassword ? "Hide password" : "Show password"
                  }
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </label>
          </div>
          <div className="mt-5 flex items-center gap-3">
            <button
              onClick={handleUpdatePassword}
              disabled={isUpdatingPassword}
              className="flex items-center gap-2 rounded-full bg-emerald-400 px-5 py-2 text-sm font-semibold text-slate-900 transition hover:bg-emerald-300 disabled:opacity-60"
            >
              {isUpdatingPassword
                ? "Updating..."
                : hasPassword
                  ? "Update password"
                  : "Set password"}
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
