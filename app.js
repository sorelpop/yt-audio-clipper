const fs = require('fs');
const ytdl = require('ytdl-core');
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const randomstring = require('randomstring');
const cmdline = require('command-line-args');
const cmdlineusage = require('command-line-usage');

const optionDefinitions = [
	{ name: "help", alias: "h", type: Boolean, description: "Prints this message"},
	{ name: "output", alias: "o", type: String, description: "Name of the output file. Extension not needed"},
	{ name: "url", alias: "u", type: String, typeLabel: "<https://youtube...>", description: "The URL from which the sound needs to be extracted"},
	{ name: "start", alias: "s", type: String, description: "This argument may be a number (in seconds) or a timestamp string (with format [[hh:]mm:]ss[.xxx]"},
	{ name: "duration", alias: "d", type: String, description: "This argument may be a number (in seconds) or a timestamp string (with format [[hh:]mm:]ss[.xxx]"}
]

const options = cmdline(optionDefinitions);

if (options.help) {
	const usage = cmdlineusage([
    {
      header: 'yt-audio-clipper',
      content: 'A simple tool used to extract, and/or clip sound from YouTube videos.'
    },
    {
      header: 'Options',
      optionList: optionDefinitions
    },
  ])
  console.log(usage)
  process.exit(0);
}

var url = options.url;
var outputName = "output.aac";
if (options.output) {
	outputName = options.output;
}

var tempPath = randomstring.generate(10) + ".mp4";
var videoOutput = path.resolve(__dirname, tempPath);
ffmpeg.setFfmpegPath(ffmpegPath);

ytdl(url, { filter: function(f) {
  return f.container === 'mp4'; }})
  .pipe(fs.createWriteStream(videoOutput))
  .on('finish', () => {
    ffmpeg()
      .input(videoOutput)
      //.audioCodec('mp3')
      .noVideo()
      .seekInput(options.start)
      .duration(options.duration)
      .save(path.resolve(__dirname, outputName))
      .on('error', console.error)
      .on('progress', function(progress) {
        process.stdout.cursorTo(0);
        process.stdout.clearLine(1);
        process.stdout.write(progress.timemark);
      }).on('end', () => {
      	fs.unlink(tempPath, () => {
          console.log("Finished");
        });
      });
  });