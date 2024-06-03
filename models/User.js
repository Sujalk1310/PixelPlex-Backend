const {mongoose, Schema, model} = require('mongoose');

const userSchema = new Schema({
    uid: {
        type: String,
        unique: true
    },
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    password: {
        type: String,
        required: true
    },
    tokens: [
        {
          token: {
            type: String,
            required: true,
          }
        }
    ]
}, { timestamps: true });

const User = model('User', userSchema);

module.exports = User;
