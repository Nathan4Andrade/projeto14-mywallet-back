import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { MongoClient } from "mongodb";
import joi from "joi";
import dayjs from "dayjs";
import bcrypt from "bcrypt";
import { v4 as uuid } from "uuid";

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

const userSchema = joi.object({
  name: joi.string().required(),
  email: joi.string().email().required(),
  password: joi.string().required(),
});

app.post("/sign-up", async (req, res) => {
  // nome, email e senha
  const { name, email, password } = req.body;

  const validation = userSchema.validate(req.body, { abortEarly: false });
  if (validation.error) {
    const errors = validation.error.details.map((detail) => detail.message);
    return res.status(422).send(errors);
  }

  try {
    const user = await db.collection("users").findOne({ email });
    if (user) return res.status(409).send("E-mail já cadastrado");

    const hash = bcrypt.hashSync(password, 10);

    await db.collection("users").insertOne({ name, email, password: hash });
    res.sendStatus(201);
  } catch (err) {
    return res.status(500).send(err.message);
  }
});

app.post("/sign-in", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await db.collection("users").findOne({ email });

    if (!user) return res.sendStatus(401);
    if (!bcrypt.compareSync(password, user.password))
      return res.sendStatus(401);

    const token = uuid();
    await db.collection("sessions").insertOne({ userId: user._id, token });
    res.status(200).send(token);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

/* const transactions1 = [
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
 */
app.post("/nova-transacao/:tipo", async (req, res) => {
  const { description, value, deposit } = req.body;

  const { authorization } = req.headers;
  console.log(authorization);
  const token = authorization?.replace("Bearer ", "");

  if (!token) return res.sendStatus(401);

  const session = await db.collection("sessions").findOne({ token });
  if (!session) return res.sendStatus(401);

  const user = await db.collection("users").findOne({
    _id: session.userId,
  });

  if (user) {
    const schemaTransaction = joi.object({
      description: joi.string().required(),
      value: joi.number().required(),
      deposit: joi.boolean().required(),
    });

    const validation = schemaTransaction.validate(req.body, {
      abortEarly: false,
    });

    if (validation.error) {
      const errors = validation.error.details.map((detail) => detail.message);
      return res.status(422).send(errors);
    }

    const newTransaction = {
      userId: user._id,
      date: currentTime,
      description,
      value,
      deposit,
    };

    try {
      await db.collection("transactions").insertOne(newTransaction);
      res.sendStatus(201);
    } catch (err) {
      res.status(500).send(err.message);
    }
  } else {
    res.sendStatus(401);
  }
});

app.get("/transactions", async (req, res) => {
  const { authorization } = req.headers;
  const token = authorization?.replace("Bearer ", "");

  if (!token) return res.sendStatus(401);

  const session = await db.collection("sessions").findOne({ token });
  if (!session) return res.sendStatus(401);

  const user = await db.collection("users").findOne({
    _id: session.userId,
  });
  if (user) {
    try {
      const transactions = await db
        .collection("transactions")
        .find({ userId: user._id })
        .toArray();
      res.send(transactions);
    } catch (err) {
      res.status(500).send(err.message);
    }
  } else {
    res.send(401);
  }
});

const PORT = 5000;
app.listen(PORT, () => console.log(`Running server on port ${PORT}`));
