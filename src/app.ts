import express, { Express } from "express";
import cors from "cors";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import cron from "node-cron";
import path from "path";
import { clientWhatsapp, sendMessageFdmUnfit } from "./utils";
import { ErrorMiddleware } from "./middlewares";
import { loggerMiddleware } from "./middlewares/loggerCLI";
import { authRoute } from "./features/auth";
import { userRoute } from "./features/user-management";
import { documentRoute } from "./features/documentTransfer";
import companyRoute from "./features/management-company/companyRoute";
import { fdmRoute } from "./features/fitDailyMonitoring";

dotenv.config();
const app: Express = express();
// const whatsapp = clientWhatsapp.initialize()

app.use(cors());
app.use(express.json());
app.use(loggerMiddleware); // Middleware morgan but custom
app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));


app.use("/public", express.static(path.join(__dirname, "../public")));
app.get("/", (req, res) => {
  res.send("Hello World");
});
app.use("/auth", authRoute)
app.use("/user", userRoute);
app.use("/document", documentRoute);
app.use("/company", companyRoute);
app.use("/fdm", fdmRoute);

app.use(ErrorMiddleware.notFound);
app.use(ErrorMiddleware.returnError);

export default app;
