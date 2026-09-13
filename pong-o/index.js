import express from 'express'
import { Client } from 'pg'

const app = express()

const dbConfig = {
    host: 'postgres-svc',
    port: 5432,
    user: 'postgres',
    password: 'postgres',
    database: 'postgres'
}

let counter = 0

// Initialize database when the application starts
const initDatabase = async () => {
    const client = new Client(dbConfig)

    try {
        await client.connect()

        await client.query(
            'CREATE TABLE IF NOT EXISTS pongcounter (counter INT)'
        )

        const result = await client.query(
            'SELECT counter FROM pongcounter ORDER BY counter DESC LIMIT 1'
        )

        counter = result.rows[0]?.counter || 0

        console.log(`Database initialized, counter: ${counter}`)
    } catch (err) {
        console.error('Database initialization failed:', err)
    } finally {
        await client.end()
    }
}

await initDatabase()


app.get('/pingpong', async (req, res) => {
    console.log(`Received pingpong request, current counter: ${counter}`)
    console.log("latest  image", counter)
    counter++
    const client = new Client(dbConfig)

    try {
        await client.connect()

        await client.query(
            'INSERT INTO pongcounter (counter) VALUES ($1)',
            [counter]
        )

        res.send(`pongs: ${counter}`)
    } catch (err) {
        console.error(err)
        res.status(500).send('Error saving counter to database')
    } finally {
        await client.end()
    }
})


app.get('/pingpong/getcounterfromdb', async (req, res) => {
    console.log('Received getcounterfromdb request')

    const client = new Client(dbConfig)

    try {
        await client.connect()

        const result = await client.query(
            'SELECT counter FROM pongcounter ORDER BY counter DESC LIMIT 1'
        )

        const dbCounter = result.rows[0]?.counter || 0

        res.send(`pongs from db: ${dbCounter}`)
    } catch (err) {
        console.error(err)
        res.status(500).send('Error retrieving counter from database')
    } finally {
        await client.end()
    }
})


app.get('/pingpong/reset', async (req, res) => {
    console.log('Received reset request')

    const client = new Client(dbConfig)

    try {
        await client.connect()

        // Reset the in-memory counter
        counter = 0

        // Remove all stored counter values
        await client.query('TRUNCATE TABLE pongcounter')

        res.send('Counter reset to 0')
    } catch (err) {
        console.error(err)
        res.status(500).send('Error resetting counter')
    } finally {
        await client.end()
    }
})


app.get('/pings', (req, res) => {
    console.log(`Received pings request, current counter: ${counter}`)
    res.send(String(counter))
})


app.listen(3000, () => {
    console.log('Server is running on port 3000')
})
