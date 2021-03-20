function cookieParser(str) {
  const cookies = str.split("; ")
  const output = {}

  cookies.forEach((element) => {
    const [key, value] = element.split("=")
    output[key] = value
  })
  return output
}

module.exports = { cookieParser }

