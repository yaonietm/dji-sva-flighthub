const crypto = require('crypto');
const axios = require('axios');

// AppId e SignKey: fornecidos pela DJI
const APP_ID = 'svatechfhappid';
const APP_KEY = 'svatechfhaddkey';
const SHA1 = 'SHA1';
const URL_USERS = 'https://brazu1valeas062.valenet.valeglobal.net/fhsdk/v3/users';

var reqId = 0;
function getReqId() {
    reqId++;
    return 'req' + reqId;
}

// Docs FlightHub: HmacSha1(data, key)
// Nodejs: crypto.createHmac(algorithm, key).update(data) where algorithm='SHA1'

function getSignData(fhTsStr, data) {
    const binAppKey = Uint8Array.from(APP_KEY);
    const binFhTs = Uint8Array.from(fhTsStr);
    const appSignKey = crypto.createHmac(SHA1, binAppKey).update(binFhTs);

    const binAppId = Uint8Array.from(APP_ID);
    const bodySignKey = crypto.createHmac(SHA1, Uint8Array.from(appSignKey)).update(binAppId);

    const binBody = Uint8Array.from(data);
    const dataSign = crypto.createHmac(SHA1, Uint8Array.from(bodySignKey)).update(binBody);

    return dataSign.digest('base64');
}

async function getAllUsers() {
    const FH_TS = '' + (new Date()).getTime();
    const signData = getSignData(FH_TS, '');
    const headers = {
        'Content-Type': 'application/json',
        'FH-AppId': APP_ID,
        'FH-Ts': FH_TS,
        'FH-ReqId': getReqId(),
        'FH-Sign': signData
    };
    const config = {
        method: 'get',
        url: URL_USERS,
        headers
    }
    let result = {};
    try {
        let res = await axios(config);
        result = res.data;
    }
    catch (error) {
        result.error = error;
    }
    return result;
}

function padEnd(str, size) {
    let result = str;
    let n = size - str.length;
    while (n > 0) {
        result += ' ';
        n--;
    }
    return result;
}

function listUsers(users) {
    console.log(`${padEnd('id', 20)} ${padEnd('account', 40)} ${padEnd('name', 30)}`);
    console.log(`-------------------- ---------------------------------------- ------------------------------`);
    if (users.length === 0) {
        console.log('    Lista vazia');
        return;
    }
    for (const user of users)
        console.log(`${padEnd(''+user.id, 20)} ${padEnd(user.account, 40)} ${padEnd(user.name, 30)}`);
}

function fatalError(msg) {
    console.log(msg);
    process.exit();
}

async function run() {
    const users = await getAllUsers();
    if (users.error) {
        console.log(users.error);
        fatalError('Falha na obtenção da lista de usuários.');
    }
    if (!Array.isArray(users)) {
        console.log(users);
        fatalError('Falha na obtenção da lista de usuários.');
    }
    
    if (users.length === 0)
        fatalError('Lista de usuários vazia');
    listUsers(users);
}
run();
