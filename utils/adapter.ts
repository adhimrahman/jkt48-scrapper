import { Request, Response, NextFunction } from "express";
import { VercelRequest, VercelResponse } from "@vercel/node";

export const serverlessToExpress =
    (handler: (req: VercelRequest, res: VercelResponse) => Promise<void>) =>
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const vercelReq: VercelRequest = req as unknown as VercelRequest;
            const vercelRes: VercelResponse = res as unknown as VercelResponse;
            await handler(vercelReq, vercelRes);
        } catch (error) {
            next(error);
        }
    };