const admin = require('firebase-admin')
const serviceAccount = require('../autoinvoice-a1471-firebase-adminsdk-ugjgo-2c27f80183.json')
const { getFirestore, Timestamp } = require('firebase-admin/firestore')

// Authentication.
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://autoinvoice-a1471-default-rtdb.firebaseio.com',
})

const db = getFirestore()

// User metadata handlers.
const createUserMetadataWithRefreshToken = async (email, refreshToken) => {
  const docRef = db.collection('user_metadata').doc(email)
  return await docRef.set({
    refreshToken,
    previousHistoryId: '-1',
  })
}

const getUserRefreshToken = async (email) => {
  if (!email) {
    return null
  }

  const docRef = db.collection('user_metadata').doc(email)
  const snapshot = await docRef.get()

  return snapshot.data()?.refreshToken
}

const updateHistoryIdOnUserMetadata = async (email, newHistoryId) => {
  const docRef = db.collection('user_metadata').doc(email)
  return await docRef.update({ previousHistoryId: newHistoryId })
}

// Order handlers.
const getUserDetailsFromEmail = async (email) => {
  const usersRef = db.collection('users')
  const snapshot = await usersRef.where('email', '==', email).get()

  if (snapshot.empty) return null

  return snapshot.docs[0].data()
}

const addOrderToUser = async (email, sender, lines, orderDue) => {
  const userDetails = await getUserDetailsFromEmail(email)

  if (userDetails && userDetails.uid) {
    const uid = userDetails.uid

    const ordersSubcollectionRef = db
      .collection('users')
      .doc(uid)
      .collection('orders')

    return ordersSubcollectionRef.add({
      orderDue: Timestamp.fromDate(orderDue),
      orderDate: new Date(),
      customer: {
        senderName: sender,
        companyName: sender,
        email: 'customer@test.com',
      },
      lines: lines,
      status: 'pending',
    })
  }
}

module.exports = {
  createUserMetadataWithRefreshToken,
  getUserRefreshToken,
  updateHistoryIdOnUserMetadata,
  getUserDetailsFromEmail,
  addOrderToUser,
}
