import { Validation } from "../../../validations";
import { ErrorResponse } from "../../../models";
import { prisma } from "../../../applications";
import { DepartmentValidation } from "./departmentValidation";
import {
  CreateDepartmentRequest,
  DeleteDepartmentRequest,
  UpdateDepartmentRequest,
} from "./departmentModel";

export class DepartmentService {
  static async createDepartment(data: CreateDepartmentRequest) {
    const validateData = Validation.validate(
      DepartmentValidation.CREATE_DEPARTMENT,
      data
    );

    const department = await prisma.department.create({
      data: {
        name: validateData.name,
      },
    });

    return department;
  }

  static async getDepartment() {
    const department = await prisma.department.findMany();
    return department;
  }

  static async updateDepartment(data: UpdateDepartmentRequest) {
    const validateData = Validation.validate(
      DepartmentValidation.UPDATE_DEPARTMENT,
      data
    );
    const department = await prisma.department.update({
      where: {
        department_id: validateData.department_id,
      },
      data: {
        name: validateData.name,
      },
    });

    return department;
  }

  static async deleteDepartment(data: DeleteDepartmentRequest) {
    const validateData = Validation.validate(
      DepartmentValidation.DELETE_DEPARTMENT,
      data
    );
    const department = await prisma.department.delete({
      where: {
        department_id: validateData.department_id,
      },
    });

    return department;
  }
}
