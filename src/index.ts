import express from "express";
import cors from "cors";
import { initServer, createExpressEndpoints } from "@ts-rest/express";
import { apiContract } from "./contract";
import { generateOpenApi } from "@ts-rest/open-api";
import { serve, setup } from "swagger-ui-express";
import { YoutubeTranscript } from "youtube-transcript";

const app = express();

app.use(cors());
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

const s = initServer();

const router = s.router(apiContract, {
  transcribeVideo: async ({ body }) => {
    const transcript = await YoutubeTranscript.fetchTranscript(body.videoUrl);
    return {
      status: 200,
      body: {
        url: body.videoUrl,
        content: transcript.map((item) => item.text).join("\n"),
        language: "English",
      },
    };
  },
});

const openapiDocument = generateOpenApi(
  apiContract,
  {
    openapi: "3.0.0",
    info: { title: "EchoTube API", version: "1.0.0" },
    servers: [
      {
        url: process.env.BASE_URL || "http://localhost:3333/",
      },
    ],
  },
  {
    setOperationId: true,
  }
);

const apiDocs = express.Router();
apiDocs.use(serve);
apiDocs.get("/", setup(openapiDocument));
app.use("/api/docs", apiDocs);
app.get("/api/swagger.json", (req, res) => {
  res.json(openapiDocument);
});

createExpressEndpoints(apiContract, router, app);

const port = process.env.port || 3333;
const server = app.listen(port, () => {
  console.log(`Listening at http://localhost:${port}`);
});
