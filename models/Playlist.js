const {mongoose, Schema, model} = require('mongoose');

const playlistSchema = new Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    puid: {
        type: String,
        unique: true
    },
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    private: {
        type: Boolean,
        required: true,
        default: false
    },
    image: {
        type: String,
        required: true,
        trim: true
    },
    movies: [
        {
            imdbID: {
                type: String,
                required: true,
                trim: true
            }
        }
    ]
}, { timestamps: true});

const Playlist = model('Playlist', playlistSchema);

module.exports = Playlist;