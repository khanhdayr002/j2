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
        <title>API - Satoru</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                line-height: 1.4;
                color: #333;
                max-width: 800px;
                margin: 0 auto;
                padding: 10px;
                font-size: 10px;
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
            .profile {
                font-size: 10px;
                border: 1px solid #ddd;
                padding: 5px;
                border-radius: 3px;
                margin-top: 15px;
            }
            .profile h2 {
                font-size: 16px;
                margin-top: 0;
            }
        </style>
    </head>
    <body>
        <h1>API - Satoru</h1>
        ${categoryHtml}
        <div class="profile">
            <h2>Profile Satoru</h2>
            <p>Author: Satoru<br>
            <a href="https://www.facebook.com/Danggiakhanh18t.vanhungcl?mibextid=ZbWKwL">FACEBOOK</a><br>
            <a href="https://www.instagram.com/gkhanh06?igsh=c3I2NnJ2YTNodmZt">INSTAGRAM</a><br>
            MBBANK: </p>
        </div>
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
    log(`API SATORU is running on port ${app.get('port')}`, 'HOST UPTIME');
});
