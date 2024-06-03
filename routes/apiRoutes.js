const express = require("express");
const router = express.Router();
const { verifyTokenMiddleware } = require('../utils/jwtResolver');
const { v4: uuidv4 } = require('uuid');
const BlacklistToken = require('../models/BlacklistToken');
const User = require('../models/User');
const Playlist = require('../models/Playlist');
const axios = require('axios');

router.use(verifyTokenMiddleware);

const fetchRandomImage = async () => {
    try {
        const response = await axios.get(`https://api.unsplash.com/search/photos?query=movie&client_id=pqTf7-alMchSv4rvgAHVpoLtWbt7D0W7sahXsj6vK_I`);
        if (response.status === 200) {
            const i = Math.floor(Math.random() * 10);
            return response.data.results[i].urls.regular;
        } else {
            console.log(`Error: ${response.status}, ${response.statusText}`);
        }
    } catch (error) {
        console.error(`Error fetching the image: ${error.message}`);
    }
}

router.post("/remove", async (req, res) => {
    try {
        const { puid, imdbID } = req.body;
        if (!puid || !imdbID) {
            return res.status(400).json({ message: "Required fields not present." });
        }
        const playlist = await Playlist.findOne({ puid });
        if (!playlist) {
            return res.status(404).json({ message: "Playlist not found." });
        }
        const movieIndex = playlist.movies.findIndex(movie => movie.imdbID === imdbID);
        if (movieIndex === -1) {
            return res.status(404).json({ message: "Movie not found in the playlist." });
        }
        playlist.movies.splice(movieIndex, 1);
        await playlist.save();

        return res.status(200).json({ message: "Movie removed from playlist successfully." });
    } catch (error) {
        console.error('Error:', error);
        return res.status(500).json({ message: `Oops! An error occurred: ${error.message}` });
    }
});


router.get("/list/:puid", async (req, res) => {
    try {
        const { puid } = req.params;
        if (!puid) return res.status(400).json({ message: "Required parameters not set." });
        const playlist = await Playlist.findOne({ puid });
        if (!playlist) return res.status(404).json({ message: "Playlist not found." });
        if (playlist.private) {
            const user = await User.findOne({ uid: req.headers.uid });
            if (!user) {
                return res.status(404).json({ message: "User not found." });
            }
            if (playlist.user !== user._id) {
                return res.status(200).json({ allow: false });
            }
        }
        const movies = playlist.movies;
        return res.status(200).json({ movies, allow: true });
    } catch (error) {
        return res.status(500).json({ message: `Oops! An error occured: ${error}` });
    }
})

router.get("/info/:puid", async (req, res) => {
    try {
        const { puid } = req.params;
        if (!puid) return res.status(400).json({ message: "Required parameters not set." });
        const playlist = await Playlist.findOne({ puid });
        if (!playlist) return res.status(404).json({ message: "Playlist not found." });
        return res.status(200).json({ user: playlist.user, puid: playlist.puid, pname: playlist.name, private: playlist.private });
    } catch (error) {
        return res.status(500).json({ message: `Oops! An error occured: ${error}` });
    }
})

router.post("/delete", async (req, res) => {
    try {
        const user = await User.findOne({ uid: req.headers.uid });
        if (!user) {
            return res.status(404).json({ message: "User not found." });
        }
        const { puid } = req.body;
        if (!puid) {
            return res.status(400).json({ message: "Required fields not present." });
        }
        const deletedPlaylist = await Playlist.findOneAndDelete({ puid });
        if (!deletedPlaylist) {
            return res.status(404).json({ message: "Playlist not found." });
        }
        return res.status(200).json({ message: "Playlist deleted successfully." });
    } catch (error) {
        return res.status(500).json({ message: `Oops! An error occured: ${error}` });
    }
})

router.get("/playlist", async (req, res) => {
    try {
        const user = await User.findOne({ uid: req.headers.uid });
        if (!user) {
            return res.status(404).json({ message: "User not found." });
        }
        const name = req.query.name;
        const g = req.query.g;
        let playlists;
        if (g === 'true') {
            if (name) {
                playlists = await Playlist.find({ name: { $regex: name, $options: 'i' }, private: false });
            } else {
                playlists = await Playlist.find({ private: false });
            }
        } else {
            if (name) {
                playlists = await Playlist.find({ user: user._id, name: { $regex: name, $options: 'i' } });
            } else {
                playlists = await Playlist.find({ user: user._id });
            }
        }
        return res.status(201).json({ playlists });
    } catch (error) {
        return res.status(500).json({ message: `Oops! An error occured: ${error}` });
    }
})

router.get("/name", async (req, res) => {
    try {
        const user = await User.findOne({ uid: req.headers.uid });
        if (!user) {
            return res.status(404).json({ message: "User not found." });
        }
        return res.status(201).json({ username: user.username });
    } catch (error) {
        return res.status(500).json({ message: `Oops! An error occured: ${error}` });
    }
})

router.post("/change", async (req, res) => {
    try {
        const { puid } = req.body;
        if (!puid) return res.status(400).json({ message: "Required parameters not set." });
        const playlist = await Playlist.findOne({ puid });
        if (!playlist) return res.status(404).json({ message: "Playlist not found." });
        playlist.private = !playlist.private;
        await playlist.save();
        return res.status(201).json({ message: `Playlist changed to ${playlist.private ? 'Private' : 'Public' }.` });
    } catch (error) {
        return res.status(500).json({ message: `Oops! An error occured: ${error}` });
    }
})

router.post("/playlist", async (req, res) => {
    try {
        const user = await User.findOne({ uid: req.headers.uid });
        if (!user) {
            return res.status(404).json({ message: "User not found." });
        }
        const { name } = req.body;
        if (!name) {
            return res.status(400).json({ message: "Required fields not present." });
        }
        const existingPlaylist = await Playlist.findOne({ user: user._id, name: name.trim() });
        if (existingPlaylist) {
            return res.status(400).json({ message: "A playlist with this name already exists." });
        }
        const image = await fetchRandomImage();
        await Playlist.create({ user: user._id, puid: uuidv4(), name: name.trim(), private: false, image });
        return res.status(201).json({ message: "Playlist created successfully." });
    } catch (error) {
        return res.status(500).json({ message: `Oops! An error occured: ${error}` });
    }
})

router.post("/movie", async (req, res) => {
    try {
        const user = await User.findOne({ uid: req.headers.uid });
        if (!user) {
            return res.status(404).json({ message: "User not found." });
        }
        const { imdbID, playlistName } = req.body;
        if (!imdbID || !playlistName) {
            return res.status(400).json({ message: "Required fields not present." });
        }
        const playlist = await Playlist.findOne({ user: user._id, name: playlistName });
        if (!playlist) {
            return res.status(404).json({ message: 'Playlist not found.' });
        }
        if (!playlist.movies.some(movie => movie.imdbID === imdbID)) {
            playlist.movies.push({ imdbID });
        } else {
            return res.status(400).json({ message: 'Movie already in playlist' });
        }
        await playlist.save();
        return res.status(201).json({ message: `Movie added to ${playlistName}` });
    } catch (error) {
        return res.status(500).json({ message: `Oops! An error occured: ${error}` });
    }
})

router.post("/logout", async (req, res) => {
    try {
        await BlacklistToken.create({ token: req.headers.authorization });
        return res.status(201).json({
            message: "User logged out."
        });
    } catch (error) {
        return res.status(500).json({ message: `Oops! An error occured: ${error}` });
    }
});

module.exports = router;