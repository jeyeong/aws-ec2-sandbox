require('dotenv').config()

const express = require('express')
const cors = require('cors')
const session = require('express-session')
const { PubSub } = require('@google-cloud/pubsub')
const axios = require('axios')

// Routers.
const authRouter = require('./routers/auth')
const gmailRouter = require('./routers/gmail')

// Express app.
const app = express()
const port = 3100

// Middleware.
app.set('view engine', 'ejs')
app.use(session({ secret: 'locavore', resave: false, saveUninitialized: true }))
app.use(cors({ origin: '*' }))

// Pub/sub.
const subscriptionNameOrId =
  'projects/gmail-api-sandbox-391202/subscriptions/my-sub'

const pubSubClient = new PubSub()

const getMessage = async (email, messageId) => {
  try {
    const url = `https://gmail.googleapis.com/gmail/v1/users/${email}/messages/${messageId}`
    const { token } = await oAuth2Client.getAccessToken()
    const config = generateConfig(url, token)
    const response = await axios(config)

    const messageInPlaintextBase64 =
      response?.data?.payload?.parts?.[0]?.body?.data

    if (messageInPlaintextBase64) {
      const messageInPlaintextUTF8 = Buffer.from(
        messageInPlaintextBase64,
        'base64'
      ).toString('utf-8')

      console.log(`The message in the email is:\n${messageInPlaintextUTF8}`)
    }
  } catch (error) {
    console.error(error)
  }
}

const getHistory = async (email, historyId) => {
  try {
    const url = `https://gmail.googleapis.com/gmail/v1/users/${email}/history?startHistoryId=${historyId}&labelId=${'INBOX'}`
    const { token } = await oAuth2Client.getAccessToken()
    const config = generateConfig(url, token)
    const response = await axios(config)

    const emails = response.data?.history
    const firstEmail = emails?.[0]
    const firstEmailId = firstEmail?.messages?.[0]?.id

    if (firstEmailId) {
      await getMessage(email, firstEmailId)
    } else {
      console.log('No email to read.')
    }
  } catch (error) {
    console.error(error)
  }
}

let previousHistoryID = '1927186'

function listenForEmails() {
  // References an existing subscription
  const subscription = pubSubClient.subscription(subscriptionNameOrId)

  // Create an event handler to handle messages
  const messageHandler = async (message) => {
    const { emailAddress, historyId } = JSON.parse(message.data.toString())

    if (emailAddress === 'sohjeyeong@gmail.com' && historyId) {
      console.log(`Message received. History ID is ${historyId}`)
      await getHistory(emailAddress, previousHistoryID)

      previousHistoryID = historyId
    }

    // "Ack" (acknowledge receipt of) the message
    message.ack()
  }

  // Listen for new messages until timeout is hit
  subscription.on('message', messageHandler)

  console.log(`Listening for Pub/sub: ${subscriptionNameOrId}`)
}

listenForEmails()

// Routes.
app.get('/', (req, res) => res.render('home'))

app.use('/auth', authRouter)

app.use('/gmail', gmailRouter)

/*
app.get('/gmail/history', async (req, res) => {
  try {
    const url = `https://gmail.googleapis.com/gmail/v1/users/${
      req.query.email
    }/history?startHistoryId=${1924436}&labelId=${'INBOX'}`
    const { token } = await oAuth2Client.getAccessToken()
    const config = generateConfig(url, token)
    const response = await axios(config)
    const emails = response.data.history
    res.json(emails)
  } catch (error) {
    console.log(error)
    res.send(error)
  }
})

app.get('/gmail/threads', async (req, res) => {
  try {
    const url = `https://gmail.googleapis.com/gmail/v1/users/${
      req.query.email
    }/threads/${'1893ccb06538653a'}`
    const { token } = await oAuth2Client.getAccessToken()
    const config = generateConfig(url, token)
    const response = await axios(config)
    const data = response.data
    res.json(data)
  } catch (error) {
    console.log(error)
    res.send(error)
  }
})
*/

app.listen(port, () => console.log(`Example app listening on port ${port}!`))
