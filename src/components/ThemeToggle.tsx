import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";

const getInitialTheme = () => {
    if (typeof window === "undefined") return "light";
    const saved = localStorage.getItem("theme");
    if (saved) return saved;
    if (window.matchMedia("(prefers-color-scheme: dark)").matches) return "dark";
    return "light";
};

export default function ThemeToggle() {
    const [theme, setTheme] = useState(getInitialTheme());

    useEffect(() => {
        document.documentElement.classList.add('theme-transition');
        document.documentElement.classList.remove("light", "dark");
        if (theme === "system") {
            const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
            document.documentElement.classList.add(systemTheme);
        } else {
            document.documentElement.classList.add(theme);
        }

        // Remove transition class after animation completes
        setTimeout(() => {
            document.documentElement.classList.remove('theme-transition');
        }, 200);
        localStorage.setItem("theme", theme);
    }, [theme]);

    // Toggle between light and dark
    const handleToggle = () => {
        setTheme((prev) => (prev === "light" ? "dark" : "light"));
    };

    return (<Button
        size="icon"
        variant="ghost"
        aria-label="Toggle theme"
        onClick={handleToggle}
        className="hover:bg-primary/10 dark:hover:text-primary transition-all duration-200"
    >
        <span className="transition-transform duration-500 rotate-0 dark:rotate-180">
            {theme === "dark" ? (
                <Moon className="h-5 w-5 transition-all" />
            ) : (
                <Sun className="h-5 w-5 transition-all" />
            )}
        </span>
    </Button>
    );
}
