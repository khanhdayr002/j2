const router = require("express").Router();
const log = require("../utils/logger");
const { readdirSync, readFileSync } = require('fs-extra');
const path = require('path');

let loadedRoutes = {};

function loadRoute(filePath, category) {
    try {
        const fileContent = readFileSync(filePath, 'utf8');
        const route = require(filePath);
        if (route.name && route.index) {
            router.get(route.name, route.index);
            
            const paramMatch = fileContent.match(/req\.query\.(\w+)/g);
            const params = paramMatch ? [...new Set(paramMatch.map(p => p.replace('req.query.', '')))] : [];
            
            if (!loadedRoutes[category]) {
                loadedRoutes[category] = [];
            }
            loadedRoutes[category].push({
                name: route.name,
                params: params
            });
            return true;
        } else {
            log(`Lỗi: File ${filePath} không có cấu trúc hợp lệ (thiếu name hoặc index)`, 'ERROR');
            return false;
        }
    } catch (error) {
        log(`Lỗi khi load file ${filePath}: ${error.message}`, 'ERROR');
        return false;
    }
}

try {
    let n = 0;
    let srcPath = path.join(process.cwd(), "/lib/");
    
    // Load các file trực tiếp trong thư mục lib
    const hosting = readdirSync(srcPath).filter((file) => file.endsWith(".js"));
    for (let file of hosting) {
        if (loadRoute(path.join(srcPath, file), 'Khác')) n++;
    }

    // Load các file trong các thư mục con
    const getDirs = readdirSync(srcPath).filter((file) => !file.endsWith(".js") && !file.endsWith(".json"));
    for (let dir of getDirs) {
        const dirPath = path.join(srcPath, dir);
        const files = readdirSync(dirPath).filter((file) => file.endsWith(".js") && file !== 'main.js');
        for (let file of files) {
            if (loadRoute(path.join(dirPath, file), dir)) n++;
        }
    }

    log(`Đã load thành công ${n} file`, 'API');
} catch (e) {
    log(`Lỗi khi đọc thư mục lib: ${e.message}`, 'ERROR');
}

module.exports = { router, loadedRoutes };