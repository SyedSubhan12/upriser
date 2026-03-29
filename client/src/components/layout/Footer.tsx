import { useState } from "react";
import { Link } from "wouter";
import { TutorRegistrationModal } from "@/components/TutorRegistrationModal";
import { Github, Twitter, Linkedin, Facebook, GraduationCap, Users } from "lucide-react";

export function Footer() {
    const [isTutorModalOpen, setIsTutorModalOpen] = useState(false);

    const footerLinks = [
        { label: "Home", link: "/" },
        { label: "Subjects", link: "/curriculum" },
        { label: "Past Papers", link: "/curriculum?resource=past_paper" },
        { label: "Tutor Registration", onClick: () => setIsTutorModalOpen(true) },
    ];

    const staggeredItems = [
        { label: "Home", link: "/", ariaLabel: "Home" },
        { label: "Subjects", link: "/curriculum", ariaLabel: "Subjects" },
        { label: "Past Papers", link: "/curriculum?resource=past_paper", ariaLabel: "Past Papers" },
        { label: "Become a Tutor", link: "/become-a-tutor", ariaLabel: "Register as Tutor" },
    ];

    return (
        <footer className="w-full bg-slate-950 text-slate-200 pt-16 pb-8 border-t border-slate-800/50">
            <div className="container mx-auto px-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
                    {/* Brand Section */}
                    <div className="space-y-6">
                        <Link href="/" className="flex items-center gap-2 group">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                                <GraduationCap className="w-6 h-6 text-white" />
                            </div>
                            <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
                                ExamsValley
                            </span>
                        </Link>
                        <p className="text-slate-400 text-sm leading-relaxed max-w-xs">
                            Empowering students with premium educational resources, past papers, and expert tutoring to master their curriculum.
                        </p>
                        <div className="flex items-center gap-4">
                            <a href="#" className="w-8 h-8 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center hover:bg-slate-800 hover:border-indigo-500/50 transition-all">
                                <Twitter className="w-4 h-4" />
                            </a>
                            <a href="#" className="w-8 h-8 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center hover:bg-slate-800 hover:border-indigo-500/50 transition-all">
                                <Github className="w-4 h-4" />
                            </a>
                            <a href="#" className="w-8 h-8 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center hover:bg-slate-800 hover:border-indigo-500/50 transition-all">
                                <Linkedin className="w-4 h-4" />
                            </a>
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div className="space-y-6">
                        <h4 className="text-white font-semibold text-lg">Quick Links</h4>
                        <ul className="space-y-3">
                            <li><Link href="/" className="text-slate-400 hover:text-indigo-400 transition-colors text-sm">Home</Link></li>
                            <li><Link href="/curriculum" className="text-slate-400 hover:text-indigo-400 transition-colors text-sm">Curriculum</Link></li>
                            <li><Link href="/about" className="text-slate-400 hover:text-indigo-400 transition-colors text-sm">About Us</Link></li>
                            <li><Link href="/contact" className="text-slate-400 hover:text-indigo-400 transition-colors text-sm">Contact</Link></li>
                        </ul>
                    </div>

                    {/* Resources */}
                    <div className="space-y-6">
                        <h4 className="text-white font-semibold text-lg">Resources</h4>
                        <ul className="space-y-3">
                            <li><Link href="/curriculum?resource=past_paper" className="text-slate-400 hover:text-indigo-400 transition-colors text-sm">Past Papers</Link></li>
                            <li><Link href="/curriculum?resource=notes" className="text-slate-400 hover:text-indigo-400 transition-colors text-sm">Study Notes</Link></li>
                            <li><Link href="/practice" className="text-slate-400 hover:text-indigo-400 transition-colors text-sm">Practice Quizzes</Link></li>
                            <li><Link href="/mcq-solver" className="text-slate-400 hover:text-indigo-400 transition-colors text-sm">MCQ Solver</Link></li>
                        </ul>
                    </div>

                    {/* For Teachers */}
                    <div className="space-y-6">
                        <h4 className="text-white font-semibold text-lg">For Teachers</h4>
                        <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center">
                                    <Users className="w-4 h-4 text-indigo-400" />
                                </div>
                                <span className="text-sm font-medium text-slate-200">Join as a Tutor</span>
                            </div>
                            <p className="text-xs text-slate-400">
                                Share your expertise and help students succeed while growing your career.
                            </p>
                            <button
                                onClick={() => setIsTutorModalOpen(true)}
                                className="w-full py-2 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition-all hover:scale-[1.02] active:scale-[0.98]"
                            >
                                Register Now
                            </button>
                        </div>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="pt-8 border-t border-slate-800/50 flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-slate-500 text-xs text-center md:text-left">
                        © {new Date().getFullYear()} Upriser Education. All rights reserved.
                    </p>
                    <div className="flex items-center gap-6">
                        <a href="#" className="text-slate-500 hover:text-slate-300 text-xs">Privacy Policy</a>
                        <a href="#" className="text-slate-500 hover:text-slate-300 text-xs">Terms of Service</a>
                    </div>
                </div>
            </div>


            <TutorRegistrationModal
                isOpen={isTutorModalOpen}
                onClose={() => setIsTutorModalOpen(false)}
            />
        </footer>
    );
}
