const SUITS = ['♣︎', '♦︎', '♥︎', '♠︎']

const NUMBERS = [
  'A',
  '2',
  '3',
  '4',
  '5',
  '6',
  '7',
  '8',
  '9',
  '10',
  'J',
  'Q',
  'K',
]

const ORDER = Object.fromEntries(
  NUMBERS.map((number, index) => [number, (index + 12) % 13])
)

const HAND_TYPES = {
  HIGH_CARD: 0,
  PAIR: 1,
  TWO_PAIRS: 2,
  THREE_OF_A_KIND: 3,
  STRAIGHT: 4,
  FLUSH: 5,
  FULL_HOUSE: 6,
  FOUR_OF_A_KIND: 7,
  STRAIGHT_FLUSH: 8,
}

const HAND_TYPE_NAMES = {
  [HAND_TYPES.HIGH_CARD]: 'High Card',
  [HAND_TYPES.PAIR]: 'Pair',
  [HAND_TYPES.TWO_PAIRS]: 'Two Pairs',
  [HAND_TYPES.THREE_OF_A_KIND]: 'Three Of A Kind',
  [HAND_TYPES.STRAIGHT]: 'Straight',
  [HAND_TYPES.FLUSH]: 'Flush',
  [HAND_TYPES.FULL_HOUSE]: 'Full House',
  [HAND_TYPES.FOUR_OF_A_KIND]: 'Four Of A Kind',
  [HAND_TYPES.STRAIGHT_FLUSH]: 'Straight Flush',
}

// all resolvers may in-place edit the argument, make sure to pass a new array to them
const resolvers = [
  function highCardResolver(cards) {
    return cards.slice(2, 7)
  },
  function pairResolver(cards) {
    let result = null
    const clone = cards.slice()
    for (let i = clone.length; i >= 2; i--) {
      if (clone[i - 1].number === clone[i - 2].number) {
        result = clone.splice(i - 2, 2)
        break
      }
    }
    if (result) {
      result = result.concat(clone.slice(-3))
      return result
    }
    return null
  },
  function twoPairsResolver(cards) {
    let result = []
    const clone = cards.slice()
    for (let i = clone.length; i >= 2; i--) {
      if (clone[i - 1].number === clone[i - 2].number) {
        result = result.concat(clone.splice(i - 2, 2))
        i -= 1
        if (result.length === 4) break
      }
    }
    if (result.length === 4) {
      result.push(clone[clone.length - 1])
      return result
    }
    return null
  },
  function threeOfAKindResolver(cards) {
    let result = null
    const clone = cards.slice()

    for (let i = clone.length; i >= 3; i--) {
      if (
        clone[i - 1].number === clone[i - 2].number &&
        clone[i - 2].number === clone[i - 3].number
      ) {
        result = clone.splice(i - 3, 3)
        break
      }
    }
    if (result) {
      return result.concat(clone.slice(-2))
    }
    return null
  },
  function straightResolver(cards) {
    // remove cards with same number as the suits aren't matter
    const deduped = cards.filter(
      (card, index) => index === 0 || card.number !== cards[index - 1].number
    )

    // special check for A2345
    let result = []
    for (let i of [12, 0, 1, 2, 3]) {
      const found = deduped.find((card) => ORDER[card.number] === i)
      if (found) result.push(found)
    }
    if (result.length === 5) return result

    for (let i = deduped.length; i >= 5; i--) {
      const take5 = deduped.slice(i - 5, i)
      const isStraight = take5.every(
        (card, index) =>
          index === 0 ||
          ORDER[card.number] === ORDER[take5[index - 1].number] + 1 ||
          ORDER[deduped[index - 1].number] === 12 // ace is the first
      )
      if (isStraight) return take5
    }

    return null
  },
  function flushResolver(cards) {
    let result = null
    SUITS.forEach((suit) => {
      // filter cards with same suit
      const sameSuit = cards.filter((card) => card.suit === suit)
      if (sameSuit.length >= 5) result = sameSuit.slice(-5)
    }, null)
    return result
  },
  function fullHouseResolver(cards) {
    let result = null
    const clone = cards.slice()
    // find 3-of-a-kind first
    for (let i = clone.length; i >= 3; i--) {
      if (
        clone[i - 1].number === clone[i - 2].number &&
        clone[i - 2].number === clone[i - 3].number
      ) {
        result = clone.splice(i - 3, 3)
        break
      }
    }
    if (result) {
      // find pair
      for (let i = clone.length; i >= 2; i--) {
        if (clone[i - 1].number === clone[i - 2].number) {
          return result.concat(clone.splice(i - 2, 2))
        }
      }
    }
    return null
  },
  function fourOfAKindResolver(cards) {
    let result = null
    const clone = cards.slice()
    for (let i = clone.length; i >= 4; i--) {
      const take4 = clone.slice(i - 4, i)
      if (take4.every((card) => card.number === clone[i - 1].number)) {
        clone.splice(i - 4, 4)
        result = take4
        break
      }
    }
    if (result) {
      result.push(clone[clone.length - 1])
      return result
    }
    return null
  },
  function straightFlushResolver(cards) {
    let result = null
    SUITS.forEach((suit) => {
      // filter cards with same suit
      const sameSuit = cards.filter((card) => card.suit === suit)
      // call straight resolver
      if (sameSuit.length)
        result = result || resolvers[HAND_TYPES.STRAIGHT](sameSuit)
    })
    return result
  },
]

const getBestPossible = (cards) => {
  cards.sort((a, b) => ORDER[a.number] - ORDER[b.number])
  for (let i = resolvers.length - 1; i >= 0; i--) {
    const result = resolvers[i](cards)
    if (result)
      return {
        type: i,
        cards: result,
      }
  }
}

const compare = (handA, handB) => {
  if (handA.type !== handB.type) return handB.type - handA.type
  const cardsA = handA.cards
  const cardsB = handB.cards
  let compareOrder = null
  switch (handA.type) {
    case HAND_TYPES.STRAIGHT_FLUSH:
    case HAND_TYPES.STRAIGHT:
    //PATTERN: AAAAB
    case HAND_TYPES.FOUR_OF_A_KIND: {
      compareOrder = [4]
      break
    }
    case HAND_TYPES.FLUSH:
    case HAND_TYPES.HIGH_CARD: {
      compareOrder = [4, 3, 2, 1, 0]
      break
    }
    // pattern: AABBC
    case HAND_TYPES.TWO_PAIRS: {
      compareOrder = [0, 2, 4]
      break
    }
    // pattern: AABCD
    case HAND_TYPES.PAIR: {
      compareOrder = [0, 4, 3, 2]
      break
    }
    // pattern: AAABC
    case HAND_TYPES.THREE_OF_A_KIND: {
      compareOrder = [0, 4, 3]
      break
    }

    // pattern: AAABB
    case HAND_TYPES.FULL_HOUSE: {
      compareOrder = [0, 4]
      break
    }

    default:
      compareOrder = [4, 3, 2, 1, 0]
  }
  for (let i of compareOrder) {
    if (cardsA[i].number !== cardsB[i].number)
      return ORDER[cardsB[i].number] - ORDER[cardsA[i].number]
  }
  return 0
}

module.exports = {
  SUITS,
  NUMBERS,
  HAND_TYPES,
  HAND_TYPE_NAMES,
  resolvers,
  getBestPossible,
  compare,
}
