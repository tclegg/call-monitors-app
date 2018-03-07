window.database = window.database || {},
function (n) {
	var fs = require('fs');
	var path = require('path');
	var nedb = require('nedb');
	//var filename = path.resolve(__dirname, '../../db/', 'monitors.db')



	/*if (!filename){
		filebuffer = fs.writeFileSync(path.resolve(__dirname, '../../db/', 'test.sqlite'))
	} else {
		filebuffer = fs.readFileSync(filename)
	}*/
	var //ipc = require('ipc'),
			//clibpboard = require('clipboard'),
			loki = require('lokijs'),
			path = require('path'),
			d = new Date()
			year = d.getFullYear(),
			mm = ("0"+(d.getMonth()+1)).slice(-2),
			yyyymm = year+'-'+mm;
			dbname = 'monitors-'+year+'.db';
	/*var		db = new loki(path.resolve(__dirname, '../../db/', dbname), {
					autoload: true,
					autoloadCallback: database.submit,
					autosave: true,
					autosaveInterval: 4000
				});*/
	//var db = new sql.Database(filebuffer);
	var db = new nedb({filename: path.resolve(__dirname, '../../db/', dbname), autoload: true})
	console.log(db);
	console.log('---^---db---^---');

	database.submit = {
		constants: {
			dbname: 'monitors'+year+'.db',
			monitors: null,
			result: null
		},
		dbswitch: function(type, rowObj){
			switch (type){
				case 'insert':
					this.insert(rowObj)
					break;
				case 'all':
					this.pullAll(rowObj)
					break;
				default:
					this.pullMonth();
			}
		},
		insert: function(row){
			//console.log(db);
			//db.insert(row)



			//console.log(result);
			// log some random event data as part of our example
		/*	console.log(db);
			this.constants.monitors.insert({
				date: '2018-02-01',
				agent: 'campbellr',
				fail: '0',
				lead: 'cleggt'
			});
			console.log('row = ' + row);
			//var result = this.constants.monitors.chain().find({agent: {'$eq': 'cambpellr'}}).data()
			var result = this.constants.monitors.find({$loki: {'$eq': '1'}})

			console.log(result);
			//var agents = db.addCollection('agents', {indicies: ['date', 'agent', 'fail', 'lead']})
			//var monitor = agents.insert({date: '2018-02-01', agent: 'rcampbell', fail: 'false', lead: 'tclegg'})
			//agents.update(monitor)

			//console.log(agents);
			//console.log(monitor);
			//console.log(db);
			*/
		},
		pullAll: function(query){
			/*console.log('in Where()')
			console.log(query);
			var date = new Date('2018/02/01')
		//	var results = db.find({'Name': { '$eq' : 'Odin' }})
			return true
			*/
		},
		pullMonth: function(){
			var reg = new RegExp(yyyymm)
			var query = {date: {'$regex': reg}}
			//var result;
			db.find(query, function(err, docs){

					$(docs).each(function(x,y){
						//console.log(y);

					})
					//window.__monitors.monitors.createElements(docs)
					//this.constants.result = {err, docs}
					return

			})
		},
		pullLastMonth: function(){

		},
		init: function(where=null){
				//console.log(db);
				/*this.constants.monitors = db.getCollection("monitors");

				if (this.constants.monitors === null) {
					db.addCollection("monitors");
					this.constants.monitors = db.getCollection("monitors", {"indicies": ['date', 'agent', 'fail', 'lead']});
				}
				console.log(this.constants.monitors);
				*/
				//var row = {date: new Date('2018-02-01'), agent: 'campbellr', fail: 'false', lead: 'tclegg'}
				//this.insert(row)
				//var collection = db.getCollection("monitors");
				//console.log(this.constants.monitors);

				this.dbswitch(where)

		}
	};
	n(function(){
		database.submit.init(null);
	})

}(jQuery)
