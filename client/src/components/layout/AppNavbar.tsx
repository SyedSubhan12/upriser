import { Header } from "@/components/ui/navbar";

interface AppNavbarProps {
  showAuth?: boolean;
}

export function AppNavbar({ showAuth = true }: AppNavbarProps) {
  void showAuth;
  return <Header />;
}
