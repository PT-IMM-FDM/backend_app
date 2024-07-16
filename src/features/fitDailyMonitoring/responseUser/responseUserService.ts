import { Validation } from "../../../validations";
import { ErrorResponse } from "../../../models";
import { prisma } from "../../../applications";
import { ResponseUserValidation } from "./responseUserValidation";
import { CreateResponseUserRequest } from "./responseUserModel";

export class ResponseUserService {
  static async createResponseUser(data: CreateResponseUserRequest) {
    const validateData = Validation.validate(
      ResponseUserValidation.CREATE_RESPONSE_USER,
      data
    );

    if (validateData.question_answer_id.length !== validateData.question_id.length) {
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
    let recomendation = "Tetap semangat! Jaga kesehatan dan terus bekerja dengan baik.";
    const valueSet = new Set(values.map((v) => v.value));

    if (valueSet.has(3)) {
      formula_health = "UNFIT";
      recomendation = "Anda tidak fit untuk bekerja. Silahkan istirahat dan periksakan diri ke dokter.";
    } else if (valueSet.has(2)) {
      formula_health = "FIT_FOLLOW_UP";
      recomendation = "Anda fit untuk bekerja, namun perlu dilakukan follow up untuk memastikan kondisi kesehatan Anda. Jaga kondisi tubuh Anda. Jika merasa lelah, jangan ragu untuk istirahat sejenak, minum kopi atau lakukan power nap.";
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
          recomendation: recomendation
        },
      });
    });
    return formula_health
  }
}
