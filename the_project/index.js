import express from "express";
import axios from "axios";
import fs from "fs";
import path from "path";

const app = express();

const PORT = process.env.PORT || 3000;
const APP_DIR = process.cwd();
const PV_PATH = "/tmp/kube";
const imagePath = path.join(PV_PATH, "image.jpg");

const tenMinutes = 10 * 60 * 1000;

// placeholder store until todo-backend takes over persistence

const indexTemplate = fs.readFileSync(path.join(APP_DIR, "index.html"), "utf-8");

const escapeHtml = (text) =>
    text.replace(/[&<>"']/g, (char) => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    }[char]));

const renderIndexHtml = async () => {
    const todos = await axios.get("http://todo-backend-svc:2351/todos")
        .then(response => response.data.todos.filter(Boolean))
        .catch(() => []);
    const items = todos.map((text) => `<li>${escapeHtml(text)}</li>`).join("\n        ");

    return indexTemplate.replace("<!--TODOS-->", items);
};

app.use("/images", express.static(PV_PATH));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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

            return res.send(await renderIndexHtml());
        }

        console.log("Image is old.");

        // Send the page immediately
        res.send(await renderIndexHtml());

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

        return res.send(await renderIndexHtml());
    } catch (error) {
        console.error("Error fetching image:", error);

        return res.status(500).send("Failed to download image");
    }
});


app.post("/add-todo-item", async (req, res) => {

    console.log(`Received todo request: ${JSON.stringify(req.body)}`);
    const text = req.body?.text?.trim() || "";

    try {
        await axios.post("http://todo-backend-svc:2351/todos", { data: text });
    } catch (error) {
        console.error("Error forwarding todo to backend:", error);

        return res.status(502).send("Failed to save todo");
    }

    console.log(`Received todo: ${text}`);
    return res.redirect(303, "/");
});

app.use(express.static(APP_DIR));

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Image path: ${imagePath}`);
});
