import { roleDefault } from "./roleDefault";
import { adminDefault } from "./adminDefault";
import { companyDefault } from "./companyDefault";
import { departmentDefault } from "./departmentDefault";
import { jobPositionDefault } from "./jobPositionDefault";
import { employmentStatusDefault } from "./employmentStatusDefault";
import { questionDefault } from "./questionDefault";
import { prisma } from "../../src/applications";
import { hashPassword } from "../../src/utils";

async function main() {
  await prisma.$transaction(async (tx) => {
    await tx.role.deleteMany({});
    await tx.role.createMany({
      data: roleDefault,
    });

    await tx.company.deleteMany({});
    await tx.company.createMany({
      data: companyDefault.map((company) => ({
        ...company,
      })),
    });

    await tx.department.deleteMany({});
    await tx.department.createMany({
      data: departmentDefault.map((department) => ({
        ...department,
      })),
    });

    await tx.jobPosition.deleteMany({});
    await tx.jobPosition.createMany({
      data: jobPositionDefault.map((jobPosition) => ({
        ...jobPosition,
      })),
    });

    await tx.employmentStatus.deleteMany({});
    await tx.employmentStatus.createMany({
      data: employmentStatusDefault.map((employmentStatus) => ({
        ...employmentStatus,
      })),
    });

    await tx.user.deleteMany({});
    await tx.user.createMany({
      data: await Promise.all(
        adminDefault.map(async (user) => ({
          ...user,
          password: await hashPassword(user.password),
          birth_date: new Date(user.birth_date),
        }))
      ),
    });

    await tx.question.deleteMany({});
    for (const question of questionDefault) {
      await tx.question.create({
        data: {
          question: question.question,
          question_answer: {
            createMany: {
              data: question.answer.map((answer, index) => ({
                question_answer: answer,
                value: question.value[index],
              })),
            },
          },
        },
      });
    }
  });
}

main();
