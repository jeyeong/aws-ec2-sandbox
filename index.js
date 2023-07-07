const express = require('express')
var cors = require('cors')
const app = express()
const port = 3100

app.use(cors({ origin: '*' }))

app.get('/', (req, res) => res.send('Welcome!'))

app.listen(port, () => console.log(`Example app listening on port ${port}!`))
