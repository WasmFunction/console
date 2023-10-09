import { MIN_PORT, MAX_PORT } from './constants'

const numbers = []

const getIpAddress = () => {
  return '114.55.62.13'
}

const generateUniqueRandomNumbers = () => {
  if (numbers.length >= MAX_PORT - MIN_PORT + 1) {
    throw new Error('Count cannot be greater than the range of numbers.')
  }

  while (1) {
    const randomNumber =
      Math.floor(Math.random() * (MAX_PORT - MIN_PORT + 1)) + MIN_PORT
    console.log(randomNumber)
    if (!numbers.includes(randomNumber)) {
      numbers.push(randomNumber)
      return randomNumber
    }
  }
  return -1
}

export const getsshCommand = () => {
  const port = generateUniqueRandomNumbers()
  const ip = getIpAddress()
  console.log(port)
  console.log(ip)
  return [`ssh -p ${port} ubuntu@${ip}`, port]
}
