const express = require('express')
const passport = require('passport')
const GoogleStrategy = require('passport-google-oauth20').Strategy

const {
  createUserMetadataWithRefreshToken,
} = require('../handlers/firestoreFunctions')
const { domainToUse } = require('../constants')

// Router.
const authRouter = express.Router()

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
        await createUserMetadataWithRefreshToken(email, refreshToken)
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

module.exports = authRouter
