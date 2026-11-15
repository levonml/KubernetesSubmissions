import express from 'express';
import pg from 'pg';
import dotenv from 'dotenv';
import { connect } from "@nats-io/transport-node"

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
                    data TEXT NOT NULL,
                    done BOOLEAN NOT NULL DEFAULT FALSE
                );
            `);
            await pool.query('ALTER TABLE todos ADD COLUMN IF NOT EXISTS done BOOLEAN NOT NULL DEFAULT FALSE');
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

let nc;


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
        const result = await pool.query('SELECT id, data, done FROM todos ORDER BY id');
        const todos = result.rows;
        res.status(200).json({ todos });
    } catch (err) {
        console.error('Error fetching todos', err.stack);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.put('/todo/:id', async (req, res) => {
    const id = Number(req.params.id);
    const { done } = req.body;

    if (!Number.isInteger(id) || id < 1) {
        return res.status(400).json({ error: 'Todo id must be a positive integer' });
    }

    if (typeof done !== 'boolean') {
        return res.status(400).json({ error: 'Todo done status must be a boolean' });
    }

    try {
        const result = await pool.query(
            'UPDATE todos SET done = $1 WHERE id = $2 RETURNING id, data, done',
            [done, id]
        );
        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Todo not found' });
        }

        return res.status(200).json({ todo: result.rows[0] });
    } catch (err) {
        console.error('Error updating todo', err.stack);
        return res.status(500).json({ error: 'Internal Server Error' });
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
        console.log(`Connecting to NATS server at ${process.env.NATS_URL}...`);
        nc = await connect({
            servers: process.env.NATS_URL,
        })

        // publish action 'created' to NATS when a new todo is created
        console.log(`Publishing todo.created event to NATS with data: ${JSON.stringify(data)}`);
        nc.publish('todo.created', JSON.stringify(data));
        console.log(`Published todo.created event to NATS with data: ${JSON.stringify(data)}`);
        // Insert the new todo into the database
        const result = await pool.query('INSERT INTO todos (data) VALUES ($1) RETURNING *', [data]);
        res.status(200).json({ todo: result.rows[0] });
    } catch (err) {
        console.error('Error adding todo', err.stack);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});