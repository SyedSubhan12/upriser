import { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { BookOpen, Sparkles, Play } from "lucide-react";
import { useMediaQuery } from "@/hooks/use-media-query";

interface SplashVideoScreenProps {
    onFinish: () => void;
}

// Responsive video paths
const SPLASH_VIDEO_DESKTOP = "/splash-desktop.mp4";
const SPLASH_VIDEO_MOBILE = "/splash-mobile.mp4";

// Fallback duration if video metadata fails to load
const FALLBACK_DURATION_MS = 2800;

// Reduced motion static delay
const REDUCED_MOTION_DELAY_MS = 600;

// Safety margin for fallback timer
const SAFETY_MARGIN_MS = 200;

export function SplashVideoScreen({ onFinish }: SplashVideoScreenProps) {
    const [isLoading, setIsLoading] = useState(true);
    const [showTapToStart, setShowTapToStart] = useState(false);
    const [isFadingOut, setIsFadingOut] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);
    const fallbackTimerRef = useRef<NodeJS.Timeout | null>(null);
    const hasCalledFinish = useRef(false);

    // Check for reduced motion preference
    const prefersReducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");

    // Detect screen size for responsive video
    const isDesktop = useMediaQuery("(min-width: 768px)");

    // Select appropriate video source
    const videoSrc = isDesktop ? SPLASH_VIDEO_DESKTOP : SPLASH_VIDEO_MOBILE;

    // Safe finish handler to prevent double-calling
    const handleFinish = useCallback(() => {
        if (hasCalledFinish.current) return;
        hasCalledFinish.current = true;

        // Clear any pending timers
        if (fallbackTimerRef.current) {
            clearTimeout(fallbackTimerRef.current);
            fallbackTimerRef.current = null;
        }

        // Start fade out
        setIsFadingOut(true);

        // Call onFinish after fade out completes
        setTimeout(() => {
            onFinish();
        }, 200); // 200ms fade-out duration
    }, [onFinish]);

    // Handle reduced motion: show static logo for 600ms then proceed
    useEffect(() => {
        if (prefersReducedMotion) {
            const timer = setTimeout(() => {
                handleFinish();
            }, REDUCED_MOTION_DELAY_MS);

            return () => clearTimeout(timer);
        }
    }, [prefersReducedMotion, handleFinish]);

    // Set up video event listeners and autoplay
    useEffect(() => {
        if (prefersReducedMotion) return; // Skip video setup for reduced motion

        const video = videoRef.current;
        if (!video) return;

        // Handle video ended event
        const handleEnded = () => {
            handleFinish();
        };

        // Handle video loaded metadata - set up fallback timer
        const handleLoadedMetadata = () => {
            setIsLoading(false);
            const duration = video.duration * 1000; // Convert to ms

            // Set fallback timer slightly after video should end
            fallbackTimerRef.current = setTimeout(() => {
                handleFinish();
            }, duration + SAFETY_MARGIN_MS);
        };

        // Handle video can play - attempt autoplay
        const handleCanPlay = () => {
            setIsLoading(false);
            attemptAutoplay();
        };

        // Handle video error
        const handleError = () => {
            console.warn("Video failed to load, using fallback timer");
            setIsLoading(false);
            fallbackTimerRef.current = setTimeout(() => {
                handleFinish();
            }, FALLBACK_DURATION_MS);
        };

        // Attempt autoplay
        const attemptAutoplay = async () => {
            try {
                await video.play();
            } catch (error) {
                console.warn("Autoplay blocked, showing tap to start:", error);
                setShowTapToStart(true);
            }
        };

        // Add event listeners
        video.addEventListener("ended", handleEnded);
        video.addEventListener("loadedmetadata", handleLoadedMetadata);
        video.addEventListener("canplay", handleCanPlay);
        video.addEventListener("error", handleError);

        // Cleanup
        return () => {
            video.removeEventListener("ended", handleEnded);
            video.removeEventListener("loadedmetadata", handleLoadedMetadata);
            video.removeEventListener("canplay", handleCanPlay);
            video.removeEventListener("error", handleError);
            if (fallbackTimerRef.current) {
                clearTimeout(fallbackTimerRef.current);
            }
        };
    }, [prefersReducedMotion, handleFinish]);

    // Handle tap to start button click
    const handleTapToStart = async () => {
        setShowTapToStart(false);
        const video = videoRef.current;
        if (video) {
            try {
                await video.play();
            } catch (error) {
                console.error("Failed to play video:", error);
                handleFinish();
            }
        }
    };

    // Render reduced motion static view
    if (prefersReducedMotion) {
        return (
            <motion.div
                className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950"
                initial={{ opacity: 0 }}
                animate={{ opacity: isFadingOut ? 0 : 1 }}
                transition={{ duration: isFadingOut ? 0.2 : 0.15 }}
            >
                {/* Static logo for reduced motion users */}
                <div className="relative z-10 flex flex-col items-center gap-6">
                    <div className="relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-blue-500 rounded-2xl blur-xl opacity-50" />
                        <div className="relative p-5 bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl shadow-2xl">
                            <BookOpen className="w-12 h-12 text-white" />
                        </div>
                        <div className="absolute -top-2 -right-2">
                            <Sparkles className="w-6 h-6 text-yellow-400" />
                        </div>
                    </div>
                    <div className="text-center">
                        <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
                            SERPREP
                        </h1>
                        <p className="mt-2 text-slate-400 text-sm">
                            Your learning journey starts here
                        </p>
                    </div>
                </div>
            </motion.div>
        );
    }

    return (
        <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 overflow-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: isFadingOut ? 0 : 1 }}
            transition={{ duration: isFadingOut ? 0.2 : 0.15 }}
            style={{ touchAction: "none" }} // Prevent scrolling
        >
            {/* Video element - fills entire screen */}
            <video
                ref={videoRef}
                className="absolute inset-0 w-full h-full object-cover"
                muted
                playsInline
                preload="auto"
                src={videoSrc}
            />

            {/* Loading state */}
            {isLoading && (
                <div className="absolute inset-0 z-20 flex items-center justify-center">
                    <div className="flex items-center gap-2">
                        {[0, 1, 2].map((i) => (
                            <motion.div
                                key={i}
                                className="w-2 h-2 rounded-full bg-purple-400"
                                animate={{
                                    scale: [1, 1.4, 1],
                                    opacity: [0.5, 1, 0.5],
                                }}
                                transition={{
                                    duration: 0.8,
                                    repeat: Infinity,
                                    delay: i * 0.15,
                                    ease: "easeInOut",
                                }}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* Tap to Start overlay (for autoplay blocked scenarios) */}
            {showTapToStart && (
                <motion.div
                    className="absolute inset-0 z-30 flex items-center justify-center bg-black/40"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.2 }}
                >
                    <button
                        onClick={handleTapToStart}
                        className="flex flex-col items-center gap-3 p-6 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/20 transition-colors"
                    >
                        <div className="p-4 rounded-full bg-gradient-to-br from-purple-600 to-blue-600">
                            <Play className="w-8 h-8 text-white fill-white" />
                        </div>
                        <span className="text-lg font-medium text-white">
                            Tap to start
                        </span>
                    </button>
                </motion.div>
            )}
        </motion.div>
    );
}
