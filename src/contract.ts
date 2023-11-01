import { initContract } from "@ts-rest/core";
import { z } from "zod";

export const contract = initContract();

const PostSchema = z.object({
  language: z.string(),
  url: z.string(),
  content: z.string(),
});

const TranscriptSchema = z.object({
  language: z.string(),
  url: z.string(),
  content: z.any(),
});

const VideoInfoSchema = z.object({
  data: z.any(),
});

export const apiContract = contract.router({
  transcribeVideo: {
    method: "POST",
    path: "/transcribe",
    responses: {
      200: PostSchema,
    },
    body: z.object({
      videoUrl: z.string(),
    }),
    summary: "Transcribe YouTube video by videoUrl",
  },
  getTranscript: {
    method: "POST",
    path: "/get-transcript",
    responses: {
      200: TranscriptSchema,
    },
    body: z.object({
      videoUrl: z.string(),
    }),
    summary: "Get youtube transcriptions.",
  },
  getVideoInfo: {
    method: "POST",
    path: "/get-video-info",
    responses: {
      200: VideoInfoSchema,
    },
    body: z.object({
      videoUrl: z.string(),
    }),
    summary: "Get video info like, description, thumbnail, title hastag etc.",
  },
  findChannel: {
    method: "POST",
    path: "/channels",
    responses: {
      200: z.any(),
    },
    body: z.object({
      query: z.string(),
    }),
    summary: "Search channels",
  },
  getChannelVideos: {
    method: "POST",
    path: "/channel/videos",
    responses: {
      200: z.any(),
    },
    body: z.object({
      id: z.string(),
    }),
    summary: "Get trending videos.",
  },
});
