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
import { ISearchResponse, Innertube, UniversalCache } from "youtubei.js";

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
// https://www.youtube.com/shorts/VIDEO_ID
const getYoutubeVideoId = (url: string) => {
  const regex =
    /(?:\/embed\/|\/v\/|\/watch\?v=|youtu\.be\/|\/shorts\/)([a-zA-Z0-9_-]+)/;
  const match = url.match(regex);
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
  findChannel: async ({ body }) => {
    const yt = await Innertube.create({
      cache: new UniversalCache(false),
    });

    const res = await yt.search(body.query, { type: "channel" });
    if (res.results) {
      return {
        status: 200,
        body: {
          data: res.results.map((item: any) => ({
            type: item.type,
            id: item.id,
            text: item.short_byline.text,
            thumbnails: item.author.thumbnails,
            subscriber_count: item.video_count.text,
            video_count: item.subscriber_count.text,
          })),
        },
      };
    }

    return {
      status: 404,
      body: "",
    };
  },
  getChannelVideos: async ({ body }) => {
    const yt = await Innertube.create({
      cache: new UniversalCache(false),
    });

    const res = await yt.getChannel(body.id);
    if (res) {
      const content = (await res.getVideos()).current_tab?.content as any;
      return {
        status: 200,
        body: {
          value: content.contents
            .filter((item: any) => item.content)
            .map((item: any) => ({
              id: item.content.id,
              title: item.content.title.text,
              description_snippet: item.content.description_snippet?.text || "",
              published: item.content.published.text,
              thumbnails: item.content.thumbnails.slice(0, 1),
              // content: item.content,
            })),
        },
      };
    }

    return {
      status: 404,
      body: "",
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
