const { ethers } = require('ethers');
const NFTModel = require('../models/nftModel')
const catchAsyncErrors = require('../middlewares/catchAsyncError')
const ErrorHandler = require('../utils/errorHandler')
const abi = require("../abi/PetNftAbi.json")

// Get all NFTs of a user
exports.getNFTsByUser = catchAsyncErrors(async (req, res, next) => {
    let nfts = await NFTModel.find({ owner: req.params.userAddress })

    for (let i = 0; i < nfts.length; i++) {
        nfts[i] = await updateStat(nfts[i])
    }

    res.status(200).json({
        success: true,
        nfts
    })
})

// Get NFT by Token ID
exports.getNFTByTokenId = catchAsyncErrors(async (req, res, next) => {
    let nft = await NFTModel.findOne({ tokenId: req.params.id })

    if (!nft) {
        return next(new ErrorHandler('NFT not found in database', 404))
    }

    nft = await updateStat(nft);
    res.status(200).json({
        success: true,
        nft
    })
})

exports.feedNft = catchAsyncErrors(async (req, res, next) => {
    let nft = await NFTModel.findOne({ tokenId: req.params.id })
    if (!nft) {
        return next(new ErrorHandler('NFT not found in database', 404))
    }

    if (new Date() - nft.lastFeed < 1000 * 60 * 60 * 1) {
        return next(new ErrorHandler('You can feed your pet only once in an hour', 400))
    }
    nft.hydration = Math.min(nft.hydration + 2, 100);
    nft.happiness = Math.min(nft.happiness + 1, 100);
    nft.health = Math.min(nft.health + 1, 100);
    nft.lastFeed = new Date();

    nft = await nft.save();

    res.status(200).json({
        success: true,
        nft
    })
})

exports.exerciseNft = catchAsyncErrors(async (req, res, next) => {
    let nft = await NFTModel.findOne({ tokenId: req.params.id })

    if (!nft) {
        return next(new ErrorHandler('NFT not found in database', 404))
    }

    if (new Date() - nft.lastExercise < 1000 * 60 * 60 * 12) {
        return next(new ErrorHandler('You can exercise your pet only once in 12 hours', 400))
    }

    nft.health = Math.min(nft.health + 5, 100)
    nft.happiness = Math.min(nft.happiness + 5, 100)
    nft.lastExercise = new Date();

    nft = await nft.save();
    res.status(200).json({
        success: true,
        nft
    })
})

let letters = "abcdefghijklmnopqrstuvwxy".split("");
let time = 0;
const words = ["train", "smart", "water", "flame", "place"];

exports.getWordleData = catchAsyncErrors(async (req, res, next) => {
    if (Date.now() - time > 1000 * 60 * 60 * 24) {
        letters = letters.sort(() => Math.random() - 0.5);
        time = Date.now();
    }

    let nft = await NFTModel.findOne({ tokenId: req.params.id })
    let chances;

    if (new Date() - nft.lastWordleTry < 1000 * 60 * 15 && nft.chances == 0) {
        return next(new ErrorHandler("You can upgrade only once every 15 minutes", 400))
    } else if (new Date() - nft.lastWordleTry > 1000 * 60 * 15 && nft.chances <= 3) {
        nft.chances = 3
        chances = 3
        await nft.save()
    } else {
        chances = nft.chances
    }

    const targetWord = words[Math.floor(Math.random() * words.length)];

    res.status(200).json({
        success: true,
        targetWord,
        chances
    })
})

exports.checkWordledata = catchAsyncErrors(async (req, res, next) => {
    let nums = req.body.nums ? req.body.nums.split(',').map(Number) : []
    let word = ""

    let nft = await NFTModel.findOne({ tokenId: req.params.id })

    if (nft.chances > 0) {
        nft.chances--;
        if (nft.chances == 0) {
            nft.lastWordleTry = new Date();
        }
        await nft.save()
    } else {
        return next(new ErrorHandler("You do not have any chances left, please try again after 15 minutes", 400))
    }

    for (let i = 0; i < 5; i++) {
        word += letters[nums[i]]
    }

    if (word == req.body.targetWord) {
        const { userAddress, tokenId } = req.body
        const signature = await getSignature(userAddress, tokenId, next)

        if (signature) {
            res.status(200).json({
                success: true,
                word: word,
                found: true,
                signature
            })
        }
    } else {
        res.status(200).json({
            success: true,
            word: word,
            found: false,
        })
    }
})

// Get the hash
async function getSignature(userAddress, tokenId, next) {
    const PRIVATE_KEY = process.env.PRIVATE_KEY
    const signature = await verifyAndGenerateProof(userAddress, tokenId, PRIVATE_KEY, next)
    return signature
}

async function updateStat(nft) {
    const now = new Date();
    const THREE_HOURS_IN_MS = 1000 * 60 * 60 * 3;
    const TWENTY_FOUR_HOURS_IN_MS = 1000 * 60 * 60 * 24;

    const timeSinceLastFeed = now - nft.lastFeed;
    const timeSinceLastExercise = now - nft.lastExercise;

    const feedInterval = Math.floor(timeSinceLastFeed / THREE_HOURS_IN_MS);
    const exerciseInterval = Math.floor(timeSinceLastExercise / TWENTY_FOUR_HOURS_IN_MS);

    if (timeSinceLastFeed > THREE_HOURS_IN_MS) {
        nft.hydration = Math.max((nft.hydration - feedInterval * 1), 0);
        nft.happiness = Math.max((nft.happiness - feedInterval * 1), 0);
        nft.health = Math.max((nft.health - feedInterval * 1), 0);
    }
    if (timeSinceLastExercise > TWENTY_FOUR_HOURS_IN_MS) {
        nft.happiness = Math.max((nft.happiness - exerciseInterval * 3), 0);
        nft.health = Math.max((nft.health - exerciseInterval * 3), 0);
    }

    return await nft.save();
}

async function verifyAndGenerateProof(userAddress, tokenId, PRIVATE_KEY, next) {
    // Check if the user completed the off-chain task
    const nft = await NFTModel.findOne({ tokenId })
    const taskCompleted = await checkData(nft)
    if (taskCompleted) {
        const provider = new ethers.JsonRpcProvider(process.env.RPC_URL, {
            name: "klaytn-baobab",
            chainId: 1001
        })
        const wallet = new ethers.Wallet(PRIVATE_KEY, provider)

        const contractAddress = process.env.CONTRACT_ADDRESS;
        const contract = new ethers.Contract(contractAddress, abi, provider);

        let nonce = await contract.getPetNonce(tokenId);
        const hash = ethers.keccak256(ethers.solidityPacked(
            ['uint256', 'address', 'uint256'],
            [tokenId, userAddress, nonce]
        ))

        const signedMessage = await wallet.signMessage(ethers.getBytes(hash))
        return signedMessage
    } else {
        return next(new ErrorHandler("Improve health, hydration and happiness above 50 before upgrade", 400))
    }
}

async function checkData(nft) {
    if (!nft) {
        return false;
    }

    if (nft.happiness < 50 || nft.hydration < 50 || nft.health < 50) {
        return false;
    }
    return true;
}