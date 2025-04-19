import { FfmpegCommand } from "fluent-ffmpeg";

export type CommandObject = {
  [key: string]: FfmpegCommand;
};