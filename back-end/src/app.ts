import dotenv from "dotenv";
import express from "express";
import cookieParser from "cookie-parser";

import "./database/db";
import router from "./routes/routes";
import { db } from "./database/db";

dotenv.config();

const app = express();

app.use(express.json());
app.use(cookieParser());

app.use("/api", router);

export default app;
