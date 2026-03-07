import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { Plus, Eye, UserCog, Power, Search, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  listAdminUsers,
  listAdminBoards,
  updateAdminUser,
  createAdminUser,
  type AdminUserListResponse,
  type AdminUserSummary,
  type AdminBoardSummary,
  type CreateAdminUserBody,
} from "@/api/admin";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

export function UsersPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [boardFilter, setBoardFilter] = useState<string>("all");
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [newUser, setNewUser] = useState<{
    name: string;
    email: string;
    role: "student" | "teacher" | "admin";
    boardId: string | "all";
    status: "ACTIVE" | "INACTIVE";
  }>({
    name: "",
    email: "",
    role: "student",
    boardId: "all",
    status: "ACTIVE",
  });

  const { data: usersResponse, isLoading: isLoadingUsers } = useQuery<AdminUserListResponse>({
    queryKey: ["admin-users"],
    queryFn: () => listAdminUsers({ page: 1, pageSize: 100 }),
  });

  const { data: boards = [], isLoading: isLoadingBoards } = useQuery<AdminBoardSummary[]>({
    queryKey: ["admin-boards"],
    queryFn: () => listAdminBoards(),
  });

  const users = usersResponse?.data ?? [];

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const matchesSearch =
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesRole = roleFilter === "all" || user.role === roleFilter;
      const matchesBoard =
        boardFilter === "all" || user.boardIds?.includes(boardFilter);
      return matchesSearch && matchesRole && matchesBoard;
    });
  }, [users, searchQuery, roleFilter, boardFilter]);

  const toggleStatusMutation = useMutation({
    mutationFn: (user: AdminUserSummary) =>
      updateAdminUser(user.id, {
        status: user.status === "ACTIVE" ? "INACTIVE" : "ACTIVE",
      }),
    onSuccess: (updatedUser) => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      const isActive = updatedUser.status === "ACTIVE";
      toast({
        title: isActive ? "User Activated" : "User Deactivated",
        description: `${updatedUser.name} has been ${isActive ? "activated" : "deactivated"}.`,
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update user status.",
        variant: "destructive",
      });
    },
  });

  const handleToggleActive = (user: AdminUserSummary) => {
    toggleStatusMutation.mutate(user);
  };

  const createUserMutation = useMutation({
    mutationFn: (body: CreateAdminUserBody) => createAdminUser(body),
    onSuccess: (createdUser) => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      setIsAddUserOpen(false);
      setNewUser({
        name: "",
        email: "",
        role: "student",
        boardId: "all",
        status: "ACTIVE",
      });
      toast({
        title: "User Created",
        description: `${createdUser.name} has been created successfully.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to create user.",
        variant: "destructive",
      });
    },
  });

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    const body: CreateAdminUserBody = {
      name: newUser.name.trim(),
      email: newUser.email.trim(),
      role: newUser.role,
      boardId: newUser.boardId === "all" ? null : newUser.boardId,
      status: newUser.status,
    };
    createUserMutation.mutate(body);
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "admin":
        return "default";
      case "teacher":
        return "secondary";
      default:
        return "outline";
    }
  };

  const getBoardName = (user: AdminUserSummary, boards: AdminBoardSummary[]) => {
    if (!user.boardIds || user.boardIds.length === 0) return "All Boards";
    const primaryBoardId = user.boardIds[0];
    const board = boards.find((b) => b.id === primaryBoardId);
    if (user.boardIds.length > 1) {
      return `${board?.displayName || "Unknown"} +${user.boardIds.length - 1}`;
    }
    return board?.displayName || "Unknown";
  };

  return (
    <TooltipProvider>
      <div className="space-y-6">
        <PageHeader
          title="Users"
          description="Manage students, teachers, and administrators"
          actions={
            <Button data-testid="button-add-user" onClick={() => setIsAddUserOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add User
            </Button>
          }
        />

        <Card>
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="relative flex-1 min-w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                  data-testid="input-search-users"
                />
              </div>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-40" data-testid="select-role-filter">
                  <SelectValue placeholder="Filter by role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="student">Students</SelectItem>
                  <SelectItem value="teacher">Teachers</SelectItem>
                  <SelectItem value="admin">Admins</SelectItem>
                </SelectContent>
              </Select>
              <Select value={boardFilter} onValueChange={setBoardFilter}>
                <SelectTrigger className="w-40" data-testid="select-board-filter">
                  <SelectValue placeholder="Filter by board" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Boards</SelectItem>
                  {boards.map((board) => (
                    <SelectItem key={board.id} value={board.id}>
                      {board.displayName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Board</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="w-32 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id} data-testid={`row-user-${user.id}`}>
                    <TableCell className="font-medium" data-testid={`text-user-name-${user.id}`}>
                      {user.name}
                    </TableCell>
                    <TableCell data-testid={`text-user-email-${user.id}`}>
                      {user.email}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={getRoleBadgeVariant(user.role)}
                        data-testid={`badge-user-role-${user.id}`}
                      >
                        {user.role}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {getBoardName(user, boards)}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant={user.status === "ACTIVE" ? "default" : "secondary"}
                        data-testid={`badge-user-status-${user.id}`}
                      >
                        {user.status === "ACTIVE" ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Link href={`/admin/users/${user.id}`}>
                              <Button
                                variant="ghost"
                                size="icon"
                                data-testid={`button-view-user-${user.id}`}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </Link>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>View user details</p>
                          </TooltipContent>
                        </Tooltip>

                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Link href={`/admin/users/${user.id}`}>
                              <Button
                                variant="ghost"
                                size="icon"
                                data-testid={`button-edit-role-${user.id}`}
                              >
                                <UserCog className="h-4 w-4" />
                              </Button>
                            </Link>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Edit user role & permissions</p>
                          </TooltipContent>
                        </Tooltip>

                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleToggleActive(user)}
                              disabled={toggleStatusMutation.isPending}
                              data-testid={`button-toggle-user-${user.id}`}
                            >
                              {toggleStatusMutation.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Power className="h-4 w-4" />
                              )}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{user.status === "ACTIVE" ? "Deactivate user" : "Activate user"}</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredUsers.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      No users found matching your filters.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add User</DialogTitle>
              <DialogDescription>
                Create a new user account. A temporary password will be assigned automatically.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="new-user-name">
                  Name
                </label>
                <Input
                  id="new-user-name"
                  value={newUser.name}
                  onChange={(e) => setNewUser((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter full name"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="new-user-email">
                  Email
                </label>
                <Input
                  id="new-user-email"
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser((prev) => ({ ...prev, email: e.target.value }))}
                  placeholder="user@example.com"
                  required
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Role</label>
                  <Select
                    value={newUser.role}
                    onValueChange={(value) =>
                      setNewUser((prev) => ({ ...prev, role: value as "student" | "teacher" | "admin" }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="student">Student</SelectItem>
                      <SelectItem value="teacher">Teacher</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Board</label>
                  <Select
                    value={newUser.boardId}
                    onValueChange={(value) =>
                      setNewUser((prev) => ({ ...prev, boardId: value as string | "all" }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All Boards" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Boards</SelectItem>
                      {boards.map((board) => (
                        <SelectItem key={board.id} value={board.id}>
                          {board.displayName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <Select
                  value={newUser.status}
                  onValueChange={(value) =>
                    setNewUser((prev) => ({ ...prev, status: value as "ACTIVE" | "INACTIVE" }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="INACTIVE">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAddUserOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={createUserMutation.isPending}>
                  {createUserMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  {createUserMutation.isPending ? "Creating..." : "Create User"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
}
