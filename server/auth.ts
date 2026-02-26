import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { storage } from "./storage";
import { randomUUID } from "crypto";
import { determineRoleFromEmail } from "./role-manager";

export function setupGoogleAuth() {
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
        console.warn("Google OAuth not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.");
        return;
    }

    passport.use(
        new GoogleStrategy(
            {
                clientID: process.env.GOOGLE_CLIENT_ID,
                clientSecret: process.env.GOOGLE_CLIENT_SECRET,
                callbackURL: process.env.GOOGLE_CALLBACK_URL || "/api/auth/google/callback",
            },
            async (accessToken, refreshToken, profile, done) => {
                try {
                    const email = profile.emails?.[0]?.value;
                    if (!email) {
                        return done(new Error("No email found in Google profile"), undefined);
                    }

                    // Check if user exists by Google ID
                    let user = await storage.getUserByGoogleId(profile.id);

                    if (!user) {
                        // Check if user exists by email (might have registered with email/password)
                        user = await storage.getUserByEmail(email);

                        if (user) {
                            // Link Google account to existing user
                            user = await storage.updateUser(user.id, {
                                googleId: profile.id,
                                authProvider: user.authProvider === "local" ? "local" : "google",
                            });
                        } else {
                            // Create new user with role determined from email
                            const assignedRole = determineRoleFromEmail(email);

                            user = await storage.createUser({
                                email,
                                name: profile.displayName || email.split("@")[0],
                                googleId: profile.id,
                                authProvider: "google",
                                avatar: profile.photos?.[0]?.value || null,
                                role: assignedRole,
                                isActive: true,
                            });

                            console.log(`New user created via Google OAuth: ${email} with role: ${assignedRole}`);
                        }
                    }

                    return done(null, user);
                } catch (error) {
                    return done(error as Error, undefined);
                }
            }
        )
    );

    // Serialize user ID to session
    passport.serializeUser((user: any, done) => {
        done(null, user.id);
    });

    // Deserialize user from session
    passport.deserializeUser(async (id: string, done) => {
        try {
            const user = await storage.getUser(id);
            done(null, user || null);
        } catch (error) {
            done(error, null);
        }
    });
}

export { passport };
