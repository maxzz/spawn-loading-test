const utils = require('util');
const childProc = require('child_process');
const chalk = require('chalk');

const HTTP_PORT = 4000;
const MAX_CHILDREN = 5;

main().catch(function(error) {
    console.error(chalk.red(error));
});

async function main() {
    throw 'EEE';
}
