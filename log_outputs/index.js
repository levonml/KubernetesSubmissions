import crypto from 'crypto'

const randomHash = crypto.randomUUID();
const getHashNow = () => {
    console.log(new Date().toISOString(), randomHash)
    setTimeout(() => getHashNow(), 5000)
}
getHashNow()
