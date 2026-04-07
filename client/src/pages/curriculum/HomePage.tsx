import { Link } from "wouter";
import { ArrowRight, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CurriculumLayout } from "@/layouts/CurriculumLayout";
import { BoardTile } from "@/components/curriculum/BoardTile";
import { useQuery } from "@tanstack/react-query";
import type { Board } from "@/lib/curriculumData";
import { Skeleton } from "@/components/ui/skeleton";
import FloatingLines from "@/components/FloatingLines";
import CurvedLoop from "@/components/CurvedLoop";
import { useTheme } from "@/context/ThemeContext";
import { FeaturesSection } from "@/components/curriculum/FeaturesSection";

export function HomePage() {
    const { theme } = useTheme();
    const isDark = theme === "dark";

    const { data: boards = [], isLoading } = useQuery<Board[]>({
        queryKey: ["/api/curriculum/boards"],
    });

    // Get only the main 3 boards for the home page
    const mainBoards = boards.filter(b =>
        ['caie', 'pearson', 'ib'].includes(b.boardKey)
    );

    return (
        <CurriculumLayout>
            {/* Hero Section with Floating Lines background */}
            <section className="relative overflow-hidden pt-8 pb-16 sm:pt-12 sm:pb-24 md:pt-20 md:pb-32">
                {/* Light mode: soft gradient background */}
                {!isDark && (
                    <div
                        className="absolute inset-0 -z-20"
                        style={{
                            background: "linear-gradient(135deg, #f8faff 0%, #eef3ff 25%, #e8efff 50%, #f0eafc 75%, #faf7ff 100%)",
                        }}
                    />
                )}

                {/* Floating Lines animation — dark mode only */}
                {isDark && (
                    <div className="absolute inset-0 -z-10 opacity-90">
                        <FloatingLines
                            linesGradient={["#38bdf8", "#6366f1", "#ec4899"]}
                            enabledWaves={["top", "middle", "bottom"]}
                            lineCount={[4, 6, 5]}
                            lineDistance={[18, 12, 16]}
                            animationSpeed={0.9}
                            interactive={true}
                            parallax={true}
                            parallaxStrength={0.25}
                            bendRadius={6}
                            bendStrength={-0.35}
                            mouseDamping={0.1}
                            mixBlendMode="lighten"
                        />
                    </div>
                )}

                {/* Light mode: subtle radial glow accents */}
                {!isDark && (
                    <>
                        <div
                            className="absolute -z-[5] rounded-full blur-3xl"
                            style={{
                                width: "500px",
                                height: "500px",
                                top: "-100px",
                                right: "-100px",
                                background: "radial-gradient(circle, rgba(147,197,253,0.2) 0%, transparent 70%)",
                            }}
                        />
                        <div
                            className="absolute -z-[5] rounded-full blur-3xl"
                            style={{
                                width: "400px",
                                height: "400px",
                                bottom: "-50px",
                                left: "-50px",
                                background: "radial-gradient(circle, rgba(196,181,253,0.15) 0%, transparent 70%)",
                            }}
                        />
                    </>
                )}

                <div className="relative z-10 mx-auto max-w-7xl px-4 md:px-6">
                    <div className="flex flex-col items-center text-center">
                        <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-background/80 backdrop-blur-sm px-4 py-2 text-sm text-primary border border-primary/20">
                            <GraduationCap className="h-4 w-4" />
                            <span>Your Complete Study Companion</span>
                        </div>

                        <h1
                            className={`text-2xl font-bold tracking-tight sm:text-3xl md:text-5xl lg:text-6xl ${isDark ? "" : "text-slate-900"
                                }`}
                        >
                            Master Your Curriculum
                        </h1>

                        <p
                            className={`mt-3 sm:mt-4 max-w-2xl text-base sm:text-lg md:text-xl ${isDark ? "text-muted-foreground" : "text-slate-600"
                                }`}
                        >
                            Access comprehensive study resources, past papers, and revision materials
                            for CAIE, Edexcel, and IB curricula. Everything you need to excel in your exams.
                        </p>

                        {/* Curved marquee loop — light mode only, below heading */}
                        {!isDark && (
                            <div className="mt-6 sm:mt-8 mb-4 w-full max-w-6xl hidden sm:block">
                                <CurvedLoop
                                    marqueeText="Past Papers • Study Notes • Timetables • Syllabus • Past Papers • Study Notes • "
                                    speed={1.8}
                                    curveAmount={220}
                                    interactive={false}
                                    className="tracking-tight fill-slate-700 text-4xl sm:text-5xl md:text-6xl"
                                />
                            </div>
                        )}

                        <div className="mt-6 sm:mt-8 flex flex-wrap items-center justify-center gap-3 sm:gap-4">
                            <Link href="/curriculum">
                                <Button size="lg">
                                    Explore Curricula
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                            </Link>
                            <Link href="/subjects">
                                <Button
                                    variant="outline"
                                    size="lg"
                                    className={`backdrop-blur-sm ${isDark
                                        ? "bg-background/80"
                                        : "bg-white/70 border-slate-300 text-slate-800 hover:bg-white/90"
                                        }`}
                                >
                                    Search Subjects
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Bottom Blur Transition Effect */}
                <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-background via-background/20 to-transparent backdrop-blur-[4px] border-b border-muted/20 pointer-events-none" />
            </section>

            {/* Board Tiles Section - semi-transparent */}
            <section className="py-12 md:py-20 bg-background/60 backdrop-blur-sm">
                <div className="mx-auto max-w-7xl px-4 md:px-6">
                    <div className="text-center">
                        <h2 className="text-2xl font-bold md:text-3xl">
                            Choose Your Board
                        </h2>
                        <p className="mt-2 text-muted-foreground">
                            Select your education board to access relevant study materials
                        </p>
                    </div>

                    <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
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

                    {/* View all boards link */}
                    <div className="mt-8 text-center">
                        <Link href="/curriculum">
                            <Button variant="ghost" className="text-muted-foreground">
                                View all boards
                                <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        </Link>
                    </div>
                </div>
            </section>

            {/* Features Section — modern two-column layout */}
            <FeaturesSection />
        </CurriculumLayout>
    );
}
