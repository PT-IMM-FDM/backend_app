import morgan from "morgan";
import chalk from "chalk";
import { Request, Response } from "express";

// Custom tokens
morgan.token("date", () => new Date().toLocaleString());
morgan.token("colored-method", (req: Request) => {
  const method = req.method;
  switch (method) {
    case "GET":
      return chalk.green(method);
    case "POST":
      return chalk.blue(method);
    case "PUT":
      return chalk.yellow(method);
    case "DELETE":
      return chalk.red(method);
    default:
      return chalk.white(method);
  }
});

morgan.token("colored-status", (_req: Request, res: Response) => {
  const status = res.statusCode;
  if (status >= 500) {
    return chalk.red(status.toString());
  } else if (status >= 400) {
    return chalk.yellow(status.toString());
  } else if (status >= 300) {
    return chalk.cyan(status.toString());
  } else if (status >= 200) {
    return chalk.green(status.toString());
  }
  return status.toString();
});

// Custom format
const customFormat =
  ":date - :colored-method :url :colored-status :response-time ms";

// Export configured morgan middleware
export const loggerMiddleware = morgan(customFormat);
