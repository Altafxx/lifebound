import { WorldWithTooltip } from "@/components/world-with-tooltip";

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center font-sans bg-background">
      <main className="flex min-h-screen w-full flex-col items-center justify-center sm:items-stretch bg-background">
        <div className="w-full">
          <WorldWithTooltip />
        </div>
      </main>
    </div>
  );
}
