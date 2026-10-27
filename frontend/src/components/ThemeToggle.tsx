import { Moon, Sun, Monitor } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ThemeToggleProps {
  className?: string;
  variant?: "icon-only" | "dropdown";
}

export function ThemeToggle({ className, variant = "dropdown" }: ThemeToggleProps) {
  const { theme, setTheme } = useTheme();

  if (variant === "icon-only") {
    return (
      <Button
        variant="outline"
        size="icon"
        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        className={`relative h-9 w-9 rounded-xl border-border/70 hover:bg-secondary/70 transition-colors ${className || ""}`}
        title={`Current: ${theme}. Click to switch to ${theme === "dark" ? "light" : "dark"} mode`}
      >
        <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 text-amber-500" />
        <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 text-[#00D8F6]" />
        <span className="sr-only">Toggle theme</span>
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className={`relative h-9 w-9 rounded-xl border-border/70 hover:bg-secondary/70 transition-colors ${className || ""}`}
          title="Toggle Light / Dark Theme"
        >
          <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 text-amber-500" />
          <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 text-[#00D8F6]" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="rounded-xl border border-border/80 shadow-xl p-1.5 min-w-[130px]">
        <DropdownMenuItem
          onClick={() => setTheme("light")}
          className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium cursor-pointer ${
            theme === "light" ? "bg-primary/10 text-primary font-semibold" : ""
          }`}
        >
          <Sun className="h-3.5 w-3.5 text-amber-500" />
          <span>Light Theme</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme("dark")}
          className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium cursor-pointer ${
            theme === "dark" ? "bg-primary/10 text-primary font-semibold" : ""
          }`}
        >
          <Moon className="h-3.5 w-3.5 text-[#00D8F6]" />
          <span>Dark Theme</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme("system")}
          className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium cursor-pointer ${
            theme === "system" ? "bg-primary/10 text-primary font-semibold" : ""
          }`}
        >
          <Monitor className="h-3.5 w-3.5 text-slate-400" />
          <span>System Sync</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
