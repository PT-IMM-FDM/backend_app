import { Validation } from "../../validations";
import { ErrorResponse } from "../../models";
import { prisma } from "../../applications";
import { UserValidation } from "./userValidation";
import { CreateUserRequest, CreateUserResponse } from "./userModel";

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

  
}
