import dotenv from "dotenv";
import express, { Request, Response } from "express";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.use("/", (req: Request, res: Response) => {
    res.send("Servidor to-do-list🚀!!!")
});

app.listen(PORT, () => {
  console.log(`Servidor rodando http://localhost:${PORT}`);
});
