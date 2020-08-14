const Game = require('../app/game.js')

class InfoMock {
  buffer = ''
  info = (text) => {
    this.buffer += text
  }
  clear = () => {
    this.buffer = ''
  }
}

describe('Game class', () => {
  let participants
  const destructor = jest.fn()
  const infoMock = new InfoMock()
  beforeEach(() => {
    infoMock.clear()
    participants = [
      { id: 1, name: 'Alice' },
      { id: 2, name: 'Bob' },
    ].map(({ id, name }) => ({
      id,
      name,
      cards: [],
      fold: false,
      bet: 0,
      allIn: false,
    }))
  })

  describe('when starting a new round', () => {
    test('charge blinds correctly', () => {
      const game = new Game({ participants, destructor, info: infoMock.info })
      game.startRound()

      expect(game.starter).toBe(1)
      const headcount = participants.length
      expect(game.participants[1].balance).toBe(game.balance - game.sb)
      expect(game.participants[1].bet).toBe(game.sb)
      expect(game.participants[(1 + 1) % headcount].balance).toBe(
        game.balance - game.bb
      )
      expect(game.participants[(1 + 1) % headcount].bet).toBe(game.bb)
    })
  })
})
