
import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  FileText, 
  User, 
  Trophy, 
  Heart
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

export const AppSidebar = () => {
  const navItems = [
    { to: '/note', icon: FileText, label: '노트' },
    { to: '/profile', icon: User, label: '프로필' },
    { to: '/ranking', icon: Trophy, label: '랭킹' },
    { to: '/healthlog', icon: Heart, label: '건강 로그' },
  ];

  return (
    <Sidebar className="border-r">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-3">
              {navItems.map((item) => {
                const Icon = item.icon;
                
                return (
                  <SidebarMenuItem key={item.to}>
                    <SidebarMenuButton asChild className="h-12 group">
                      <NavLink
                        to={item.to}
                        className={({ isActive }) =>
                          cn(
                            "flex items-center space-x-4 px-4 py-3 rounded-lg transition-all duration-300 w-full text-base font-medium",
                            "hover:scale-105 hover:shadow-md",
                            isActive
                              ? "text-primary bg-primary/10 shadow-sm"
                              : "text-muted-foreground hover:text-foreground hover:bg-accent"
                          )
                        }
                      >
                        <Icon className="h-6 w-6 transition-all duration-300 group-hover:scale-125 group-hover:text-primary group-hover:drop-shadow-md group-hover:rotate-12 group-hover:animate-pulse" />
                        <span className="text-base transition-all duration-300 group-hover:translate-x-2 group-hover:font-semibold">{item.label}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
};
