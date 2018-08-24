const RxNode = require('rx-node');
const { Client } = require('pg');
const QueryStream = require('pg-query-stream');
//require('../vault/vault');

module.exports = async (queryString, params) => {
    const client = new Client();

    await client.connect();

    const query = new QueryStream(queryString, params);
    const stream = client.query(query);

    return RxNode.fromStream(stream).finally(() => client.end());
};