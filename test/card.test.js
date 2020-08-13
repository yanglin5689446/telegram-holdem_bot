const card = require('../app/card.js')
const { getBestPossible } = require('../app/card.js')

// pair
const testcases = [
  {
    type: 0,
    cards: [
      { suit: '♠︎', number: '6' },
      { suit: '♣︎', number: 'J' },
      { suit: '♠︎', number: '9' },
      { suit: '♥︎', number: '2' },
      { suit: '♠︎', number: '4' },
      { suit: '♠︎', number: '8' },
      { suit: '♦︎', number: '10' },
    ],
  },
  {
    type: 1,
    cards: [
      { suit: '♠︎', number: '6' },
      { suit: '♣︎', number: 'J' },
      { suit: '♠︎', number: '9' },
      { suit: '♥︎', number: '2' },
      { suit: '♠︎', number: '4' },
      { suit: '♠︎', number: '10' },
      { suit: '♦︎', number: '10' },
    ],
  },
  {
    type: 2,
    cards: [
      { suit: '♠︎', number: '6' },
      { suit: '♣︎', number: '9' },
      { suit: '♠︎', number: '9' },
      { suit: '♥︎', number: '2' },
      { suit: '♠︎', number: '4' },
      { suit: '♠︎', number: '10' },
      { suit: '♦︎', number: '10' },
    ],
  },
  {
    type: 3,
    cards: [
      { suit: '♠︎', number: '6' },
      { suit: '♣︎', number: '10' },
      { suit: '♠︎', number: '9' },
      { suit: '♥︎', number: '2' },
      { suit: '♠︎', number: '4' },
      { suit: '♠︎', number: '10' },
      { suit: '♦︎', number: '10' },
    ],
  },
  {
    type: 4,
    cards: [
      { suit: '♠︎', number: '6' },
      { suit: '♣︎', number: '7' },
      { suit: '♠︎', number: '9' },
      { suit: '♥︎', number: '2' },
      { suit: '♠︎', number: '4' },
      { suit: '♠︎', number: '8' },
      { suit: '♦︎', number: '10' },
    ],
  },
  {
    type: 4,
    cards: [
      { suit: '♠︎', number: 'A' },
      { suit: '♣︎', number: '7' },
      { suit: '♠︎', number: '9' },
      { suit: '♥︎', number: '2' },
      { suit: '♠︎', number: '4' },
      { suit: '♠︎', number: '3' },
      { suit: '♦︎', number: '5' },
    ],
  },
  {
    type: 5,
    cards: [
      { suit: '♠︎', number: 'A' },
      { suit: '♠︎', number: '7' },
      { suit: '♠︎', number: '9' },
      { suit: '♥︎', number: '2' },
      { suit: '♠︎', number: '4' },
      { suit: '♠︎', number: '6' },
      { suit: '♦︎', number: '5' },
    ],
  },
  {
    type: 6,
    cards: [
      { suit: '♠︎', number: '6' },
      { suit: '♣︎', number: '10' },
      { suit: '♠︎', number: '9' },
      { suit: '♥︎', number: '2' },
      { suit: '♠︎', number: '2' },
      { suit: '♠︎', number: '10' },
      { suit: '♦︎', number: '10' },
    ],
  },
  {
    type: 7,
    cards: [
      { suit: '♠︎', number: 'A' },
      { suit: '♣', number: 'A' },
      { suit: '♠︎', number: '9' },
      { suit: '♥︎', number: 'A' },
      { suit: '♠︎', number: '4' },
      { suit: '♠︎', number: '3' },
      { suit: '♦︎', number: 'A' },
    ],
  },
  {
    type: 8,
    cards: [
      { suit: '♠︎', number: 'A' },
      { suit: '♣', number: 'A' },
      { suit: '♠︎', number: '10' },
      { suit: '♥︎', number: 'A' },
      { suit: '♠︎', number: 'J' },
      { suit: '♠︎', number: 'Q' },
      { suit: '♠︎', number: 'K' },
    ],
  },
]

testcases.forEach((testcase) => {
  const result = getBestPossible(testcase.cards)
  console.log(result.cards)
  console.log(`Expected type: ${testcase.type}, actual type: ${result.type}`)
})
