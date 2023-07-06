import { db } from "../app.js";
import joi from "joi";
import bcrypt from "bcrypt";
import { v4 as uuid } from "uuid";

export const signup = async (req, res) => {
  const { name, email, password } = req.body;

  const userSchema = joi.object({
    name: joi.string().required(),
    email: joi.string().email().required(),
    password: joi.string().required().min(3),
  });

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
};

export const signin = async (req, res) => {
  const { email, password } = req.body;

  const userSchema = joi.object({
    email: joi.string().email().required(),
    password: joi.string().required().min(3),
  });

  const validation = userSchema.validate(req.body, { abortEarly: false });
  if (validation.error) {
    const errors = validation.error.details.map((detail) => detail.message);
    return res.status(422).send(errors);
  }

  try {
    const user = await db.collection("users").findOne({ email });

    if (!user) return res.sendStatus(404);
    if (!bcrypt.compareSync(password, user.password))
      return res.status(401).send("Senha incorreta");

    const token = uuid();
    await db.collection("sessions").insertOne({ userId: user._id, token });
    res.status(200).send(token);
  } catch (err) {
    res.status(500).send(err.message);
  }
};

export const loggedUser = async (req, res) => {
  const { authorization } = req.headers;
  const token = authorization?.replace("Bearer ", "");

  if (!token) return res.sendStatus(401);

  const session = await db.collection("sessions").findOne({ token });
  if (!session) return res.sendStatus(401);

  const user = await db.collection("users").findOne({
    _id: session.userId,
  });
  if (user) {
    delete user.password;
    res.send(user);
  } else {
    res.send(401);
  }
};
