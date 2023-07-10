require('dotenv').config()

const useAWS = false
const localDomain = 'https://0be9-24-17-127-170.ngrok-free.app'
const AWSDomain = 'http://locavorapi.com'
const domainToUse = useAWS ? AWSDomain : localDomain

const express = require('express')
const cors = require('cors')
const passport = require('passport')
const GoogleStrategy = require('passport-google-oauth20').Strategy
const session = require('express-session')
const { google } = require('googleapis')
const { PubSub } = require('@google-cloud/pubsub')
const axios = require('axios')

passport.serializeUser((user, done) => {
  done(null, user)
})
passport.deserializeUser((user, done) => {
  done(null, user)
})

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.CLIENT_ID,
      clientSecret: process.env.CLIENT_SECRET,
      callbackURL: `${domainToUse}/auth/google/callback`,
    },
    (accessToken, refreshToken, profile, done) => {
      // console.log('access token', accessToken)
      console.log('refresh token', refreshToken)
      done(null, profile, accessToken)
    }
  )
)

const app = express()
const port = 3100

// Middleware.
app.set('view engine', 'ejs')

app.use(session({ secret: 'locavore', resave: false, saveUninitialized: true }))
app.use(cors({ origin: '*' }))
app.use(passport.initialize())

// Helpers.
const generateConfig = (url, accessToken) => {
  return {
    method: 'get',
    url: url,
    headers: {
      Authorization: `Bearer ${accessToken} `,
      'Content-type': 'application/json',
    },
  }
}

const generateWatchConfig = (url, accessToken) => {
  return {
    method: 'post',
    url: url,
    headers: {
      Authorization: `Bearer ${accessToken} `,
      'Content-type': 'application/json',
    },
    data: {
      labelIds: ['INBOX'],
      topicName: 'projects/gmail-api-sandbox-391202/topics/my-topic',
      labelFilterBehavior: 'include',
    },
  }
}

const oAuth2Client = new google.auth.OAuth2(
  process.env.CLIENT_ID,
  process.env.CLIENT_SECRET,
  `${domainToUse}/auth/google/callback`
)

oAuth2Client.setCredentials({ refresh_token: process.env.REFRESH_TOKEN })

// Pub/sub.
const subscriptionNameOrId =
  'projects/gmail-api-sandbox-391202/subscriptions/my-sub'

const pubSubClient = new PubSub()

function listenForEmails() {
  // References an existing subscription
  const subscription = pubSubClient.subscription(subscriptionNameOrId)

  // Create an event handler to handle messages
  const messageHandler = (message) => {
    console.log(`Received message ${message.id}:`)
    console.log(`\tData: ${message.data}`)
    console.log(`\tAttributes: ${message.attributes}`)

    // "Ack" (acknowledge receipt of) the message
    message.ack()
  }

  // Listen for new messages until timeout is hit
  subscription.on('message', messageHandler)
}

listenForEmails()

// Controllers.
app.get('/', (req, res) => res.render('home'))

app.get(
  '/auth/google',
  passport.authenticate('google', {
    scope: [
      'profile',
      'email',
      'https://www.googleapis.com/auth/gmail.readonly',
    ],
    accessType: 'offline',
    prompt: 'consent',
  })
)

app.get(
  '/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/' }),
  (req, res) => {
    try {
      res.send('Authenticated')
    } catch (error) {
      console.log(error)
    }
  }
)

app.get('/gmail/user', async (req, res) => {
  try {
    const url = `https://gmail.googleapis.com/gmail/v1/users/${req.query.email}/profile`
    const { token } = await oAuth2Client.getAccessToken()
    const config = generateConfig(url, token)
    const response = await axios(config)
    res.json(response.data)
  } catch (error) {
    console.log(error)
    res.send(error)
  }
})

app.get('/gmail/watch', async (req, res) => {
  try {
    const url = `https://gmail.googleapis.com/gmail/v1/users/${req.query.email}/watch`
    const { token } = await oAuth2Client.getAccessToken()
    const config = generateWatchConfig(url, token)
    const response = await axios(config)
    res.json(response.data)
  } catch (error) {
    console.log(error)
    res.send(error)
  }
})

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

app.listen(port, () => console.log(`Example app listening on port ${port}!`))
