import crypto from 'crypto'
import express from 'express'
import fs from 'fs'
import path from 'path'

const app = express()
let currentStatus

const logFilePath = '/usr/src/app/files/logoutput.txt'
fs.mkdirSync(path.dirname(logFilePath), { recursive: true })

setInterval(() => {
    currentStatus = fs.readFileSync(logFilePath, 'utf-8')
}, 5000)
app.get('/showlogs', (req, res) => {
    console.log("currentStatus:", currentStatus)
    res.send(currentStatus)
})
app.listen(3000, () => {
    console.log('Server is running on port 3000')
})