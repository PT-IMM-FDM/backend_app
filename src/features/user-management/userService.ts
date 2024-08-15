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

export class UserService {
  static async createUser(
    data: CreateUserRequest
  ): Promise<CreateUserResponse> {
    data.birth_date = new Date(data.birth_date);

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

  static async getUsers(data: GetUserRequest): Promise<GetUserResponse[]> {
    let users;
    let adminDefault;
    const adminRole = await prisma.user.findFirst({
      where: {
        user_id: data.adminUserId,
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
        company: {
          select: {
            name: true,
          },
        },
      },
    });

    if (
      adminRole &&
      adminRole.role.name !== "Admin" &&
      adminRole.role.name !== "Full Viewer"
    ) {
      users = await prisma.user.findMany({
        where: {
          department: {
            name: adminRole.department.name,
          },
          company: {
            deleted_at: null,
          },
          deleted_at: null,
        },
        select: formatUserResponseData,
      });

      return users;
    }

    const CompanyId = await prisma.company.findMany({
      where: {
        name: { in: data.company_name, mode: "insensitive" },
      },
    });

    const jobPositionId = await prisma.jobPosition.findMany({
      where: {
        name: { in: data.job_position, mode: "insensitive" },
      },
    });

    const employmentStatusId = await prisma.employmentStatus.findMany({
      where: {
        name: { in: data.employment_status, mode: "insensitive" },
      },
    });

    const departmentId = await prisma.department.findMany({
      where: {
        name: { in: data.department, mode: "insensitive" },
      },
    });

    adminDefault = await prisma.user.findMany({
      where: {
        phone_number: "00000",
      },
      select: {
        user_id: true,
      },
    });
    console.log(adminDefault[0].user_id);
    users = await prisma.user.findMany({
      where: {
        company: {
          company_id: { in: CompanyId.map((item) => item.company_id) },
          deleted_at: null,
        },
        job_position_id: {
          in: jobPositionId.map((item) => item.job_position_id),
        },
        employment_status_id: {
          in: employmentStatusId.map((item) => item.employment_status_id),
        },
        department_id: { in: departmentId.map((item) => item.department_id) },
        full_name: data.name
          ? {
              contains: data.name,
              mode: "insensitive",
            }
          : undefined,
        is_active: data.is_active,
        user_id: { notIn: [adminDefault[0].user_id], contains: data.user_id },
        deleted_at: null,
      },
      select: formatUserResponseData,
    });
    return users;
  }

  static async updateUser(
    data: UpdateUserRequest
  ): Promise<UpdateUserResponse> {
    const validateData = Validation.validate(UserValidation.UPDATE_USER, data);

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

    if (arrayUsers.length) {
      await prisma.$transaction(async (prisma) => {
        for (const userId of arrayUsers) {
          const user = await prisma.user.findUnique({
            where: { user_id: userId },
            select: { deleted_at: true },
          });

          if (user && user.deleted_at === null) {
            await prisma.user.update({
              where: { user_id: userId },
              data: { deleted_at: new Date() },
            });
          }
        }
      });
    }
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
