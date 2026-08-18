"use client";

import * as React from "react";
import { PanelLeftIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

type SidebarContextValue = { open: boolean; toggleSidebar: () => void };
const SidebarContext = React.createContext<SidebarContextValue | null>(null);

function useSidebar() {
  const context = React.useContext(SidebarContext);
  if (!context) throw new Error("useSidebar must be used within SidebarProvider");
  return context;
}

function SidebarProvider({ children, defaultOpen = true }: { children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = React.useState(defaultOpen);
  const toggleSidebar = React.useCallback(() => setOpen((value) => !value), []);
  React.useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "b") {
        event.preventDefault();
        toggleSidebar();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [toggleSidebar]);
  return <SidebarContext.Provider value={{ open, toggleSidebar }}><div data-slot="sidebar-wrapper" className="flex min-h-svh w-full bg-background">{children}</div></SidebarContext.Provider>;
}

function Sidebar({ className, children }: React.ComponentProps<"aside">) {
  const { open } = useSidebar();
  return <aside data-slot="sidebar" data-state={open ? "expanded" : "collapsed"} className={cn("sticky top-0 hidden h-svh shrink-0 flex-col border-r bg-sidebar text-sidebar-foreground transition-[width] duration-200 md:flex", open ? "w-64" : "w-16", className)}>{children}</aside>;
}
function SidebarHeader({ className, ...props }: React.ComponentProps<"div">) { return <div data-slot="sidebar-header" className={cn("flex flex-col gap-2 p-2", className)} {...props} />; }
function SidebarContent({ className, ...props }: React.ComponentProps<"div">) { return <div data-slot="sidebar-content" className={cn("flex min-h-0 flex-1 flex-col gap-2 overflow-auto p-2", className)} {...props} />; }
function SidebarFooter({ className, ...props }: React.ComponentProps<"div">) { return <div data-slot="sidebar-footer" className={cn("flex flex-col gap-2 border-t p-2", className)} {...props} />; }
function SidebarGroup({ className, ...props }: React.ComponentProps<"div">) { return <div data-slot="sidebar-group" className={cn("flex flex-col gap-1", className)} {...props} />; }
function SidebarGroupLabel({ className, ...props }: React.ComponentProps<"div">) { const { open } = useSidebar(); return open ? <div data-slot="sidebar-group-label" className={cn("px-2 py-1 text-xs font-medium text-sidebar-foreground/60", className)} {...props} /> : null; }
function SidebarMenu({ className, ...props }: React.ComponentProps<"ul">) { return <ul data-slot="sidebar-menu" className={cn("flex flex-col gap-1", className)} {...props} />; }
function SidebarMenuItem({ className, ...props }: React.ComponentProps<"li">) { return <li data-slot="sidebar-menu-item" className={cn("relative", className)} {...props} />; }
function SidebarMenuButton({ className, isActive, tooltip, children, ...props }: React.ComponentProps<"button"> & { isActive?: boolean; tooltip?: string }) {
  const { open } = useSidebar();
  const button = <button data-slot="sidebar-menu-button" data-active={isActive} className={cn("flex h-9 w-full items-center gap-2 overflow-hidden rounded-md px-2 text-left text-sm outline-none transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 focus-visible:ring-sidebar-ring data-[active=true]:bg-sidebar-accent data-[active=true]:font-medium data-[active=true]:text-sidebar-accent-foreground [&_svg]:size-4 [&_svg]:shrink-0", !open && "justify-center px-0 [&>span]:hidden", className)} {...props}>{children}</button>;
  return !open && tooltip ? <Tooltip><TooltipTrigger asChild>{button}</TooltipTrigger><TooltipContent side="right">{tooltip}</TooltipContent></Tooltip> : button;
}
function SidebarInset({ className, ...props }: React.ComponentProps<"main">) { return <main data-slot="sidebar-inset" className={cn("min-w-0 flex-1 bg-background", className)} {...props} />; }
function SidebarTrigger({ className }: { className?: string }) { const { toggleSidebar } = useSidebar(); return <Button variant="ghost" size="icon" className={className} onClick={toggleSidebar} aria-label="Alternar barra lateral"><PanelLeftIcon /></Button>; }

export { SidebarProvider, Sidebar, SidebarHeader, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupLabel, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarInset, SidebarTrigger, useSidebar };
