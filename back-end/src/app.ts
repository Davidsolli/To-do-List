import dotenv from "dotenv";
import express from "express";

import "./database/db";
import router from "./routes/routes";

dotenv.config();

const app = express();

app.use(express.json());
app.use("/api", router);

export default app;
