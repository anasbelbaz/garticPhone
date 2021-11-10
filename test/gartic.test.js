const {
  BN,
  expectRevert,
  expectEvent,
  constants,
} = require('@openzeppelin/test-helpers')
const { expect } = require('chai')

const qaq = artifacts.require('Gartic')

contract('Gartic', function (accounts) {
  const owner = accounts[0]
  const nbJoueurs = new BN(5)
  const j1 = accounts[1]
  const j2 = accounts[2]
  const j3 = accounts[3]
  const j4 = accounts[4]
  const j5 = accounts[5]
  const newWord = 'NewWord'

  let Gartic

  context('fonctions', function () {
    beforeEach(async function () {
      Gartic = await qaq.new(nbJoueurs, { from: owner })
    })

    it('... tester la function StoreWord', async () => {
      let result = await Gartic.StoreWord(newWord, { from: j1 })
      await expectRevert(
        Gartic.StoreWord(newWord, { from: j2 }),
        "Can't write same word !"
      )
      await expectRevert(
        Gartic.StoreWord("N'impote", { from: j1 }),
        'u already played'
      )

      const words = await Gartic.GetWords({ from: owner })

      expectEvent(result, 'newWord', { player: j1, word: newWord })
      expect(words[0]).to.equal(newWord, 'Les mots sont pas meme')
    })

    it('... tester la function GetLastWord', async () => {
      let lastMot = await Gartic.getLastWord({ from: owner })
      expect(lastMot).to.equal('', 'En debut de jeu on doit avoir chaine vide')

      const word = 'Word'
      await Gartic.StoreWord(word + 1, { from: j1 })
      await Gartic.StoreWord(word + 2, { from: j2 })
      await Gartic.StoreWord(word + 3, { from: j3 })

      lastMot = await Gartic.getLastWord({ from: owner })
      expect(lastMot).to.equal(word + 3, 'Doit etre le mot : Word')
    })
  })

  context('tous les joueurs ont joue', function () {
    beforeEach(async function () {
      Gartic = await qaq.new(nbJoueurs, { from: owner })
      await Gartic.StoreWord(newWord + 1, { from: j1 })
      await Gartic.StoreWord(newWord + 2, { from: j2 })
      await Gartic.StoreWord(newWord + 3, { from: j3 })
      await Gartic.StoreWord(newWord + 4, { from: j4 })
      // await Gartic.StoreWord(newWord+5, {from: j5});
    })

    it('... tester la function StoreWord', async () => {
      const result = await Gartic.StoreWord(newWord + 5, { from: j5 })

      expectEvent(result, 'stateChanged', { enCours: new BN(1) })
    })

    it('... tester la function getFirstLast', async () => {
      await expectRevert(
        Gartic.getFirstLast({ from: owner }),
        "game's not over yet"
      )
      await Gartic.StoreWord(newWord + 5, { from: j5 })

      const result = await Gartic.getFirstLast({ from: owner })
      const { 0: first, 1: last } = result

      expect(first).to.equal(newWord + 1, 'Doit etre le mot : NewWord1')
      expect(last).to.equal(newWord + 5, 'Doit etre le mot : NewWord5')
    })

    it('... tester la function guessIt', async () => {
      await expectRevert(
        Gartic.guessIt('UnMot', { from: j2 }),
        'not guess time yet'
      )
      await Gartic.StoreWord(newWord + 5, { from: j5 })

      const adrressPerdantZero = await Gartic.guessIt.call('MauvaiseMot', {
        from: j2,
      })
      expect(adrressPerdantZero).to.be.bignumber.equal(constants.ZERO_ADDRESS)

      const adrressGagnant = await Gartic.guessIt.call(newWord + 1, {
        from: j2,
      })
      expect(adrressGagnant).to./* be.bignumber. */ equal(j2)
    })

    it('... tester la function getResults', async () => {
      await expectRevert(Gartic.getResults(), "game's not over yet")
      await Gartic.StoreWord(newWord + 5, { from: j5 })
      await Gartic.guessIt(newWord + 1, { from: j2 })
      const result = await Gartic.getResults({ from: j4 })

      expectEvent(result, 'finalResults', {
        firstWord: newWord + 1,
        lastWord: newWord + 5,
        winnerAddr: j2,
      })
    })

    it('... tester la function resetGame', async () => {
      await Gartic.StoreWord(newWord + 5, { from: j5 })
      await Gartic.guessIt(newWord + 1, { from: j2 })

      const result = await Gartic.resetGame({ from: owner })
      const words = await Gartic.GetWords.call({ from: owner })

      console.log(words)

      expectEvent(result, 'stateChanged', { enCours: new BN(0) })
      expect(words.length).to.equal(0)
    })
  })
})
