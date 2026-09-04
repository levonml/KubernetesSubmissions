import express from "express";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const __dirname = process.cwd();
app.get("/the-project", (req, res) => {
    console.log("Request received for /");
    //serve an html file
    res.sendFile("index.html", { root: __dirname });
});


app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
