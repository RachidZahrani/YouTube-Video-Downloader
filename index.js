import express from "express";
import fs from "fs";
import path from "path";
import ytdl from "@distube/ytdl-core";
import ffmpeg from "fluent-ffmpeg";

const app = express();
const port = 5000;

app.set("view engine", "ejs");
app.set("views", path.join(process.cwd(), "./views"));

app.use(express.json());
app.use((_req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    next();
});

app.use(express.urlencoded({ extended: true }));

app.use('/downloads', express.static(path.join(process.cwd(), 'downloads')));

app.get('/', (_req, res) => { res.render('index.ejs'); });

app.post('/download', async (req, res) => {
    const { url, format } = req.body;

    if (!url || !ytdl.validateURL(url)) {
        return res.status(400).json({ error: 'Invalid YouTube URL' });
    }

    try {
        const info = await ytdl.getInfo(url);
        const videoFormat = ytdl.chooseFormat(info.formats, { quality: 'highestvideo' });
        const audioFormat = ytdl.chooseFormat(info.formats, { quality: 'highestaudio' });

        const videoId = ytdl.getURLVideoID(url);
        const outputDirectory = path.resolve(process.cwd(), 'downloads');
        const videoOutput = path.join(outputDirectory, `${videoId}_video.mp4`);
        const audioOutput = path.join(outputDirectory, `${videoId}_audio.mp3`);
        const finalOutput = path.join(outputDirectory, `${videoId}.mp4`);

        if (!fs.existsSync(outputDirectory)) {
            fs.mkdirSync(outputDirectory, { recursive: true });
        }

        if (format === 'audio') {
            const audioStream = ytdl(url, { format: audioFormat });
            const audioFile = fs.createWriteStream(audioOutput);

            audioStream.pipe(audioFile);

            audioFile.on('finish', () => {
                res.json({ message: 'Audio download successful', file: `/downloads/${videoId}_audio.mp3` });
                setTimeout(() => {
                    try {
                        fs.unlinkSync(audioOutput);
                    } catch (err) {
                        console.error('Error deleting audio file:', err);
                    }
                }, 60000); // Delete after 1 minute
            });

            audioFile.on('error', (err) => {
                console.error('Error during audio download:', err.message);
                res.status(500).json({ error: 'Error downloading audio' });
            });

        } else {
            const videoStream = ytdl(url, { format: videoFormat });
            const audioStream = ytdl(url, { format: audioFormat });

            const videoFile = fs.createWriteStream(videoOutput);
            const audioFile = fs.createWriteStream(audioOutput);

            videoStream.pipe(videoFile);
            audioStream.pipe(audioFile);

            await Promise.all([
                new Promise((resolve, reject) => {
                    videoFile.on('finish', resolve);
                    videoFile.on('error', reject);
                }),
                new Promise((resolve, reject) => {
                    audioFile.on('finish', resolve);
                    audioFile.on('error', reject);
                })
            ]);

            ffmpeg()
                .input(videoOutput)
                .input(audioOutput)
                .audioCodec('aac')
                .videoCodec('copy')
                .output(finalOutput)
                .on('end', () => {
                    fs.unlinkSync(videoOutput);
                    fs.unlinkSync(audioOutput);
                    res.json({ message: 'Download and merge successful', file: `/downloads/${videoId}.mp4` });
                    setTimeout(() => {
                        try {
                            fs.unlinkSync(finalOutput);
                        } catch (err) {
                            console.error('Error deleting final file:', err);
                        }
                    }, 60000); // Delete after 1 minute
                })
                .on('error', (err) => {
                    console.error(err.message);
                    res.status(500).json({ error: 'Error during FFmpeg processing' });
                })
                .run();
        }

    } catch (err) {
        console.error('Error during download or merge:', err.message);
        res.status(500).json({ error: 'Error downloading or merging video' });
    } finally {
        const baseFiles = fs.readdirSync('./').filter(file => file.includes('-base'));
        baseFiles.forEach(file => fs.unlinkSync(`./${file}`));
    }
});
app.post('/search', async (req, res) => {
    const { url } = req.body;

    if (!url || !ytdl.validateURL(url)) {
        return res.status(400).json({ error: 'Invalid YouTube URL' });
    }

    try {
        const info = await ytdl.getInfo(url);

        // Video details
        const videoDetails = {
            title: info.videoDetails.title,
            thumbnail: info.videoDetails.thumbnails[0].url, // Get the highest resolution thumbnail
            size: {
                video: ytdl.chooseFormat(info.formats, { quality: 'highestvideo' }).contentLength,
                audio: ytdl.chooseFormat(info.formats, { quality: 'highestaudio' }).contentLength,
            },
            videoId: ytdl.getURLVideoID(url),
        };

        res.json({ videoDetails });
    } catch (err) {
        res.status(500).json({ error: err.message });
    } finally {
        const baseFiles = fs.readdirSync('./').filter(file => file.includes('-base'));
        baseFiles.forEach(file => fs.unlinkSync(`./${file}`));
    }
});
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
