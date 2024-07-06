import { Request, Response, NextFunction } from "express";
import { ErrorResponse } from "../models";
import jwt from "jsonwebtoken";
import { UserToken } from "../models/token_model";
import { prisma } from "../applications";

export class JwtMiddleware {
  static async verifyToken(req: Request, res: Response, next: NextFunction) {
    try {
      const token = req.headers.authorization?.split(" ")[1];
      if (!token) {
        throw new ErrorResponse("Unauthorized", 401, ["token"], "UNAUTHORIZED");
      }
      const decoded = jwt.verify(token, process.env.JWT_SECRET!);
      res.locals.user = decoded as UserToken;
      next();
    } catch (error) {
      next(error);
    }
  }

  static async adminOnly(req: Request, res: Response, next: NextFunction) {
    try {
      const { user_id } = res.locals.user as UserToken;

      if (user_id) {
        const userData = await prisma.user.findFirst({
          where: {
            user_id,
          },
          select: {
            role: {
              select: {
                name: true,
              },
            },
          },
        });

        if (userData && userData.role.name !== "Admin") {
          throw new ErrorResponse(
            "Only be accessed by Admin.",
            403,
            ["ADMIN_ONLY"],
            "ADMIN_ONLY"
          );
        }
      }
      next();
    } catch (error) {
      next(error);
    }
  }

  static async adminOrViewer(req: Request, res: Response, next: NextFunction) {
    try {
      const { user_id } = res.locals.user as UserToken;

      if (user_id) {
        const userData = await prisma.user.findFirst({
          where: {
            user_id,
          },
          select: {
            role: {
              select: {
                name: true,
              },
            },
          },
        });

        if (
          (userData && userData.role.name !== "Admin") &&
          (userData && userData.role.name !== "Viewer")
        ) {
          throw new ErrorResponse(
            "Only be accessed by Admin or Viewer.",
            403,
            ["ADMIN_OR_VIEWER_ONLY"],
            "ADMIN_OR_VIEWER_ONLY"
          );
        }
      }
      next();
    } catch (error) {
      next(error);
    }
  }
}
