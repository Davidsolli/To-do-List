import dotenv from "dotenv";
import express, { Request, Response } from "express";

import "./database/db";
import router from "./routes/routes";
import { db } from "./database/db";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.use("/api", router);

app.listen(PORT, () => {
  console.log(`Servidor rodando http://localhost:${PORT}`);
});
