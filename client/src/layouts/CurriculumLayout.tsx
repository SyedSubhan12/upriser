import type { ReactNode } from "react";
import { GraduationCap } from "lucide-react";
import { AnimatedNavbar } from "@/components/navigation/AnimatedNavbar";

interface CurriculumLayoutProps {
    children: ReactNode;
}

export function CurriculumLayout({ children }: CurriculumLayoutProps) {
    return (
        <div className="flex min-h-screen flex-col">
            <AnimatedNavbar />

            {/* Main Content */}
            <main className="flex-1 pt-4 md:pt-6">{children}</main>

            {/* Footer */}
            <footer className="border-t bg-background/80 backdrop-blur-sm px-4 py-6 md:px-6">
                <div className="mx-auto max-w-7xl">
                    <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
                        <div className="flex items-center gap-2">
                            <GraduationCap className="h-5 w-5 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">
                                Upriser Educational Platform
                            </span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                            © {new Date().getFullYear()} Upriser. All rights reserved.
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    );
}
