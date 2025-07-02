import { NavLink, Link } from 'react-router-dom';
import { 
  FileText, 
  User, 
  Trophy, 
  Heart,
  Settings,
  Moon,
  Sun
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
import { Switch } from '@/components/ui/switch';
import React from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { useLocation } from 'react-router-dom';

const GradientFileTextIcon = ({ className }: { className?: string }) => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    stroke="url(#sidebar-gradient)"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <defs>
      <linearGradient id="sidebar-gradient" x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse">
        <stop stopColor="#7c3aed" />
        <stop offset="1" stopColor="#ec4899" />
      </linearGradient>
    </defs>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <polyline points="10 9 9 9 8 9" />
  </svg>
);

const GradientUserIcon = ({ className }: { className?: string }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} stroke="url(#sidebar-gradient)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <defs>
      <linearGradient id="sidebar-gradient" x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse">
        <stop stopColor="#7c3aed" />
        <stop offset="1" stopColor="#ec4899" />
      </linearGradient>
    </defs>
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const GradientTrophyIcon = ({ className }: { className?: string }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} stroke="url(#sidebar-gradient)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <defs>
      <linearGradient id="sidebar-gradient" x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse">
        <stop stopColor="#7c3aed" />
        <stop offset="1" stopColor="#ec4899" />
      </linearGradient>
    </defs>
    <path d="M21 4H17V2H7V4H3V6C3 10.4183 7.58172 14 12 14C16.4183 14 21 10.4183 21 6V4Z" />
    <path d="M8 21H16" />
    <path d="M12 17V21" />
  </svg>
);

const GradientHeartIcon = ({ className }: { className?: string }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} stroke="url(#sidebar-gradient)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <defs>
      <linearGradient id="sidebar-gradient" x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse">
        <stop stopColor="#7c3aed" />
        <stop offset="1" stopColor="#ec4899" />
      </linearGradient>
    </defs>
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
  </svg>
);

export const AppSidebar = () => {
  const { isDarkMode, toggleDarkMode } = useTheme();
  const location = useLocation();

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
                const isActive = location.pathname === item.to || location.pathname.startsWith(item.to + '/');
                
                let GradientIcon = null;
                if (item.to === '/note') GradientIcon = GradientFileTextIcon;
                if (item.to === '/profile') GradientIcon = GradientUserIcon;
                if (item.to === '/ranking') GradientIcon = GradientTrophyIcon;
                if (item.to === '/healthlog') GradientIcon = GradientHeartIcon;
                
                return (
                  <SidebarMenuItem key={item.to}>
                    <SidebarMenuButton asChild className="h-12 group">
                      <NavLink
                        to={item.to}
                        className={cn(
                          "flex items-center space-x-4 px-4 py-3 rounded-lg transition-all duration-300 w-full text-base font-medium",
                          "hover:scale-105 hover:shadow-md",
                          isActive
                            ? "text-primary bg-primary/10 shadow-sm dark:bg-[#181c2a] dark:!border-2 dark:!border-[#7c3aed]"
                            : "text-muted-foreground hover:text-foreground hover:bg-accent"
                        )}
                      >
                        {isActive && GradientIcon ? (
                          <GradientIcon className={"h-6 w-6 transition-all duration-300 group-hover:scale-125 group-hover:drop-shadow-md group-hover:rotate-12 group-hover:animate-pulse"} />
                        ) : (
                          <Icon
                            className={"h-6 w-6 transition-all duration-300 group-hover:scale-125 group-hover:drop-shadow-md group-hover:rotate-12 group-hover:animate-pulse"}
                            style={{ color: undefined, fill: 'none' }}
                          />
                        )}
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
