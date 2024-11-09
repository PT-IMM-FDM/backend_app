import { Router } from "express";
import { DocumentController } from "./documentController";
import { upload } from "../../middlewares/multer";
import { JwtMiddleware } from "../../middlewares/jwt_middleware";

const documentRoute = Router();

documentRoute.get("/list-users", [
  JwtMiddleware.verifyToken,
  JwtMiddleware.adminOrViewer,
  DocumentController.exportFileListUsers,
]);

documentRoute.post("/import-users", [
  JwtMiddleware.verifyToken,
  JwtMiddleware.adminOnly,
  upload.single("file_of_users"),
  DocumentController.importFileListUsers,
]);

documentRoute.get("/template-users", [
  // JwtMiddleware.verifyToken,
  // JwtMiddleware.adminOrViewer,
  DocumentController.templateFileListUsers,
]);

documentRoute.post("/export-fdm", [
  JwtMiddleware.verifyToken,
  JwtMiddleware.adminOrViewer,
  DocumentController.exportDataFdm,
]);

export default documentRoute;
