import { useEffect, useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { RatingInteraction } from "@/components/ui/emoji-rating";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useFeedbackStore } from "@/hooks/useFeedbackStore";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface FeedbackPopupProps {
    delayMinutes?: number; // Delay before showing popup (in minutes)
}

export function FeedbackPopup({ delayMinutes = 2 }: FeedbackPopupProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [rating, setRating] = useState<number>(0);
    const [comment, setComment] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const { user } = useAuth();
    const { toast } = useToast();
    const { hasSubmittedFeedback, canShowFeedback, setFeedbackSubmitted } = useFeedbackStore();

    useEffect(() => {
        // Only show if user is logged in and hasn't submitted feedback recently
        if (!user || !canShowFeedback()) {
            return;
        }

        // Set timer to show popup after delay
        const timer = setTimeout(() => {
            setIsOpen(true);
        }, delayMinutes * 60 * 1000); // Convert minutes to milliseconds

        return () => clearTimeout(timer);
    }, [user, canShowFeedback, delayMinutes]);

    const handleSubmit = async () => {
        if (rating === 0) {
            toast({
                title: "Please rate your experience",
                description: "Select an emoji to rate your experience",
                variant: "destructive",
            });
            return;
        }

        setIsSubmitting(true);

        try {
            await fetch("/api/feedback", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    rating,
                    comment,
                    // userId and other info is handled by the backend from the session
                }),
            });

            // Mark as submitted
            setFeedbackSubmitted();

            toast({
                title: "Thank you for your feedback! 🎉",
                description: "We appreciate you taking the time to help us improve.",
            });

            setIsOpen(false);
        } catch (error) {
            toast({
                title: "Error submitting feedback",
                description: "Please try again later",
                variant: "destructive",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSkip = () => {
        setIsOpen(false);
        // Don't mark as submitted so it can show again later
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-center text-xl">
                        How's your experience?
                    </DialogTitle>
                    <DialogDescription className="text-center">
                        We'd love to hear your feedback on Upriser!
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* Emoji Rating */}
                    <div className="flex flex-col items-center gap-4">
                        <RatingInteraction
                            onChange={setRating}
                            className="scale-90 sm:scale-100" // Adjust size via scale class since props don't support it
                        />
                        {rating > 0 && (
                            <p className="text-sm text-muted-foreground">
                                {getRatingMessage(rating)}
                            </p>
                        )}
                    </div>

                    {/* Optional Comment */}
                    <div className="space-y-2">
                        <label htmlFor="comment" className="text-sm font-medium">
                            Tell us more (optional)
                        </label>
                        <Textarea
                            id="comment"
                            placeholder="What do you like? What could be better?"
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            rows={3}
                            className="resize-none"
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            onClick={handleSkip}
                            className="flex-1"
                        >
                            Maybe Later
                        </Button>
                        <Button
                            onClick={handleSubmit}
                            disabled={isSubmitting || rating === 0}
                            className="flex-1"
                        >
                            {isSubmitting ? "Submitting..." : "Submit Feedback"}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

function getRatingMessage(rating: number): string {
    const messages: Record<number, string> = {
        1: "We're sorry to hear that. We'll work on improving!",
        2: "Thanks for your feedback. We'll do better!",
        3: "Good to know! We appreciate your input.",
        4: "Great! We're glad you're enjoying it!",
        5: "Awesome! Thank you for the love! ❤️",
    };
    return messages[rating] || "";
}
