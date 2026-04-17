import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
    GraduationCap,
    Mail,
    BookOpen,
    Clock,
    Award,
    Phone,
    Linkedin,
    Star,
    FileText,
    MapPin,
    Briefcase,
    ChevronRight,
    ExternalLink,
    Share2,
    Check,
    Copy,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";

interface TeacherProfile {
    id: string;
    name: string;
    username: string;
    email: string;
    avatar: string | null;
    bio: string | null;
    qualifications: string[] | null;
    experienceYears: number | null;
    subjectIds: string[] | null;
    phoneNumber: string | null;
    degree: string | null;
    subjects: string[] | null;
    linkedinUrl: string | null;
    availableHours: string | null;
    materialCount: number;
    rating: number | null;
}

async function fetchTeacherProfile(username: string): Promise<TeacherProfile> {
    const encodedUsername = encodeURIComponent(username);
    const res = await fetch(`/api/profile/${encodedUsername}`, { credentials: "include" });
    if (!res.ok) {
        const error = await res.json().catch(() => ({ error: "Profile not found" }));
        throw new Error(error.error || "Failed to fetch profile");
    }
    return res.json();
}

function StarRating({ rating }: { rating: number | null }) {
    if (rating === null) return null;
    const stars = Math.round(rating);
    return (
        <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((i) => (
                <Star
                    key={i}
                    className={`h-4 w-4 ${i <= stars ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"}`}
                />
            ))}
            <span className="ml-1 text-sm font-semibold text-amber-500">{rating.toFixed(1)}</span>
        </div>
    );
}

function PortfolioSkeleton() {
    return (
        <div className="min-h-screen bg-background">
            {/* Hero skeleton */}
            <div className="relative h-64 bg-gradient-to-br from-violet-950 to-indigo-900" />
            <div className="max-w-4xl mx-auto px-4 -mt-20 pb-16 space-y-6">
                <div className="flex flex-col items-center gap-4">
                    <Skeleton className="h-32 w-32 rounded-full" />
                    <Skeleton className="h-8 w-48" />
                    <Skeleton className="h-5 w-32" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                    {[1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-40 rounded-2xl" />
                    ))}
                </div>
            </div>
        </div>
    );
}

