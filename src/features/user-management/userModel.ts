import { User } from "@prisma/client";

export type CreateUserRequest = Omit<
  User,
  "user_id" | "created_at" | "deleted_at"
>;

export type CreateUserResponse = User;