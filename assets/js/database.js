'use strict';

// Require the NEDB Module
const Datastore = require('nedb'),
			path = require('path'),
			date = new Date(),
			isDev = process.env.TODO_DEV ? (process.env.TODO_DEV.trim() == "true") : false,
			datastorePath = (!isDev) ? path.resolve(process.env['prodPath']) : path.resolve(__dirname, process.env['devPath'])

let year = date.getFullYear(),
		dbname = 'monitors-' + year + '.db'

// Initialize the databases
let db = {
				monitors : new Datastore({
					filename: path.resolve(datastorePath, dbname),
					autoload: true
				}),
				leadsDb : new Datastore({
					filename: path.resolve(datastorePath, 'leads.db'),
					autoload: true
				}),
				agentsDb : new Datastore({
					filename: path.resolve(datastorePath, 'agents.db'),
					autoload: true
				}),
				claimedDb : new Datastore({
					filename: path.resolve(datastorePath, 'claimed.db'),
					autoload: false
				})
			};

function loadDatabases (dbToLoad = null) {
	let count = 0
	return new Promise((resolve, reject) => {
		// Originally set up to load the claimed database, but it can load any database in thd db object
		if (dbToLoad){
			db[dbToLoad].loadDatabase()
			return resolve(true)
		} else {
			return resolve(true)
		}
	})
}

let transactions = {
	
	/**
	 * DB Transactions
	 */ 
	init: function (dbname, type, query, sort = null, multi = false, row = null) {
		let args = {}, 
				dbToLoad = ('claimedDb') ? 'claimedDb' : null
		//if (dbname === 'claimedDb') {loadDatabases('claimedDb');}
		switch (type) {
			case 'pull': 
				args = {
					dbname: dbname,
					type: type,
					query: query,
					sort: sort
				}
			break;
			case 'post':
				args = {
					dbname: dbname,
					query: query
				}
			break;
			case 'update':
				args = {
					dbname: dbname,
					row: row,
					query: query
				}
			break;
			case 'remove':
				args = {
					dbname: dbname,
					query: query,
					multi: multi
				}
			break;
		}
		return new Promise ((resolve, reject) => {
			return Promise.resolve( this[type](args) ).then((result) => {
				return resolve(result)
			}).catch((err) => console.error(err))
		})
	},
	pull: function (args){
		/**
		 * @param {String} dbname - Database to use
		 * @param {Object} query - nedb query object
		 * @param {String} sort - column to use for the order of results (defaults to _id ascending order)
		 * 
		 * @return {Object} Promise & Result
		 */
		//var query = {'_id': {'$regex': /^[a-zA-Zd]/}}

		return new Promise((resolve, reject) => {
			return db[args.dbname].find(args.query).sort(args.sort).exec((err, result) => {
				if (err) {
					return reject(err)
				} else {
					return resolve(result)
				}
			})
		}).catch((err) => console.error(err))
	},
	post: function (args){
		/**
		 * @param {String} dbname - Database to use
		 * @param {Object} query - nedb query object
		 * 
		 * @return {Object} Promise & Result
		 */
		args.query.date = new Date
		return new Promise ((resolve, reject) => {
			return db[args.dbname].insert(args.query, function (err, newDoc) {
				if (err) {
					return reject(err) 
				} else {
					return resolve(newDoc)
				}
			})
		}).catch((err) => console.error(err))
	},
	update: function (args){
		/**
		 * @param {String} dbname - Database to use
		 * @param {Object} query - nedb query object
		 * 
		 * @return {Object} Promise & Result (numReplaced)
		 */
		return new Promise((resolve, reject) => {
			return db[args.dbname].update(args.row, args.query, {}, function(err, numReplaced) {
				if (err){
					return reject(err)
				} else {
					return resolve(numReplaced)
				}
			})
		}).catch((err) => console.error(err))
	},
	remove: function (args) {
		/**
		 * @param {String} dbname - Database to use
		 * @param {Object} query - nedb query object
		 * @param {Boolean} multi - remove multiple rows (defaults to false)
		 */
		return new Promise((resolve, reject) => {
			return db[args.dbname].remove(args.query, {'multi': args.multi}, function (err, numRemoved) {
				if (err) {
					return reject(err)
				} else {
					return resolve(numRemoved)
				}
			})
		}).catch((err) => console.error(err))
	}
}
module.exports = {
	agentsDb: db.agentsDb,
	leadsDb: db.leadsDb,
	monitors: db.monitors,
	claimedDb: db.claimedDb,
	loadDatabases: loadDatabases,
	transactions: transactions
}