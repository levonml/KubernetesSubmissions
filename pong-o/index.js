import express from 'express'

const app = express()

app.get('/', (req, res) => {
    res.send(`correct path: /pingpong`);
})

let counter = 0;
app.get('/pingpong', (req, res) => {
    counter++;
    res.send(`pong: ${counter}`);
})

app.listen(3000, () => {
    console.log('Server is running on port 3000')
})