import { Request, Response, NextFunction } from "express";
import { AuthService } from "./auth-service";
import { AdminToken, UserToken } from "../../models";

export class AuthController {
  static async loginAdmin(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;
      const token = await AuthService.loginAdmin({ email, password });
      return res.status(200).json({
        success: true,
        data: { ...token },
        message: "Admin logged in successfully",
      });
    } catch (error) {
      next(error);
    }
  }

  static async loginUser(req: Request, res: Response, next: NextFunction) {
    try {
      const { number_phone } = req.body;
      const token = await AuthService.loginUser({ number_phone });
      return res.status(200).json({
        success: true,
        data: { ...token },
        message: "User logged in successfully",
      });
    } catch (error) {
      next(error);
    }
  }

  static async currentLoggedIn(req: Request, res: Response, next: NextFunction) {
    try {
      const user = res.locals.user as AdminToken | UserToken;
      const data = await AuthService.currentLoggedIn(user.admin_id, user.user_id);
      return res.status(200).json({
        success: true,
        data,
        message: "Current logged in user",
      });
    } catch (error) {
      next(error);
    }
  }
}
