import { Request, Response } from "express";
import { VercelRequest, VercelResponse } from "@vercel/node";

export const serverlessToExpress = (
    handler: (req: VercelRequest, res: VercelResponse) => Promise<void>
) => {
    return async (req: Request, res: Response) => {
        const vercelReq = req as unknown as VercelRequest;
        const vercelRes = res as unknown as VercelResponse;
        await handler(vercelReq, vercelRes);
    };
};