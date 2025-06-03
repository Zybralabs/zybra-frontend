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
import { useRouter } from "next/navigation";

// Define types for navigation items
interface SubMenuItem {
  title: string;
  icon: React.FC<React.SVGProps<SVGSVGElement>>;
  href: string;
}

interface NavigationItem {
  title: string;
  icon: React.FC<React.SVGProps<SVGSVGElement>>;
  href?: string;
  isActive?: boolean;
  hasSubmenu?: boolean;
  submenu?: SubMenuItem[];
}

const navigation: NavigationItem[] = [
  {
    title: "Dashboard",
    icon: LayoutDashboard,
    href: "#",
    isActive: true,
  },
  {
    title: "Earn",
    icon: BarChart2,
    hasSubmenu: true,
    submenu: [
      {
        title: "Staking",
        icon: BarChart2,
        href: "/stake",
      },
      {
        title: "Lend/Borrow",
        icon: ScrollText,
        href: "/lending",
      }
    ]
  },
  {
    title: "OTC",
    icon: PieChart,
    href: "/otc",
  },
  {
    title: "Stocks",
    icon: Grid,
    href: "/swap",
  },
  {
    title: "Pools",
    icon: FileText,
    href: "/offers",
  }
];

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
 const {push} =  useRouter();
  return (
    <Sidebar className="w-64 h-screen bg-darkGrassGreen text-white border-[#121212]" {...props}>
      {/* Sidebar Header */}
      <SidebarHeader className="border-0 border-white/10 px-6 py-4">
        {/* Space for Zybra logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white rounded-full"></div> {/* Placeholder */}
          <div className="text-2xl font-semibold text-white">zybra</div>
        </div>
        <p className="text-base tracking-wide text-white mt-10 font-bold">ANALYTICS</p>
      </SidebarHeader>

      {/* Sidebar Content */}
      <SidebarContent className="flex-1 overflow-y-auto">
        <SidebarMenu>
          {navigation.map((item) => (
            <SidebarMenuItem key={item.title}>
              {item.hasSubmenu && item.submenu ? (
                <div className="flex flex-col">
                  <div className="flex items-center gap-4 px-6 py-5 my-0.5 text-sm font-medium text-white">
                    <item.icon className="h-5 w-5 text-white/70" />
                    <span className="text-white/90">{item.title}</span>
                  </div>
                  <div className="ml-6 pl-4 border-l border-white/10">
                    {item.submenu.map((subItem) => (
                      <SidebarMenuButton
                        key={subItem.title}
                        asChild
                        className="flex items-center gap-4 px-6 py-3 my-0.5 text-sm font-light text-white hover:bg-white/10 rounded-md"
                      >
                        <a href={subItem.href} className="flex items-center gap-4">
                          <subItem.icon className="h-4 w-4 text-white/70" />
                          <span className="text-white/80">{subItem.title}</span>
                        </a>
                      </SidebarMenuButton>
                    ))}
                  </div>
                </div>
              ) : (
                <SidebarMenuButton
                  asChild
                  isActive={item.isActive}
                  className="flex items-center gap-4 px-6 py-5 my-0.5 text-sm font-light text-white hover:bg-white/10 data-[active=true]:bg-white/10 rounded-md"
                >
                  <a href={item.href} className="flex items-center gap-4">
                    <item.icon className="h-5 w-5 text-white/70" />
                    <span className="text-white/90">{item.title}</span>
                  </a>
                </SidebarMenuButton>
              )}
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>

      {/* Sidebar Footer */}
      <SidebarFooter className="border-t border-white/10 px-6 py-4" onClick={() => {push('/userDashboard')}}>
        <button className="flex w-full items-center gap-3 text-sm font-light text-white/80 hover:bg-white/10 rounded-md">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10">
            <User2 className="h-5 w-5 text-white/80" />
          </div>
          <div className="flex flex-col items-start">
            <span className="font-medium text-white">Desham Neetwa</span>
            <span className="text-xs font-light text-white/70">desham.neetwa@gmail.com</span>
          </div>
        </button>
      </SidebarFooter>
    </Sidebar>
  );
}
