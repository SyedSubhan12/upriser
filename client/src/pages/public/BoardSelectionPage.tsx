import { useState } from "react";
import { useLocation } from "wouter";
import { CheckCircle, ArrowRight } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { mockBoards } from "@/lib/mockData";
import { PublicLayout } from "@/layouts/PublicLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function BoardSelectionPage() {
  const [, setLocation] = useLocation();
  const { user, updateUser, isAuthenticated } = useAuth();
  const [selectedBoardId, setSelectedBoardId] = useState<string | null>(
    user?.boardIds?.[0] || null
  );

  const handleBoardSelect = (boardId: string) => {
    setSelectedBoardId(boardId);
  };

  const handleContinue = () => {
    if (selectedBoardId && isAuthenticated) {
      updateUser({ boardIds: [selectedBoardId] });
      if (user?.role) {
        setLocation(`/${user.role}/dashboard`);
      }
    } else if (!isAuthenticated) {
      setLocation("/login");
    }
  };

  return (
    <PublicLayout>
      <div className="flex min-h-[calc(100vh-8rem)] flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-4xl">
          <div className="mb-8 text-center">
            <h1
              className="text-2xl font-bold md:text-3xl"
              data-testid="text-board-selection-title"
            >
              Select Your Education Board
            </h1>
            <p
              className="mt-2 text-muted-foreground"
              data-testid="text-board-selection-description"
            >
              Choose your education board to access relevant study materials and resources
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {mockBoards.filter(board => board.isEnabled).map((board) => {
              const isSelected = selectedBoardId === board.id;

              return (
                <Card
                  key={board.id}
                  className={cn(
                    "cursor-pointer transition-all hover-elevate",
                    isSelected && "ring-2 ring-primary"
                  )}
                  onClick={() => handleBoardSelect(board.id)}
                  data-testid={`card-board-${board.id}`}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <CardTitle
                          className="text-lg"
                          data-testid={`text-board-name-${board.id}`}
                        >
                          {board.displayName}
                        </CardTitle>
                        <CardDescription data-testid={`text-board-code-${board.id}`}>
                          {board.boardKey}
                        </CardDescription>
                      </div>
                      {isSelected && (
                        <CheckCircle
                          className="h-5 w-5 shrink-0 text-primary"
                          data-testid={`icon-board-selected-${board.id}`}
                        />
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p
                      className="text-sm text-muted-foreground"
                      data-testid={`text-board-description-${board.id}`}
                    >
                      {board.description}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="mt-8 flex justify-center">
            <Button
              size="lg"
              disabled={!selectedBoardId}
              onClick={handleContinue}
              data-testid="button-board-continue"
            >
              Continue
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>

          {!isAuthenticated && (
            <p
              className="mt-4 text-center text-sm text-muted-foreground"
              data-testid="text-login-prompt"
            >
              You need to be logged in to save your board selection.
            </p>
          )}
        </div>
      </div>
    </PublicLayout>
  );
}
