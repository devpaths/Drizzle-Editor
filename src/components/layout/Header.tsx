import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { ModeToggle } from "../ui/mode-toggle";
import { useEffect, useState } from "react";
import { Code, Database, Github, Layout, Settings } from "lucide-react";

export default function Header() {
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    setIsDarkMode(document.documentElement.classList.contains("dark"));

    const observer = new MutationObserver(() => {
      setIsDarkMode(document.documentElement.classList.contains("dark"));
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  return (
    <div
      className={`w-full border-b p-0 ${
        isDarkMode
          ? "border-[#2E2E32] bg-[#1B1B1F] text-gray-200"
          : "border-gray-300 bg-[#F3F4F6] text-gray-800"
      }`}
    >
      <NavigationMenu className="w-full max-w-none">
        <div className="mx-auto flex h-14 w-full items-center justify-between px-4">
          {/* Logo and Brand */}
          <div className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            <span className="text-lg font-semibold">DrizzleEditor</span>
          </div>

          {/* Navigation Items */}
          <NavigationMenuList className="flex items-center gap-1">
            {/* GitHub Link */}
            <NavigationMenuItem>
              <NavigationMenuLink
                className={`flex h-9 items-center rounded-md px-3 text-sm ${
                  isDarkMode ? "hover:bg-[#252526]" : "hover:bg-gray-200"
                } transition`}
              >
                <Github className="h-4 w-4" />
              </NavigationMenuLink>
            </NavigationMenuItem>

            {/* Theme Toggle */}
            <NavigationMenuItem>
              <div className="ml-2">
                <ModeToggle />
              </div>
            </NavigationMenuItem>
          </NavigationMenuList>
        </div>
      </NavigationMenu>
    </div>
  );
}
