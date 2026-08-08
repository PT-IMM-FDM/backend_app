import { Validation } from "../../validations";
import { ErrorResponse } from "../../models";
import { prisma } from "../../applications";
import { UserValidation } from "./userValidation";
import {
  CreateUserRequest,
  CreateUserResponse,
  DeleteUserRequest,
  GetUserRequest,
  GetUserResponse,
  ResetPassword,
  UpdatePassword,
  UpdateUserRequest,
  UpdateUserResponse,
} from "./userModel";
import { password_generator, hashPassword, comparePassword } from "../../utils";
import { Prisma } from "@prisma/client";
let formatUserResponseData = {
  user_id: true,
  full_name: true,
  phone_number: true,
  birth_date: true,
  email: true,
  is_active: true,
  get_notification: true,
  job_position: {
    select: {
      job_position_id: true,
      name: true,
    },
  },
  department: {
    select: {
      department_id: true,
      name: true,
    },
  },
  company: {
    select: {
      company_id: true,
      name: true,
    },
  },
  employment_status: {
    select: {
      employment_status_id: true,
      name: true,
    },
  },
  role: {
    select: {
      role_id: true,
      name: true,
    },
  },
};

export type UserScope = { departmentName: string } | null;

export const buildUserWhere = (
  data: GetUserRequest,
  scope: UserScope
): Prisma.UserWhereInput => {
  const excludeDefaultAdmin: Prisma.UserWhereInput = {
    phone_number: { not: "00000" },
  };

  if (scope) {
    return {
      ...excludeDefaultAdmin,
      department: { name: scope.departmentName },
      company: { deleted_at: null },
      deleted_at: null,
    };
  }

  return {
    ...excludeDefaultAdmin,
    deleted_at: null,
    company: {
      name: { in: data.company_name, mode: Prisma.QueryMode.insensitive },
      deleted_at: null,
    },
    job_position: {
      name: { in: data.job_position, mode: Prisma.QueryMode.insensitive },
    },
    employment_status: {
      name: { in: data.employment_status, mode: Prisma.QueryMode.insensitive },
    },
    department: {
      name: { in: data.department, mode: Prisma.QueryMode.insensitive },
    },
    full_name: data.name
      ? { contains: data.name, mode: Prisma.QueryMode.insensitive }
      : undefined,
    is_active: data.is_active,
    user_id: data.user_id ? { contains: data.user_id } : undefined,
  };
};

export class UserService {
  static async createUser(
    data: CreateUserRequest
  ): Promise<CreateUserResponse> {
    data.birth_date = new Date(data.birth_date + "GMT-0000");

    const validateData = Validation.validate(UserValidation.CREATE_USER, data);

    const findUser = await prisma.user.count({
      where: {
        phone_number: validateData.phone_number,
        deleted_at: null,
      },
    });

    if (findUser > 0) {
      throw new ErrorResponse(
        "Phone number already exists",
        400,
        ["Phone number already exists"],
        "PHONE_NUMBER_EXISTS"
      );
    }

    const generate_password = await password_generator(
      data.full_name,
      data.birth_date
    );

    const createUser = await prisma.user.create({
      data: {
        company_id: validateData.company_id,
        job_position_id: validateData.job_position_id,
        employment_status_id: validateData.employment_status_id,
        department_id: validateData.department_id,
        full_name: validateData.full_name,
        email: validateData.email,
        phone_number: validateData.phone_number,
        birth_date: validateData.birth_date,
        password: await hashPassword(generate_password),
        role_id: validateData.role_id,
      },
      select: formatUserResponseData,
    });
    return createUser;
  }

  private static async resolveUserScope(
    adminUserId: string
  ): Promise<UserScope> {
    const caller = await prisma.user.findFirst({
      where: {
        user_id: adminUserId,
      },
      select: {
        role: {
          select: {
            name: true,
          },
        },
        department: {
          select: {
            name: true,
          },
        },
      },
    });

    if (
      caller &&
      caller.role.name !== "Admin" &&
      caller.role.name !== "Full Viewer"
    ) {
      return { departmentName: caller.department.name };
    }

    return null;
  }

