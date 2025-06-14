import React, { useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  SidebarProvider, 
  SidebarTrigger, 
  SidebarInset,
  useSidebar 
} from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { useIsMobile } from '@/hooks/use-mobile';
import { FileText, BarChart3, Trophy, User, Moon, Sun, ChevronUp } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

// 웹용 헤더 컴포넌트 분리
const WebHeader = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const { open: sidebarOpen } = useSidebar();

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    document.documentElement.classList.toggle('dark');
  };

  return (
    <>
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-16 items-center justify-between px-4">
          <div className="flex items-center space-x-2">
            <Link to="/" className="flex items-center space-x-2">
              <div className="gradient-bg w-8 h-8 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">L</span>
              </div>
              <span className="gradient-text text-2xl font-bold">LifeBit</span>
            </Link>
          </div>

          <div className="flex items-center space-x-4">
            {/* Dark Mode Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleDarkMode}
              className="hover-lift"
            >
              {isDarkMode ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </Button>

            {isLoggedIn ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="hover-lift">
                    <User className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem asChild>
                    <Link to="/profile" className="flex items-center">
                      <User className="mr-2 h-4 w-4" />
                      마이페이지
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setIsLoggedIn(false)}>
                    로그아웃
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link to="/login">
                <Button className="gradient-bg hover:opacity-90 transition-opacity">
                  로그인
                </Button>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Fixed Sidebar Toggle Button - 사이드바 상태에 따라 위치 조정 */}
      <div 
        className={`fixed top-20 z-50 transition-all duration-300 ease-in-out ${
          sidebarOpen ? 'left-64' : 'left-4'
        }`}
      >
        <SidebarTrigger className="bg-background/80 backdrop-blur border hover:bg-accent hover:text-accent-foreground shadow-md" />
      </div>
    </>
  );
};

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const isMobile = useIsMobile();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isNavVisible, setIsNavVisible] = useState(true);

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    document.documentElement.classList.toggle('dark');
  };

  const toggleNavVisibility = () => {
    setIsNavVisible(!isNavVisible);
  };

  const navigationItems = [
    { path: '/note', icon: FileText, label: '노트' },
    { path: '/healthlog', icon: BarChart3, label: '헬스로그' },
    { path: '/ranking', icon: Trophy, label: '랭킹' },
    { path: '/profile', icon: User, label: '프로필' },
  ];

  if (!isMobile) {
    // 웹 버전 - 왼쪽 사이드바 사용
    return (
      <SidebarProvider>
        <div className="min-h-screen flex w-full">
          <AppSidebar />
          <SidebarInset className="flex-1">
            <WebHeader />

            {/* Main Content */}
            <main className="flex-1">
              {children}
            </main>
          </SidebarInset>
        </div>
      </SidebarProvider>
    );
  }

  // 모바일 버전 - 하단 네비게이션 유지
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between px-4">
          <Link to="/" className="flex items-center space-x-2">
            <div className="gradient-bg w-8 h-8 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">L</span>
            </div>
            <span className="gradient-text text-2xl font-bold">LifeBit</span>
          </Link>

          <div className="flex items-center space-x-4">
            {/* Dark Mode Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleDarkMode}
              className="hover-lift"
            >
              {isDarkMode ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </Button>

            {isLoggedIn ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="hover-lift">
                    <User className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem asChild>
                    <Link to="/profile" className="flex items-center">
                      <User className="mr-2 h-4 w-4" />
                      마이페이지
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setIsLoggedIn(false)}>
                    로그아웃
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link to="/login">
                <Button className="gradient-bg hover:opacity-90 transition-opacity">
                  로그인
                </Button>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1" style={{ paddingBottom: isNavVisible ? '80px' : '20px' }}>
        {children}
      </main>

      {/* Navigation Toggle Button - Fixed above navigation bar */}
      <div className={`fixed left-1/2 transform -translate-x-1/2 z-50 ${
        isNavVisible ? 'bottom-16' : 'bottom-4'
      }`}>
        <button
          onClick={toggleNavVisibility}
          className="
            w-12 h-12 rounded-full shadow-lg 
            bg-gradient-to-br from-teal-400 to-blue-500 
            hover:from-teal-500 hover:to-blue-600
            text-white border-4 border-white
            transition-all duration-300 ease-in-out transform
            hover:scale-110
            flex items-center justify-center
          "
        >
          <div className={`transition-transform duration-300 ${isNavVisible ? 'rotate-180' : 'rotate-0'}`}>
            <ChevronUp className="w-5 h-5" />
          </div>
        </button>
      </div>

      {/* Bottom Navigation with Animation */}
      <nav className={`
        fixed bottom-0 left-0 right-0 z-40 
        bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-t
        transition-transform duration-300 ease-in-out
        ${isNavVisible ? 'translate-y-0' : 'translate-y-full'}
      `}>
        <div className="container px-4">
          <div className="flex items-center justify-around h-16">
            <Link
              to="/"
              className={`flex flex-col items-center space-y-1 px-3 py-2 rounded-lg transition-all duration-200 ${
                location.pathname === '/' 
                  ? 'text-primary bg-primary/10' 
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent'
              }`}
            >
              <FileText className="h-5 w-5" />
              <span className="text-xs font-medium">홈</span>
            </Link>
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex flex-col items-center space-y-1 px-3 py-2 rounded-lg transition-all duration-200 ${
                    isActive 
                      ? 'text-primary bg-primary/10' 
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span className="text-xs font-medium">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </nav>
    </div>
  );
};
