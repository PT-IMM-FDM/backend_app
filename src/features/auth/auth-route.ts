import { Router } from "express";
import { JwtMiddleware } from "../../middlewares/jwt_middleware";
import { AuthController } from "./auth-controller";

const authRoute: Router = Router();

authRoute.post("/login/admin", AuthController.loginAdmin);
authRoute.post("/login/user", AuthController.loginUser);
authRoute.get("/me", [
  JwtMiddleware.verifyToken,
  AuthController.currentLoggedIn,
]);

export default authRoute;
