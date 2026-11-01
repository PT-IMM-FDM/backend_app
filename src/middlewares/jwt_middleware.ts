import { Request, Response, NextFunction } from "express";
import { ErrorResponse } from "../models";
import jwt from "jsonwebtoken";
import { UserToken } from "../models/token_model";
import { prisma } from "../applications";

const ROLE_TTL_MS = 60_000;
// Cache role per user supaya middleware tidak query DB di setiap request.
// TTL pendek (60s) agar perubahan role tetap tertangkap cepat.
const roleCache = new Map<string, { role: string; expires: number }>();

const getCachedRole = async (user_id: string): Promise<string | undefined> => {
  const hit = roleCache.get(user_id);
  if (hit && hit.expires > Date.now()) {
    return hit.role;
  }
  const userData = await prisma.user.findFirst({
    where: { user_id },
    select: { role: { select: { name: true } } },
  });
  if (!userData) return undefined;
  roleCache.set(user_id, {
    role: userData.role.name,
    expires: Date.now() + ROLE_TTL_MS,
  });
  return userData.role.name;
};

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
        const roleName = await getCachedRole(user_id);

        if (roleName && roleName !== "Admin") {
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
        const roleName = await getCachedRole(user_id);

        if (
          roleName &&
          roleName !== "Admin" &&
          roleName !== "Viewer" &&
          roleName !== "Full Viewer"
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
