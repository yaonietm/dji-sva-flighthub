const crypto = require('crypto');
const axios = require('axios');

// AppId e SignKey: fornecidos pela DJI
const APP_ID = 'admin';
const SIGN_KEY = '074fd28e!';
const SHA1 = 'SHA1';
const URL_USERS = 'brazu1valeas062.valenet.valeglobal.net/fhsdk/v3/users';

var reqId = 0;
function getReqId() {
    reqId++;
    return 'req' + reqId;
}

// HmacSha1: data & key (Nos docs FlightHub)
// createHmac: algorithm & key; then, update (data)

function getSignData(fhTsStr, data) {
    const binFhTs = Uint8Array.from(fhTsStr);
    const key1 = crypto.createHmac(SHA1, SIGN_KEY).update(binFhTs).digest();
    const binAppId = Uint8Array.from(APP_ID);
    const masterKey = crypto.createHmac(SHA1, key1).update(binAppId).digest();
    const signData = crypto.createHmac(SHA1, masterKey).update(data);
    return signData;
}

async function getAllUsers() {
    const FH_TS = '' + (new Date()).getTime();
    const signData = getSignData(FH_TS, '');
    const headers = {
        'Content-Type': 'application/json',
        'FH-AppId': APP_ID,
        'FH-Ts': FH_TS,
        'FH-ReqId': getReqId(),
        'FH-Sign': signData.digest('base64')
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

async function updateUserPwd(userId, name, newPwd) {
    const FH_TS = '' + (new Date()).getTime();
    const data = {
        password: newPwd,
        name
    };
    const signData = getSignData(FH_TS, data.toString());
    const headers = {
        'Content-Type': 'application/json',
        'FH-AppId': APP_ID,
        'FH-Ts': FH_TS,
        'FH-ReqId': getReqId(),
        'FH-Sign': signData.digest('base64')
    };
    const config = {
        method: 'put',
        url: URL_USERS + '/' + userId,
        headers
    }
    let result = false;
    try {
        let res = await axios(config);
        result = true;
    }
    catch (error) {
        result = false;
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

function checkNumArgs() {
    let len = process.argv.length;
    if (len !== 3 && len !== 4)
        fatalError('Modo de usar: node pwd.js <idUsuário> [<novaSenha>]');
    return len;
}

function checkNewPwd(newPwd) {
    const MIN_PWD_LENGTH = 6;
    if (newPwd.length < MIN_PWD_LENGTH)
        fatalError(`Nova senha inválida. Tamanho mínimo: ${MIN_PWD_LENGTH} caracteres.`);
}

function oneOf(s) {
    return s.charAt(Math.floor(Math.random() * s.length));
}

function randomPwd() {
    let alpha = 'abcdefghjkmnprstuvwxyz';
    let digits = '23456789';
    let symbols = '#@!';

    let result = oneOf(alpha).toUpperCase();
    for (let i = 0; i < 2; i++)
        result += oneOf(alpha);
    result += oneOf(digits);
    for (let i = 0; i < 3; i++)
        result += oneOf(alpha);
    result += oneOf(symbols);
    return result;
}

async function run() {
    let nargs = checkNumArgs();
    const userId = process.argv[2];
    const newPwd = nargs === 4 ? process.argv[3] : randomPwd();
    checkNewPwd(newPwd);

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
    const user = users.find(user => user.id === userId);
    if (!user)
        fatalError('Usuário não encontrado: ' + userId); 

    const ok = await updateUserPwd(userId, user.name, newPwd);
    if (!ok)
        fatalError('Falha na atualização da senha do usuário');
    console.log('Nova senha ok: ' + newPwd);
}
run();