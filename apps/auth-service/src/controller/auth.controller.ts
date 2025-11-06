import { Request, Response, NextFunction } from "express";
import {
    validateRegistrationData,
    checkOtpRestrictions,
    trackOtpRequest,
    sendOtp,
    verifyOtp,
    emailRegex,
} from "../utils/auth.helper";
import prisma from "@packages/libs/prisma";
import { AuthError, ValidationError } from "@packages/error-handler";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { setCookie } from "../utils/cookies/setCookie";

// Register new user
export const userRegistration = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    /* 
    #swagger.description = 'Register a new user and send OTP verification email'
    #swagger.parameters['body'] = {
        in: 'body',
        description: 'User registration information',
        required: true,
        schema: {
            name: 'John Doe',
            email: 'john@example.com',
            password: 'SecurePass123!',
            phone_number: '+1234567890',
            country: 'US'
        }
    }
    #swagger.responses[200] = {
        description: 'OTP sent successfully'
    }
    #swagger.responses[400] = {
        description: 'Validation error or user already exists'
    }
    */
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

// Verify new user with OTP
export const verifyUser = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    /* 
    #swagger.description = 'Verify OTP and complete user registration'
    #swagger.parameters['body'] = {
        in: 'body',
        description: 'OTP verification and user details',
        required: true,
        schema: {
            email: 'john@example.com',
            otp: '1234',
            password: 'SecurePass123!',
            name: 'John Doe'
        }
    }
    #swagger.responses[201] = {
        description: 'User registered successfully'
    }
    #swagger.responses[400] = {
        description: 'Validation error, invalid OTP, or user already exists'
    }
    */
    try {
        const { email, otp, password, name } = req.body;
        if (!email || !otp || !password || !name) {
            return next(new ValidationError("All fields are required!"));
        }

        const exsistinguser = await prisma.users.findUnique({
            where: { email },
        });
        if (exsistinguser) {
            return next(
                new ValidationError("User already exsists with this email!")
            );
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
};

// Login existing user
export const loginUser = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return next(new ValidationError("Email and password are required"));
        }

        if (!emailRegex.test(email)) {
            throw new ValidationError("Invalid email format");
        }

        const user = await prisma.users.findUnique({ where: { email } });

        if (!user) {
            return next(
                new AuthError(
                    "User doesn't exist! Check your email or register first."
                )
            );
        }

        // Verify Password
        const isMatch = await bcrypt.compare(password, user.password!);

        if (!isMatch) {
            return next(new AuthError("Invalid email or password"));
        }

        // Generate session and refresh token
        const accessToken = jwt.sign(
            { id: user.id, role: "user" },
            process.env.JWT_ACCESS_TOKEN_SECRET as string,
            { expiresIn: "15m" }
        );
        const refreshToken = jwt.sign(
            { id: user.id, role: "user" },
            process.env.JWT_REFRESH_TOKEN_SECRET as string,
            { expiresIn: "7d" }
        );

        // store the access and refresh token in httpOnly secure cookies
        setCookie(res, "refresh_token", refreshToken);
        setCookie(res, "access_token", accessToken);

        res.status(200).json({
            message: "Login successful",
            user: {
                id: user.id,
                email: user.email,
                name: user.name
            }
        })

    } catch (error) {
        return next(error);
    }
};
