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
  UpdateUserRequest,
  UpdateUserResponse,
} from "./userModel";

export class UserService {
  static async createUser(
    data: CreateUserRequest
  ): Promise<CreateUserResponse> {
    const validateData = Validation.validate(UserValidation.CREATE_USER, data);

    const createUser = await prisma.user.create({
      data: {
        company_id: validateData.company_id,
        job_position_id: validateData.job_position_id,
        employment_status_id: validateData.employment_status_id,
        department_id: validateData.department_id,
        full_name: validateData.full_name,
        phone_number: validateData.phone_number,
      },
    });

    return createUser;
  }

  static async getUsers(data: GetUserRequest): Promise<GetUserResponse> {
    const CompanyId = await prisma.company.findMany({
      where: {
        name: { contains: data.company_name, mode: "insensitive" },
      },
    });

    const jobPositionId = await prisma.jobPosition.findMany({
      where: {
        name: { contains: data.job_position, mode: "insensitive" },
      },
    });

    const employmentStatusId = await prisma.employmentStatus.findMany({
      where: {
        name: { contains: data.employment_status, mode: "insensitive" },
      },
    });

    const departmentId = await prisma.department.findMany({
      where: {
        name: { contains: data.department, mode: "insensitive" },
      },
    });

    const users = await prisma.user.findMany({
      where: {
        company_id: { in: CompanyId.map((item) => item.company_id) },
        job_position_id: {
          in: jobPositionId.map((item) => item.job_position_id),
        },
        employment_status_id: {
          in: employmentStatusId.map((item) => item.employment_status_id),
        },
        department_id: { in: departmentId.map((item) => item.department_id) },
        full_name: data.name
          ? { contains: data.name, mode: "insensitive" }
          : undefined,
        deleted_at: null,
      },
    });

    if (!users) {
      throw new ErrorResponse(
        "Users not found",
        404,
        ["Users not found"],
        "USERS_NOT_FOUND"
      );
    }
    return users;
  }

  static async updateUser(
    data: UpdateUserRequest
  ): Promise<UpdateUserResponse> {
    const validateData = Validation.validate(UserValidation.UPDATE_USER, data);

    const updateUser = await prisma.user.update({
      where: {
        user_id: validateData.user_id,
        deleted_at: null,
      },
      data: {
        company_id: validateData.company_id,
        job_position_id: validateData.job_position_id,
        employment_status_id: validateData.employment_status_id,
        department_id: validateData.department_id,
        full_name: validateData.full_name,
        phone_number: validateData.phone_number,
      },
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
}
