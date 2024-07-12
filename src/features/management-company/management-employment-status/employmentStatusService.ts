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
    const employmentStatus = await prisma.employmentStatus.findMany({
      where: {
        deleted_at: null,
      },
    });
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
        name: validateData.new_name,
      },
    });

    return employmentStatus;
  }

  static async deleteEmploymentStatus(data: DeleteEmploymentStatusRequest) {
    const validateData = Validation.validate(
      EmploymentStatusValidation.DELETE_EMPLOYMENT_STATUS,
      data
    );
    const arrayEmploymentStatuses = Array.isArray(validateData.employment_status_id)
      ? validateData.employment_status_id
      : [validateData.employment_status_id];

    if (arrayEmploymentStatuses.length) {
      await prisma.$transaction(async (prisma) => {
        for (const EmploymentStatusId of arrayEmploymentStatuses) {
          const employmentStatus = await prisma.employmentStatus.findUnique({
            where: { employment_status_id: EmploymentStatusId },
            select: { deleted_at: true },
          });

          if (employmentStatus && employmentStatus.deleted_at === null) {
            await prisma.employmentStatus.update({
              where: { employment_status_id: EmploymentStatusId },
              data: { deleted_at: new Date() },
            });
          }
        }
      });
    }
  }
}
