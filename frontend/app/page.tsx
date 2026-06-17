import type { Metadata } from "next";
import Capabilities from "@/components/Capabilities";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import { HomeDataSources } from "@/components/HomeDataSources";
import HomeDemoLaunchpad from "@/components/HomeDemoLaunchpad";
import { SquigglyHome } from "@/components/SquigglyHome";

export const metadata: Metadata = {
  other: {
    "talentapp:project_verification":
      "8fc3c22853db717c0ac3567bce73e75fca5576dce2aa34a209c2a810435bdbd5fbda8c4e7a07dc5cfd91ab0eb16b2fb7e9aa2f0eb5307cdecae8a69e9cf49c58",
  },
};

export default function Home() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,color-mix(in_oklab,var(--primary)_10%,transparent),transparent_30%),linear-gradient(180deg,var(--background),var(--muted)_52%,var(--background))]">
      <Header />
      <Hero />
      <HomeDemoLaunchpad />
      <HomeDataSources />
      <SquigglyHome />
      <Capabilities />
    </main>
  );
}
