import express from 'express';
import { Client } from 'pg'
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = process.env.PORT;

app.use(express.json());

const dbConfig = {
    host: 'postgres-svc-todo',
    port: 5432,
    user: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
    database: process.env.POSTGRES_DB
};

const client = new Client(dbConfig);

const initDatabase = async () => {
    try {
        await client.connect();
        console.log('Connected to the database');

        await client.query(`
            CREATE TABLE IF NOT EXISTS todos (
                id SERIAL PRIMARY KEY,
                data TEXT NOT NULL
            );
        `);
        console.log('Database initialized: "todos" table is ready');
    } catch (err) {
        console.error('Database connection / init error', err.stack);
    }
};

await initDatabase();

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

app.get('/todos', async (req, res) => {
    try {
        const result = await client.query('SELECT data FROM todos');
        const todos = result.rows.map(row => row.data);
        res.status(200).json({ todos });
    } catch (err) {
        console.error('Error fetching todos', err.stack);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.post('/todos', async (req, res) => {
    const { data } = req.body;
    console.log(`Received todo item in the backend: ${JSON.stringify(data)}`, "data.length", data.length,);
    if (data.length > 140) {
        console.log(`Received todo in the backend and blocked because it exceeds 140 characters: ${JSON.stringify(data)}`);
        return res.status(400).json({ error: 'Todo exceeds 140 characters' });
    }

    try {
        const result = await client.query('INSERT INTO todos (data) VALUES ($1) RETURNING *', [data]);
        res.status(200).json({ todo: result.rows[0] });
    } catch (err) {
        console.error('Error adding todo', err.stack);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});
