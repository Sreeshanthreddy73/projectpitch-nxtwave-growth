import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/admin/login-form";
import { Logo, SiteFooter } from "@/components/site-chrome";
import { Card } from "@/components/ui";
import { adminConfigured, isAdmin } from "@/lib/auth";

export const metadata: Metadata = { title: "Admin sign-in", robots: { index: false, follow: false } };

export default async function AdminLoginPage() {
  if (await isAdmin()) redirect("/admin");

  return (
    <>
      <main className="mx-auto w-full max-w-sm px-5 py-20">
        <Logo />
        <h1 className="mt-8 text-2xl font-semibold tracking-tight">Growth dashboard</h1>
        <p className="mt-1.5 text-sm text-muted">Sign in to see campaign analytics.</p>
        <Card className="mt-6 p-6">
          {adminConfigured() ? (
            <LoginForm />
          ) : (
            <div role="alert" className="text-sm text-ink">
              <p className="font-semibold">Setup needed: no admin password is set</p>
              <ol className="mt-3 list-decimal space-y-1.5 pl-5 text-body">
                <li>Open .env.local (copy it from .env.example if it does not exist).</li>
                <li>
                  Set <span className="font-mono text-xs">ADMIN_PASSWORD</span> to a long random string.
                </li>
                <li>Restart the dev server.</li>
              </ol>
            </div>
          )}
        </Card>
      </main>
      <SiteFooter />
    </>
  );
}
