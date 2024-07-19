import { Validation } from "../../../validations";
import { ErrorResponse } from "../../../models";
import { prisma } from "../../../applications";
import { ResponseUserValidation } from "./responseUserValidation";
import { CreateResponseUserRequest } from "./responseUserModel";
import { sendMessageFdmUnfit } from "../../../utils";

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

    console.log(validateData);
    const values = await prisma.questionAnswer.findMany({
      where: {
        question_answer_id: { in: validateData.question_answer_id },
      },
      select: {
        value: true,
      },
    });

    let formula_health: "FIT" | "FIT_FOLLOW_UP" | "UNFIT" = "FIT";
    let recomendation =
      "Tetap semangat! Jaga kesehatan dan terus bekerja dengan baik.";
    const valueSet = new Set(values.map((v) => v.value));

    if (valueSet.has(3)) {
      formula_health = "UNFIT";
      recomendation =
        "Anda tidak fit untuk bekerja. Silahkan istirahat dan periksakan diri ke dokter.";
    } else if (valueSet.has(2)) {
      formula_health = "FIT_FOLLOW_UP";
      recomendation =
        "Anda fit untuk bekerja, namun perlu dilakukan follow up untuk memastikan kondisi kesehatan Anda. Jaga kondisi tubuh Anda. Jika merasa lelah, jangan ragu untuk istirahat sejenak, minum kopi atau lakukan power nap.";
    }

    await prisma.$transaction(async (prisma) => {
      await Promise.all(
        validateData.question_answer_id.map((question_answer_id, index) =>
          prisma.responseUser.create({
            data: {
              user_id: validateData.user_id,
              question_id: validateData.question_id[index],
              question_answer_id,
            },
          })
        )
      );

      await prisma.attendance_health_result.create({
        data: {
          user_id: validateData.user_id,
          attendance_status: validateData.attendance_status,
          work_duration_plan: validateData.work_duration_plan,
          shift: validateData.shift,
          is_driver: validateData.is_driver,
          vehicle_hull_number: validateData.vehicle_hull_number,
          result: formula_health, // Ensure this is a valid enum value
          recomendation: recomendation,
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

      if (user && formula_health === "UNFIT") {
        const descriptions = user.ResponseUser.map((response) => {
          const question = response.question.question;
          const answer = response.question_answer.question_answer;
          return `${question} - ${answer}`;
        });

        const descriptionString = descriptions.join("\n");

        sendMessageFdmUnfit("0811597599", {
          full_name: user.full_name,
          phone_number: user.phone_number,
          department: user.department.name,
          description: descriptionString,
        });
      }
    });
    return { formula_health, recomendation };
  }
}
