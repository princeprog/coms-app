"use client";
import { useSyncExternalStore } from "react";
import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
const subscribe = () => () => {};
const clientSnapshot = () => true;
const serverSnapshot = () => false;
const choices = [
  {
    value: "light",
    label: "Light",
    Icon: Sun,
    color: "text-amber-600 dark:text-amber-400",
  },
  {
    value: "dark",
    label: "Dark",
    Icon: Moon,
    color: "text-indigo-600 dark:text-indigo-400",
  },
  {
    value: "system",
    label: "System",
    Icon: Monitor,
    color: "text-muted-foreground",
  },
] as const;
export function ThemeSelector() {
  const mounted = useSyncExternalStore(
    subscribe,
    clientSnapshot,
    serverSnapshot,
  );
  const { theme, setTheme } = useTheme();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            aria-label="Change theme"
            title="Change theme"
          />
        }
      >
        <Sun className="size-4 dark:hidden" aria-hidden="true" />
        <Moon className="hidden size-4 dark:block" aria-hidden="true" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-36">
        <DropdownMenuRadioGroup
          aria-label="Appearance"
          value={mounted ? (theme ?? "system") : "system"}
          onValueChange={setTheme}
        >
          {choices.map(({ value, label, Icon, color }) => (
            <DropdownMenuRadioItem
              key={value}
              value={value}
              closeOnClick
              className="min-h-10 gap-2"
            >
              <Icon className={color} aria-hidden="true" />
              {label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
