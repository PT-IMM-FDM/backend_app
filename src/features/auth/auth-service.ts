import { Validation } from "../../validations";
import { prisma } from "../../applications";
import { comparePassword } from "../../utils";
import { ErrorResponse } from "../../models";
import { AuthValidation } from "./auth-validation";
import {
  LoginRequest,
  LoginResponse,
  CurrentLoggedInUserResponse,
} from "./auth-model";
import jwt from "jsonwebtoken";

export class AuthService {
  static async login(data: LoginRequest): Promise<LoginResponse> {
    const validateData = Validation.validate(AuthValidation.LOGIN, data);

    if (!validateData.email_or_phone_number) {
      throw new ErrorResponse(
        "Email or phone number is required",
        400,
        ["email", "phone_number"],
        "REQUIRED"
      );
    }

    const userData = await prisma.user.findFirst({
      where: {
        OR: [
          {
            email: validateData.email_or_phone_number,
          },
          {
            phone_number: validateData.email_or_phone_number,
          },
        ]
      },
      select: {
        user_id: true,
        password: true,
        role_id: true,
      },
    });

    if (!userData) {
      throw new ErrorResponse(
        "Invalid Email or Phone Number",
        401,
        ["email", "password"],
        "INVALID_EMAIL_OR_PHONE_NUMBER"
      );
    }

    const isPasswordMatch = await comparePassword(
      validateData.password,
      userData.password
    );

    if (!isPasswordMatch) {
      throw new ErrorResponse(
        "Invalid Password",
        401,
        ["email", "password"],
        "INVALID_PASSWORD"
      );
    }

    const token = jwt.sign(
      {
        user_id: userData.user_id,
        role_id: userData.role_id,
      },
      process.env.JWT_SECRET!,
      {
        expiresIn: "1d",
      }
    );

    return {
      token,
    };
  }

  static async currentLoggedIn(
    user_id: string
  ): Promise<CurrentLoggedInUserResponse> {
    const userData = await prisma.user.findUnique({
      where: {
        user_id,
      },
      select: {
        user_id: true,
        email: true,
        full_name: true,
        phone_number: true,
        company: {
          select: {
            name: true,
          },
        },
        department: {
          select: {
            name: true,
          },
        },
        employment_status: {
          select: {
            name: true,
          },
        },
        job_position: {
          select: {
            name: true,
          },
        },
        role: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!userData) {
      throw new ErrorResponse(
        "User not found",
        404,
        ["user_id"],
        "USER_NOT_FOUND"
      );
    }

    return userData;
  }
}
