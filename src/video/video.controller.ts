import { Controller, Get, Header, Headers, HttpStatus, Param, Res, StreamableFile } from "@nestjs/common";
import { VideoService } from "./video.service";
import { createReadStream, statSync } from "fs";
import { Response } from "express";
import { join } from "path";

@Controller("video")
export class VideoController {
    constructor(private readonly videoService: VideoService) { }
    @Get("stream/:id")
    @Header("Accept-Range", "bytes")
    @Header("Content-Type", "video/mp4")
    async getStreamVideo(
        @Param("id") id: string,
        @Headers() headers,
        @Res() res: Response,
    ) {
        const videoPath = `assets/${id}.mp4`
        const { size } = statSync(videoPath);
        const videoRange: string = headers.range;
        if (videoRange) {
            console.log("video range:" + videoRange);
            const parts = videoRange.replace(/bytes=/, "").split("-");
            const start = parseInt(parts[0], 10);
            const end = parts[1] ? parseInt(parts[1], 10) : size - 1;
            const chunksize = (end - start) + 1;
            const readStreamFile = createReadStream(videoPath, { start, end, highWaterMark: 20 });
            const head = {
                "Content-Range": `bytes ${start}-${end}/${size}`,
                "Content-Length": chunksize,
            };
            res.writeHead(HttpStatus.PARTIAL_CONTENT, head);
            readStreamFile.pipe(res);

        }
        else {
            const head = { "Content-Length": size, };
            res.writeHead(HttpStatus.OK, head); //200
            createReadStream(videoPath).pipe(res);

        }
    }
    @Get("/getJson")
    async  getJson() {
        const file =createReadStream(join(process.cwd(), "package.json"));
        return new StreamableFile(file);
    }
    @Get("/")
    async index() {
        return "hello guy";
    }
}
