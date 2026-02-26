import type { ReactNode } from "react";
import { Link } from "wouter";
import { GraduationCap } from "lucide-react";
import { Header } from "@/components/ui/navbar";

interface PublicLayoutProps {
  children: ReactNode;
}

export function PublicLayout({ children }: PublicLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />


      <main className="flex-1">{children}</main>

      <footer className="border-t bg-background px-4 py-6 md:px-6">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                Upriser Educational Platform
              </span>
            </div>
            <p className="text-sm text-muted-foreground" data-testid="text-copyright">
              {new Date().getFullYear()} Upriser. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
