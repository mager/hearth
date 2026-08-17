import { redirect } from "next/navigation";
import { AgentChat } from "@/app/_components/agent-chat";
import { getSession } from "@/lib/session";

export default async function WorkspacePage() {
  const user = await getSession();
  if (!user) redirect("/login");
  return <AgentChat user={user} />;
}
