import crypto from 'crypto'
import fs from 'fs'
import path from 'path'
let currentStatus

const logFilePath = '/usr/src/app/files/logoutput.txt'
fs.mkdirSync(path.dirname(logFilePath), { recursive: true })
fs.writeFileSync(logFilePath, '')

setInterval(() => {
    fs.appendFileSync(logFilePath, `${currentStatus}\n`)
}, 5000)


const randomHash = crypto.randomUUID();
const getHashNow = () => {
    const currentTime = new Date().toISOString()
    console.log(currentTime, randomHash)
    currentStatus = `${currentTime} ${randomHash}`
    setTimeout(() => getHashNow(), 5000)
}
getHashNow()
