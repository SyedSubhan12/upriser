import type { ReactNode } from "react";
import { GraduationCap } from "lucide-react";
import { AnimatedNavbar } from "@/components/navigation/AnimatedNavbar";
import { Footer } from "@/components/layout/Footer";

interface CurriculumLayoutProps {
    children: ReactNode;
}

export function CurriculumLayout({ children }: CurriculumLayoutProps) {
    return (
        <div className="flex min-h-screen flex-col">
            <AnimatedNavbar />

            {/* Main Content */}
            <main className="flex-1 pt-0">{children}</main>

            <Footer />
        </div>
    );
}
