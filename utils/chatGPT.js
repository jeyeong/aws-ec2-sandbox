const { Configuration, OpenAIApi } = require('openai')
const configuration = new Configuration({
  organization: 'org-zViYeQySG0nY70N4gOT3nDFd',
  apiKey: process.env.OPENAI_API_KEY,
})
const openai = new OpenAIApi(configuration)

const orderEx1 = {
  title: 'Etta Bucktown',
  sender: 'Soh Je Yeong <sohjeyeong@gmail.com>',
  date: '2023-07-10',
  message:
    'For tomorrow please: 6 cs oyster mushrooms. 4 cs lions mane. thanks!',
}

// 1. Check whether an email is an order
// Input: Email
// Output: "yes" or "no"

const filterOrderEmail = async (email) => {
  const completion = await openai.createChatCompletion({
    model: 'gpt-3.5-turbo',
    temperature: 0,
    messages: [
      {
        role: 'system',
        content: `You will be given an email object that a food supplier/distributor received, extracted using the gmail API. Your job is to distinguish whether the email is an order email from the customer or not.\n \
      This is a sample email order: \
      <email> {title: "Etta Bucktown", sender: "Soh Je Yeong <sohjeyeong@gmail.com>", date: "2023-07-10", message: "For tomorrow please: 6 cs oyster mushrooms. thanks!"} </email>\n \
      If it is an order, output "yes", if it is not an order, output "no". Output only "yes" or "no".`,
      },
      { role: 'user', content: JSON.stringify(email) },
    ],
  })

  const checkOrder = completion.data.choices[0].message.content

  return checkOrder
}

// 2. Extract customer info (We need to match this to their Quickbooks data), so
// lets just use the customer name email for now

const ParseCustomerInfo = async (email) => {
  const { sender } = email
  //   const completion = await openai.createChatCompletion({
  //     model: "gpt-3.5-turbo",
  //       temperature: 0,
  //     messages: [
  //       {
  //         role: "system",
  //         content: `You will be given an email that a food supplier/distributor received, extracted using the gmail API. Your job is to distinguish whether the email is an order email from the customer or not.\n \
  //         This is a sample email order: \
  //         <email> Title: Etta Bucktown, Content: For tomorrow please: 6 cs oyster mushrooms. thanks! </email>\n \
  //         If it is an order, output "yes", if it is not an order, output "no". Output only "yes" or "no".`,
  //       },
  //       { role: "user", content: userInput },
  //     ],
  //   });

  //   console.log(completion.data.choices[0].message);
  return sender
}

// 3. Extract order details (The prompt should change after integrating QB)
// Input: Email
// Output: order details

const ParseOrderDetails = async (email) => {
  const completion = await openai.createChatCompletion({
    model: 'gpt-3.5-turbo',
    temperature: 0,
    messages: [
      {
        role: 'system',
        content: `You will be given an email object that a food supplier/distributor received. Extract what the customer is \
        trying to order in the form of a JSON array of objects. Output must be valid JSON. E.g.[{product, quantity, unit (in lb)}, {product, quantity, unit (in lb)}]. 1 case, or cs, equals to 6 lbs.\n \
        For example, User: <email> {title: "Etta Bucktown", sender: "Soh Je Yeong <sohjeyeong@gmail.com>", date: "2023-07-10", \
        message: "For tomorrow please: 6 cs oyster mushrooms. 4 cs lions mane. thanks!"} </email>.
        Output: [{"product": "oyster mushrooms", "quantity": 36, "unit": "lb"}, {"product": "lions mane", "quantity": 24, "unit": "lb"}]\
        `,
      },
      { role: 'user', content: JSON.stringify(email) },
    ],
  })

  const output = completion.data.choices[0].message.content

  return output
}

// 4. Parse Delivery Date
const ParseDeliveryDate = async (email) => {
  const completion = await openai.createChatCompletion({
    model: 'gpt-3.5-turbo',
    temperature: 0,
    messages: [
      {
        role: 'system',
        content: `You will be provided an email, which is an order email that a food distributor received from a customer. \
          Find out which date the customer wants it delivered. If the email does not explicitly mention the date they want it delivered, \
          the default is the next day of when the email is sent.\n \
          Only output the date and in the format of “YYYY-MM-DD”. Do not output anything other than "YYYY-MM-DD".
          `,
      },
      { role: 'user', content: JSON.stringify(email) },
    ],
  })

  const date = completion.data.choices[0].message.content

  return date
}

//All necessary info
// filterOrderEmail(orderEx1)
// ParseCustomerInfo(orderEx1)
// ParseOrderDetails(orderEx1)
// ParseDeliveryDate(orderEx1)

module.exports = {
  filterOrderEmail,
  ParseCustomerInfo,
  ParseOrderDetails,
  ParseDeliveryDate,
}
