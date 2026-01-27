import dotenv from "dotenv";
import express from "express";
import cookieParser from "cookie-parser";

import "./database/db";
import router from "./routes/routes";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(cookieParser());

app.use("/api", router);

app.listen(PORT, () => {
  console.log(`Servidor rodando http://localhost:${PORT}`);
});
