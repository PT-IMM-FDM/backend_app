import { Router } from "express";
import { JwtMiddleware } from "../../middlewares/jwt_middleware";
import { UserController } from "./userController";

const userRoute: Router = Router();

userRoute.post("/create", [
  JwtMiddleware.verifyToken,
  JwtMiddleware.adminOnly,
  UserController.createUser,
]);

userRoute.get("/", [
  JwtMiddleware.verifyToken,
  UserController.getUsers,
]);

userRoute.put("/update", [
  JwtMiddleware.verifyToken,
  JwtMiddleware.adminOnly,
  UserController.updateUser,
])

userRoute.delete("/delete", [
  JwtMiddleware.verifyToken,
  JwtMiddleware.adminOnly,
  UserController.deleteUser,
])
export default userRoute;