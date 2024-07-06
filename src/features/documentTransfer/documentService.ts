import { Validation } from "../../validations";
import { ErrorResponse } from "../../models";
import { prisma } from "../../applications";
import { DocumentValidation } from "./documentValidation";
import {
  ExportFileListUsersRequest,
  ImportFileListUsersRequest,
} from "./documentModel";
import ExcelJS from "exceljs";
import fs from "fs";
import path from "path";
import { password_generator, pathToFileUrl } from "../../utils";

export class DocumentService {
  static async exportFileListUsers(data: ExportFileListUsersRequest) {
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

    const filePath1 = path.join("./public", "Kumpulan Data Karyawan.xlsx");
    const filePath = pathToFileUrl(
      "/public/Kumpulan data Karyawan.xlsx" || "",
      "localhost:3030"
    );
    await workbook.xlsx.writeFile(filePath1);

    return filePath;
  }

  static async importFileListUsers(data: ImportFileListUsersRequest) {
    if (
      data.file_of_users.mimetype !==
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    ) {
      throw new ErrorResponse(
        "Invalid file format",
        400,
        ["Invalid file format"],
        "INVALID_FILE_FORMAT"
      );
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = await workbook.xlsx.readFile(data.file_of_users.path);

    const usersWorksheet = worksheet.getWorksheet("Users");
    if (!usersWorksheet) {
      throw new ErrorResponse(
        "Invalid Worksheet Name",
        400,
        ["Invalid Worksheet Name"],
        "INVALID_WORKSHEET_NAME"
      );
    }
    const usersData = usersWorksheet.getSheetValues();

    for (let i = 2; i < usersData.length; i++) {
      const user = usersData[i] as { [key: number]: any };

      const company = await prisma.company.findFirst({
        where: {
          name: user[4],
        },
      });

      const jobPosition = await prisma.jobPosition.findFirst({
        where: {
          name: user[5],
        },
      });

      const employmentStatus = await prisma.employmentStatus.findFirst({
        where: {
          name: user[6],
        },
      });

      const department = await prisma.department.findFirst({
        where: {
          name: user[7],
        },
      });

      const passwordDefault = await password_generator(
        user[1] as string,
        user[3] as Date
      );

      const userData = {
        full_name: user[1] as string,
        phone_number: user[2] as string,
        birth_date: user[3] as Date,
        password: passwordDefault,
        company_id: company?.company_id as number,
        job_position_id: jobPosition?.job_position_id as number,
        employment_status_id: employmentStatus?.employment_status_id as number,
        department_id: department?.department_id as number,
        role_id: 3,
      };

      await prisma.user.createMany({
        data: userData,
      });
    }

    return "Users imported successfully";
  }

  static async templateFileListUsers() {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Users");

    worksheet.columns = [
      { header: "Full Name", key: "full_name", width: 20 },
      { header: "Phone Number", key: "phone_number", width: 20 },
      { header: "Birth Date", key: "birth_date", width: 20 },
      { header: "Company", key: "company", width: 20 },
      { header: "Job Position", key: "job_position", width: 20 },
      { header: "Employment Status", key: "employment_status", width: 20 },
      { header: "Department", key: "department", width: 20 },
    ];

    const listCompany = await prisma.company.findMany(
      {
        select: {
          name: true,
        },
      }
    );
    const listJobPosition = await prisma.jobPosition.findMany(
      {
        select: {
          name: true,
        },
      }
    );
    const listEmploymentStatus = await prisma.employmentStatus.findMany(
      {
        select: {
          name: true,
        },
      }
    );
    const listDepartment = await prisma.department.findMany(
      {
        select: {
          name: true,
        },
      }
    );

    worksheet.addRow([]);

    // Add headers for reference data starting from column J
    worksheet.getColumn(10).values = ["List Company", ...listCompany.map(company => company.name)];
    worksheet.getColumn(11).values = ["List Job Position", ...listJobPosition.map(job => job.name)];
    worksheet.getColumn(12).values = ["List Employment Status", ...listEmploymentStatus.map(status => status.name)];
    worksheet.getColumn(13).values = ["List Department", ...listDepartment.map(department => department.name)];

    const filePath1 = path.join("./public", "Template Import Data Karyawan.xlsx");
    const filePath = pathToFileUrl(
      "public/Template Import Data Karyawan.xlsx" || "",
      "localhost:3030"
    );
    await workbook.xlsx.writeFile(filePath1);

    return filePath;
  }
}
