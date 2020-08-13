const debug = process.env.NODE_ENV === 'develop' ? console.log : () => null

module.exports = debug
