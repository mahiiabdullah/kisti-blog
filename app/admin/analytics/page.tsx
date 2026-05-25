import { redirect } from "next/navigation";

// Analytics has been merged into /admin/dashboard
export default function AnalyticsRedirect() {
  redirect("/admin/dashboard");
}
