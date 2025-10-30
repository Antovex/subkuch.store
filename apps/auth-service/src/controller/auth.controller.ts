import { Request, Response, NextFunction } from "express";
import { validateRegistrationData, checkOtpRestrictions } from "../utils/auth.helper";
import prisma from "../../../../packages/libs/prisma";
import { ValidationError } from "../../../../packages/error-handler";

export const userRegistration = async (req: Request, res: Response, next: NextFunction) => {
    validateRegistrationData(req.body, "user");
    const {name, email} = req.body;

    const exsistingUser = await prisma.user.findUnique({
        where: { email }
    });

    if(exsistingUser) {
        return next(new ValidationError("User with this email already exists"));
    }

    await checkOtpRestrictions(email, next);
}