export function TeacherPortfolioPage() {
    const params = useParams<{ username: string }>();
    const username = params.username ? decodeURIComponent(params.username) : "";
    const { toast } = useToast();
    const [isCopying, setIsCopying] = useState(false);

    const { data: teacher, isLoading, error } = useQuery({
        queryKey: ["teacher-portfolio", username],
        queryFn: () => fetchTeacherProfile(username),
        enabled: !!username,
        retry: false,
    });

    const handleShare = async () => {
        const url = window.location.href;
        if (navigator.share) {
            try {
                await navigator.share({
                    title: `${teacher?.name} - Teacher Portfolio`,
                    text: `Check out ${teacher?.name}'s teaching portfolio on ExamsValley!`,
                    url: url,
                });
            } catch (err: any) {
                if (err.name !== 'AbortError') {
                    console.error("Error sharing:", err);
                }
            }
        } else {
            // Fallback to clipboard
            try {
                if (!navigator.clipboard) {
                    throw new Error("Clipboard API not available");
                }
                setIsCopying(true);
                await navigator.clipboard.writeText(url);
                toast({
                    title: "Link copied!",
                    description: "Portfolio link has been copied to your clipboard.",
                });
                setTimeout(() => setIsCopying(false), 2000);
            } catch (err: any) {
                setIsCopying(false);
                console.error("Error copying:", err);
                toast({
                    title: "Copy failed",
                    description: "Please copy the URL from your browser's address bar.",
                    variant: "destructive",
                });
            }
        }
    };

    if (isLoading) return <PortfolioSkeleton />;

    if (error || !teacher) {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
                {/* Error hero */}
                <div className="relative w-full max-w-sm text-center space-y-6">
                    <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10 ring-2 ring-destructive/20">
                        <GraduationCap className="h-9 w-9 text-destructive" />
                    </div>
                    <div className="space-y-2">
                        <h1 className="text-2xl font-bold tracking-tight">Profile Not Found</h1>
                        <p className="text-muted-foreground text-sm leading-relaxed">
                            {error instanceof Error
                                ? error.message
                                : "This teacher profile doesn't exist or hasn't been approved yet."}
                        </p>
                    </div>
                    <Button asChild className="mt-2">
                        <a href="/">Return Home</a>
                    </Button>
                </div>
            </div>
        );
    }

    const initials = (teacher.name || "T")
        .split(" ")
        .filter(Boolean)
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);

    const displaySubjects = teacher.subjects || teacher.subjectIds || [];

    return (
        <div className="min-h-screen bg-background text-foreground">
            {/* ── Hero Banner ── */}
            <div className="relative h-56 md:h-72 overflow-hidden">
                {/* Gradient canvas */}
                <div className="absolute inset-0 bg-gradient-to-br from-violet-950 via-indigo-900 to-cyan-900" />
                {/* Decorative circles */}
                <div className="absolute -top-16 -right-16 h-72 w-72 rounded-full bg-violet-500/20 blur-3xl" />
                <div className="absolute -bottom-10 -left-10 h-56 w-56 rounded-full bg-cyan-500/20 blur-3xl" />
                {/* Pattern overlay */}
                <div
                    className="absolute inset-0 opacity-10"
                    style={{
                        backgroundImage:
                            "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.3) 1px, transparent 0)",
                        backgroundSize: "28px 28px",
                    }}
                />

                {/* Back to home & Share */}
                <div className="absolute top-4 left-4 right-4 z-10 flex items-center justify-between">
                    <a
                        href="/"
                        className="flex items-center gap-1.5 rounded-full bg-white/10 backdrop-blur-sm px-3 py-1.5 text-xs text-white/80 hover:bg-white/20 transition-colors"
                    >
                        <ChevronRight className="h-3 w-3 rotate-180" />
                        Home
                    </a>

                    <button
                        onClick={handleShare}
                        className="flex items-center gap-1.5 rounded-full bg-white/10 backdrop-blur-sm px-3 py-1.5 text-xs text-white/80 hover:bg-white/20 transition-colors"
                    >
                        {isCopying ? (
                            <Check className="h-3 w-3 text-green-400" />
                        ) : (
                            <Share2 className="h-3 w-3" />
                        )}
                        {isCopying ? "Copied" : "Share"}
                    </button>
                </div>
            </div>

            {/* ── Profile identity block (floats over hero) ── */}
            <div className="max-w-4xl mx-auto px-4 sm:px-6">
                <div className="-mt-20 flex flex-col items-center text-center mb-8">
                    {/* Avatar */}
                    <div className="ring-4 ring-background rounded-full shadow-2xl mb-4">
                        <Avatar className="h-36 w-36">
                            <AvatarImage src={teacher.avatar || undefined} alt={teacher.name} />
                            <AvatarFallback className="text-3xl bg-gradient-to-br from-violet-500 to-indigo-600 text-white font-bold">
                                {initials}
                            </AvatarFallback>
                        </Avatar>
                    </div>

                    <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight leading-tight">
                        {teacher.name}
                    </h1>
                    <div className="flex items-center gap-2 mt-2 flex-wrap justify-center">
                        <span className="text-muted-foreground text-sm">@{teacher.username}</span>
                        <span className="text-muted-foreground/40">·</span>
                        <Badge className="bg-violet-500/15 text-violet-600 dark:text-violet-400 border-violet-500/20 text-[11px] px-2">
                            Verified Teacher
                        </Badge>
                    </div>

                    {/* Rating */}
                    <div className="mt-2">
                        <StarRating rating={teacher.rating} />
                    </div>

                    {/* Degree / Role tagline */}
                    {teacher.degree && (
                        <p className="mt-2 text-sm text-muted-foreground flex items-center gap-1.5">
                            <GraduationCap className="h-4 w-4 text-violet-500" />
                            {teacher.degree}
                        </p>
                    )}
                </div>

                {/* ── Stats bar ── */}
                <div className="grid grid-cols-3 gap-3 mb-8">
                    {[
                        {
                            icon: Briefcase,
                            label: "Experience",
                            value: teacher.experienceYears ? `${teacher.experienceYears}+ yrs` : "—",
                        },
                        {
                            icon: BookOpen,
                            label: "Subjects",
                            value: displaySubjects.length > 0 ? `${displaySubjects.length}` : "—",
                        },
                        {
                            icon: FileText,
                            label: "Materials",
                            value: teacher.materialCount > 0 ? `${teacher.materialCount}` : "0",
                        },
                    ].map(({ icon: Icon, label, value }) => (
                        <div
                            key={label}
                            className="flex flex-col items-center justify-center rounded-2xl border border-border/60 bg-card/60 backdrop-blur-sm py-5 shadow-sm hover:shadow-md transition-shadow"
                        >
                            <Icon className="h-5 w-5 text-violet-500 mb-1.5" />
                            <span className="text-xl font-bold leading-none">{value}</span>
                            <span className="text-[11px] text-muted-foreground mt-1 uppercase tracking-widest">{label}</span>
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pb-20">
                    {/* ── Left column (2/3) ── */}
                    <div className="md:col-span-2 space-y-6">
                        {/* About */}
                        {teacher.bio && (
                            <section className="rounded-2xl border border-border/60 bg-card/60 backdrop-blur-sm p-6 shadow-sm">
                                <h2 className="font-semibold text-base mb-3 flex items-center gap-2">
                                    <span className="h-5 w-1 rounded-full bg-violet-500 inline-block" />
                                    About
                                </h2>
                                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                                    {teacher.bio}
                                </p>
                            </section>
                        )}

                        {/* Education / Qualifications */}
                        {teacher.qualifications && teacher.qualifications.length > 0 && (
                            <section className="rounded-2xl border border-border/60 bg-card/60 backdrop-blur-sm p-6 shadow-sm">
                                <h2 className="font-semibold text-base mb-4 flex items-center gap-2">
                                    <span className="h-5 w-1 rounded-full bg-indigo-500 inline-block" />
                                    Education & Qualifications
                                </h2>
                                <ul className="space-y-2">
                                    {teacher.qualifications.map((qual, i) => (
                                        <li key={i} className="flex items-start gap-3">
                                            <div className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-indigo-500/10">
                                                <Award className="h-3.5 w-3.5 text-indigo-500" />
                                            </div>
                                            <span className="text-sm leading-relaxed">{qual}</span>
                                        </li>
                                    ))}
                                </ul>
                            </section>
                        )}

                        {/* Subjects taught */}
                        {displaySubjects.length > 0 && (
                            <section className="rounded-2xl border border-border/60 bg-card/60 backdrop-blur-sm p-6 shadow-sm">
                                <h2 className="font-semibold text-base mb-4 flex items-center gap-2">
                                    <span className="h-5 w-1 rounded-full bg-cyan-500 inline-block" />
                                    Subjects Taught
                                </h2>
                                <div className="flex flex-wrap gap-2">
                                    {displaySubjects.map((subj, i) => (
                                        <Badge
                                            key={i}
                                            variant="outline"
                                            className="rounded-full px-3 py-0.5 text-xs bg-cyan-500/5 border-cyan-500/30 text-cyan-700 dark:text-cyan-400"
                                        >
                                            {subj}
                                        </Badge>
                                    ))}
                                </div>
                            </section>
                        )}
                    </div>

                    {/* ── Right column (1/3) ── */}
                    <div className="space-y-5">
                        {/* Contact card */}
                        <section className="rounded-2xl border border-border/60 bg-card/60 backdrop-blur-sm p-5 shadow-sm space-y-4">
                            <h2 className="font-semibold text-sm uppercase tracking-widest text-muted-foreground">
                                Contact
                            </h2>

                            <a
                                href={`mailto:${teacher.email}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-3 group"
                            >
                                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-violet-500/10 group-hover:bg-violet-500/20 transition-colors">
                                    <Mail className="h-4 w-4 text-violet-500" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Email</p>
                                    <p className="text-sm font-medium truncate group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
                                        {teacher.email}
                                    </p>
                                </div>
                            </a>

                            {teacher.phoneNumber && (
                                <a
                                    href={`tel:${teacher.phoneNumber}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-3 group"
                                >
                                    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-green-500/10 group-hover:bg-green-500/20 transition-colors">
                                        <Phone className="h-4 w-4 text-green-500" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Phone</p>
                                        <p className="text-sm font-medium truncate">{teacher.phoneNumber}</p>
                                    </div>
                                </a>
                            )}

                            {teacher.linkedinUrl && (
                                <a
                                    href={teacher.linkedinUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-3 group"
                                >
                                    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-blue-500/10 group-hover:bg-blue-500/20 transition-colors">
                                        <Linkedin className="h-4 w-4 text-blue-500" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">LinkedIn</p>
                                        <p className="text-sm font-medium truncate group-hover:text-blue-500 transition-colors flex items-center gap-1">
                                            View Profile <ExternalLink className="h-3 w-3" />
                                        </p>
                                    </div>
                                </a>
                            )}
                        </section>

                        {/* Available Hours */}
                        <section className="rounded-2xl border border-border/60 bg-card/60 backdrop-blur-sm p-5 shadow-sm">
                            <h2 className="font-semibold text-sm uppercase tracking-widest text-muted-foreground mb-4">
                                Availability
                            </h2>
                            {teacher.availableHours ? (
                                <div className="flex items-start gap-3">
                                    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-amber-500/10">
                                        <Clock className="h-4 w-4 text-amber-500" />
                                    </div>
                                    <p className="text-sm leading-relaxed">{teacher.availableHours}</p>
                                </div>
                            ) : (
                                <div className="flex items-center gap-3">
                                    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-amber-500/10">
                                        <Clock className="h-4 w-4 text-amber-500" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium">Flexible Hours</p>
                                        <p className="text-xs text-muted-foreground">Contact for scheduling</p>
                                    </div>
                                </div>
                            )}
                        </section>

                        {/* Experience */}
                        {teacher.experienceYears && (
                            <section className="rounded-2xl border border-border/60 bg-card/60 backdrop-blur-sm p-5 shadow-sm">
                                <h2 className="font-semibold text-sm uppercase tracking-widest text-muted-foreground mb-3">
                                    Experience
                                </h2>
                                <div className="flex items-center gap-3">
                                    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-rose-500/10">
                                        <Briefcase className="h-4 w-4 text-rose-500" />
                                    </div>
                                    <p className="text-2xl font-bold">
                                        {teacher.experienceYears}
                                        <span className="text-sm font-normal text-muted-foreground ml-1">+ years</span>
                                    </p>
                                </div>
                            </section>
                        )}

                        {/* CTA */}
                        <Button
                            className="w-full h-11 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 shadow-lg shadow-violet-500/20 text-white font-semibold"
                            asChild
                        >
                            <a href={`mailto:${teacher.email}`}>
                                <Mail className="mr-2 h-4 w-4" />
                                Contact Teacher
                            </a>
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
