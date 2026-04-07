import { FileText, CheckSquare, BookOpen, BarChart2, GraduationCap } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";

const features = [
    {
        icon: FileText,
        title: "Past Papers",
        desc: "Practice with real exam papers from previous years to sharpen your exam technique.",
    },
    {
        icon: CheckSquare,
        title: "Mark Schemes",
        desc: "Understand exactly what examiners are looking for with detailed marking criteria.",
    },
    {
        icon: BookOpen,
        title: "Study Notes",
        desc: "Concise, topic-wise notes crafted to help you revise efficiently and effectively.",
    },
    {
        icon: BarChart2,
        title: "Grade Thresholds",
        desc: "Track grade boundaries to set realistic targets and measure your progress.",
    },
];

export function FeaturesSection() {
    const { theme } = useTheme();
    const isDark = theme === "dark";

    return (
        <section className="py-16 md:py-24 bg-background">
            <div className="mx-auto max-w-7xl px-4 md:px-8">
                <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-16 items-center">

                    {/* ── Left column ── */}
                    <div>
                        {/* Badge */}
                        <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/8 px-3 py-1 text-xs font-medium text-primary">
                            <GraduationCap className="h-3.5 w-3.5" />
                            Your Complete Study Companion
                        </div>

                        {/* Heading */}
                        <h2
                            className={`text-3xl font-bold tracking-tight sm:text-4xl md:text-[2.75rem] leading-[1.15] ${isDark ? "text-foreground" : "text-slate-900"
                                }`}
                        >
                            Everything You Need{" "}
                            <span className="text-primary">to Ace</span>{" "}
                            Your Exams
                        </h2>

                        <p
                            className={`mt-4 text-base sm:text-lg leading-relaxed ${isDark ? "text-muted-foreground" : "text-slate-500"
                                }`}
                        >
                            Access curated resources for CAIE, Edexcel, and IB — all in one
                            place. From past papers to grade thresholds, we have you covered.
                        </p>

                        {/* 2×2 Feature cards grid */}
                        <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
                            {features.map(({ icon: Icon, title, desc }) => (
                                <div
                                    key={title}
                                    className={`group rounded-xl border p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${isDark
                                            ? "border-border bg-card hover:border-primary/30"
                                            : "border-slate-100 bg-white shadow-sm hover:border-primary/20 hover:shadow-blue-50/80"
                                        }`}
                                >
                                    {/* Icon container */}
                                    <div
                                        className={`mb-3 inline-flex h-9 w-9 items-center justify-center rounded-lg ${isDark ? "bg-primary/10" : "bg-blue-50"
                                            }`}
                                    >
                                        <Icon className="h-4.5 w-4.5 text-primary" strokeWidth={1.8} />
                                    </div>

                                    <h3
                                        className={`text-sm font-semibold ${isDark ? "text-foreground" : "text-slate-800"
                                            }`}
                                    >
                                        {title}
                                    </h3>
                                    <p
                                        className={`mt-1 text-xs leading-relaxed ${isDark ? "text-muted-foreground" : "text-slate-500"
                                            }`}
                                    >
                                        {desc}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* ── Right column — illustration ── */}
                    <div className="relative flex items-center justify-center">
                        {/* Background blob */}
                        <div
                            className="absolute inset-0 -z-10 rounded-3xl"
                            style={{
                                background: isDark
                                    ? "radial-gradient(ellipse at center, rgba(59,130,246,0.07) 0%, transparent 70%)"
                                    : "radial-gradient(ellipse at center, rgba(219,234,254,0.6) 0%, rgba(240,246,255,0.3) 60%, transparent 100%)",
                            }}
                        />

                        {/* Floating cards — analytics */}
                        <div
                            className={`absolute top-4 right-4 md:top-6 md:right-6 z-10 rounded-xl border px-3.5 py-2.5 shadow-lg backdrop-blur-sm text-xs font-medium ${isDark
                                    ? "border-border bg-card/90 text-foreground"
                                    : "border-slate-100 bg-white/90 text-slate-700"
                                }`}
                        >
                            <div className="flex items-center gap-1.5 mb-1.5">
                                <BarChart2 className="h-3.5 w-3.5 text-primary" />
                                <span className="font-semibold">Analytics</span>
                            </div>
                            <div className="flex items-end gap-0.5 h-8">
                                {[40, 65, 50, 80, 60, 90, 75].map((h, i) => (
                                    <div
                                        key={i}
                                        className="w-2 rounded-sm bg-primary/70"
                                        style={{ height: `${h}%` }}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Floating checklist card */}
                        <div
                            className={`absolute bottom-8 left-2 md:bottom-10 md:left-0 z-10 rounded-xl border px-3.5 py-2.5 shadow-lg backdrop-blur-sm text-xs ${isDark
                                    ? "border-border bg-card/90 text-foreground"
                                    : "border-slate-100 bg-white/90 text-slate-700"
                                }`}
                        >
                            <div className="flex items-center gap-1.5 mb-2">
                                <CheckSquare className="h-3.5 w-3.5 text-primary" />
                                <span className="font-semibold">Checklist</span>
                            </div>
                            {["Past Papers ✓", "Mark Schemes ✓", "Study Notes ✓"].map((item) => (
                                <div key={item} className="flex items-center gap-1.5 mb-1 last:mb-0">
                                    <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                                    <span className={isDark ? "text-muted-foreground" : "text-slate-500"}>
                                        {item}
                                    </span>
                                </div>
                            ))}
                        </div>

                        {/* Floating "Exam" tag */}
                        <div
                            className={`absolute top-1/2 -translate-y-1/2 right-2 md:right-0 z-10 rounded-xl border px-3 py-2 shadow-md text-xs font-semibold flex items-center gap-1.5 ${isDark
                                    ? "border-border bg-card/90 text-foreground"
                                    : "border-slate-100 bg-white/90 text-slate-800"
                                }`}
                        >
                            <FileText className="h-3.5 w-3.5 text-primary" />
                            Exam Ready
                        </div>

                        {/* Central illustration using SVG */}
                        <div className="w-full max-w-sm md:max-w-md px-4">
                            <svg
                                viewBox="0 0 400 340"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                                className="w-full drop-shadow-sm"
                                aria-label="Student studying illustration"
                            >
                                {/* ── Desk ── */}
                                <rect x="60" y="240" width="280" height="10" rx="3" fill={isDark ? "#334155" : "#CBD5E1"} />
                                {/* Desk legs */}
                                <rect x="80" y="250" width="8" height="60" rx="2" fill={isDark ? "#334155" : "#CBD5E1"} />
                                <rect x="312" y="250" width="8" height="60" rx="2" fill={isDark ? "#334155" : "#CBD5E1"} />

                                {/* ── Chair ── */}
                                <rect x="155" y="255" width="90" height="8" rx="3" fill={isDark ? "#475569" : "#94A3B8"} />
                                <rect x="170" y="263" width="8" height="55" rx="2" fill={isDark ? "#475569" : "#94A3B8"} />
                                <rect x="222" y="263" width="8" height="55" rx="2" fill={isDark ? "#475569" : "#94A3B8"} />
                                <rect x="155" y="295" width="90" height="6" rx="2" fill={isDark ? "#475569" : "#94A3B8"} />

                                {/* ── Books stack ── */}
                                <rect x="72" y="210" width="55" height="10" rx="2" fill="#F97316" />
                                <rect x="72" y="200" width="50" height="11" rx="2" fill="#3B82F6" />
                                <rect x="72" y="191" width="52" height="10" rx="2" fill="#6366F1" />
                                {/* bookmark */}
                                <rect x="118" y="191" width="4" height="20" rx="1" fill="#EF4444" />

                                {/* ── Laptop ── */}
                                {/* base */}
                                <rect x="148" y="220" width="140" height="22" rx="4" fill={isDark ? "#475569" : "#94A3B8"} />
                                {/* screen body */}
                                <rect x="158" y="128" width="120" height="93" rx="6" fill={isDark ? "#1E293B" : "#E2E8F0"} />
                                {/* screen */}
                                <rect x="164" y="134" width="108" height="80" rx="3" fill={isDark ? "#0F172A" : "#DBEAFE"} />
                                {/* screen content lines */}
                                <rect x="172" y="148" width="55" height="4" rx="2" fill={isDark ? "#3B82F6" : "#3B82F6"} opacity="0.7" />
                                <rect x="172" y="157" width="40" height="3" rx="1.5" fill={isDark ? "#64748B" : "#93C5FD"} opacity="0.7" />
                                <rect x="172" y="165" width="48" height="3" rx="1.5" fill={isDark ? "#64748B" : "#93C5FD"} opacity="0.7" />
                                {/* mini bar chart on screen */}
                                {[0, 8, 16, 24, 32].map((x, i) => (
                                    <rect key={i} x={230 + x} y={185 - [12, 20, 16, 26, 18][i]} width="6" height={[12, 20, 16, 26, 18][i]} rx="1" fill="#3B82F6" opacity={0.5 + i * 0.1} />
                                ))}
                                {/* hinge */}
                                <rect x="148" y="218" width="140" height="4" rx="2" fill={isDark ? "#334155" : "#94A3B8"} />
                                {/* trackpad */}
                                <rect x="195" y="228" width="46" height="8" rx="2" fill={isDark ? "#334155" : "#94A3B8"} opacity="0.7" />

                                {/* ── Person body ── */}
                                {/* torso */}
                                <ellipse cx="200" cy="195" rx="32" ry="38" fill={isDark ? "#60A5FA" : "#60A5FA"} />
                                {/* arms */}
                                <path d="M168 205 Q152 215 148 228" stroke={isDark ? "#60A5FA" : "#60A5FA"} strokeWidth="18" strokeLinecap="round" />
                                <path d="M232 205 Q248 215 252 228" stroke={isDark ? "#60A5FA" : "#60A5FA"} strokeWidth="18" strokeLinecap="round" />
                                {/* collar */}
                                <ellipse cx="200" cy="168" rx="10" ry="7" fill={isDark ? "#7DD3FC" : "#93C5FD"} />
                                {/* neck */}
                                <rect x="196" y="142" width="8" height="18" rx="4" fill="#FDBA74" />
                                {/* head */}
                                <ellipse cx="200" cy="128" rx="22" ry="24" fill="#FDBA74" />
                                {/* hair */}
                                <path d="M178 120 Q178 103 200 103 Q222 103 222 120" fill={isDark ? "#1E293B" : "#1E293B"} />
                                <ellipse cx="200" cy="103" rx="22" ry="10" fill={isDark ? "#1E293B" : "#1E293B"} />
                                {/* eyes */}
                                <ellipse cx="193" cy="127" rx="2.5" ry="2.5" fill="#1E293B" />
                                <ellipse cx="207" cy="127" rx="2.5" ry="2.5" fill="#1E293B" />
                                {/* smile */}
                                <path d="M194 135 Q200 140 206 135" stroke="#1E293B" strokeWidth="1.5" strokeLinecap="round" fill="none" />
                                {/* ears */}
                                <ellipse cx="178" cy="129" rx="4" ry="5" fill="#FDBA74" />
                                <ellipse cx="222" cy="129" rx="4" ry="5" fill="#FDBA74" />

                                {/* ── Legs visible under desk ── */}
                                <path d="M180 255 Q178 280 172 305" stroke={isDark ? "#1E293B" : "#374151"} strokeWidth="22" strokeLinecap="round" />
                                <path d="M220 255 Q222 280 228 305" stroke={isDark ? "#1E293B" : "#374151"} strokeWidth="22" strokeLinecap="round" />
                                {/* shoes */}
                                <ellipse cx="168" cy="308" rx="14" ry="6" fill={isDark ? "#0F172A" : "#1E293B"} />
                                <ellipse cx="232" cy="308" rx="14" ry="6" fill={isDark ? "#0F172A" : "#1E293B"} />
                            </svg>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
