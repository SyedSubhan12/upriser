import { CurriculumLayout } from "@/layouts/CurriculumLayout";
import { ScreenHeader } from "@/components/navigation/ScreenHeader";
import { BoardTile, BoardTileCompact } from "@/components/curriculum/BoardTile";
import { useQuery } from "@tanstack/react-query";
import type { Board } from "@/lib/curriculumData";
import { Skeleton } from "@/components/ui/skeleton";

export function BoardsListPage() {
    const { data: boards = [], isLoading } = useQuery<Board[]>({
        queryKey: ["/api/curriculum/boards"],
    });

    // Separate main boards from others
    const mainBoards = boards.filter(b => ['caie', 'pearson', 'ib'].includes(b.boardKey));
    const otherBoards = boards.filter(b => !['caie', 'pearson', 'ib'].includes(b.boardKey));

    return (
        <CurriculumLayout>
            <div className="mx-auto max-w-7xl px-4 py-8 md:px-6 md:py-12">
                <ScreenHeader
                    title="Curriculum"
                    subtitle="Select your education board to explore qualifications and subjects"
                />

                {/* Main Boards */}
                <section className="mt-8">
                    <h2 className="mb-4 text-lg font-semibold">Featured Boards</h2>
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {isLoading ? (
                            Array.from({ length: 3 }).map((_, i) => (
                                <Skeleton key={i} className="h-[200px] rounded-xl" />
                            ))
                        ) : (
                            mainBoards.map((board) => (
                                <BoardTile key={board.id} board={board} />
                            ))
                        )}
                    </div>
                </section>

                {/* Other Boards */}
                {(isLoading || otherBoards.length > 0) && (
                    <section className="mt-12">
                        <h2 className="mb-4 text-lg font-semibold">Other Boards</h2>
                        <div className="grid gap-4 sm:grid-cols-2">
                            {isLoading ? (
                                Array.from({ length: 4 }).map((_, i) => (
                                    <Skeleton key={i} className="h-[80px] rounded-lg" />
                                ))
                            ) : (
                                otherBoards.map((board) => (
                                    <BoardTileCompact key={board.id} board={board} />
                                ))
                            )}
                        </div>
                    </section>
                )}
            </div>
        </CurriculumLayout>
    );
}

// Also export as CurriculumPage for backward compatibility
export { BoardsListPage as CurriculumPage };
