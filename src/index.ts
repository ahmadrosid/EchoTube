import express from "express";
import type { Request, Response } from "express";
import cors from "cors";
import { initServer, createExpressEndpoints } from "@ts-rest/express";
import { apiContract } from "./contract";
import { generateOpenApi } from "@ts-rest/open-api";
import { serve, setup } from "swagger-ui-express";
import { YoutubeTranscript } from "youtube-transcript";
const CSS_URL =
  "https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.1.0/swagger-ui.min.css";
import { Innertube, UniversalCache } from "youtubei.js";

const app = express();

app.use(cors());
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

const s = initServer();

// Typical YouTube URL formats:
// https://www.youtube.com/watch?v=VIDEO_ID
// https://youtu.be/VIDEO_ID
// https://www.youtube.com/embed/VIDEO_ID
// https://www.youtube.com/v/VIDEO_ID?version=3&autohide=1
const getYoutubeVideoId = (url: string) => {
  const match = url.match(
    /^(?:https?:\/\/)?(?:www\.)?(?:youtube\.com|youtu\.be)\/(?:watch\?v=)?(.{11})/
  );
  return match ? match[1] : null;
};

const router = s.router(apiContract, {
  transcribeVideo: async ({ body }) => {
    const yt = await Innertube.create({
      cache: new UniversalCache(false),
    });
    const videoId = getYoutubeVideoId(body.videoUrl);
    if (videoId === null) {
      return {
        status: 400,
        body: {
          message: "Invalid video URL",
        },
      };
    }
    const viodeoInfo = await yt.getBasicInfo(videoId);
    const transcript = await YoutubeTranscript.fetchTranscript(body.videoUrl);
    return {
      status: 200,
      body: {
        info: viodeoInfo.basic_info,
        url: body.videoUrl,
        content: transcript.map((item) => item.text).join("\n"),
        language: "English",
      },
    };
  },
  getTranscript: async ({ body }) => {
    const yt = await Innertube.create({
      cache: new UniversalCache(false),
    });
    const videoId = getYoutubeVideoId(body.videoUrl);
    if (videoId === null) {
      return {
        status: 400,
        body: {
          message: "Invalid video URL",
        },
      };
    }
    const viodeoInfo = await yt.getBasicInfo(videoId);
    const transcript = await YoutubeTranscript.fetchTranscript(body.videoUrl);
    return {
      status: 200,
      body: {
        info: viodeoInfo.basic_info,
        url: body.videoUrl,
        content: transcript,
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
apiDocs.get("/", setup(openapiDocument, { customCssUrl: CSS_URL }));
app.use("/docs", apiDocs);
app.get("/swagger.json", (req: Request, res: Response) => {
  res.contentType("application/json");
  res.send(JSON.stringify(openapiDocument, null, 2));
});

createExpressEndpoints(apiContract, router, app);

const port = process.env.port || 3333;
const server = app.listen(port, () => {
  console.log(`Listening at http://localhost:${port}`);
});
