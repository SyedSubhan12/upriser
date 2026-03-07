import type { ReactNode } from "react";
import { AnimatedNavbar } from "@/components/navigation/AnimatedNavbar";

interface PublicLayoutProps {
  children: ReactNode;
}

export function PublicLayout({ children }: PublicLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <AnimatedNavbar />
      <main className="flex-1 pt-0">{children}</main>
    </div>
  );
}
