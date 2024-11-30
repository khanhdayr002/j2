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
    <title>API - DGK</title>
    <style>
        /* Body styling */
        body {
            font-family: Arial, sans-serif;
            line-height: 1.4;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 10px;
            font-size: 10px;
            background-color: #000;
        }

        /* Heading styling */
        h1 {
            font-size: 24px;
            margin-bottom: 10px;
            color: #fff;
            text-align: center;
            text-shadow: 0 0 10px #3498db, 0 0 20px #3498db;
        }

        /* API list section */
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
            margin-bottom: 5px;
            padding: 5px;
            background-color: #f9f9f9;
            border: 1px solid #ddd;
            border-radius: 3px;
            box-shadow: 0 0 5px rgba(0, 0, 0, 0.1);
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
            padding: 2px 8px;
            border-radius: 3px;
            text-decoration: none;
            font-size: 10px;
        }

        /* Profile section styling */
        .profile {
            font-size: 12px;
            border: 1px solid #ddd;
            padding: 15px;
            border-radius: 8px;
            margin-top: 15px;
            color: #fff;
            background-color: #333;
            text-align: center;
            box-shadow: 0 0 15px rgba(255, 255, 255, 0.2);
        }

        .profile h2 {
            font-size: 20px;
            margin-top: 0;
            text-shadow: 0 0 5px #fff;
        }

        /* Social links styling */
        .social-links {
            margin-top: 10px;
        }

        .social-links a {
            display: inline-block;
            margin: 0 10px;
            text-decoration: none;
            color: #fff;
            transition: transform 0.3s, box-shadow 0.3s;
        }

        .social-links a:hover {
            transform: scale(1.2);
            box-shadow: 0 0 10px #fff;
        }

        .social-links img {
            width: 40px;
            height: 40px;
            border-radius: 50%;
        }
    </style>
</head>
<body>
    <h1>API - DGK</h1>
    <audio id="bg-music" src="https://cdn.fbsbx.com/v/t59.3654-21/467096692_532226176369524_1502215851174074072_n.mp3/1732947984125.mp3?_nc_cat=110&ccb=1-7&_nc_sid=d61c36&_nc_ohc=r2vCErSBE9kQ7kNvgHznq_0&_nc_zt=7&_nc_ht=cdn.fbsbx.com&_nc_gid=A6ZwZUozWNe0KHjTANABxha&oh=03_Q7cD1QE2zyQU9Wah4pECiVvr3IPEs3Kimk4kkkjwA1lrxNClkQ&oe=674C96EB&dl=1" autoplay muted></audio>

    <!-- API List -->
    <div class="category">
        <h2 style="color: white;">Danh sách API</h2>
        <ul class="api-list">
            <li>
                <span class="route-name">GET</span>
                <span class="params">/api/users</span>
                <a href="/api/users" class="get-button">Send Request</a>
            </li>
            <li>
                <span class="route-name">POST</span>
                <span class="params">/api/upload</span>
                <a href="/api/upload" class="get-button">Send Request</a>
            </li>
            <li>
                <span class="route-name">DELETE</span>
                <span class="params">/api/delete</span>
                <a href="/api/delete" class="get-button">Send Request</a>
            </li>
        </ul>
    </div>

    <!-- Profile Section -->
    <div class="profile">
        <h2>Profile DangGiaKhanh</h2>
        <p>Author: DgK</p>
        <div class="social-links">
            <!-- Facebook link -->
            <a href="https://www.facebook.com/Danggiakhanh18t.vanhungcl?mibextid=ZbWKwL" target="_blank">
                <img src="https://i.imgur.com/q8klL8H.jpeg" alt="Facebook" title="Facebook">
            </a>
            <!-- Instagram link -->
            <a href="https://www.instagram.com/gkhanh06?igsh=c3I2NnJ2YTNodmZt" target="_blank">
                <img src="https://i.imgur.com/LADQ95h.jpeg" alt="Instagram" title="Instagram">
            </a>
        </div>
    </div>

    <script>
        // Auto-play music
        window.addEventListener('DOMContentLoaded', () => {
            const music = document.getElementById('bg-music');
            music.muted = false;
            const playPromise = music.play();

            if (playPromise !== undefined) {
                playPromise.catch(error => {
                    console.log('Autoplay bị chặn:', error);
                });
            }
        });
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
