"use client";

import * as React from "react";
import {
  BarChart2,
  FileText,
  Grid,
  LayoutDashboard,
  PieChart,
  ScrollText,
  User2,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "./ui/sidebar";

const navigation = [
  {
    title: "Dashboard",
    icon: LayoutDashboard,
    href: "#",
    isActive: true,
  },
  {
    title: "Charts",
    icon: BarChart2,
    href: "#",
  },
  {
    title: "Statics",
    icon: PieChart,
    href: "#",
  },
  {
    title: "Products",
    icon: Grid,
    href: "#",
  },
  {
    title: "Articles",
    icon: FileText,
    href: "#",
  },
  {
    title: "Reports",
    icon: ScrollText,
    href: "#",
  },
];

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar className="w-64 h-screen bg-[#0a192f] text-white" {...props}>
      {/* Sidebar Header */}
      <SidebarHeader className="border-b border-white/10 px-6 py-4">
        {/* Space for Zybra logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white rounded-full"></div> {/* Placeholder */}
          <div className="text-2xl font-semibold text-white">zybra</div>
        </div>
        <div className="mt-1 text-xs font-light text-white/70">ANALYTICS</div>
      </SidebarHeader>

      {/* Sidebar Content */}
      <SidebarContent className="flex-1 overflow-y-auto">
        <SidebarMenu>
          {navigation.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton
                asChild
                isActive={item.isActive}
                className="flex items-center gap-4 px-6 py-3 text-sm font-light text-white hover:bg-white/10 data-[active=true]:bg-white/10 rounded-md"
              >
                <a href={item.href} className="flex items-center gap-4">
                  <item.icon className="h-5 w-5 text-white/70" />
                  <span className="text-white/90">{item.title}</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>

      {/* Sidebar Footer */}
      <SidebarFooter className="border-t border-white/10 px-6 py-4">
        <button className="flex w-full items-center gap-3 text-sm font-light text-white/80 hover:bg-white/10 rounded-md">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10">
            <User2 className="h-5 w-5 text-white/80" />
          </div>
          <div className="flex flex-col items-start">
            <span className="font-medium text-white">Desham Neetwa</span>
            <span className="text-xs font-light text-white/70">
              desham.neetwa@gmail.com
            </span>
          </div>
        </button>
      </SidebarFooter>
    </Sidebar>
  );
}
