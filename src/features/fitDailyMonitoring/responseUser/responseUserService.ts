import { Validation } from "../../../validations";
import { ErrorResponse } from "../../../models";
import { prisma } from "../../../applications";
import { ResponseUserValidation } from "./responseUserValidation";
import {
  CreateResponseUserRequest,
  GetResponseUserByIdRequest,
} from "./responseUserModel";
import { sendMessageFdmUnfit } from "../../../utils";
const recomendationFit = `
•	Anda dinyatakan Sehat dan diperbolehkan Masuk Kerja
•	Tetap Jaga Kesehatan Fisik, Pikiran dan Perasaan Anda Serta Utamakan Tidur yang Cukup
•	Jika Mengalami Tanda Gejala Sakit atau Kelelahan (Fatigue) Segera Hubungi Departemen Occupational Health atau Atasan Anda
`
const recomendationFitFollowUp = `
•	Anda dinyatakan Kurang Sehat dan diperbolehkan Masuk Kerja Dengan Syarat Lakukan Power Nap Atau Kopi Stimulan Terlebih Dahulu
•	Setelah Sampai di Site Segera Hubungi Occupational Health Dept. Untuk Tes Fit dengan Alat Ukur Fatigue 
•	Tetap Jaga Kesehatan Fisik, Pikiran dan Perasaan Anda Serta Utamakan Tidur yang Cukup
`
const recomendationUnfit = `
•	Anda dinyatakan Tidak Sehat dan Tidak diperbolehkan Masuk Kerja 
•	Segera Hubungi Occupational Health Dept. atau Atasan Anda Untuk Follow Up Berikutnya 
•	Tetap Jaga Kesehatan Fisik, Pikiran Dan Perasaan Anda Serta Utamakan Tidur yang Cukup
`

export class ResponseUserService {
  static async createResponseUser(data: CreateResponseUserRequest) {
    const validateData = Validation.validate(
      ResponseUserValidation.CREATE_RESPONSE_USER,
      data
    );

    const user = await prisma.user.findUnique({
      where: {
        user_id: validateData.user_id,
      },
    });

    if (!user) {
      throw new ErrorResponse("User not found", 404, ["user_id"], "NOT_FOUND");
    }

    if (
      validateData.question_answer_id.length !== validateData.question_id.length
    ) {
      throw new ErrorResponse(
        "Question and Question Answer arrays must be of the same length",
        400,
        ["question_id", "question_answer_id"],
        "ARRAY_LENGTH_MISMATCH"
      );
    }

    const values = await prisma.questionAnswer.findMany({
      where: {
        question_answer_id: { in: validateData.question_answer_id },
      },
      select: {
        value: true,
      },
    });

    let result: "FIT" | "FIT_FOLLOW_UP" | "UNFIT" = "FIT";
    let recomendation = recomendationFit;
    const valueSet = new Set(values.map((v) => v.value));

    if (valueSet.has(3)) {
      result = "UNFIT";
      recomendation = recomendationUnfit;
    } else if (valueSet.has(2)) {
      result = "FIT_FOLLOW_UP";
      recomendation = recomendationFitFollowUp;
    }

    await prisma.$transaction(async (prisma) => {
      await prisma.attendanceHealthResult.create({
        data: {
          user_id: validateData.user_id,
          attendance_status: validateData.attendance_status,
          work_duration_plan: validateData.work_duration_plan,
          shift: validateData.shift,
          is_driver: validateData.is_driver,
          vehicle_hull_number: validateData.vehicle_hull_number,
          result: result,
          recomendation: recomendation,
          response_user: {
            createMany: {
              data: validateData.question_id.map((question_id, index) => ({
                user_id: validateData.user_id,
                question_id,
                question_answer_id: validateData.question_answer_id[index],
              })),
            },
          },
        },
      });

      const user = await prisma.user.findUnique({
        where: {
          user_id: validateData.user_id,
        },
        select: {
          full_name: true,
          phone_number: true,
          department: {
            select: {
              name: true,
            },
          },
          job_position: {
            select: {
              name: true,
            },
          },
          ResponseUser: {
            where: {
              created_at: {
                gte: new Date(new Date().setHours(0, 0, 0, 0)),
                lte: new Date(new Date().setHours(23, 59, 59, 999)),
              },
              question_answer: {
                value: 3,
              },
            },
            include: {
              question: true,
              question_answer: true,
            },
          },
        },
      });

      if (user && result === "UNFIT") {
        const descriptions = user.ResponseUser.map((response) => {
          const question = response.question.question;
          const answer = response.question_answer.question_answer;
          return `${question} - ${answer}`;
        });

        const descriptionString = descriptions.join("\n");

        const phoneNumberOfOH = await prisma.user.findMany({
          where: {
            get_notification: true,
            department: {
              name: "Occupational Health",
            },
          },
          select: {
            phone_number: true,
          },
        });

        const phoneNumberOfDepartmentHead = await prisma.user.findMany({
          where: {
            get_notification: true,
            department: {
              name: user.department.name,
            },
          },
          select: {
            phone_number: true,
          },
        });

        const phoneNumberToNotify = [
          ...phoneNumberOfOH.map((i) => i.phone_number),
          ...phoneNumberOfDepartmentHead.map((i) => i.phone_number),
        ];
        for (let phoneNumberWhatsapp of phoneNumberToNotify) {
          sendMessageFdmUnfit(phoneNumberWhatsapp, {
            full_name: user.full_name,
            phone_number: user.phone_number,
            job_position: user.job_position.name,
            department: user.department.name,
            description: descriptionString,
          });
        }
      }
    });
    return { result, recomendation };
  }

  static async getResponseUserById(data: GetResponseUserByIdRequest) {
    const validateData = Validation.validate(
      ResponseUserValidation.GET_RESPONSE_USER_BY_ID,
      data
    );

    const responseUser = await prisma.responseUser.findMany({
      where: {
        user_id: validateData.user_id,
        attendance_health_result_id: validateData.attandance_health_result_id,
      },
      select: {
        user: {
          select: {
            full_name: true,
            phone_number: true,
            email: true,
            birth_date: true,
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
            job_position: {
              select: {
                name: true,
              },
            },
          },
        },
        attendance_health_result: {
          select: {
            attendance_status: true,
            work_duration_plan: true,
            shift: true,
            is_driver: true,
            vehicle_hull_number: true,
            result: true,
            recomendation: true,
            attachment_health_file: true,
            note: true,
          },
        },
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
    });

    return responseUser;
  }
}
