import app from "./app";
import { logger } from "./applications";

app.listen(process.env.PORT, () => {
  console.log(`Server running on port http://localhost:${process.env.PORT}`);
  const currentTime = new Date().toLocaleString();
  logger.info(`Server running on port http://localhost:${process.env.PORT} at ${currentTime}`);
});
