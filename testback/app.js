const express = require('express');
const mongoose = require('mongoose');

var app = express();
port = 3000;

mongoose.connect('mongodb://localhost/testDb', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log("========================DATABASE CONNECTED====================")
})

app.listen(port, () => console.log("Server started"));