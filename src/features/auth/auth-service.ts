import { Validation } from "../../validations";
import { prisma } from "../../applications";
import { comparePassword, hashPassword } from "../../utils";
import { ErrorResponse } from "../../models";
import { AuthValidation } from "./auth-validation";
import {
  LoginAdminRequest,
  LoginAdminResponse,
  LoginUserRequest,
  LoginUserResponse,
  CurrentLoggedInAdminResponse,
  CurrentLoggedInUserResponse,
} from "./auth-model";
import jwt from "jsonwebtoken";

export class AuthService {
  static async loginAdmin({
    email,
    password,
  }: LoginAdminRequest): Promise<LoginAdminResponse> {
    const request = Validation.validate(AuthValidation.LOGIN_ADMIN, {
      email,
      password,
    });

    const adminData = await prisma.admin.findUnique({
      where: {
        email: request.email,
      },
      select: {
        admin_id: true,
        password: true,
        company_id: true,
        role_id: true,
      },
    });

    if (!adminData) {
      throw new ErrorResponse("Invalid email or password", 401, [
        "email",
        "password",
      ]);
    }

    const isPasswordMatch = await comparePassword(
      request.password,
      adminData.password
    );

    if (!isPasswordMatch) {
      throw new ErrorResponse(
        "Invalid email or password",
        401,
        ["email", "password"],
        "INVALID_EMAIL_OR_PASSWORD"
      );
    }

    const token = jwt.sign(
      {
        admin_id: adminData.admin_id,
        company_id: adminData.company_id,
        role_id: adminData.role_id,
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

  static async loginUser({
    number_phone,
  }: LoginUserRequest): Promise<LoginUserResponse> {
    const request = Validation.validate(AuthValidation.LOGIN_USER, {
      number_phone,
    });

    const userData = await prisma.user.findFirst({
      where: {
        phone_number: request.number_phone,
      },
      select: {
        user_id: true,
        company_id: true,
      },
    });

    if (!userData) {
      throw new ErrorResponse(
        "Invalid phone number",
        401,
        ["number_phone"],
        "INVALID_PHONE_NUMBER"
      );
    }

    const token = jwt.sign(
      {
        user_id: userData.user_id,
        company_id: userData.company_id,
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
    admin_id?: string,
    user_id?: string
  ): Promise<CurrentLoggedInUserResponse | CurrentLoggedInAdminResponse> {
    if (admin_id) {
      const adminData = await prisma.admin.findUnique({
        where: {
          admin_id,
        },
        select: {
          admin_id: true,
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
              department_id: true,
              name: true,
            },
          },
          employment_status: {
            select: {
              employment_status_id: true,
              name: true,
            },
          },
          job_position: {
            select: {
              job_position_id: true,
              name: true,
            },
          },
          role: {
            select: {
              role_id: true,
              name: true,
            },
          },
        },
      });

      if (!adminData) {
        throw new ErrorResponse(
          "Admin not found",
          404,
          ["admin_id"],
          "ADMIN_NOT_FOUND"
        );
      }

      return adminData;
    }

    const userData = await prisma.user.findUnique({
      where: {
        user_id,
      },
      include: {
        job_position: {
          select: {
            job_position_id: true,
            name: true,
          },
        },
        employment_status: {
          select: {
            employment_status_id: true,
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
