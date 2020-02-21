const request = require('request');
const { URL } = require('url');
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database(__dirname + '/database.db');

function generate_url(api, page_id, options = {}){
    const url = new URL(`https://bad-dragon.com/${api ? 'api/inventory-toys' : 'shop/clearance'}`);
    if(options.ready_made === undefined || options.ready_made === true){
        url.searchParams.append('type[]', 'ready_made');
    }
    if(options.flop === undefined || options.flop === true){
        url.searchParams.append('type[]', 'flop');
    }

    // hard limit of max_price 300. Is this a garuntee that things wont get pricey?
    url.searchParams.set('price[max]', options.max_price || 300);
    url.searchParams.set('price[min]', options.min_price || 0);

    url.searchParams.set('noAccessories', options.no_accessories || false);
    url.searchParams.set('cumtube', options.cumtube || 'false');
    url.searchParams.set('suctionCup', options.suctionCup || 'false');

    url.searchParams.set('sort[field]', options.sort_field || 'price');
    url.searchParams.set('sort[direction]', options.sort_direction || 'desc');

    url.searchParams.set('page', page_id);
    url.searchParams.set('limit', '60'); // hard limit of 60 from the API

    return url.href;
}

async function get_all_pages(){
    const all_toys = [];
    for(let page_number = 1; true; page_number++){
        const page_details = await get_page(page_number);
        page_details.toys.forEach(e => {
            e.page_number = page_number;
            e.flop = e.flop_reason.length != 0;
        });
        all_toys.push(...page_details.toys);
        if(page_details.toys.length == 0){ break; }
    }
    return all_toys;

    // pages start at one
    async function get_page(page_id, options = {}){
	return new Promise(function(resolve, reject){
		request(generate_url(true, page_id, options), function(req_err, headers, response){
			if(req_err || headers.statusCode != 200){
				resolve({totalPages:0, toys: []})
			} else {
//				console.log(response)
				resolve(JSON.parse(response));
			}
		});
	});
    }
}

db.promise_get = (sql) => new Promise((res, rej) => db.get(sql, (err, row) => err ? rej(err) : res(row)));
db.promise_all = (sql) => new Promise((res, rej) => db.get(sql, (err, all) => err ? rej(err) : res(all)));
db.promise_run = (sql) => new Promise((res, rej) => db.run(sql, (err) => err ? rej(err) : err == null ? res() : 0));

async function main(){
        await db.promise_run('CREATE TABLE IF NOT EXISTS toys (toy_id INT PRIMARY KEY, toy_info TEXT)');
        await db.promise_run('CREATE TABLE IF NOT EXISTS toys_date (timestamp INT, toy_array TEXT)');
	// 3:30 - 3:50
	for(let i = 0; i < 20; i++){
		await Promise.all([
			get_all_pages().then(e => insert_toys(e)),
			sleep(60 * 1000)
		]);
	}
	// 3:50 - 4:20
	for(let i = 0; i < 90; i++){
		await Promise.all([
			get_all_pages().then(e => insert_toys(e)),
			sleep(20 * 1000)
		]);
	}
	// 4:20 - 4:50
	for(let i = 0; i < 30; i++){
		await Promise.all([
			get_all_pages().then(e => insert_toys(e)),
			sleep(60 * 1000)
		]);
	}
	// 4:50 - 6:00
	for(let i = 0; i < 35; i++){
                await Promise.all([
                        get_all_pages().then(e => insert_toys(e)),
                        sleep(120 * 1000)
                ]);
        }

}

async function sleep(t){ return new Promise(r => setTimeout(r, t));  }

async function insert_toys(toys){
	return new Promise(resolve => {
		db.serialize(function() {
    			let stmt = db.prepare('REPLACE INTO toys VALUES((?), json(?))');
    			for (const toy of toys) {
        			stmt.run(toy.id, JSON.stringify(toy));
    			}
			const now = new Date().getTime();
    			stmt.finalize(() => db.run(
				'INSERT INTO toys_date VALUES((?), json(?))',
				[now, JSON.stringify(toys.map(e => e.id))],
				resolve
			));
		});
	});
}
main();

