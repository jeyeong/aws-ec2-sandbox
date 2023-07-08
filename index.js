require('dotenv').config()

const express = require('express')
const cors = require('cors')
const passport = require('passport')
const GoogleStrategy = require('passport-google-oauth20').Strategy
const session = require('express-session')
const { google } = require('googleapis')
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
      callbackURL:
        'https://0be9-24-17-127-170.ngrok-free.app/auth/google/callback',
    },
    (accessToken, refreshToken, profile, done) => {
      console.log('access token', accessToken)
      console.log('refresh token', refreshToken)
      //   console.log('profile', profile)
      done(null, profile, accessToken)
    }
  )
)

const app = express()
const port = 3100

// Middleware.
app.set('view engine', 'ejs')

app.use(session({ secret: 'dog', resave: false, saveUninitialized: true }))
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

const auth = {
  type: 'OAuth2',
  user: 'sohjeyeong@gmail.com',
  clientId: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET,
  refreshToken: process.env.REFRESH_TOKEN,
}

const oAuth2Client = new google.auth.OAuth2(
  process.env.CLIENT_ID,
  process.env.CLIENT_SECRET,
  'https://77f2-24-17-127-170.ngrok-free.app/auth/google/callback'
)

oAuth2Client.setCredentials({ refresh_token: process.env.REFRESH_TOKEN })

async function getUser(req, res) {
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
}

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
    // console.log(req)
    res.json(req.user)
  }
)

app.get('/user', getUser)

app.listen(port, () => console.log(`Example app listening on port ${port}!`))
