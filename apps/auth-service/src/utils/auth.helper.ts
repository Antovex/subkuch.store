import crypto from "crypto";
import { ValidationError } from "../../../../packages/error-handler";
import { NextFunction } from "express";
import redis from "../../../../packages/libs/redis";

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

export const checkOtpRestrictions = async (email: string, next: NextFunction) => {

}

export const sendOtp = async (name: string, email: string, template: string) => {
    const otp = crypto.randomInt(1000, 9999).toString();
    // await sendEmail();
    await redis.set(`otp:${email}`, otp, 'EX', 300); // OTP valid for 5 minutes
    await redis.set(`otp_cooldown:${email}`, "true", 'EX', 60); // Cooldown of 1 minute
}