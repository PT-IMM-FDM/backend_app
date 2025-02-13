import { Router } from "express";
import { JwtMiddleware } from "../../middlewares/jwt_middleware";
import { UserController } from "./userController";

const userRoute: Router = Router();

userRoute.post("/create", [
  JwtMiddleware.verifyToken,
  JwtMiddleware.adminOnly,
  UserController.createUser,
]);

userRoute.post("/", [
  JwtMiddleware.verifyToken,
  JwtMiddleware.adminOrViewer,
  UserController.getUsers,
]);

userRoute.get("/total", [
  JwtMiddleware.verifyToken,
  JwtMiddleware.adminOrViewer,
  UserController.getTotalUsers,
]);

userRoute.put("/update", [
  JwtMiddleware.verifyToken,
  JwtMiddleware.adminOnly,
  UserController.updateUser,
]);

userRoute.put("/update/me", [
  JwtMiddleware.verifyToken,
  UserController.updateMe,
]);

userRoute.delete("/delete", [
  JwtMiddleware.verifyToken,
  JwtMiddleware.adminOnly,
  UserController.deleteUser,
]);

userRoute.put("/updatePassword", [
  JwtMiddleware.verifyToken,
  UserController.updatePassword,
]);

userRoute.put("/resetPassword/:user_id", [
  JwtMiddleware.verifyToken,
  JwtMiddleware.adminOnly,
  UserController.resetPassword,
])

export default userRoute;
