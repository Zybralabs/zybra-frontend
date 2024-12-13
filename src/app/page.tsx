"use client";

import { Footer, MainPane } from "@/components";
import { AppSidebar as Sidebar } from "@/components/Sidebar/AppSidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/Sidebar/ui/sidebar";

export default function Home() {
  return (
    <SidebarProvider>
      {/* Root Container with Blue Background */}
      <div className="flex w-full min-h-screen bg-[#0a192f]">
        {/* Sidebar */}
        <Sidebar />

        {/* Main Content */}
        <div className="flex flex-col flex-1 bg-[#0a192f]">
          {/* Header */}
          <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b border-white/10 bg-[#0a192f] px-6">
            <SidebarTrigger />
          </header>

          {/* Main Content Area */}
          <main className="flex-1 p-0">
            <MainPane />
          </main>

          {/* Footer */}
          <Footer />
        </div>
      </div>
    </SidebarProvider>
  );
}
