import { Live, PrismaClient, Video } from "@prisma/client";
import ffmpeg from 'fluent-ffmpeg';
import { CommandObject } from "../types/command_object";
const prisma = new PrismaClient();

export const startStreaming = (live: Live, video: Video, ffMpegProcess: CommandObject, max_quality: number, watermark: Boolean) => {
  let resolution = '';
  let videoBitrate = '';

  if (max_quality === 720) {
    resolution = '1280x720';
    videoBitrate = '3500k';
  }

  if (max_quality === 1080) {
    resolution = '1920x1080';
    videoBitrate = '5000k';
  }

  if (max_quality === 4096) {
    resolution = '3840x2160';
    videoBitrate = '20000k';
  }

  const command = ffmpeg()
    .input('./public/' + video.video)
    .inputOptions('-re')
    .videoCodec('libx264')
    .audioCodec('aac')
    .outputOptions([
      '-preset veryfast',
      '-g 50',
      `-b:v ${videoBitrate}`,
      '-b:a 128k',
      `-s ${resolution}`,
      '-f flv'
    ])
    .format('flv')

    if (watermark) {
      command.input('./public/watermark.png') // Add the watermark image
        .complexFilter([ 
          'overlay=W-w-10:H-h-10'  // Adjust watermark position (bottom-right corner with a 10px margin)
        ]);
    }


  command.on('start', async commandLine => {
    console.log('\n🚀 Memulai streaming ke YouTube...');
    console.log('FFmpeg command:', commandLine);
    await prisma.history.create({ data: { liveId: live.id } })
  })
    .on('error', (err, stdout, stderr) => {
      console.error('\n❌ Terjadi kesalahan saat streaming:');
      console.error(err.message);
    })
    .on('end', async () => {
      if (live.loop) {
        ffMpegProcess[live.uuid].run();
        return;
      }

      await prisma.live.update({ where: { id: live.id }, data: { live: false } })
      await prisma.history.updateMany({ where: { live: { uuid: live.uuid } }, data: { updatedAt: new Date() } })
      console.log('\n✅ Streaming selesai.');
    })
    .output(live.rtmpUrl + '/' + live.streamKey)

  ffMpegProcess[live.uuid] = command;
  ffMpegProcess[live.uuid].run();

  console.log(`\n🔴 Streaming dimulai dengan UUID: ${live.uuid}`);
}

export const stopStreaming = (live: Live, ffMpegProcess: CommandObject) => {
  if (ffMpegProcess[live.uuid]) {
    ffMpegProcess[live.uuid].kill('SIGKILL');
    delete ffMpegProcess[live.uuid];
    console.log(`\n🔴 Streaming dihentikan dengan UUID: ${live.uuid}`);
  } else {
    console.log('\n❌ Tidak ada streaming yang sedang berjalan.');
  }
}