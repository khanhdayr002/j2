'use strict';
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const { router, loadedRoutes } = require("./server.js");
const log = require("../utils/logger");
const checkAPI = require("../utils");
const config = require("../config.json");
const APIKEY = process.cwd() + "/utils/APIKEY.json"
const app = express();
const getIP = require('ipware')().get_ip;
const fs = require('fs');
const { resolve } = require("path");
const path = resolve(__dirname, 'data.json');
const { writeFileSync } = require('fs');

global.checkAPI = checkAPI.check_api_key
global.config = config;
global.APIKEY = APIKEY;
global._404 = process.cwd() + '/public/_404.html';

app.use(helmet());
app.use(express.json());
app.use(cors());

app.use((req, res, next) => {
    if(global.admin == true || global.admin == false) return next();
    global.admin
    var ipInfo = getIP(req);
    var block = require("../utils/block-ban/block.js")(ipInfo.clientIp)
    if (block == true) return
    var limit = require("../utils/block-ban/limit-request.js")(ipInfo.clientIp)
    var type = global.config.ADMIN.includes(ipInfo.clientIp) ? 'ADMIN' : 'IP'
    log(`${type}: ${ipInfo.clientIp} - Đã yêu cầu tới path: ${decodeURIComponent(req.url)}`, 'STATUS');
    next();
});

app.get('/total_request', function (request, response) {
    var admin = request.query.admin
    if(admin == "true") {
        global.admin = true
    }
    var data = require('./data.json')
    response.status(200).json(data)
});

app.use(function (req, res, next) {
    if(global.admin == true) {
        global.admin = false
        return next();
    }
    var data = require('./data.json');
    data.total = data.total + 1
    writeFileSync(path, JSON.stringify(data, null, 4));
    next();
});

app.use("/", router);
app.set("json spaces", 4);
app.get('/', function (request, response) {
    let categoryHtml = Object.entries(loadedRoutes).map(([category, routes]) => {
        let routeLinks = routes.map(route => {
            let params = route.params.join(', ');
            return `
            <li>
                <span class="route-name">${route.name}</span>
                <span class="params">${params || 'Không có'}</span>
                <a href="${route.name}${params ? '?' + params.replace(/, /g, '&') + '=' : ''}" class="get-button">GET</a>
            </li>
            `;
        }).join('');

        return `
        <div class="category">
            <h2>${category}</h2>
            <ul class="api-list">
                ${routeLinks}
            </ul>
        </div>
        `;
    }).join('');

    response.send(`
<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>API - DgK</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.4;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 10px;
            font-size: 10px;
            background-color: #f0f0f0;
        }
        h1 {
            font-size: 18px;
            margin-bottom: 10px;
        }
        h2 {
            font-size: 14px;
            margin: 10px 0 5px;
        }
        .category {
            margin-bottom: 15px;
        }
        .api-list {
            list-style-type: none;
            padding: 0;
            margin: 0;
        }
        .api-list li {
            display: flex;
            align-items: center;
            margin-bottom: 3px;
            padding: 3px;
            background-color: #f9f9f9;
            border: 1px solid #ddd;
            border-radius: 3px;
            transition: background-color 0.3s ease;
        }
        .api-list li:hover {
            background-color: #e0e0e0;
        }
        .route-name {
            font-weight: bold;
            margin-right: 5px;
        }
        .params {
            color: #666;
            flex-grow: 1;
            text-overflow: ellipsis;
            overflow: hidden;
            white-space: nowrap;
        }
        .get-button {
            background-color: #3498db;
            color: white;
            padding: 2px 5px;
            border-radius: 3px;
            text-decoration: none;
            font-size: 8px;
        }
        .get-button:hover {
            background-color: #2980b9;
        }
        .profile {
            font-size: 10px;
            border: 1px solid #ddd;
            padding: 5px;
            border-radius: 3px;
            margin-top: 15px;
            background-color: #ffffff;
        }
        .profile h2 {
            font-size: 16px;
            margin-top: 0;
        }
        .music-player {
            margin-top: 20px;
            text-align: center;
            display: none; /* Hide the music player initially */
            opacity: 0; /* Set opacity to 0 for the fade effect */
            transition: opacity 1s ease-in-out; /* Fade-in effect */
        }
        audio {
            width: 100%;
            border-radius: 10px;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
        }
        audio:hover {
            transform: scale(1.05);
            transition: transform 0.3s ease-in-out;
        }
        .now-playing-text {
            font-size: 14px;
            color: #3498db;
            animation: fadeInText 1s ease-in-out;
        }
        @keyframes fadeInText {
            0% { opacity: 0; }
            100% { opacity: 1; }
        }
    </style>
</head>
<body>
    <h1>API - DgK</h1>
    ${categoryHtml}

    <!-- Music Player -->
    <div class="music-player" id="musicPlayer">
        <h2 class="now-playing-text">Now Playing: Music from DgK</h2>
        <audio controls autoplay id="audioPlayer">
            Your browser does not support the audio element.
        </audio>
    </div>

    <!-- Profile Section -->
    <div class="profile">
        <h2>Profile DgK</h2>
        <p>Author: DgK<br>
        <a href="https://www.facebook.com/wind.009">FACEBOOK</a><br>
        <a href="https://instagram.com/im.baooo">INSTAGRAM</a><br>
        MBBANK: </p>
    </div>

    <script>
        // List of music URLs
        const musicList = [
            "https://files.catbox.moe/ist9k1.mp3", // Example 1
            "https://files.catbox.moe/cwmud8.mp3", // Example 2
            "https://files.catbox.moe/s215gy.mp3"  // Example 3
        ];

        // Function to randomly select a song
        function selectRandomMusic() {
            const randomIndex = Math.floor(Math.random() * musicList.length);
            const selectedMusic = musicList[randomIndex];

            const audioPlayer = document.getElementById("audioPlayer");
            const musicPlayer = document.getElementById("musicPlayer");

            // Set the source for the audio player
            audioPlayer.src = selectedMusic;

            // Display the music player and fade it in
            musicPlayer.style.display = 'block';
            setTimeout(() => musicPlayer.style.opacity = 1, 100); // Delay to trigger fade-in effect
        }

        // Call the function to select and play a random song
        window.onload = selectRandomMusic;
    </script>
</body>
</html>



    `);
});



app.post('/upcode', function (req, res) {
    var code = req.body.code;
    var id = ((Math.random() + 1).toString(36).substring(2)).toUpperCase()
    fs.writeFile(
        `${__dirname}/public/codeStorage/database/_${id}.js`,
        code,
        "utf-8",
        function (err) {
            if (err) return res.status(500).json({
                status: false,
                message: 'Không thể up code của bạn lên!'
            })
            return res.status(200).json({
                status: true,
                url: 'https://subnhanh.vn/upcode/raw/?id=' + id
            })
        }
    );
});

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(err.status || 500).json({
        error: {
            message: err.message || 'Đã xảy ra lỗi server',
            status: err.status || 500
        }
    });
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

app.set('port', (process.env.PORT || 8888));
app.listen(app.get('port'), function() {
    log(`API DGK is running on port ${app.get('port')}`, 'HOST UPTIME');
});
