import { MainPane } from "@/components";

export default async function Home() {
  return (
    <div className="flex w-full min-h-screen justify-center overflow-x-hidden">
      <div className="flex flex-col flex-1 max-w-screen-2xl w-full px-2 sm:px-4 lg:px-6">
        <MainPane />
      </div>
    </div>
  );
}
