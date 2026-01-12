import prisma from "@packages/libs/prisma";
import { NextFunction, Response } from "express";
import jwt from 'jsonwebtoken';


const isAuthenticated = async (req: any, res: Response, next: NextFunction) => {
    try {
        const token = req.cookies.access_token || req.headers.authorization?.split(" ")[1];

        if (!token) {
            return res.status(401).json({ message: "Unauthorized! No token provided" });
        }

        const secret = process.env.JWT_ACCESS_TOKEN_SECRET;

        if (!secret) {
            return res.status(500).json({ message: "Server configuration error: JWT access token secret is not configured" });
        }

        const decoded = jwt.verify(
            token,
            secret
        ) as { id: string; role: "user" | "seller" };

        if(!decoded){
            return res.status(403).json({ message: "Forbidden! Invalid token" });
        }

        const account = await prisma.users.findUnique({ where: { id: decoded.id } });

        if (!account) {
            return res.status(403).json({ message: "Forbidden! User/Seller not found!" });
        }

        req.user = account;

        return next();
    } catch (error) {
        return next(error);
    }
}

export default isAuthenticated;