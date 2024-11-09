import { Validation } from "../../validations";
import { ErrorResponse } from "../../models";
import { prisma } from "../../applications";
import { DocumentValidation } from "./documentValidation";
import {
  ExportDataFdmRequest,
  ExportFileListUsersRequest,
  GenerateExcelFdmRequest,
  ImportFileListUsersRequest,
  ResultKey,
} from "./documentModel";
import ExcelJS from "exceljs";
import fs from "fs";
import path from "path";
import { hashPassword, password_generator, pathToFileUrl } from "../../utils";

type ResultEnum = ResultKey;

const resultEnumMapping: { [key in ResultEnum]: ResultEnum } = {
  FIT: "FIT",
  FIT_FOLLOW_UP: "FIT_FOLLOW_UP",
  UNFIT: "UNFIT",
};

const publicDir = path.resolve(__dirname, "../../../public");

// Check if directory exists and create it if not
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}
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
        company: {
          name: { in: validateData.company },
          deleted_at: null,
        },
        job_position: {
          job_position_id: { in: validateData.job_position_id },
          deleted_at: null,
        },
        department: {
          department_id: { in: validateData.department_id },
          deleted_at: null,
        },
        employment_status: {
          employment_status_id: { in: validateData.employment_status_id },
          deleted_at: null,
        },
        deleted_at: null,
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
      throw new ErrorResponse(
        "No users found",
        404,
        ["No users found"],
        "NO_USERS_FOUND"
      );
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
    const file_name = "Kumpulan Data Karyawan.xlsx";
    const filePath1 = path.join(publicDir, file_name);
    await workbook.xlsx.writeFile(filePath1);

    return file_name;
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

    const role = await prisma.role.findFirst({
      where: {
        name: "User",
      },
    });
    const usersData = usersWorksheet.getSheetValues();

    for (let i = 3; i < usersData.length; i++) {
      const user = usersData[i] as { [key: number]: any };
      if (user[1] === undefined) {
        break;
      }
      await prisma.$transaction(async (prisma) => {
        const userBirthDate = new Date(user[3] + 'GMT-0000');
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

        const findUser = await prisma.user.findFirst({
          where: {
            phone_number: user[2],
            deleted_at: null,
          },
        });

        if (findUser) {
          throw new ErrorResponse(
            "There Are User Phone number already exists or account has been created",
            400,
            ["phone_number"],
            "PHONE_NUMBER_ALREADY_EXISTS"
          );
        }

        const passwordDefault = await password_generator(
          user[1] as string,
          userBirthDate
        );

        const hashedPassword = await hashPassword(passwordDefault);
        const userData = {
          full_name: user[1] as string,
          phone_number: user[2] as string,
          birth_date: userBirthDate,
          password: hashedPassword,
          company_id: company?.company_id as number,
          job_position_id: jobPosition?.job_position_id as number,
          employment_status_id:
            employmentStatus?.employment_status_id as number,
          department_id: department?.department_id as number,
          role_id: role?.role_id as number,
        };

        await prisma.user.create({
          data: userData,
        });
      });
      // Remove the file after the data is imported
      fs.rmSync("./public/uploads/users_file/", {
        recursive: true,
        force: true,
      });
    }

    return "Users imported successfully";
  }

  static async templateFileListUsers() {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Users");
  
    // Define columns
    worksheet.columns = [
      { header: "Full Name", key: "full_name", width: 20 },
      { header: "Phone Number", key: "phone_number", width: 20 },
      { header: "Birth Date", key: "birth_date", width: 20 },
      { header: "Company", key: "company", width: 30 },
      { header: "Job Position", key: "job_position", width: 30 },
      { header: "Employment Status", key: "employment_status", width: 30 },
      { header: "Department", key: "department", width: 30 },
    ];
  
    // Fetch lists from the database
    const listCompany = await prisma.company.findMany({
      where: { deleted_at: null },
      select: { name: true },
    });
    const listJobPosition = await prisma.jobPosition.findMany({
      where: { deleted_at: null },
      select: { name: true },
    });
    const listEmploymentStatus = await prisma.employmentStatus.findMany({
      where: { deleted_at: null },
      select: { name: true },
    });
    const listDepartment = await prisma.department.findMany({
      where: { deleted_at: null },
      select: { name: true },
    });
  
    // Example row
    const exampleRow = worksheet.addRow({
      full_name: "Nama Lengkap",
      phone_number: "'081234(pakai tanda petik satu didepan)",
      birth_date: "[mm/dd/yyyy]",
      company: "Nama perusahaan diisi dengan isian dropdown",
      job_position: "Nama posisi kerja diisi dengan isian dropdown",
      employment_status: "Status kerja diisi dengan isian dropdown",
      department: "Nama departemen diisi dengan isian dropdown",
    });

    exampleRow.getCell(1).alignment = { wrapText: true, vertical: 'top' };
  
    exampleRow.eachCell((cell) => {
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "D3D3D3" },
      };
    });
  
    worksheet.addRow([]);
  
    // Add reference lists in right-hand columns
    worksheet.getColumn(10).values = ["List Company", ...listCompany.map((company) => company.name)];
    worksheet.getColumn(10).width = 35;
  
    worksheet.getColumn(11).values = ["List Job Position", ...listJobPosition.map((job) => job.name)];
    worksheet.getColumn(11).width = 30;
  
    worksheet.getColumn(12).values = ["List Employment Status", ...listEmploymentStatus.map((status) => status.name)];
    worksheet.getColumn(12).width = 30;
  
    worksheet.getColumn(13).values = ["List Department", ...listDepartment.map((department) => department.name)];
    worksheet.getColumn(13).width = 30;
  
    // Set up dropdowns using dataValidations
    const startRow = 3; // Row where the dropdown should start
    const endRow = 500; // Define how many rows you want to include for the dropdown
  
    for (let row = startRow; row <= endRow; row++) {
      worksheet.getCell(`D${row}`).dataValidation = {
        type: "list",
        allowBlank: true,
        formulae: [`$J$2:$J${listCompany.length + 1}`], // Reference to List Company
      };
      worksheet.getCell(`E${row}`).dataValidation = {
        type: "list",
        allowBlank: true,
        formulae: [`$K$2:$K${listJobPosition.length + 1}`], // Reference to List Job Position
      };
      worksheet.getCell(`F${row}`).dataValidation = {
        type: "list",
        allowBlank: true,
        formulae: [`$L$2:$L${listEmploymentStatus.length + 1}`], // Reference to List Employment Status
      };
      worksheet.getCell(`G${row}`).dataValidation = {
        type: "list",
        allowBlank: true,
        formulae: [`$M$2:$M${listDepartment.length + 1}`], // Reference to List Department
      };
    }
    const filename = "Template Import Data Karyawan.xlsx";
    const filePath1 = path.join("./public", filename);
    const filePath = pathToFileUrl(filePath1, process.env.API_URL || "localhost:3030");
    console.log(filePath);

    await workbook.xlsx.writeFile(filePath1);
    return filePath;
  }
  

  static async exportDataFdm(data: ExportDataFdmRequest) {
    let resultValue; // FIT, FIT_FOLLOW_UP, UNFIT
    if (data.result) {
      resultValue = resultEnumMapping[data.result as ResultKey];
    }

    const validateData = Validation.validate(
      DocumentValidation.GET_DATA_FDM,
      data
    );

    const fdm = await prisma.attendanceHealthResult.findMany({
      where: {
        created_at: {
          gte: validateData.customDateFrom,
          lte: validateData.customDateTo,
        },
        result: resultValue,
        user: {
          user_id: {
            in: validateData.user_id ? [...validateData.user_id] : undefined,
          },
          job_position: {
            name: { in: validateData.job_position_name },
          },
          department: {
            name: { in: validateData.department_name },
          },
          company: {
            name: { in: validateData.company_name },
          },
          employment_status: {
            name: { in: validateData.employment_status_name },
          },
          deleted_at: null,
        },
      },
      include: {
        user: {
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
            ResponseUser: {
              select: {
                question: {
                  select: {
                    question: true,
                  },
                },
                question_answer: {
                  select: {
                    question_answer: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (fdm.length === 0) {
      throw new ErrorResponse(
        "No Data Fit Daily Monitoring found",
        404,
        ["No Data Fit Daily Monitoring found"],
        "NO_DATA_FDM_FOUND"
      );
    }

    const excelFile = await this.generateExcelFdm(fdm);

    // return path the file
    return excelFile;
  }

  static async generateExcelFdm(fdm: GenerateExcelFdmRequest) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("FDM");

    const userColumns: Partial<ExcelJS.Column>[] = [
      { header: "Result", key: "result", width: 15 },
      { header: "Full Name", key: "full_name", width: 25 },
      { header: "Phone Number", key: "phone_number", width: 15 },
      { header: "Birth Date", key: "birth_date", width: 15 },
      { header: "Company", key: "company", width: 30 },
      { header: "Job Position", key: "job_position", width: 30 },
      { header: "Employment Status", key: "employment_status", width: 30 },
      { header: "Department", key: "department", width: 30 },
    ];

    // Kolom Pertanyaan Dinamis
    const questionColumns: Partial<ExcelJS.Column>[] = [];

    if (fdm.length > 0 && fdm[0].user.ResponseUser.length > 0) {
      fdm[0].user.ResponseUser.forEach((response, index) => {
        if (response.question && response.question.question) {
          questionColumns.push({
            header: response.question.question,
            key: `question_${index + 1}`,
            width: 15,
          });
        }
      });
    }

    worksheet.columns = [...userColumns, ...questionColumns];

    fdm.forEach((data) => {
      const row: { [key: string]: any } = {
        full_name: data.user.full_name,
        phone_number: data.user.phone_number,
        birth_date: data.user.birth_date,
        company: data.user.company.name,
        job_position: data.user.job_position.name,
        employment_status: data.user.employment_status.name,
        department: data.user.department.name,
        result: data.result,
      };

      data.user.ResponseUser.forEach((response, index) => {
        row[`question_${index + 1}`] = response.question_answer.question_answer;
      });

      worksheet.addRow(row);
    });

    const filename = "Export Data FDM Karyawan.xlsx";
    const filePath1 = path.join(publicDir, filename);

    await workbook.xlsx.writeFile(filePath1);

    return filename;
  }
}
