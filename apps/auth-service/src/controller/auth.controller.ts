import { Request, Response, NextFunction } from "express";
import {
    validateRegistrationData,
    checkOtpRestrictions,
    trackOtpRequest,
    sendOtp,
    verifyOtp,
} from "../utils/auth.helper";
import prisma from "@packages/libs/prisma";
import { ValidationError } from "@packages/error-handler";
import bcrypt from "bcryptjs";

export const userRegistration = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        validateRegistrationData(req.body, "user");
        const { name, email } = req.body;

        const exsistingUser = await prisma.users.findUnique({
            where: { email },
        });

        if (exsistingUser) {
            return next(
                new ValidationError("User with this email already exists")
            );
        }

        await checkOtpRestrictions(email, next);
        await trackOtpRequest(email, next);
        await sendOtp(name, email, "user-activation-mail");

        res.status(200).json({
            message:
                "OTP sent to your email. Please verify to complete registration.",
        });
    } catch (error) {
        return next(error);
    }
};

export const verifyUser = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { email, otp, password, name } = req.body;
        if(!email || !otp || !password || !name) {
            return next(new ValidationError("All fields are required!"));
        }

        const exsistinguser = await prisma.users.findUnique({ where: { email } });
        if (exsistinguser) {
            return next(new ValidationError("User already exsists with this email!"));
        }

        await verifyOtp(email, otp, next);

        const hashedPassword = await bcrypt.hash(password, 10);

        // Create new user
        await prisma.users.create({
            data: {
                name,
                email,
                password: hashedPassword,
            },
        });

        res.status(201).json({
            success: true,
            message: "User registered successfully",
        });
    } catch (error) {
        return next(error);
    }
}