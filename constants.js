const useAWS = false
const localDomain = 'https://7020-24-17-127-170.ngrok-free.app'
const AWSDomain = 'http://locavorapi.com'
const domainToUse = useAWS ? AWSDomain : localDomain

module.exports = {
  domainToUse,
}
