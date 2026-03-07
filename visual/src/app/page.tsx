import { World } from "@/static/world";

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex min-h-screen w-full flex-col items-center justify-center bg-white dark:bg-black sm:items-stretch">
        <div className="w-full">
          <World />
        </div>
      </main>
    </div>
  );
}
