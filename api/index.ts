import { app, initializeServer } from "../server/index.js";

export default async function handler(req: any, res: any) {
    await initializeServer();
    return app(req, res);
}
