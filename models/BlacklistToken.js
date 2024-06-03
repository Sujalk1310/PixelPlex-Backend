const mongoose = require('mongoose');

const blacklistTokenSchema = new mongoose.Schema({
    token: { type: String, required: true, unique: true },
    blacklistedAt: {
        type: Date,
        default: Date.now,
    }
}, {timestamps: true});

blacklistTokenSchema.index({createdOn: 1}, {expireAfterSeconds: 4000});

const BlacklistToken = mongoose.model('BlacklistToken', blacklistTokenSchema);

module.exports = BlacklistToken;