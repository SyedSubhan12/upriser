import { useState, useEffect, useCallback, ReactNode } from "react";
import { OnboardingWizard } from "./OnboardingWizard";
import { useToast } from "@/hooks/use-toast";

// Device ID management (Big Tech pattern)
const DEVICE_ID_KEY = "serprep_device_id";
const ONBOARDING_COMPLETED_KEY = "serprep_onboarding_completed";
const PREFERENCES_KEY = "serprep_preferences";

function generateDeviceId(): string {
    return crypto.randomUUID();
}

function getDeviceId(): string {
    let deviceId = localStorage.getItem(DEVICE_ID_KEY);
    if (!deviceId) {
        deviceId = generateDeviceId();
        localStorage.setItem(DEVICE_ID_KEY, deviceId);
    }
    return deviceId;
}

function isOnboardingCompleted(): boolean {
    return localStorage.getItem(ONBOARDING_COMPLETED_KEY) === "true";
}

function markOnboardingCompleted(): void {
    localStorage.setItem(ONBOARDING_COMPLETED_KEY, "true");
}

function savePreferences(prefs: any): void {
    localStorage.setItem(PREFERENCES_KEY, JSON.stringify(prefs));
}

interface OnboardingGateProps {
    children: ReactNode;
}

type GateState = "wizard" | "ready";

export function OnboardingGate({ children }: OnboardingGateProps) {
    // Always start with ready or wizard based on local storage
    const [state, setState] = useState<GateState>(() => {
        if (typeof window !== "undefined" && isOnboardingCompleted()) {
            return "ready";
        }
        return "wizard";
    });
    const { toast } = useToast();

    // Initialize on mount
    useEffect(() => {
        const init = async () => {
            const deviceId = getDeviceId();

            // Try to sync with server
            try {
                const response = await fetch("/api/onboarding/init", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ deviceId }),
                });

                if (response.ok) {
                    const data = await response.json();

                    // Sync server state to localStorage
                    if (data.onboardingCompleted) {
                        markOnboardingCompleted();
                        if (data.preferences) {
                            savePreferences({
                                ...data.preferences,
                                subjectIds: data.subjectIds,
                            });
                        }
                        // If we found they completed it on server but local was false, update state
                        if (state !== "ready") {
                            setState("ready");
                        }
                    }
                }
            } catch (error) {
                console.warn("Could not sync with server, using local state:", error);
            }
        };

        init();
    }, [state]);

    const handleWizardComplete = useCallback(async (data: any) => {
        const deviceId = getDeviceId();

        try {
            // Save to server
            const response = await fetch("/api/onboarding/complete", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    deviceId,
                    boardKey: data.boardKey,
                    qualKey: data.qualKey,
                    programKey: data.programKey,
                    subjectIds: data.subjectIds,
                    preferences: {
                        studyMinutesDaily: data.studyMinutesDaily,
                        difficulty: data.difficulty,
                        resourceFocus: data.resourceFocus,
                        examSessionTarget: data.examSessionTarget,
                    },
                }),
            });

            if (!response.ok) {
                throw new Error("Failed to save preferences");
            }

            // Save to localStorage
            markOnboardingCompleted();
            savePreferences(data);

            toast({
                title: "Welcome to SERPREP! 🎉",
                description: "Your profile has been set up successfully.",
            });

            setState("ready");
        } catch (error) {
            console.error("Error saving onboarding:", error);

            // Still save locally even if server fails
            markOnboardingCompleted();
            savePreferences(data);

            toast({
                title: "Profile saved locally",
                description: "Your preferences will sync when you're back online.",
            });

            setState("ready");
        }
    }, [toast]);

    const handleSkip = useCallback(() => {
        const deviceId = getDeviceId();

        // Save minimal defaults
        const defaults = {
            boardKey: "",
            qualKey: "",
            subjectIds: [],
            studyMinutesDaily: 30,
            difficulty: "medium",
            resourceFocus: ["past_papers"],
        };

        // Try to save to server (fire and forget)
        fetch("/api/onboarding/complete", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                deviceId,
                ...defaults,
                preferences: {
                    studyMinutesDaily: defaults.studyMinutesDaily,
                    difficulty: defaults.difficulty,
                    resourceFocus: defaults.resourceFocus,
                },
            }),
        }).catch(console.warn);

        // Save locally
        markOnboardingCompleted();
        savePreferences(defaults);

        toast({
            title: "Skipped for now",
            description: "You can set up your profile later in Settings.",
        });

        setState("ready");
    }, [toast]);

    return (
        <>
            {/* Onboarding wizard */}
            <OnboardingWizard
                open={state === "wizard"}
                onComplete={handleWizardComplete}
                onSkip={handleSkip}
            />

            {/* Main content - always rendered but hidden until ready */}
            <div
                className={state === "ready" ? "opacity-100" : "opacity-0 pointer-events-none"}
                style={{ transition: "opacity 0.3s ease-in-out" }}
            >
                {children}
            </div>
        </>
    );
}
