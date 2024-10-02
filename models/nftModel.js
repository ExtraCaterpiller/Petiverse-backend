const mongoose = require('mongoose')

const nftSchema = mongoose.Schema({
    tokenId: {
        type: Number,
        required: true,
        unique: true
    },
    petName: {
        type: String,
        required: true,
        maxlength: 50
    },
    level: {
        type: Number,
        required: true,
        min: 1
    },
    owner: {
        type: String,
        required: true,
        validate: {
            validator: function (v) {
                return /^0x[a-fA-F0-9]{40}$/.test(v); // Checks for valid Ethereum address
            },
            message: props => `${props.value} is not a valid Ethereum address!`
        }
    },
    image: {
        type: String,
        required: true
    },
    petType: {
        type: String,
        enum: ['CAT', 'DOG', 'DUCK', 'DOVE'],
        required: true
    },
    agility: {
        type: Number,
        required: true,
        min: 0
    },
    strength: {
        type: Number,
        required: true,
        min: 0
    },
    intelligence: {
        type: Number,
        required: true,
        min: 0
    },
    lastFeed: {
        type: Date,
        required: true
    },
    lastExercise: {
        type: Date,
        required: true
    },
    hydration: {
        type: Number,
        required: true,
        min: 0
    },
    happiness: {
        type: Number,
        required: true,
        min: 0
    },
    health: {
        type: Number,
        required: true,
        min: 0
    },
    lastWordleTry: {
        type: Date,
        required: true
    },
    chances: {
        type: Number,
        max: 3,
        required: true
    }
}, { timestamps: true })

nftSchema.index({ tokenId: 1 }, { unique: true })
nftSchema.index({ owner: 1 })

module.exports = mongoose.model("nftdata", nftSchema);