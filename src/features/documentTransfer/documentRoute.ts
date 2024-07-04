import { Router } from "express";
import { DocumentController } from "./documentController";

const documentRoute = Router();

documentRoute.get("/list-users", DocumentController.getDocumentListUsers);

export default documentRoute;