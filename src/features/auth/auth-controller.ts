import { Request, Response, NextFunction } from "express";
import { AuthService } from "./auth-service";
import { UserToken } from "../../models";

export class AuthController {
  static async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email_or_phone_number, password } = req.body;
      const token = await AuthService.login({ email_or_phone_number, password });
      return res.status(200).json({
        success: true,
        data: { ...token },
        message: "login successfully",
      });
    } catch (error) {
      next(error);
    }
  }

  static async currentLoggedIn(req: Request, res: Response, next: NextFunction) {
    try {
      const user = res.locals.user as UserToken;
      const data = await AuthService.currentLoggedIn(user.user_id);
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
