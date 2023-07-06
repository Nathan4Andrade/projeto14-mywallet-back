import { db } from "../app.js";
import joi from "joi";
import dayjs from "dayjs";

const currentTime = dayjs().format("DD/MM");

export const newTransaction = async (req, res) => {
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
};

export const getTransaction = async (req, res) => {
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
};
