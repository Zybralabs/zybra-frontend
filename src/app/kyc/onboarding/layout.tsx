import { ProgressSteps } from "@/components/Kyc/ProgressStep";
import { OnboardingProvider } from "@/context/OnboardingContext";

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return (
    <OnboardingProvider>
      {/* Mobile-first responsive layout */}
      <div className="w-full min-h-screen flex justify-center items-start md:items-center p-2 md:p-4">
        <div className="flex flex-col md:flex-row relative bg-[#031D2A] w-full max-w-7xl min-h-[calc(100vh-1rem)] md:h-[85vh] rounded-lg md:rounded-xl overflow-hidden">
          {/* Mobile: Top progress bar, Desktop: Left sidebar */}
          <aside className="w-full md:w-64 p-4 md:p-6 border-b md:border-b-0 md:border-r border-gray-800 bg-[#031D2A] md:bg-transparent">
            <ProgressSteps />
          </aside>

          {/* Main content area */}
          <main className="flex-1 p-4 md:p-6 relative text-gray-100 overflow-y-auto">
            <div className="w-full max-w-4xl mx-auto">
              {children}
            </div>
          </main>
        </div>
      </div>
    </OnboardingProvider>
  );
}
