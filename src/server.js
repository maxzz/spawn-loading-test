"use strict";

const fs = require('fs');
const path = require('path');
const util = require('util');
const http = require('http');

const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const sqlite3 = require('sqlite3');
const chalk = require('chalk');

const app = express();
app.use(morgan('dev'));
app.use(cors());

const WEB_PATH = path.join(__dirname, 'web');
const DB_PATH = path.join(__dirname, 'db/sql.db');
const DB_SQL_PATH = path.join(__dirname, 'db/mydb.sql');
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

main().catch((error) => console.error(chalk.red(error)));

async function main() {
    let initSQL = fs.readFileSync(DB_SQL_PATH, 'utf-8');
    await SQL3.exec(initSQL);

    await insertDummyRecord();

    defineRoutes(app);
    httpServer.listen(HTTP_PORT, () => console.log(chalk.cyan(`Listening on port ${HTTP_PORT}`)));
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
        if (/^\/(?:index\/?)?(?:[?#].*$)?$/.test(req.url)) {
            req.url = 'index.html';
        }
        else if (/^\/js\/.+$/.test(req.url)) {
            // DO nothing
        }
        else if (/^\/(?:[\w\d]+)(?:[\/?#].*$)?$/.test(req.url)) {
            let [, basename] = req.url.match(/^\/([\w\d]+)(?:[\/?#].*$)?$/);
            req.url = `${basename}.html`;
        }
        else {
            req.url = '/404.html';
        }

        next();
    });

    app.use(express.static(WEB_PATH, {
        maxAge: 100,
        setHeaders: function setHeaders(res) {
            res.setHeader("Server", "Spawn test");
        }
    }));
} //defineRoutes()

async function insertDummyRecord() {
    let other = `dummy ${Date.now() % 5}`;
    let something = Math.trunc(Math.random() * 1E9);

    let otherID = await getOrInsertOtherID(other);
    if (otherID !== null) {
        let inserted = await insertSomething(something, otherID);
        if (inserted) {
            let records = await getAllRecords();
            console.table(records);
            return true;
        }
    }
    console.error('Ooops');
}

async function getAllRecords() {
    const result = await SQL3.all(
        `
        SELECT
            Something.data AS "something",
            Other.data AS "other"
        FROM
            Something
            JOIN Other ON (Something.otherID = Other.id)
        ORDER BY
            Other.id DESC, Something.data
        `
    );
    return result;
}

async function getOrInsertOtherID(other) {
    let result = await SQL3.get(`
        SELECT
            id
        FROM
            Other
        WHERE
            data = ?`, other);
    if (result) {
        return result.id;
    } else {
        result = await SQL3.run(`
            INSERT INTO
                Other
            (data)
            VALUES
                (?)`, other);
        if (result && result.changes > 0) {
            return result.lastID;
        }
    }
}

async function insertSomething(something, otherID) {
    let result = await SQL3.run(`INSERT INTO Something (otherID, data) VALUES (?, ?)`, otherID, something);
    if (result && result.changes > 0) {
        return true;
    }
}
