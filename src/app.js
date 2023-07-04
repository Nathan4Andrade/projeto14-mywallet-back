import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { MongoClient } from "mongodb";
import Joi from "joi";
import dayjs from "dayjs";

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

const currentTime = dayjs().format("DD/MM");

const mongoClient = new MongoClient(process.env.DATABASE_URL);

let db;

mongoClient
  .connect()
  .then(() => (db = mongoClient.db()))
  .catch((err) => console.log(err.message));

/* app.post("/login", async(req, res));
app.post("/cadastro", async(req, res));

app.get("/transacoes", (req, res));
 */

const transactions = [
  {
    id: 1,
    date: "03/07",
    description: "Almoço",
    value: 120.5,
    deposit: false,
  },
  { id: 2, date: "03/07", description: "Salário", value: 3000, deposit: true },
  { id: 3, date: "03/07", description: "Sushi", value: 49.9, deposit: false },
  { id: 4, date: "04/07", description: "Bônus", value: 500, deposit: true },
];

app.post("/nova-transacao/:tipo", async (req, res) => {
  const { description, value, deposit } = req.body;
  const newTransaction = {
    id: transactions.length + 1,
    date: currentTime,
    description,
    value,
    deposit,
  };

  transactions.push(newTransaction);
  res.send(newTransaction);
});
app.get("/transactions", (req, res) => {
  res.send(transactions);
});

const PORT = 5000;
app.listen(PORT, () => console.log(`Running server on port ${PORT}`));
