import { Validation } from "../../../validations";
import { ErrorResponse } from "../../../models";
import { prisma } from "../../../applications";
import { JobPositionValidation } from "./jobPositionValidation";
import {
  CreateJobPositionRequest,
  DeleteJobPositionRequest,
  UpdateJobPositionRequest,
} from "./jobPositionModel";

export class JobPositionService {
  static async createJobPosition(data: CreateJobPositionRequest) {
    const validateData = Validation.validate(
      JobPositionValidation.CREATE_JOB_POSITION,
      data
    );

    const jobPosition = await prisma.jobPosition.create({
      data: {
        name: validateData.name,
      },
    });

    return jobPosition;
  }

  static async getJobPosition() {
    const jobPosition = await prisma.jobPosition.findMany();
    return jobPosition;
  }

  static async updateJobPosition(data: UpdateJobPositionRequest) {
    const validateData = Validation.validate(
      JobPositionValidation.UPDATE_JOB_POSITION,
      data
    );
    const jobPosition = await prisma.jobPosition.update({
      where: {
        job_position_id: validateData.job_position_id,
      },
      data: {
        name: validateData.name,
      },
    });

    return jobPosition;
  }

  static async deleteJobPosition(data: DeleteJobPositionRequest) {
    const validateData = Validation.validate(
      JobPositionValidation.DELETE_JOB_POSITION,
      data
    );
    const jobPosition = await prisma.jobPosition.delete({
      where: {
        job_position_id: validateData.job_position_id,
      },
    });

    return jobPosition;
  }
}
