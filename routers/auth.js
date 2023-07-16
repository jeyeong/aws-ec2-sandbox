const express = require('express')
const passport = require('passport')
const GoogleStrategy = require('passport-google-oauth20').Strategy

const { setUserMetadata } = require('../handlers/firestoreFunctions')
const { domainToUse } = require('../constants')

// Router.
const authRouter = express.Router()

/*************************
 * Google Authentication *
 *************************/

// Passport setup.
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
    async (accessToken, refreshToken, profile, done) => {
      const email = profile?.emails?.[0]?.value

      if (email) {
        await setUserMetadata(email, { gmailRefreshToken: refreshToken })
      }

      console.log(`${profile.displayName} refresh token is: ${refreshToken}`)
      done(null, profile, accessToken)
    }
  )
)

// Middleware.
authRouter.use(passport.initialize())

// Routes.
authRouter.get(
  '/google',
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

authRouter.get(
  '/google/callback',
  passport.authenticate('google', { failureRedirect: '/' }),
  (req, res) => {
    try {
      res.send('Authenticated')
    } catch (error) {
      console.log(error)
    }
  }
)

/*****************************
 * QuickBooks Authentication *
 *****************************/

const IntuitOAuthClient = require('intuit-oauth')

const oauthClient = new IntuitOAuthClient({
  clientId: process.env.INTUIT_CLIENT_ID,
  clientSecret: process.env.INTUIT_CLIENT_SECRET,
  environment: 'sandbox',
  redirectUri: `${domainToUse}/auth/quickbooks/callback`,
})

authRouter.get('/quickbooks', (req, res) => {
  const authUri = oauthClient.authorizeUri({
    scope: [
      IntuitOAuthClient.scopes.Accounting,
      IntuitOAuthClient.scopes.OpenId,
    ],
    state: 'state',
  })

  res.redirect(authUri)
})

authRouter.get('/quickbooks/callback', async (req, res) => {
  const parseRedirect = req.url

  try {
    const authResponse = await oauthClient.createToken(parseRedirect)
    console.log('The Token is  ' + JSON.stringify(authResponse.getJson()))

    res.send('ok')
  } catch (error) {
    console.error('Quickbook auth error', error)
    res.send('Error occured on server.')
  }
})

module.exports = authRouter
