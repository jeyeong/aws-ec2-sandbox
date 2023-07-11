const { PubSub } = require('@google-cloud/pubsub')
const { google } = require('googleapis')
const axios = require('axios')

const { generateGoogleRequestForAxios } = require('../utils/requestGenerators')
const {
  filterOrderEmail,
  ParseOrderDetails,
  ParseDeliveryDate,
} = require('../utils/chatGPT')
const { addOrderToUser } = require('./firestoreFunctions')
const { domainToUse } = require('../constants')

const subscriptionNameOrId =
  'projects/gmail-api-sandbox-391202/subscriptions/my-sub'

const oAuth2Client = new google.auth.OAuth2(
  process.env.CLIENT_ID,
  process.env.CLIENT_SECRET,
  `${domainToUse}/auth/google/callback`
)

oAuth2Client.setCredentials({ refresh_token: process.env.REFRESH_TOKEN })

// State.
let previousHistoryID = '0'
const messagesParsed = new Set()

// Pub/Sub.
const pubSubClient = new PubSub()

const getMessage = async (emailAddress, messageId) => {
  const padWith0 = (m) => {
    const asStr = m.toString()
    return asStr.length >= 2 ? asStr : `0${asStr}`
  }

  try {
    const url = `https://gmail.googleapis.com/gmail/v1/users/${emailAddress}/messages/${messageId}`
    const { token } = await oAuth2Client.getAccessToken()
    const request = generateGoogleRequestForAxios(url, token)
    const response = await axios(request)

    const payload = response?.data?.payload

    if (payload) {
      const today = new Date()

      let title = ''
      let sender = ''
      let date = `${today.getFullYear()}-${padWith0(
        today.getMonth() + 1
      )}-${today.getDate()}`
      let message = ''

      for (const { name, value } of payload.headers) {
        if (name === 'From') {
          sender = value
        } else if (name === 'Subject') {
          title = value
        } else if (name === 'Date') {
          const receivedDate = new Date(value)
          date = `${receivedDate.getFullYear()}-${padWith0(
            receivedDate.getMonth() + 1
          )}-${receivedDate.getDate()}`
        }
      }

      const messageInPlaintextBase64 =
        response?.data?.payload?.parts?.[0]?.body?.data

      if (messageInPlaintextBase64) {
        const messageInPlaintextUTF8 = Buffer.from(
          messageInPlaintextBase64,
          'base64'
        ).toString('utf-8')

        message = messageInPlaintextUTF8
      }

      const chatGPTInput = {
        title,
        sender,
        date,
        message,
      }

      const isOrder = await filterOrderEmail(chatGPTInput)
      const lines = JSON.parse(await ParseOrderDetails(chatGPTInput))
      const deliveryDate = await ParseDeliveryDate(chatGPTInput)

      const orderDue = new Date(`${deliveryDate}T20:00:00`)

      if (isOrder === 'yes') {
        console.log('Adding an order to Firestore', sender, lines)
        await addOrderToUser(emailAddress, sender, lines, orderDue)
      }
    }
  } catch (error) {
    console.error(error)
  }
}

const getHistory = async (emailAddress, historyId) => {
  try {
    const url = `https://gmail.googleapis.com/gmail/v1/users/${emailAddress}/history?startHistoryId=${historyId}&labelId=${'INBOX'}`
    const { token } = await oAuth2Client.getAccessToken()
    const request = generateGoogleRequestForAxios(url, token)
    const response = await axios(request)

    const emails = response.data?.history || []
    emails.reverse()

    for (const email of emails) {
      // Only read emails that were sent.
      if (email.messagesAdded) {
        const messageId = email.messagesAdded?.[0]?.message?.id
        if (messageId && !messagesParsed.has(messageId)) {
          messagesParsed.add(messageId)
          await getMessage(emailAddress, messageId)

          break
        }
      }
    }
  } catch (error) {
    console.error(error)
  }
}

const listenForEmails = () => {
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

module.exports = { listenForEmails }
