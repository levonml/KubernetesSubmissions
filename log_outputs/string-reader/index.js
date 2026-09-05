import crypto from 'crypto'
import express from 'express'
import fs from 'fs'
import path from 'path'

const app = express()
let currentStatus

const logFilePath = '/tmp/kube/logoutput.txt'
const pongCounterFilePath = '/tmp/kube/pongcounter.txt'
fs.mkdirSync(path.dirname(logFilePath), { recursive: true })
fs.mkdirSync(path.dirname(pongCounterFilePath), { recursive: true })

setInterval(() => {
    currentStatus = fs.readFileSync(logFilePath, 'utf-8')
}, 5000)
app.get('/showlogs', (req, res) => {
    const pongCounter = fs.readFileSync(pongCounterFilePath, 'utf-8')
    console.log("currentStatus:", currentStatus)
    res.send(`${currentStatus}.<br>Ping / Pongs: ${pongCounter}`)
})
app.listen(3000, () => {
    console.log('Server is running on port 3000')
})