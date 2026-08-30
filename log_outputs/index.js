import crypto from 'crypto'
import express from 'express'

const app = express()
let currentStatus

app.get('/', (req, res) => {
    res.send(currentStatus)
})


const randomHash = crypto.randomUUID();
const getHashNow = () => {
    const currentTime = new Date().toISOString()
    console.log(currentTime, randomHash)
    currentStatus = `${currentTime} ${randomHash}`
    setTimeout(() => getHashNow(), 5000)
}
getHashNow()
app.listen(3000, () => {
    console.log('Server is running on port 3000')
})