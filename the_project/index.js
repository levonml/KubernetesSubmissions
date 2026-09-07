import express from "express";
import axios from "axios";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
dotenv.config();

const app = express();

const PORT = process.env.PORT || 3000;
const APP_DIR = process.cwd();
const PV_PATH = "/tmp/kube";
const imagePath = path.join(PV_PATH, "image.jpg");

const tenMinutes = 10 * 60 * 1000;

app.use("/images", express.static(PV_PATH));

const downloadImage = async () => {
    console.log("Starting image download...");

    const imageResponse = await axios.get(
        "https://picsum.photos/1200",
        {
            responseType: "stream"
        }
    );

    const writer = fs.createWriteStream(imagePath);

    imageResponse.data.pipe(writer);

    await new Promise((resolve, reject) => {
        writer.on("finish", resolve);
        writer.on("error", reject);
    });

    console.log("Image downloaded successfully.");
};

app.get("/", async (req, res) => {
    console.log("Received request for /");

    const imageExists = fs.existsSync(imagePath);

    if (imageExists) {
        console.log("Image exists, checking age...");

        const stats = fs.statSync(imagePath);

        const imageAge = Date.now() - stats.mtimeMs;

        console.log(`Image last modified at: ${stats.mtimeMs}`);
        console.log(`Current time: ${Date.now()}`);
        console.log(`Image age: ${imageAge} ms`);

        if (imageAge < tenMinutes) {
            console.log("Image is recent, serving existing image.");

            return res.sendFile("index.html", {
                root: APP_DIR
            });
        }

        console.log("Image is old.");

        // Send the page immediately
        res.sendFile("index.html", {
            root: APP_DIR
        });

        // Download in the background
        try {
            console.log("Downloading new image...");
            await downloadImage();
        } catch (error) {
            console.error("Error fetching image:", error);
        }

        return;
    }

    console.log("Image does not exist, downloading...");

    try {
        await downloadImage();

        console.log("Sending index.html...");

        return res.sendFile("index.html", {
            root: APP_DIR
        });
    } catch (error) {
        console.error("Error fetching image:", error);

        return res.status(500).send("Failed to download image");
    }
});

app.use(express.static(APP_DIR));

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Image path: ${imagePath}`);
});
