const query = require('./db/query');

const go = async () => {
    const results = await query('SELECT * FROM generate_series(0, 10000) num');

    results.subscribe(next => console.log(`result: ${JSON.stringify(next)}`));
};

go();




