"use strict";

const path = require('path');
const util = require('util');
const http = require('http');

const express = require('express');
const sqlite3 = require('sqlite3');
const { mainModule } = require('process');
const app = express();

const DB_PATH = path.join(__dirname, 'sql.db');
const WEB_PATH = path.join(__dirname, 'web');
const HTTP_PORT = 4000;

const delay = util.promisify(setTimeout);

const myDB = new sqlite3.Database(DB_PATH);
const SQL3 = {
    run(...args) {
        return new Promise(function c(resolve, reject) {
            myDB.run(...args, function onResult(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve(this);
                }

            });
        })
    },
    get: util.promisify(myDB.get.bind(myDB)),
    all: util.promisify(myDB.all.bind(myDB)),
    exec: util.promisify(myDB.exec.bind(myDB)),
}

const httpServer = http.createServer(app);

main();

function main() {
    defineRoutes(app);
    httpServer.listen(HTTP_PORT, () => console.log(`Listening on port ${HTTP_PORT}`));
}

function defineRoutes(app) {
    app.get(/\/get-records\b/, async function getRecords(req, res) {
        let records = await getAllRecords() || [];

        res.setHeader("Content-Type", "application/json");
        res.setHeader("Cache-Control", "max-age: 0, no-cache");
        res.writeHead(200);
        res.end(JSON.stringify(records));
    });

    app.use(function rewriter(req, res, next) {
        if (/(?:\/index\/?)?(?:[#?].*$)?$/.test(req.url)) {
            req.url = 'index.html';
        }
        else if (/^\/js\/.+$/.test(req.url)) {
            // DO nothing
        }
        else if (/^\/(?:[\w\d]+)(?:[\/#?].*$)?$/.test(req.url)) {
            let [, basename] = req.url.match(/^([\w\d]+)(?:[\/#?].*$)$/);
            req.url = `${basename}.html`;
        }
        else {
            req.url = '/404.html';
        }

        next();
    });

    app.use(express.static(WEB_PATH), {
        maxAge: 100,
        setHeaders: function setHeaders(res) {
            res.setHeader("Server", "Spawn test");
        }
    });
} //defineRoutes()

async function getAllRecords() {
    const result = await SQL3.all(
        `
        SELECT
            Something.data AS 'something',
            Order.data AS 'other'
        FROM
            Something
            JOIN Other ON (Something.otherID = Other.id)
        ORDER BY
            Other.id DESC, Something.data
        `
    );
    return result;
}
