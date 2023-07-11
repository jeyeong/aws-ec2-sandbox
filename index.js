require('dotenv').config()

const express = require('express')
const cors = require('cors')
const session = require('express-session')

// Routers.
const authRouter = require('./routers/auth')
const gmailRouter = require('./routers/gmail')

// Pub/Sub.
const { listenForEmails } = require('./handlers/gmailPubSubListener')

listenForEmails()

// Express app.
const app = express()
const port = 3100

// Middleware.
app.set('view engine', 'ejs')
app.use(session({ secret: 'locavore', resave: false, saveUninitialized: true }))
app.use(cors({ origin: '*' }))

// Routes.
app.get('/', (req, res) => res.render('home'))

app.use('/auth', authRouter)
app.use('/gmail', gmailRouter)

app.listen(port, () => console.log(`Example app listening on port ${port}!`))
