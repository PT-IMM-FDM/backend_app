import { roleDefault } from "./roleDefault";
import { adminDefault } from "./adminDefault";
import { companyDefault } from "./companyDefault";
import { departmentDefault } from "./departmentDefault";
import { jobPositionDefault } from "./jobPositionDefault";
import { employmentStatusDefault } from "./employmentStatusDefault";
import { prisma } from "../../src/applications";
import { hashPassword } from "../../src/utils";

async function main() {
  await prisma.role.deleteMany({});
  await prisma.role.createMany({
    data: roleDefault,
  });

  await prisma.company.deleteMany({});
  await prisma.company.createMany({
    data: companyDefault.map((company) => ({
      ...company,
    })),
  });

  await prisma.department.deleteMany({});
  await prisma.department.createMany({
    data: departmentDefault.map((department) => ({
      ...department,
    })),
  });

  await prisma.jobPosition.deleteMany({});
  await prisma.jobPosition.createMany({
    data: jobPositionDefault.map((jobPosition) => ({
      ...jobPosition,
    })),
  });

  await prisma.employmentStatus.deleteMany({});
  await prisma.employmentStatus.createMany({
    data: employmentStatusDefault.map((employmentStatus) => ({
      ...employmentStatus,
    })),
  });

  await prisma.admin.deleteMany({});
  await prisma.admin.createMany({
    data: adminDefault.map((admin) => ({
      ...admin,
      password: hashPassword(admin.password),
    })),
  });
}

main();
