import { MainPane } from "@/components";

export default async function Home() {
  return (
    <div className="flex w-full min-h-screen justify-center">
      <div className="flex flex-col flex-1 max-w-screen-2xl">
        <MainPane />
      </div>
    </div>
  );
}
