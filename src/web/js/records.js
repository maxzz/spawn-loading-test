let btn;
let display;

function init() {
    display = document.getElementById('records-result');
    btn = document.getElementById('btn-get-records');

    btn.addEventListener('click', getRecords, false);
}

async function getRecords() {
    try {
        let res = await fetch('/get-records');    
        if (res.status === 200) {
            let records = await res.json();
            showRecords(records);
        }
    } catch (error) {
        showRecords();
    }
}

function showRecords(records) {
    if (records) {
        display.innerText = JSON.stringify(records, null, 4);
    } else {
        display.innerText = 'No records';
    }
}

init();
