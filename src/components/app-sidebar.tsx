"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChartPie,
  HandCoins,
  LayoutDashboard,
  ListChecks,
  ReceiptText,
  ShoppingBag,
  Wallet,
} from "lucide-react";
import { cn } from "cn";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

const navItems = [
  {
    group: "Overview",
    items: [
      { title: "Dashboard", href: "/", icon: LayoutDashboard },
      { title: "Analytics", href: "/analytics", icon: ChartPie },
    ],
  },
  {
    group: "Finance",
    items: [
      { title: "Bills", href: "/bills", icon: ReceiptText },
      { title: "Income", href: "/salaries", icon: Wallet },
      { title: "Shopping Loans", href: "/loans/shopping", icon: ShoppingBag },
      { title: "Personal Loans", href: "/loans/personal", icon: HandCoins },
      { title: "Payment Logs", href: "/history", icon: ListChecks },
    ],
  },
];

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex h-11 items-center gap-2.5 px-2">
          <div className="size-8 shrink-0 overflow-hidden rounded-lg ring-1 ring-border">
            <Image
              src="/favicon.ico"
              alt="Finance Tracker logo"
              width={32}
              height={32}
              className="size-full"
            />
          </div>
          <div className="grid leading-tight">
            <span className="text-sm font-semibold tracking-tight">
              Finance Tracker
            </span>
            <span className="text-xs text-muted-foreground">
              Personal finance
            </span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        {navItems.map((group) => (
          <SidebarGroup key={group.group}>
            <SidebarGroupLabel>{group.group}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive =
                    item.href === "/"
                      ? pathname === "/"
                      : pathname.startsWith(item.href);

                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        isActive={isActive}
                        tooltip={item.title}
                        render={<Link href={item.href} />}
                      >
                        <Icon className={cn(isActive && "text-sidebar-primary")} />
                        <span>{item.title}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
    </Sidebar>
  );
}
