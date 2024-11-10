const express = require('express');

const app = express();
require('dotenv').config();
const PORT = 3000;

app.get('/', (req, res) => {
    res.send("Hello world!");
});

app.listen(process.env.PORT, () => {
    console.log(`App is listening on port ${PORT}`);
});