import { Router } from "express";
import { JwtMiddleware } from "../../middlewares/jwt_middleware";
import { questionRoute } from "./question";
import { FdmController } from "./fdmController";
import { responseUserRoute } from "./responseUser";
import { upload } from "../../middlewares/multer";

const fdmRoute = Router();

fdmRoute.use("/question", questionRoute);
fdmRoute.use("/response", responseUserRoute);
fdmRoute.get("/", [
  JwtMiddleware.verifyToken,
  JwtMiddleware.adminOrViewer,
  FdmController.getFDM,
]);
fdmRoute.get("/me", [JwtMiddleware.verifyToken, FdmController.getMyFDM]);
fdmRoute.get("/countResult", [
  JwtMiddleware.verifyToken,
  JwtMiddleware.adminOrViewer,
  FdmController.countResult,
]);
fdmRoute.get("/countFilledToday", [
  JwtMiddleware.verifyToken,
  JwtMiddleware.adminOrViewer,
  FdmController.countFilledToday,
]);
fdmRoute.get("/usersNotFilledToday", [
  JwtMiddleware.verifyToken,
  JwtMiddleware.adminOrViewer,
  FdmController.getUsersNotFilledToday,
]);
fdmRoute.post("/addAttachment/:attendance_health_result_id", [
  JwtMiddleware.verifyToken,
  JwtMiddleware.adminOnly,
  upload.single("fdm_attachment_file"),
  FdmController.addAttachmentFile,
]);
fdmRoute.delete(
  "/:attendance_health_result_id/deleteAttachment/:attendance_health_file_attachment_id",
  [
    JwtMiddleware.verifyToken,
    JwtMiddleware.adminOnly,
    FdmController.deleteAttachmentFile,
  ]
);

export default fdmRoute;
