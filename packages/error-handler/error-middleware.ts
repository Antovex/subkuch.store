import { AppError } from "./index";
import { Request, Response, NextFunction } from "express";

export const errorMiddleware = (err: Error, req: Request, res: Response, next: NextFunction) => {
    if(err instanceof AppError) {
        console.log(`Error: ${req.method} ${req.url} - ${err.message}, Status Code: ${err.statusCode}`);
        return res.status(err.statusCode).json({
            status: "error",
            message: err.message,
            ...(err.details && { details: err.details }),
        });
    }

    console.log(`Unhandled Error: ${req.method} ${req.url} - ${err}`);

    return res.status(500).json({
        status: "error",
        message: "Internal Server Error",
    });
}