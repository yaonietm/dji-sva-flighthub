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

function checkResponseData(resData) {
    if (!resData) {
        console.log('Resposta da API sem o campo "data"');
        return false;
    }
    if (resData.code != 0) {
        console.log(`ERRO: code: ${resData.code} message: ${resData.message}`);
        return false;
    }
    return true;
}

async function updateUserPwd(userId, name, newPwd) {
    const FH_TS = '' + (new Date()).getTime();
    const data = {
        password: newPwd,
        name
    };
    const dataStr = JSON.stringify(data);
    const signData = getSignData(FH_TS, dataStr);
    const headers = {
        'Content-Type': 'application/json',
        'FH-AppId': APP_ID,
        'FH-Ts': FH_TS,
        'FH-ReqId': getReqId(),
        'FH-Sign': signData
    };
    const config = {
        method: 'put',
        url: URL_USERS + '/' + userId,
        data: dataStr,
        headers
    }
    let result = false;

    try {
        let res = await axios(config);
        result = checkResponseData(res.data);
    }
    catch (error) {
        console.log('Erro:', erro);
        result = false;
    }
    return result;
}

function fatalError(msg) {
    console.log(msg);
    process.exit();
}

function checkNumArgs() {
    let len = process.argv.length;
    if (len !== 3 && len !== 4)
        fatalError('Modo de usar: node pwd.js <idUsuário> [<novaSenha>]');
    return len;
}

function oneOf(s) {
    return s.charAt(Math.floor(Math.random() * s.length));
}

function randomPwd() {
    let alpha = 'abcdefghjkmnprstuvwxyz';
    let digits = '23456789';
    let symbols = '#@!';

    let result = oneOf(alpha).toUpperCase();
    for (let i = 0; i < 3; i++)
        result += oneOf(alpha);
    result += oneOf(digits);
    for (let i = 0; i < 2; i++)
        result += oneOf(alpha);
    result += oneOf(symbols);
    return result;
}

async function run() {
    let nargs = checkNumArgs();
    const userId = process.argv[2];
    const newPwd = nargs === 4 ? process.argv[3] : randomPwd();

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

    const user = users.find(user => user.id == userId);
    if (!user)
        fatalError('Usuário não encontrado: ' + userId); 

    const ok = await updateUserPwd(userId, user.name, newPwd);
    if (!ok)
        fatalError('Falha na atualização da senha do usuário');
    console.log('Nova senha ok: ' + newPwd);
}
run();
