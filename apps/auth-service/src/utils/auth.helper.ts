import crypto from "crypto";
import { ValidationError } from "../../../../packages/error-handler";
import { NextFunction } from "express";
import redis from "../../../../packages/libs/redis";
import { sendEmail } from "./sendMail";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

export const trackOtpRequest = async (
    email: string,
    next: NextFunction
) => {
    const otpRequestKey = `otp_request_count:${email}`;
    let requestCount = parseInt(await redis.get(otpRequestKey) || "0");

    if(requestCount >= 2) {
        await redis.set(`otp_spam_lock:${email}`, "locked", "EX", 3600); // 1 hour lock
        return next(
            new ValidationError(
                "Too many OTP requests. Please try again after 1 hour."
            )
        );
    }

    await redis.set(otpRequestKey, requestCount + 1, "EX", 3600); // tracking otp of particular email for 1 hour
}