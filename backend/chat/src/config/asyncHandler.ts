import { NextFunction, Request, RequestHandler, Response } from "express";


const asyncHandler = (handler: RequestHandler): RequestHandler => {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            await handler(req, res, next);
        } catch (error: any) {
            next(error);
            return;
        }
    }
}


export default asyncHandler;