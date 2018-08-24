const request = require('sync-request');
const readFile = require('fs').readFileSync;

const getTokenFromPath = fsPath => {
    console.log(`fspath: ${fsPath}`);
    if (!fsPath) {
        return;
    }

    return readFile(fsPath, 'utf8')
};

const getApproleToken = (roleId, secretId, vaultEndpoint) => {
    if (roleId && secretId) {
        const res = request('POST', vaultEndpoint + '/auth/approle/login', {
            json: {
                role_id: roleId,
                secret_id: secretId
            },
        });
        return JSON.parse(res.getBody('utf8')).auth.client_token;
    }
};

const putSecretsInEnvironment = secrets => {
    console.log(`secrets: ${JSON.stringify(secrets)}`);
    Object.keys(secrets.data).forEach(secretKey => {
        if (!process.env[secretKey]) {
            process.env[secretKey] = secrets.data[secretKey];
        }
    });
};

const loadEnv = options => {
    console.log('loadenv');
    const opts = options || {};
    const VAULT_ADDR = (opts.vaultAddr || process.env.VAULT_ADDR || 'http://127.0.0.1:8200');
    const VAULT_API_VERSION = opts.vaultApiVersion || process.env.VAULT_API_VERSION || 'v1';
    const vaultEndpoint = VAULT_ADDR.endsWith('/') ? VAULT_ADDR : VAULT_ADDR + '/' + VAULT_API_VERSION;

    const VAULT_TOKEN_PATH = opts.vaultTokenPath || process.env.VAULT_TOKEN_PATH;
    const VAULT_ROLE_ID = opts.vaultRoleId || process.env.VAULT_ROLE_ID;
    const VAULT_SECRET_ID = opts.vaultSecretId || process.env.VAULT_SECRET_ID;
    const VAULT_TOKEN = opts.vaultToken
        || process.env.VAULT_TOKEN
        || getTokenFromPath(VAULT_TOKEN_PATH)
        || getApproleToken(VAULT_ROLE_ID, VAULT_SECRET_ID, vaultEndpoint);
    const VAULT_PATHS = opts.vaultPaths || process.env.VAULT_PATHS;

    if (!VAULT_TOKEN) {
        throw new Error('Unable to find/get token.  You must provide a VAULT_TOKEN, VAULT_TOKEN_PATH or VAULT_ROLE_ID and VAULT_SECRET_ID');
    }

    if (!VAULT_PATHS) {
        throw new Error('You must specify at least one VAULT_PATHS');
    }

    VAULT_PATHS.split(',').forEach(vaultPath => {
        const response = request('GET', vaultEndpoint + '/' + vaultPath, {
            headers: {
                'X-Vault-Token': VAULT_TOKEN
            }
        });

        const secrets = JSON.parse(response.getBody()).data;

        putSecretsInEnvironment(secrets);
    });

};

module.exports = loadEnv();