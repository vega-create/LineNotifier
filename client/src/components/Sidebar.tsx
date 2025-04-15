import { useState } from "react";
import { Link, useLocation } from "wouter";
import { FiMessageSquare, FiCalendar, FiClock, FiUsers, FiFileText, FiSettings, FiMenu, FiSend, FiSearch } from "react-icons/fi";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { Settings } from "@shared/schema";

type SidebarProps = {
  currentPath: string;
};

export default function Sidebar({ currentPath }: SidebarProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [location, setLocation] = useLocation();

  // Fetch settings to display LINE API status
  const { data: settings } = useQuery<Settings>({
    queryKey: ["/api/settings"],
  });

  const navigationItems = [
    {
      name: "發送訊息",
      path: "/",
      icon: <FiMessageSquare className="h-5 w-5" />,
    },
    {
      name: "排程管理",
      path: "/schedules",
      icon: <FiCalendar className="h-5 w-5" />,
    },
    {
      name: "歷史紀錄",
      path: "/history",
      icon: <FiClock className="h-5 w-5" />,
    },
    {
      name: "群組管理",
      path: "/groups",
      icon: <FiUsers className="h-5 w-5" />,
    },
    {
      name: "訊息模板",
      path: "/templates",
      icon: <FiFileText className="h-5 w-5" />,
    },
    {
      name: "測試發送",
      path: "/test-send",
      icon: <FiSend className="h-5 w-5" />,
    },
    {
      name: "系統設定",
      path: "/settings",
      icon: <FiSettings className="h-5 w-5" />,
    },
  ];

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <aside className="bg-white w-full md:w-64 md:min-h-screen shadow-sm">
      <div className="p-4 flex justify-between items-center border-b">
        <h1 className="text-xl font-semibold flex items-center text-gray-800">
          <svg 
            viewBox="0 0 35 35" 
            className="h-6 w-6 mr-2 text-primary"
            fill="currentColor"
          >
            <path d="M32.7,16.3c0-8.3-8.3-15-18.5-15S-4.2,8-4.2,16.3c0,7.4,6.6,13.6,15.4,14.8c0.6,0.1,1.4,0.4,1.6,0.9c0.2,0.5,0.1,1.2,0.1,1.7c0,0-0.2,1.4-0.2,1.7c-0.1,0.6-0.4,2.3,2,1.2c2.4-1,12.8-7.5,17.5-12.9l0,0C31.7,21.5,32.7,19,32.7,16.3"/>
          </svg>
          LINE訊息系統
        </h1>
        <Button 
          variant="ghost" 
          size="icon" 
          className="md:hidden"
          onClick={toggleMobileMenu}
        >
          <FiMenu className="h-5 w-5" />
        </Button>
      </div>
      <nav className={`p-4 ${isMobileMenuOpen ? 'block' : 'hidden'} md:block`}>
        <ul className="space-y-2">
          {navigationItems.map((item) => (
            <li key={item.path}>
              <Link 
                href={item.path}
                className={`flex items-center p-2 text-gray-700 rounded-md ${
                  currentPath === item.path
                    ? "bg-gray-100 font-medium"
                    : "hover:bg-gray-100"
                }`}
                onClick={() => {
                  setIsMobileMenuOpen(false);
                }}
              >
                <span className={`mr-3 ${currentPath === item.path ? "text-primary" : "text-gray-500"}`}>
                  {item.icon}
                </span>
                {item.name}
              </Link>
            </li>
          ))}
        </ul>
        <div className="mt-8 pt-4 border-t">
          <div className="bg-gray-100 p-3 rounded-md">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">LINE API 狀態</h3>
            <div className="flex items-center">
              <div className={`h-2.5 w-2.5 rounded-full ${settings?.isConnected ? 'bg-green-500' : 'bg-gray-300'} mr-2`}></div>
              <span className="text-sm text-gray-600">
                {settings?.isConnected ? '已連接' : '未連接'}
              </span>
            </div>
            {settings?.lastSynced && (
              <div className="mt-2 text-xs text-gray-500">
                上次同步: {new Date(settings.lastSynced).toLocaleString('zh-TW', {
                  month: 'numeric',
                  day: 'numeric',
                  hour: 'numeric',
                  minute: 'numeric'
                })}
              </div>
            )}
          </div>
        </div>
      </nav>
    </aside>
  );
}
