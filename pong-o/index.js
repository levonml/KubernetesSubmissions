import express from 'express'
import fs from 'fs'

const app = express()


let counter = 0;
fs.mkdirSync('/tmp/kube', { recursive: true })
app.get('/pingpong', (req, res) => {

    counter++;
    fs.writeFileSync('/tmp/kube/pongcounter.txt', `${counter}\n`)
    res.send(`pongs: ${counter}`);
})

app.listen(3000, () => {
    console.log('Server is running on port 3000')
})