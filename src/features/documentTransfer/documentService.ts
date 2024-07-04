import { Validation } from "../../validations";
import { ErrorResponse } from "../../models";
import { prisma } from "../../applications";
import { DocumentValidation } from "./documentValidation";
import { ExportFileListUsersRequest } from "./documentModel";
import ExcelJS from "exceljs";
import fs from "fs";
import path from "path";
import { pathToFileUrl } from "../../utils/format";

export class DocumentService {
  static async getDocumentListUsers(data: ExportFileListUsersRequest) {
    const validateData = Validation.validate(
      DocumentValidation.GET_DOCUMENT_LIST_USER,
      data
    );

    const users = await prisma.user.findMany({
      where: {
        created_at: {
          gte: validateData.date_from,
          lte: validateData.date_to,
        },
      },
      select: {
        full_name: true,
        phone_number: true,
        birth_date: true,
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
      },
    });

    if (users.length === 0) {
      throw new ErrorResponse("No users found", 404);
    }

    const excelFile = await this.generateExcelUsers(users);

    return excelFile;
  }

  static async generateExcelUsers(users: any[]) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Users");

    worksheet.columns = [
      { header: "Full Name", key: "full_name", width: 25 },
      { header: "Phone Number", key: "phone_number", width: 15 },
      { header: "Birth Date", key: "birth_date", width: 30 },
      { header: "Company", key: "company", width: 15 },
      { header: "Job Position", key: "job_position", width: 15 },
      { header: "Employment Status", key: "employment_status", width: 15 },
      { header: "Department", key: "department", width: 15 },
    ];

    users.forEach((user) => {
      worksheet.addRow({
        full_name: user.full_name,
        phone_number: user.phone_number,
        birth_date: user.birth_date,
        company: user.company.name,
        job_position: user.job_position.name,
        employment_status: user.employment_status.name,
        department: user.department.name,
      });
    });
    
    const filePath1 = path.join("./public", "users.xlsx");
    const filePath = pathToFileUrl("/public/users.xlsx"||"", "localhost:3030")
    await workbook.xlsx.writeFile(filePath1);

    return filePath;
  }
}
