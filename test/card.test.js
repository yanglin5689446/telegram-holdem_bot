const card = require('../app/card.js')
const { getBestPossible, compare, HAND_TYPES } = require('../app/card.js')

describe('getBestPossible', () => {
  test('resolve high card correctly', () => {
    let cards = [
      { suit: '♠︎', number: '6' },
      { suit: '♣︎', number: 'J' },
      { suit: '♠︎', number: '9' },
      { suit: '♥︎', number: '2' },
      { suit: '♠︎', number: '4' },
      { suit: '♠︎', number: '8' },
      { suit: '♦︎', number: '10' },
    ]
    let result = getBestPossible(cards)
    expect(result.type).toBe(HAND_TYPES.HIGH_CARD)
  })
  test('resolve pair correctly', () => {
    let cards = [
      { suit: '♠︎', number: '6' },
      { suit: '♣︎', number: 'J' },
      { suit: '♠︎', number: '9' },
      { suit: '♥︎', number: '2' },
      { suit: '♠︎', number: '4' },
      { suit: '♠︎', number: '10' },
      { suit: '♦︎', number: '10' },
    ]
    let result = getBestPossible(cards)
    expect(result.type).toBe(HAND_TYPES.PAIR)
  })
  test('resolve two pairs correctly', () => {
    let cards = [
      { suit: '♠︎', number: '6' },
      { suit: '♣︎', number: '9' },
      { suit: '♠︎', number: '9' },
      { suit: '♥︎', number: '2' },
      { suit: '♠︎', number: '4' },
      { suit: '♠︎', number: '10' },
      { suit: '♦︎', number: '10' },
    ]
    let result = getBestPossible(cards)
    expect(result.type).toBe(HAND_TYPES.TWO_PAIRS)
  })
  test('resolve three of kind correctly', () => {
    let cards = [
      { suit: '♠︎', number: '6' },
      { suit: '♣︎', number: '10' },
      { suit: '♠︎', number: '9' },
      { suit: '♥︎', number: '2' },
      { suit: '♠︎', number: '4' },
      { suit: '♠︎', number: '10' },
      { suit: '♦︎', number: '10' },
    ]
    let result = getBestPossible(cards)
    expect(result.type).toBe(HAND_TYPES.THREE_OF_A_KIND)
  })
  test('resolve straight correctly', () => {
    let cards = [
      { suit: '♠︎', number: '6' },
      { suit: '♣︎', number: '7' },
      { suit: '♠︎', number: '9' },
      { suit: '♥︎', number: '2' },
      { suit: '♠︎', number: '4' },
      { suit: '♠︎', number: '8' },
      { suit: '♦︎', number: '10' },
    ]
    let result = getBestPossible(cards)
    expect(result.type).toBe(HAND_TYPES.STRAIGHT)

    cards = [
      { suit: '♠︎', number: 'A' },
      { suit: '♣︎', number: '7' },
      { suit: '♠︎', number: '9' },
      { suit: '♥︎', number: '2' },
      { suit: '♠︎', number: '4' },
      { suit: '♠︎', number: '3' },
      { suit: '♦︎', number: '5' },
    ]
    result = getBestPossible(cards)
    expect(result.type).toBe(HAND_TYPES.STRAIGHT)
  })
  test('resolve flush correctly', () => {
    let cards = [
      { suit: '♠︎', number: 'A' },
      { suit: '♠︎', number: '7' },
      { suit: '♠︎', number: '9' },
      { suit: '♥︎', number: '2' },
      { suit: '♠︎', number: '4' },
      { suit: '♠︎', number: '6' },
      { suit: '♦︎', number: '5' },
    ]
    let result = getBestPossible(cards)
    expect(result.type).toBe(HAND_TYPES.FLUSH)
  })
  test('resolve full house correctly', () => {
    let cards = [
      { suit: '♠︎', number: '6' },
      { suit: '♣︎', number: '10' },
      { suit: '♠︎', number: '9' },
      { suit: '♥︎', number: '2' },
      { suit: '♠︎', number: '2' },
      { suit: '♠︎', number: '10' },
      { suit: '♦︎', number: '10' },
    ]
    let result = getBestPossible(cards)
    expect(result.type).toBe(HAND_TYPES.FULL_HOUSE)
  })
  test('resolve four of kind correctly', () => {
    let cards = [
      { suit: '♠︎', number: 'A' },
      { suit: '♣', number: 'A' },
      { suit: '♠︎', number: '9' },
      { suit: '♥︎', number: 'A' },
      { suit: '♠︎', number: '4' },
      { suit: '♠︎', number: '3' },
      { suit: '♦︎', number: 'A' },
    ]
    let result = getBestPossible(cards)
    expect(result.type).toBe(HAND_TYPES.FOUR_OF_A_KIND)
  })
  test('resolve straight flush correctly', () => {
    let cards = [
      { suit: '♠︎', number: 'A' },
      { suit: '♣', number: 'A' },
      { suit: '♠︎', number: '10' },
      { suit: '♥︎', number: 'A' },
      { suit: '♠︎', number: 'J' },
      { suit: '♠︎', number: 'Q' },
      { suit: '♠︎', number: 'K' },
    ]
    let result = getBestPossible(cards)
    expect(result.type).toBe(HAND_TYPES.STRAIGHT_FLUSH)
  })
})

describe('compare', () => {
  test('compare highcard correctly', () => {
    let handA = {
      type: HAND_TYPES.HIGH_CARD,
      cards: [
        { suit: '♠︎', number: '2' },
        { suit: '♠︎', number: '5' },
        { suit: '♠︎', number: '6' },
        { suit: '♠︎', number: '7' },
        { suit: '♥︎', number: 'A' },
      ],
    }
    let handB = {
      type: HAND_TYPES.HIGH_CARD,
      cards: [
        { suit: '♠︎', number: '3' },
        { suit: '♠︎', number: '8' },
        { suit: '♠︎', number: 'J' },
        { suit: '♠︎', number: 'Q' },
        { suit: '♥︎', number: 'K' },
      ],
    }
    let result = compare(handA, handB)
    expect(result).not.toBeGreaterThan(0)
  })
})
