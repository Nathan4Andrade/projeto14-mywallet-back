import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { MongoClient } from "mongodb";

import {
  getTransaction,
  newTransaction,
} from "./controllers/transactionController.js";
import { loggedUser, signin, signup } from "./controllers/userController.js";

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

const mongoClient = new MongoClient(process.env.DATABASE_URL);

export let db;

mongoClient
  .connect()
  .then(() => (db = mongoClient.db()))
  .catch((err) => console.log(err.message));

app.post("/sign-up", signup);

app.post("/sign-in", signin);

app.post("/nova-transacao/:tipo", newTransaction);

app.get("/transactions", getTransaction);

app.get("/logged-user", loggedUser);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Running server on port ${PORT}`));
