import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Dashboard } from "@/components/admin/dashboard";
import { SiteFooter } from "@/components/site-chrome";
import { isAdmin } from "@/lib/auth";

export const metadata: Metadata = { title: "Growth dashboard", robots: { index: false, follow: false } };

export default async function AdminPage() {
  if (!(await isAdmin())) redirect("/admin/login");
  return (
    <>
      <Dashboard />
      <SiteFooter />
    </>
  );
}
