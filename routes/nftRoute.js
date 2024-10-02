const express = require('express')
const router = express.Router()

const { getNFTsByUser, getNFTByTokenId, feedNft, exerciseNft, getWordleData, checkWordledata } = require('../controllers/nftController')

router.route('/nft/gamedata/:id').get(getWordleData)
router.route('/nft/checkwordle/:id').post(checkWordledata)
router.route('/nft/:userAddress').get(getNFTsByUser)
router.route('/nft/token/:id').get(getNFTByTokenId)
router.route('/nft/feed/:id').put(feedNft)
router.route('/nft/exercise/:id').put(exerciseNft)

module.exports = router