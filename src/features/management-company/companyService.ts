import { Validation } from "../../validations";
import { ErrorResponse } from "../../models";
import { prisma } from "../../applications";
import { CompanyValidation } from "./companyValidation";
import {
  CreateCompanyRequest,
  DeleteCompanyRequest,
  UpdateCompanyRequest,
} from "./companyModel";

export class CompanyService {
  static async createCompany(data: CreateCompanyRequest) {
    const validateData = Validation.validate(
      CompanyValidation.CREATE_COMPANY,
      data
    );

    const company = await prisma.company.create({
      data: {
        name: validateData.name,
      },
    });

    return company;
  }

  static async getCompany() {
    const company = await prisma.company.findMany({
      where: {
        deleted_at: null,
      },
    });
    return company;
  }

  static async updateCompany(data: UpdateCompanyRequest) {
    const validateData = Validation.validate(
      CompanyValidation.UPDATE_COMPANY,
      data
    );
    const company = await prisma.company.update({
      where: {
        company_id: validateData.company_id,
      },
      data: {
        name: validateData.new_name,
      },
    });

    return company;
  }

  static async deleteCompany(data: DeleteCompanyRequest) {
    const validateData = Validation.validate(
      CompanyValidation.DELETE_COMPANY,
      data
    );

    const arrayCompanys = Array.isArray(validateData.company_id)
      ? validateData.company_id
      : [validateData.company_id];

    if (arrayCompanys.length) {
      await prisma.$transaction(async (prisma) => {
        for (const CompanyId of arrayCompanys) {
          const Company = await prisma.company.findUnique({
            where: { company_id: CompanyId },
            select: { deleted_at: true },
          });

          if (Company && Company.deleted_at === null) {
            await prisma.company.update({
              where: { company_id: CompanyId },
              data: { deleted_at: new Date() },
            });
          }
        }
      });
    }
  }
}