  static async getUsers(data: GetUserRequest): Promise<GetUserResponse[]> {
    const scope = await this.resolveUserScope(data.adminUserId);
    return prisma.user.findMany({
      where: buildUserWhere(data, scope),
      select: formatUserResponseData,
    });
  }

  static async getTotalUsers(data: GetUserRequest): Promise<number> {
    const scope = await this.resolveUserScope(data.adminUserId);
    return prisma.user.count({
      where: buildUserWhere(data, scope),
    });
  }

  static async updateUser(
    data: UpdateUserRequest
  ): Promise<UpdateUserResponse> {
    if (data.birth_date) {
      data.birth_date = new Date(data.birth_date + "GMT-0000");
    }
    const validateData = Validation.validate(UserValidation.UPDATE_USER, data);
    const findUser = await prisma.user.findFirst({
      where: {
        user_id: validateData.user_id,
        deleted_at: null,
      },
    });
    if (!findUser) {
      throw new ErrorResponse(
        "User not found",
        404,
        ["user_id"],
        "USER_NOT_FOUND"
      );
    }
    if (validateData.phone_number !== undefined) {
      const findPhone = await prisma.user.findFirst({
        where: {
          phone_number: validateData.phone_number,
          deleted_at: null,
        },
      });

      if (findPhone && findPhone.user_id !== validateData.user_id) {
        throw new ErrorResponse(
          "Phone number already exists",
          400,
          ["Phone number already exists"],
          "PHONE_NUMBER_EXISTS"
        );
      }
    }
    if (validateData.email?.trim() !== "" && validateData.email !== undefined) {
      const findEmail = await prisma.user.findFirst({
        where: {
          email: validateData.email,
          deleted_at: null,
        },
      });

      if (findEmail && findEmail.user_id !== validateData.user_id) {
        throw new ErrorResponse(
          "Email already exists",
          400,
          ["Email already exists"],
          "EMAIL_EXISTS"
        );
      }
    }

    const updateUser = await prisma.user.update({
      where: {
        user_id: validateData.user_id,
      },
      data: {
        company_id: validateData.company_id,
        job_position_id: validateData.job_position_id,
        employment_status_id: validateData.employment_status_id,
        department_id: validateData.department_id,
        full_name: validateData.full_name,
        phone_number: validateData.phone_number,
        email: validateData.email,
        birth_date: validateData.birth_date,
        role_id: validateData.role_id,
        is_active: validateData.is_active,
        get_notification: validateData.get_notification,
      },
      select: formatUserResponseData,
    });

    return updateUser;
  }

  static async deleteUser(data: DeleteUserRequest) {
    const validateData = Validation.validate(UserValidation.DELETE_USER, data);

    const arrayUsers = Array.isArray(validateData.user_id)
      ? validateData.user_id
      : [validateData.user_id];

    await prisma.user.updateMany({
      where: { user_id: { in: arrayUsers }, deleted_at: null },
      data: { deleted_at: new Date() },
    });
  }

  static async updatePassword(data: UpdatePassword) {
    const validateData = Validation.validate(
      UserValidation.UPDATE_PASSWORD,
      data
    );
    const userData = await prisma.user.findUnique({
      where: {
        user_id: data.user_id,
      },
      select: {
        password: true,
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

    const isPasswordMatch = await comparePassword(
      validateData.old_password,
      userData.password
    );
    if (!isPasswordMatch) {
      throw new ErrorResponse(
        "Invalid Old Password",
        401,
        ["old_password"],
        "INVALID_OLD_PASSWORD"
      );
    }

    const hashedPassword = await hashPassword(validateData.new_password);

    await prisma.user.update({
      where: {
        user_id: data.user_id,
      },
      data: {
        password: hashedPassword,
      },
    });
  }

  static async resetPassword(data: ResetPassword) {
    const validateData = Validation.validate(
      UserValidation.RESET_PASSWORD,
      data
    );

    const userData = await prisma.user.findUnique({
      where: {
        user_id: validateData.user_id,
      },
      select: {
        full_name: true,
        birth_date: true,
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

    const generate_password = await password_generator(
      userData.full_name,
      userData.birth_date
    );

    const hashedPassword = await hashPassword(generate_password);

    await prisma.user.update({
      where: {
        user_id: validateData.user_id,
      },
      data: {
        password: hashedPassword,
      },
    });
  }
}
