import { useState } from "react";
import { Link } from "wouter";
import { Plus, Pencil, Power } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { mockBoards } from "@/lib/mockData";
import type { Board } from "@shared/schema";

export function BoardsPage() {
  const [boards, setBoards] = useState<Board[]>(mockBoards);

  const handleToggleActive = (boardId: string) => {
    setBoards((prev) =>
      prev.map((board) =>
        board.id === boardId ? { ...board, isActive: !board.isActive } : board
      )
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Boards"
        description="Manage educational boards and their configurations"
        actions={
          <Link href="/admin/boards/new">
            <Button data-testid="button-add-board">
              <Plus className="h-4 w-4 mr-2" />
              Add Board
            </Button>
          </Link>
        }
      />

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="w-24 text-center">Active</TableHead>
                <TableHead className="w-32 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {boards.map((board) => (
                <TableRow key={board.id} data-testid={`row-board-${board.id}`}>
                  <TableCell className="font-medium" data-testid={`text-board-name-${board.id}`}>
                    {board.name}
                  </TableCell>
                  <TableCell data-testid={`text-board-code-${board.id}`}>
                    {board.code}
                  </TableCell>
                  <TableCell className="text-muted-foreground max-w-xs truncate">
                    {board.description || "No description"}
                  </TableCell>
                  <TableCell className="text-center">
                    <Switch
                      checked={board.isActive}
                      onCheckedChange={() => handleToggleActive(board.id)}
                      data-testid={`switch-board-active-${board.id}`}
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Link href={`/admin/boards/${board.id}`}>
                        <Button
                          variant="ghost"
                          size="icon"
                          data-testid={`button-edit-board-${board.id}`}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleToggleActive(board.id)}
                        data-testid={`button-toggle-board-${board.id}`}
                      >
                        <Power className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {boards.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    No boards found. Create your first board to get started.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
