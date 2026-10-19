import express from 'express';
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

const dbConfig = {
    host: 'postgres-svc-todo',
    port: 5432,
    user: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
    database: process.env.POSTGRES_DB,
    max: 10,
};

const pool = new Pool(dbConfig);

// Without this handler, an error on an idle connection (e.g. Postgres restarts)
// would crash the process with an unhandled 'error' event.
pool.on('error', (err) => {
    console.error('Unexpected error on idle database client', err.message);
});

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const initDatabase = async (retries = 30, delayMs = 2000) => {
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            await pool.query(`
                CREATE TABLE IF NOT EXISTS todos (
                    id SERIAL PRIMARY KEY,
                    data TEXT NOT NULL
                );
            `);
            console.log('Connected to the database');
            console.log('Database initialized: "todos" table is ready');
            return;
        } catch (err) {
            console.error(`Database not ready (${attempt}/${retries}): ${err.message}`);
            await sleep(delayMs);
        }
    }
    console.error('Could not connect to the database, exiting');
    process.exit(1); // let Kubernetes restart the pod
};

await initDatabase();

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

app.get('/livez', (req, res) => {
    res.status(200).send('OK');
});

// For readiness probe: reports 500 if the database is unreachable
app.get('/healthz', async (req, res) => {
    try {
        await pool.query('SELECT 1');
        res.status(200).send('OK');
    } catch (err) {
        res.status(500).send('Database unavailable');
    }
});

app.get('/todos', async (req, res) => {
    try {
        const result = await pool.query('SELECT data FROM todos');
        const todos = result.rows.map((row) => row.data);
        res.status(200).json({ todos });
    } catch (err) {
        console.error('Error fetching todos', err.stack);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.post('/todos', async (req, res) => {
    const { data } = req.body;

    if (typeof data !== 'string') {
        return res.status(400).json({ error: 'Todo must be a string' });
    }

    console.log(`Received todo item in the backend: ${JSON.stringify(data)}`, 'data.length', data.length);

    if (data.length > 140) {
        console.log(`Received todo in the backend and blocked because it exceeds 140 characters: ${JSON.stringify(data)}`);
        return res.status(400).json({ error: 'Todo exceeds 140 characters' });
    }

    try {
        const result = await pool.query('INSERT INTO todos (data) VALUES ($1) RETURNING *', [data]);
        res.status(200).json({ todo: result.rows[0] });
    } catch (err) {
        console.error('Error adding todo', err.stack);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});