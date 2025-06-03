import SwapBuyPage from "@/components/Swap-new";

export default function Swap() {
  return (
    // <SidebarProvider>
    // {/* Root Container with Blue Background */}
    <div className="flex flex-col w-full">
      {/* Sidebar */}
      {/* <Sidebar /> */}

      {/* Main Content */}
      {/* Header */}
      {/* <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b border-white/10 bg-[#0a192f] px-6">
            <SidebarTrigger />
          </header> */}

      {/* Main Content Area */}
      <SwapBuyPage />

      {/* Footer */}
      {/* <Footer /> */}
    </div>
  );
}
