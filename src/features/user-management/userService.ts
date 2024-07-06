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
import { Password_generator, hashPassword } from "../../utils";

let formatUserResponseData = {
  user_id: true,
  full_name: true,
  phone_number: true,
  birth_date: true,
  email: true,
  job_position: {
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
  employment_status: {
    select: {
      name: true,
    },
  },
  role: {
    select: {
      name: true,
    }
  }
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

    const first_name = data.full_name.split(" ")[0].toLowerCase();
    const dateDay = String(data.birth_date.getDate()).padStart(2, '0');
    const dateMonth = String(data.birth_date.getUTCMonth() + 1).padStart(2, '0');
    const dateFullYear = data.birth_date.getFullYear();
    const format_password = `${first_name}${dateDay}${dateMonth}${dateFullYear}`;
    
    const generate_password = await password_generator(first_name, format_password);
    
    const createUser = await prisma.user.create({
      data: {
        company_id: validateData.company_id,
        job_position_id: validateData.job_position_id,
        employment_status_id: validateData.employment_status_id,
        department_id: validateData.department_id,
        full_name: validateData.full_name,
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
      select: formatUserResponseData,
    });
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
        email: validateData.email,
        birth_date: validateData.birth_date,
        role_id: validateData.role_id,
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
