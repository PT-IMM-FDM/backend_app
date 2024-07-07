import { Request, Response, NextFunction } from "express";
import { CompanyService } from "./companyService";

export class CompanyController {
  static async createCompany(req: Request, res: Response, next: NextFunction) {
    try {
      const { name } = req.body;
      const company = await CompanyService.createCompany({ name });
      res.status(200).json({
        success: true,
        data: company,
        message: `Company ${company.name} has been created`,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getCompany(req: Request, res: Response, next: NextFunction) {
    try {
      const company = await CompanyService.getCompany();
      res.status(200).json({
        success: true,
        data: company,
        message: `Company has been fetched`,
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateCompany(req: Request, res: Response, next: NextFunction) {
    try {
      const { company_id, name } = req.body;
      const company = await CompanyService.updateCompany({ company_id, name });
      res.status(200).json({
        success: true,
        data: company,
        message: `Company ${company.name} has been updated`,
      });
    } catch (error) {
      next(error);
    }
  }

  static async deleteCompany(req: Request, res: Response, next: NextFunction) {
    try {
      const { company_id } = req.body;
      const company = await CompanyService.deleteCompany({ company_id });
      res.status(200).json({
        success: true,
        data: company,
        message: `Company has been deleted`,
      });
    } catch (error) {
      next(error);
    }
  }
}
