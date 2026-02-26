import { Request, Response, NextFunction } from "express";
import { storage } from "../storage";

// Middleware to require authentication
export function requireAuth(req: Request, res: Response, next: NextFunction) {
    if (!req.session.userId) {
        return res.status(401).json({ error: "Authentication required" });
    }
    next();
}

// Middleware to require specific roles
export function requireRole(...allowedRoles: string[]) {
    return async (req: Request, res: Response, next: NextFunction) => {
        if (!req.session.userId) {
            return res.status(401).json({ error: "Authentication required" });
        }

        const user = await storage.getUser(req.session.userId);
        if (!user) {
            return res.status(401).json({ error: "User not found" });
        }

        if (!allowedRoles.includes(user.role)) {
            return res.status(403).json({ error: "Insufficient permissions" });
        }

        next();
    };
}

// Attach user to request for convenience
export async function attachUser(req: Request, res: Response, next: NextFunction) {
    if (req.session.userId) {
        const user = await storage.getUser(req.session.userId);
        if (user) {
            (req as any).user = user;
        }
    }
    next();
}
