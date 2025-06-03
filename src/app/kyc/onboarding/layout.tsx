import { ProgressSteps } from "@/components/Kyc/ProgressStep";
import { OnboardingProvider } from "@/context/OnboardingContext";

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return (
    <OnboardingProvider>
      <div className="w-full h-full flex justify-center items-center">
        <div className="flex p-4 relative bg-[#031D2A] w-[80vw] h-[80vh] rounded-xl mt-4">
          <aside className="w-64 p-6 border-r border-gray-800">
            <ProgressSteps />
          </aside>
          <main className="flex-1 p-6 relative text-gray-100">
            <div className="w-[75%]">{children}</div>
          </main>
        </div>
      </div>
    </OnboardingProvider>
  );
}
