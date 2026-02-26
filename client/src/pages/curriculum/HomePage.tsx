import { Link } from "wouter";
import { ArrowRight, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CurriculumLayout } from "@/layouts/CurriculumLayout";
import { BoardTile } from "@/components/curriculum/BoardTile";
import { useQuery } from "@tanstack/react-query";
import type { Board } from "@/lib/curriculumData";
import { Skeleton } from "@/components/ui/skeleton";
import ShaderBackground from "@/components/ui/shader-background";

export function HomePage() {
    const { data: boards = [], isLoading } = useQuery<Board[]>({
        queryKey: ["/api/curriculum/boards"],
    });

    // Get only the main 3 boards for the home page
    const mainBoards = boards.filter(b =>
        ['caie', 'pearson', 'ib'].includes(b.boardKey)
    );

    return (
        <CurriculumLayout>
            {/* Animated Shader Background */}
            <ShaderBackground />

            {/* Hero Section - transparent to show shader */}
            <section className="relative overflow-hidden py-12 md:py-20">
                <div className="mx-auto max-w-7xl px-4 md:px-6">
                    <div className="flex flex-col items-center text-center">
                        <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-background/80 backdrop-blur-sm px-4 py-2 text-sm text-primary border border-primary/20">
                            <GraduationCap className="h-4 w-4" />
                            <span>Your Complete Study Companion</span>
                        </div>

                        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl lg:text-6xl">
                            Master Your Curriculum
                        </h1>

                        <p className="mt-4 max-w-2xl text-lg text-muted-foreground md:text-xl">
                            Access comprehensive study resources, past papers, and revision materials
                            for CAIE, Edexcel, and IB curricula. Everything you need to excel in your exams.
                        </p>

                        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
                            <Link href="/curriculum">
                                <Button size="lg">
                                    Explore Curricula
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                            </Link>
                            <Link href="/subjects">
                                <Button variant="outline" size="lg" className="bg-background/80 backdrop-blur-sm">
                                    Search Subjects
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
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

            {/* Features Section - semi-transparent */}
            <section className="bg-background/70 backdrop-blur-sm py-12 md:py-20">
                <div className="mx-auto max-w-7xl px-4 md:px-6">
                    <div className="text-center">
                        <h2 className="text-2xl font-bold md:text-3xl">
                            Everything You Need
                        </h2>
                        <p className="mt-2 text-muted-foreground">
                            Comprehensive resources for every subject
                        </p>
                    </div>

                    <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
                        {[
                            { icon: "📄", title: "Past Papers", desc: "Practice with real exam papers" },
                            { icon: "📝", title: "Mark Schemes", desc: "Understand marking criteria" },
                            { icon: "📚", title: "Study Notes", desc: "Detailed topic-wise notes" },
                            { icon: "📊", title: "Grade Thresholds", desc: "Track grade boundaries" },
                        ].map((feature, i) => (
                            <div key={i} className="text-center">
                                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-background text-3xl shadow-sm">
                                    {feature.icon}
                                </div>
                                <h3 className="font-semibold">{feature.title}</h3>
                                <p className="mt-1 text-sm text-muted-foreground">{feature.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        </CurriculumLayout>
    );
}
