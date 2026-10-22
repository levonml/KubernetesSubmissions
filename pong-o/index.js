import express from 'express'
import fs from 'fs'

const app = express()


let counter = 0;
fs.mkdirSync('/tmp/kube', { recursive: true })


app.get('/', (req, res) => {

    counter++;
    fs.writeFileSync('/tmp/kube/pongcounter.txt', `${counter}\n`)
    res.send(`pongs: ${counter}`);
})

app.get('/pings', (req, res) => {
    console.log(`>>  Received pings request, current counter: ${counter}`)
    res.send(String(counter))
})

app.listen(3000, () => {
    console.log('Server is running on port 3000')
})