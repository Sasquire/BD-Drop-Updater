const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database(__dirname + '/database.db');
const fs = require('fs');

db.promise_all = (sql) => new Promise((res, rej) => db.all(sql, (err, all) => err ? rej(err) : res(all)));

async function main() {
	const all_toys = await db.promise_all('select * from toys');
	const itemized_toys = Object.values(all_toys).map(e => {
		try {
			return JSON.parse(e.toy_info);
		} catch(error) {
			console.log(error);
			console.log(e);
			return null;
		}
	});
	fs.writeFileSync('toy_listing.json', JSON.stringify(itemized_toys))

	const all_times = await db.promise_all('select * from toys_date');
	fs.writeFileSync('toy_times.json', JSON.stringify(all_times));	
}

main();