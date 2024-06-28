import { Validation } from "../../validations";
import { ErrorResponse } from "../../models";
import { prisma } from "../../applications";
import { UserValidation } from "./userValidation";
import {
  CreateUserRequest,
  CreateUserResponse,
  GetUserRequest,
  GetUserResponse,
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
        company_id: {in: CompanyId.map((item) => item.company_id)},
        job_position_id: {in: jobPositionId.map((item) => item.job_position_id)},
        employment_status_id: {in: employmentStatusId.map((item) => item.employment_status_id)},
        department_id: {in: departmentId.map((item) => item.department_id)},
        full_name: data.name
          ? { contains: data.name, mode: "insensitive" }
          : undefined,
        deleted_at: null
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
}
