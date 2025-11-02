import express from "express";
import cors from "cors";
import { errorMiddleware } from "@packages/error-handler/error-middleware";
import cookieParser from "cookie-parser";
import router from "./routes/auth.router";
import swaggerUi from 'swagger-ui-express';
const swaggerUiDocument = require('./swagger-output.json');

const app = express();

app.use(
  cors({
    origin: ["http://localhost:3000"],
    allowedHeaders: ["Authorization", "Content-Type"],
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());

app.get("/", (req, res) => {
  res.send({ message: "Hello API" });
});

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerUiDocument));
app.get("/docs.json", (req, res) => {
  res.json(swaggerUiDocument);
});
// Routes
app.use('/api', router);

app.use(errorMiddleware)

const port = process.env.PORT ? Number(process.env.PORT) : 6001;

const server = app.listen(port, () => {
  console.log(`Listening at http://localhost:${port}/`);
  console.log(`API Docs UI at http://localhost:${port}/api-docs`);
  console.log(`API Docs JSON at http://localhost:${port}/docs.json`);
});

server.on("error", (err) => {
  console.log("Server error", err);
});
