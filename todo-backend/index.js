import express from 'express';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = process.env.PORT;

app.use(express.json());

const todos = [];
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

app.get('/todos', (req, res) => {
    res.status(200).json({ todos });
});

app.post('/todos', (req, res) => {
    console.log(`Received todo in the backend: ${JSON.stringify(req.body)}`);
    const { data } = req.body;
    // Here you would typically add the todo item to your database
    todos.push(data);
    res.status(200).json({ todos });
});
