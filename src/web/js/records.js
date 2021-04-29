let btnGet;
let btnClear;
let display;

function init() {
    display = document.getElementById('records-result');
    btnGet = document.getElementById('btn-get-records');
    btnClear = document.getElementById('btn-clear-records');
    display.innerText = '';

    btnGet.addEventListener('click', getRecords, false);
    btnClear.addEventListener('click', clearRecords, false);
}

async function getRecords() {
    display.innerText = '';
    try {
        let res = await fetch('http://localhost:4000/get-records');
        if (res.status === 200) {
            let records = await res.json();
            showRecords(records);
        }
    } catch (error) {
        display.innerText = `Failed to get records. ${error}`;
    }
}

function showRecords(records) {
    if (records) {
        let newRecords = records.map((record) => {
            let res = '';
            for (let [key, val] of Object.entries(record)) {
                res += `${key}: '${val}'`;
            }
            return `{${res}}`;
        });
        display.innerText = JSON.stringify(newRecords, null, 4);
    } else {
        display.innerText = 'No records';
    }
}

function clearRecords() {
    display.innerText = '';
}

init();
