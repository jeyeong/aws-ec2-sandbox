const useAWS = false
const localDomain = 'https://98cc-67-134-124-154.ngrok-free.app'
const AWSDomain = 'http://locavorapi.com'
const domainToUse = useAWS ? AWSDomain : localDomain

module.exports = {
  domainToUse,
}
