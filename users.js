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
    const appSignKey = hmacSha1(Buffer.from(fhTsStr), Buffer.from(APP_KEY));
    const bodySignKey = hmacSha1(Buffer.from(APP_ID), appSignKey);
    const dataSign = hmacSha1(Buffer.from(data), bodySignKey);
    return dataSign.toString('base64');
}

function hmacSha1(encData, encKey) {
    const hmac = crypto.createHmac(SHA1, encKey);
    hmac.update(encData);
    return Buffer.from(hmac.digest());
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

function listUsers(users) {
    console.log('id, account, name');
    for (const user of users)
        console.log(user.id, user.account, user.name);
}

function fatalError(msg) {
    console.log(msg);
    process.exit();
}

async function run() {
    const res = await getAllUsers();
    if (res.error) {
        console.log(res.error);
        fatalError('Falha na obtenção da lista de usuários.');
    }
    if (!res.data) {
        console.log(res);
        fatalError('Falha na obtenção da lista de usuários.');
    }
    const users = res.data.list;
    if (!Array.isArray(users)) {
        console.log(users);
        fatalError('Falha na obtenção da lista de usuários.');
    }
    
    if (users.length === 0)
        fatalError('Lista de usuários vazia');
    listUsers(users);
}
run();
