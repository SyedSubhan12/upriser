import { Link, useLocation } from "wouter";
import { Home, BookOpen, Search, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
    { name: "Home", href: "/", icon: Home },
    { name: "Curriculum", href: "/curriculum", icon: BookOpen },
    { name: "Subjects", href: "/subjects", icon: Search },
    { name: "Help", href: "/help", icon: HelpCircle },
];

export function BottomNav() {
    const [location] = useLocation();

    const isActive = (href: string) => {
        if (href === "/") return location === "/" || location === "/home";
        return location.startsWith(href);
    };

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
            <div className="mx-auto max-w-lg">
                <div className="flex items-center justify-around py-2">
                    {navItems.map((item) => {
                        const active = isActive(item.href);
                        return (
                            <Link key={item.name} href={item.href}>
                                <button
                                    className={cn(
                                        "flex flex-col items-center gap-1 rounded-lg px-4 py-2 text-xs font-medium transition-all",
                                        active
                                            ? "text-primary"
                                            : "text-muted-foreground hover:text-foreground"
                                    )}
                                >
                                    <item.icon
                                        className={cn(
                                            "h-5 w-5 transition-transform",
                                            active && "scale-110"
                                        )}
                                    />
                                    <span>{item.name}</span>
                                    {active && (
                                        <span className="absolute bottom-1 h-1 w-8 rounded-full bg-primary" />
                                    )}
                                </button>
                            </Link>
                        );
                    })}
                </div>
            </div>
            {/* Safe area padding for mobile devices */}
            <div className="h-[env(safe-area-inset-bottom)]" />
        </nav>
    );
}
