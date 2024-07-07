import { Company } from "@prisma/client";

export type CreateCompanyRequest = {
  name: string;
};

export type CreateCompanyResponse = Company

export type GetCompanyResponse = Company[]

export type UpdateCompanyRequest = {
  company_id: number;
  name: string;
};

export type UpdateCompanyResponse = Company

export type DeleteCompanyRequest = {
  company_id: number;
};
