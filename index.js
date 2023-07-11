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

// Firebase.
const admin = require('firebase-admin')
const serviceAccount = require('./autoinvoice-a1471-firebase-adminsdk-ugjgo-2c27f80183.json')
const {
  getFirestore,
  Timestamp,
  FieldValue,
  Filter,
} = require('firebase-admin/firestore')

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://autoinvoice-a1471-default-rtdb.firebaseio.com',
})

const db = getFirestore()

db.collection('users')
  .get()
  .then((snapshot) => {
    snapshot.forEach((doc) => {
      console.log(doc.id, '=>', doc.data())
    })
  })

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
