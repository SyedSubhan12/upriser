import { useAuth } from "@/context/AuthContext";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { UserRole } from "@shared/schema";

const ROLE_LABELS: Record<UserRole, string> = {
  student: "Student",
  teacher: "Teacher",
  admin: "Admin",
};

const ROLE_COLORS: Record<UserRole, string> = {
  student: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  teacher: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  admin: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
};

interface RoleSwitcherProps {
  showSelector?: boolean;
  onRoleChange?: (role: UserRole) => void;
}

export function RoleSwitcher({ showSelector = false, onRoleChange }: RoleSwitcherProps) {
  const { user, updateUser } = useAuth();

  if (!user) return null;

  const handleRoleChange = (role: UserRole) => {
    updateUser({ role });
    onRoleChange?.(role);
  };

  if (showSelector) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Role:</span>
        <Select value={user.role} onValueChange={handleRoleChange}>
          <SelectTrigger className="w-32" data-testid="select-role-switcher">
            <SelectValue placeholder="Select role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="student" data-testid="option-role-student">
              Student
            </SelectItem>
            <SelectItem value="teacher" data-testid="option-role-teacher">
              Teacher
            </SelectItem>
            <SelectItem value="admin" data-testid="option-role-admin">
              Admin
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
    );
  }

  return (
    <Badge
      className={`${ROLE_COLORS[user.role]} no-default-hover-elevate no-default-active-elevate`}
      data-testid="badge-current-role"
    >
      {ROLE_LABELS[user.role]}
    </Badge>
  );
}
