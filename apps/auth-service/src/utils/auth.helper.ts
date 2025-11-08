import crypto from "crypto";
import { ValidationError } from "@packages/error-handler";
import { NextFunction, Request, Response } from "express";
import redis from "@packages/libs/redis";
import { sendEmail } from "./sendMail";
import prisma from "@packages/libs/prisma";

export const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const validateRegistrationData = (
    data: any,
    userType: "user" | "seller"
) => {
    const { name, email, password, phone_number, country } = data;

    if (
        !name ||
        !email ||
        !password ||
        (userType === "seller" && (!phone_number || !country))
    ) {
        throw new ValidationError("Missing required fields for registration");
    }

    if (!emailRegex.test(email)) {
        throw new ValidationError("Invalid email format");
    }
};

export const checkOtpRestrictions = async (
    email: string,
    next: NextFunction
) => {
    if (await redis.get(`otp_lock:${email}`)) {
        return next(
            new ValidationError(
                "Account locked due to multiple failed OTP attempts. Please try again after 30 minutes."
            )
        );
    }

    if (await redis.get(`otp_spam_lock:${email}`)) {
        return next(
            new ValidationError(
                "Too many OTP requests. Please try again after 1 hour."
            )
        );
    }

    if (await redis.get(`otp_cooldown:${email}`)) {
        return next(
            new ValidationError(
                "Please wait 1 mintue before requesting a new OTP."
            )
        );
    }
};

export const sendOtp = async (
    name: string,
    email: string,
    template: string
) => {
    const otp = crypto.randomInt(1000, 9999).toString();
    await sendEmail(email, "Verify your Email...", template, { name, otp });
    await redis.set(`otp:${email}`, otp, "EX", 300); // OTP valid for 5 minutes
    await redis.set(`otp_cooldown:${email}`, "true", "EX", 60); // Cooldown of 1 minute
};

export const trackOtpRequest = async (email: string, next: NextFunction) => {
    const otpRequestKey = `otp_request_count:${email}`;
    let requestCount = parseInt((await redis.get(otpRequestKey)) || "0");

    if (requestCount >= 2) {
        await redis.set(`otp_spam_lock:${email}`, "locked", "EX", 3600); // 1 hour lock
        return next(
            new ValidationError(
                "Too many OTP requests. Please try again after 1 hour."
            )
        );
    }

    await redis.set(otpRequestKey, requestCount + 1, "EX", 3600); // tracking otp of particular email for 1 hour
};

export const verifyOtp = async (
    email: string,
    otp: string,
    next: NextFunction
) => {
    const storedOtp = await redis.get(`otp:${email}`);
    if (!storedOtp) {
        throw new ValidationError(
            "OTP expired or not found. Please request a new one."
        );
    }

    const failedAttemptsKey = `otp_attempts:${email}`;
    const failedAttempts = parseInt(
        (await redis.get(failedAttemptsKey)) || "0"
    );

    if (storedOtp !== otp) {
        if (failedAttempts >= 2) {
            await redis.set(`otp_lock:${email}`, "locked", "EX", 1800); // 30 minutes lock
            await redis.del(`otp:${email}`, failedAttemptsKey);
            throw new ValidationError(
                "Account locked due to multiple failed OTP attempts. Please try again after 30 minutes."
            );
        }
        await redis.set(failedAttemptsKey, failedAttempts + 1, "EX", 300); // track failed attempts for 5 minutes
        throw new ValidationError(
            `Invalid OTP. You have ${2 - failedAttempts} attempts left.`
        );
    }

    await redis.del(`otp:${email}`, failedAttemptsKey);
    // OTP verified successfully
    // Proceed with further registration steps
};

export const handleForgotPassword = async (
    req: Request,
    res: Response,
    next: NextFunction,
    userType: "user" | "seller"
) => {
    try {
        const { email } = req.body;
        if (!email) {
            throw new ValidationError("Email is required!");
        }

        //  Find user or seller in database
        const user =
            userType === "user" &&
            (await prisma.users.findUnique({ where: { email } }));

        if (!user) {
            throw new ValidationError(`No ${userType} found with this email!`);
        }

        // Check OTP restrictions
        await checkOtpRestrictions(email, next);
        await trackOtpRequest(email, next);

        // Generate and send OTP
        await sendOtp(email, user.name, "forgot_password_user_mail");

        res.status(200).json({
            message: "OTP sent to your email. Please verify to reset password.",
        });
    } catch (error) {
        return next(error);
    }
};

export const verifyUserForgotPasswordOtp = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { email, otp } = req.body;
        if (!email || !otp) {
            throw new ValidationError("Email and OTP are required!");
        }

        await verifyOtp(email, otp, next);

        res.status(200).json({
            message:
                "OTP verified successfully! You can now reset your password.",
        });
    } catch (error) {
        return next(error);
    }
};
