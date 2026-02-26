import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface FeedbackState {
    hasSubmittedFeedback: boolean;
    lastFeedbackDate: string | null;
    setFeedbackSubmitted: () => void;
    canShowFeedback: () => boolean;
}

// Store feedback state in localStorage
export const useFeedbackStore = create<FeedbackState>()(
    persist(
        (set, get) => ({
            hasSubmittedFeedback: false,
            lastFeedbackDate: null,

            setFeedbackSubmitted: () => {
                set({
                    hasSubmittedFeedback: true,
                    lastFeedbackDate: new Date().toISOString(),
                });
            },

            // Show feedback popup once per day maximum
            canShowFeedback: () => {
                const state = get();
                if (!state.hasSubmittedFeedback) return true;

                if (!state.lastFeedbackDate) return true;

                const lastDate = new Date(state.lastFeedbackDate);
                const now = new Date();
                const daysSince = Math.floor(
                    (now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24)
                );

                // Allow showing again after 7 days
                return daysSince >= 7;
            },
        }),
        {
            name: 'feedback-storage',
        }
    )
);
