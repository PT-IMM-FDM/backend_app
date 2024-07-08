import { Validation } from "../../../validations";
import { ErrorResponse } from "../../../models";
import { prisma } from "../../../applications";
import { EmploymentStatusValidation } from "./employmentStatusValidation";
import {
  CreateEmploymentStatusRequest,
  DeleteEmploymentStatusRequest,
  UpdateEmploymentStatusRequest,
} from "./employmentStatusModel";

export class EmploymentStatusService {
  static async createEmploymentStatus(data: CreateEmploymentStatusRequest) {
    const validateData = Validation.validate(
      EmploymentStatusValidation.CREATE_EMPLOYMENT_STATUS,
      data
    );

    const employmentStatus = await prisma.employmentStatus.create({
      data: {
        name: validateData.name,
      },
    });

    return employmentStatus;
  }

  static async getEmploymentStatus() {
    const employmentStatus = await prisma.employmentStatus.findMany();
    return employmentStatus;
  }

  static async updateEmploymentStatus(data: UpdateEmploymentStatusRequest) {
    const validateData = Validation.validate(
      EmploymentStatusValidation.UPDATE_EMPLOYMENT_STATUS,
      data
    );
    const employmentStatus = await prisma.employmentStatus.update({
      where: {
        employment_status_id: validateData.employment_status_id,
      },
      data: {
        name: validateData.name,
      },
    });

    return employmentStatus;
  }

  static async deleteEmploymentStatus(data: DeleteEmploymentStatusRequest) {
    const validateData = Validation.validate(
      EmploymentStatusValidation.DELETE_EMPLOYMENT_STATUS,
      data
    );
    const employmentStatus = await prisma.employmentStatus.delete({
      where: {
        employment_status_id: validateData.employment_status_id,
      },
    });

    return employmentStatus;
  }
}
