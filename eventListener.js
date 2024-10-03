require("dotenv").config(); // Load environment variables
const { ethers } = require("ethers");
const abi = require("./abi/PetNftAbi.json")
const NFTModel = require('./models/nftModel')

const provider = new ethers.JsonRpcProvider(process.env.RPC_URL, {
    name: "klayton-baobab",
    chainId: 1001
});
const contractAddress = process.env.CONTRACT_ADDRESS;

const contract = new ethers.Contract(contractAddress, abi, provider);

// Example: Event Listener for Transfer event
contract.on("Transfer", async (from, to, tokenId, event) => {
    console.log(`Transfer detected! From: ${from}, To: ${to}, TokenId: ${tokenId.toString()}`);

    if (from != "0x0000000000000000000000000000000000000000") {
        let nft = await NFTModel.findOne({ tokenId })
        nft.owner = to
        nft = await nft.save()
    }
});

contract.on("NFTMinted", async (owner, tokenId, name, petType, imageUri, event) => {
    console.log(`NFTMinted detected! Owner: ${owner}, TokenId: ${tokenId}, Name: ${name} Image: ${imageUri} petType: ${petType}`);
    console.log("PetType: ", petType)

    let type;
    if (Number(petType) == 1) {
        type = "DOG"
    } else if (Number(petType) == 2) {
        type = "DUCK"
    } else if (Number(petType) == 3) {
        type = "DOVE"
    } else {
        type = "CAT"
    }

    const id = Number(tokenId)

    await NFTModel.create({
        tokenId: id,
        petName: name,
        owner,
        image: imageUri,
        petType: type,
        level: 1,
        agility: 1,
        strength: 1,
        intelligence: 1,
        lastFeed: new Date() - 1000 * 60 * 60 * 1,
        lastExercise: new Date() - 1000 * 60 * 60 * 12,
        hydration: 40,
        happiness: 40,
        health: 50,
        lastWordleTry: new Date() - 1000 * 60 * 15,
        chances: 3
    })
});

contract.on("NFTUpdated", async (tokenId, level, agility, strength, intelligence, event) => {
    console.log(`NFTUpdated detected! TokenId: ${tokenId}, Level: ${level}, Agility: ${agility}, Strength: ${strength}, Intelligence: ${intelligence}`);

    const id = Number(tokenId)

    let nft = await NFTModel.findOne({ tokenId: id })
    nft.level = Number(level)
    nft.agility = Number(agility)
    nft.strength = Number(strength)
    nft.intelligence = Number(intelligence)
    nft = await nft.save()
})