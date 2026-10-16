import crypto from 'crypto'
import express from 'express'
import fs from 'fs'
import path from 'path'
import axios from 'axios'
import dotenv from 'dotenv'

dotenv.config()

const myMessage = process.env.MESSAGE
async function getPongs() {
    try {
        const response = await axios.get('http://pong-o-svc:2346/pings')
        return response.data
    } catch (error) {
        console.error('Error fetching pong counter:', error)
        return 0
    }
}

const app = express()
let currentStatus

const logFilePath = '/tmp/kube/logoutput.txt'
const informationFilePath = '/etc/kube/configmap/information.txt'
const pongCounterFilePath = '/tmp/kube/pongcounter.txt'
//fs.mkdirSync(path.dirname(logFilePath), { recursive: true })
//fs.mkdirSync(path.dirname(pongCounterFilePath), { recursive: true })

const information = fs.readFileSync(informationFilePath, 'utf-8')

setInterval(() => {
    currentStatus = fs.readFileSync(logFilePath, 'utf-8')
}, 5000)

app.get('/showlogs', async (req, res) => {
    try {
        let pongCounter = await getPongs()
        // const pongCounter = fs.readFileSync(pongCounterFilePath, 'utf-8')
        console.log("currentStatus:", currentStatus)
        res.send(`file content: ${information}<br>env variable: ${myMessage}<br>${currentStatus}.<br>Ping / Pongs: ${pongCounter}`)
    } catch (error) {
        console.error('Error handling /showlogs request:')
        res.status(500).send('Internal Server Error')
    }
})

app.get('/healthz', (req, res) => {
    console.log('Received health check request in log-output/string-reader')
    axios.get('http://pong-o-svc:2346/pings')
        .then(() => {
            console.log('Health check passed in log-output/string-reader')
            res.status(200).send('OK')
        })
        .catch((error) => {
            console.error('Health check failed in log-output/string-reader:')
            res.status(500).send('Pong service unavailable')
        })
})

app.listen(3000, () => {
    console.log('Server is running on port 3000')
})