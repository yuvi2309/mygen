import { redirect } from "next/navigation";
import { getAuthenticatedUser } from "@/lib/auth/supabase-server";

export default async function Home() {
  const user = await getAuthenticatedUser();
  redirect(user ? "/chat" : "/auth");
}
