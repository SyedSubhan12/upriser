import { Link } from "wouter";
import {
    CheckCircle2,
    GraduationCap,
    Users,
    Target,
    Clock,
    ArrowRight,
    Sparkles,
    BookOpen,
    DollarSign,
    Globe
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PublicLayout } from "@/layouts/PublicLayout";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";

export function BecomeTutorPage() {
    const { user, isAuthenticated } = useAuth();
    const { theme } = useTheme();
    const isDark = theme === "dark";

    const benefits = [
        {
            icon: Users,
            title: "Reach Thousands",
            description: "Connect with eager students globally and make a real impact on their academic journey."
        },
        {
            icon: DollarSign,
            title: "Competitive Earnings",
            description: "Set your own rates or enjoy performance-based incentives for creating quality materials."
        },
        {
            icon: Clock,
            title: "Flexible Schedule",
            description: "Teach whenever and wherever you want. You are in full control of your commitment."
        },
        {
            icon: Globe,
            title: "Digital Presence",
            description: "Build a verified professional profile that showcases your expertise to students and parents."
        }
    ];

    return (
        <PublicLayout>
            <div className="relative overflow-hidden pt-20 pb-16">
                {/* Background elements */}
                <div className={`absolute inset-0 -z-10 ${isDark ? "opacity-20" : "opacity-10"}`}>
                    <div className="absolute top-0 left-1/4 h-[500px] w-[500px] rounded-full bg-primary/30 blur-[120px]" />
                    <div className="absolute bottom-0 right-1/4 h-[500px] w-[500px] rounded-full bg-purple-500/20 blur-[120px]" />
                </div>

                <div className="mx-auto max-w-7xl px-4 md:px-6">
                    <div className="grid lg:grid-cols-2 gap-12 items-center">
                        {/* Hero text */}
                        <motion.div
                            initial={{ opacity: 0, x: -30 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.6 }}
                            className="space-y-6"
                        >
                            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
                                <Sparkles className="h-4 w-4" />
                                <span>Join our Educator Community</span>
                            </div>

                            <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl text-foreground">
                                Teach the world's <span className="text-primary">Best Students</span>
                            </h1>

                            <p className="text-lg text-muted-foreground max-w-lg">
                                ExamsValley is looking for experienced CAIE, Edexcel, and IB tutors to share their knowledge.
                                Whether you create notes, record videos, or build quizzes, we help you shine.
                            </p>

                            <div className="flex flex-wrap items-center gap-4 pt-4">
                                {isAuthenticated ? (
                                    user?.role === "teacher" ? (
                                        <Link href="/teacher/registration">
                                            <Button size="lg" className="h-12 px-8 text-lg font-semibold shadow-lg shadow-primary/20 hover-elevate transition-all duration-300">
                                                Enter Tutor Portal
                                                <ArrowRight className="ml-2 h-5 w-5" />
                                            </Button>
                                        </Link>
                                    ) : (
                                        <div className="p-4 rounded-xl bg-muted/50 border border-muted flex items-start gap-4 max-w-md">
                                            <div className="p-2 rounded-full bg-amber-500/10 text-amber-500">
                                                <Target className="h-5 w-5" />
                                            </div>
                                            <div className="text-sm">
                                                <p className="font-semibold">Current role: {user?.role}</p>
                                                <p className="text-muted-foreground">To become a tutor, please register with a teacher account or contact support.</p>
                                            </div>
                                        </div>
                                    )
                                ) : (
                                    <Link href="/register">
                                        <Button size="lg" className="h-12 px-8 text-lg font-semibold shadow-lg shadow-primary/20 hover-elevate transition-all duration-300">
                                            Register as a Tutor
                                            <ArrowRight className="ml-2 h-5 w-5" />
                                        </Button>
                                    </Link>
                                )}

                                <Link href="/curriculum">
                                    <Button variant="outline" size="lg" className="h-12 px-8 text-lg hover-elevate border-primary/20 text-foreground transition-all duration-300">
                                        Explore Platform
                                    </Button>
                                </Link>
                            </div>

                            <div className="flex flex-wrap items-center gap-6 pt-6">
                                <div className="flex -space-x-3">
                                    {[1, 2, 3, 4].map((i) => (
                                        <div key={i} className="h-10 w-10 rounded-full border-2 border-background bg-muted overflow-hidden">
                                            <img src={`https://api.dicebear.com/7.x/app transduction/svg?seed=${i * 123}`} alt="tutor" />
                                        </div>
                                    ))}
                                    <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-background bg-primary text-xs font-bold text-primary-foreground">
                                        +500
                                    </div>
                                </div>
                                <p className="text-xs text-muted-foreground">Join 500+ educators sharing materials across 30+ subjects.</p>
                            </div>
                        </motion.div>

                        {/* Hero features Grid */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.7, delay: 0.2 }}
                            className="grid sm:grid-cols-2 gap-4 lg:gap-6"
                        >
                            {benefits.map((benefit, index) => (
                                <Card key={index} className="border-none shadow-xl shadow-black/5 bg-card/40 backdrop-blur-md hover-scale transition-all duration-300 group overflow-hidden">
                                    <CardContent className="p-6 relative">
                                        <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                                            <benefit.icon className="h-20 w-20" />
                                        </div>
                                        <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-500">
                                            <benefit.icon className="h-6 w-6" />
                                        </div>
                                        <h3 className="mb-2 text-lg font-bold group-hover:text-primary transition-colors">{benefit.title}</h3>
                                        <p className="text-sm text-muted-foreground leading-relaxed">{benefit.description}</p>
                                    </CardContent>
                                </Card>
                            ))}
                        </motion.div>
                    </div>

                    {/* Steps Section */}
                    <section className="mt-24 py-16 border-y border-muted/50 relative">
                        <div className="text-center mb-16">
                            <h2 className="text-3xl font-bold mb-4">How it works</h2>
                            <p className="text-muted-foreground max-w-xl mx-auto">Get verified and start sharing your materials in three easy steps.</p>
                        </div>

                        <div className="grid md:grid-cols-3 gap-8 relative">
                            {/* Connector line */}
                            <div className="hidden md:block absolute top-[60px] left-[15%] right-[15%] h-[2px] bg-gradient-to-r from-primary/20 via-primary/50 to-primary/20 -z-10" />

                            {[
                                {
                                    label: "Apply",
                                    title: "Submit Profile",
                                    desc: "Register and fill the professional registration form",
                                    icon: GraduationCap
                                },
                                {
                                    label: "Review",
                                    title: "Get Verified",
                                    desc: "Our team reviews your credentials and credentials",
                                    icon: CheckCircle2
                                },
                                {
                                    label: "Share",
                                    title: "Upload & Earn",
                                    desc: "Upload quality materials and interact with students",
                                    icon: BookOpen
                                }
                            ].map((step, i) => (
                                <div key={i} className="flex flex-col items-center text-center group">
                                    <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-background border-2 border-primary shadow-xl shadow-primary/10 group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-500 relative">
                                        <step.icon className="h-6 w-6" />
                                        <div className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold text-muted-foreground border border-muted">
                                            {i + 1}
                                        </div>
                                    </div>
                                    <span className="text-xs font-bold text-primary uppercase tracking-widest mb-1">{step.label}</span>
                                    <h3 className="text-xl font-bold mb-2">{step.title}</h3>
                                    <p className="text-sm text-muted-foreground max-w-[200px]">{step.desc}</p>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* CTA Section */}
                    <div className="mt-24 rounded-3xl bg-primary p-8 md:p-16 text-center text-primary-foreground relative overflow-hidden shadow-2xl shadow-primary/30">
                        {/* Background sparkle effect */}
                        <div className="absolute inset-0 opacity-10 pointer-events-none">
                            <svg className="h-full w-full" preserveAspectRatio="none">
                                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                                    <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="1" />
                                </pattern>
                                <rect width="100%" height="100%" fill="url(#grid)" />
                            </svg>
                        </div>

                        <div className="relative z-10 space-y-6">
                            <h2 className="text-3xl md:text-5xl font-extrabold max-w-3xl mx-auto leading-tight">Expertly Crafted. Student Approved. Become a Creator.</h2>
                            <p className="text-primary-foreground/80 text-lg max-w-xl mx-auto">
                                Ready to turn your knowledge into impact? We're waiting for you.
                            </p>
                            <div className="pt-4">
                                {isAuthenticated ? (
                                    <Link href="/teacher/dashboard">
                                        <Button size="lg" variant="secondary" className="h-12 px-10 text-lg font-bold hover-elevate transition-all duration-300">
                                            Go to Dashboard
                                        </Button>
                                    </Link>
                                ) : (
                                    <Link href="/register">
                                        <Button size="lg" variant="secondary" className="h-12 px-10 text-lg font-bold hover-elevate transition-all duration-300">
                                            Apply Now
                                        </Button>
                                    </Link>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </PublicLayout>
    );
}
