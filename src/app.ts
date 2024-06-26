import express, { Express } from "express";
import cors from "cors";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import morgan from "morgan";
import cron from "node-cron";
import { ErrorMiddleware } from "./middlewares";
import { authRoute } from "./features/auth";

dotenv.config();
const app: Express = express();

cron.schedule("0 0 * * *", async () => {
  // await UserFormMiddleware.dailyCheckExpiredPremiumPackage()
});

app.use(cors());
app.use(express.json());
app.use(morgan("dev"));
app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.send("Hello World");
});
app.use("/auth", authRoute)


app.use(ErrorMiddleware.notFound);
app.use(ErrorMiddleware.returnError);

export default app;
