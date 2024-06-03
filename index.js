require('dotenv').config();
const express=require('express');
const app=express();
const mongoose = require('mongoose');
const cors = require('cors');
const userAuthRoutes = require('./routes/userAuthRoutes');
const apiRoutes = require('./routes/apiRoutes');

app.use(cors({
    origin: true,
    credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({extended: true}));

app.use(userAuthRoutes);
app.use(apiRoutes);

mongoose.connect(process.env.MONGODB_URI)
.then((data, error) => {
    if (!error) {
        console.log("Connected to DB");
        app.listen(process.env.PORT, "0.0.0.0", (error) => {
            if (!error) console.log("Server started at http://0.0.0.0:" + process.env.PORT);
            else console.log(error.message);
        }); 
    } else console.log(error);
});