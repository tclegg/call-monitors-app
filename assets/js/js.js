// declare constants for node tools
const {app} = require('electron').remote, // electron.app,
	electron = require('electron'),
	{ipcRenderer} = require('electron'), // send data back and forth between windows (used for help (?))
	fs = require('fs'), // Access the PC's File System
	path = require('path'), // Resolve paths in the FS
	nedb = require('nedb'), // Flat File Database
	date = new Date(),
	loggedOnUser = process.env['USERPROFILE'].split(path.sep)[2];

	

	// check for dev and set the database location if dev === true
const isDev = process.env.TODO_DEV ? (process.env.TODO_DEV.trim() == "true") : false,
	datastorePath = (!isDev) ? path.resolve(process.env['prodPath']) : path.resolve(__dirname, process.env['devPath'])
	
let validation = {},
	domTools = {}
	// variables for date and database creation/selection
let today = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12),
	year = date.getFullYear(),
	mm = ("0" + (date.getMonth() + 1)).slice(-2),
	dd = ("0" + (date.getDate())).slice(-2),
	thisMonth = year + '-' + mm,
	dbname = 'monitors-' + year + '.db'
	// Declaring db and full name
let	db = {},
	loggedOnUserFullname;

try {
		db.monitors = new nedb({
				filename: path.resolve(datastorePath, dbname),
				autoload: true
			})
		db.leadsDb = new nedb({
				filename: path.resolve(datastorePath, 'leads.db'),
				autoload: true
			})
		db.agentsDb = new nedb({
				filename: path.resolve(datastorePath, 'agents.db'),
				autoload: true
			})
		db.claimedDb = new nedb({
				filename: path.resolve(datastorePath, 'claimed.db'),
				autoload: true
			})
} catch (err) {
	//location.reload()
	console.log(err)
	alert(`An Error Has Occurred\nPlease reload the page\n\n${err}`)
}


	// month tools
var months = {
		"01": "Janary",
		"02": "February",
		"03": "March",
		"04": "April",
		"05": "May",
		"06": "June",
		"07": "July",
		"08": "August",
		"09": "September",
		"10": "October",
		"11": "November",
		"12": "December"
	},
	monthName = months[mm],
	// quarter calculation tools
	q1 = ["0", "1", "2"],
	q2 = ["3", "4", "5"],
	q3 = ["6", "7", "8"],
	q4 = ["9", "10", "11"],
	qstart = {},
	qend = {},
	qm = new Date()

	if (q1.includes(qm.getMonth().toString()) ){
		qstart = new Date(year, 0, 1)
		qend = new Date(year, 3, 1)
	} else if (q2.includes(qm.getMonth().toString()) ){
		qstart = new Date(year, 3, 1)
		qend = new Date(year, 6, 1)
	} else if (q3.includes(qm.getMonth().toString()) ){
		qstart = new Date(year, 6, 1)
		qend = new Date(year, 9, 1)
	} else {
		qstart = new Date(year, 9, 1)
		qend = new Date(year, 12, 1)
	}
	
	// objects to store query data
var	leadsObj = {},
	activeLeadsObj = {},
	agentsObj = {},
	activeAgentsObj = {}

/**
 * Date Tools
 */
function setDate() {
	// Sets the date index-main.html, allmonitors.html, and leadsmonitors.html
	// today = new Date(date.getFullYear(), date.getMonth(), date.getDate())
	let inputdate = document.getElementById('input-date'),
		monitorsMonth = document.getElementById('all-monitors-date-2'),
		leadsSearchDate = document.getElementById('input-date-search'),
		monitorsByAgentDate = document.getElementById('monitors-search-date'),
		monitorsByAgentDate2 = document.getElementById('monitors-search-date-2'),
		startOfMonth = new Date(year, date.getMonth(), 1)
	// Set the main form
	inputdate.valueAsDate = today;
	// Set the Lead Search
	leadsSearchDate.valueAsDate = startOfMonth;
	// Set All Monitors by Month
	monitorsMonth.innerHTML = monthName;
	// Set All Monitors by Agent
	monitorsByAgentDate.valueAsDate = startOfMonth;
	monitorsByAgentDate2.valueAsDate = startOfMonth;
	
}

/**
* Reload the page after submit
*/
var ReloadInit = {
	init: function () {
		return new Promise ((resolve, reject) => {
			return BuildStaffDom.init().then((result) => {
				return LoadStaffEdit.init()
			}).then((result) => {
				return LoadMonitors.init()
			})
		}).catch(err => console.log(err))
	}
}


/**
 * DB Tools
 */

var DBSubmitTools = {
	init: function(formName, formValues, formFields){
		/**
		 * Routes based on the validated form (not used for claimed)
		 * 
		 * @param {String} formName Name of the form
		 * @param {Object} formValues All the values from the fields of the form
		 * @param {Object} formFields Fields listed as {name: HTML-FIELD-ELEMENT}
		 */
		return new Promise ((resolve, reject) => {
			 this[formName](formValues).then((result) => {
				$('.modal').modal('hide')
				return resolve(this.clearfields(formValues))
			})/*.then((result) => {
				return ReloadInit.init()
			})*/
		}).catch((err) => console.log(err))
	},
	/**
	 * Routing
	 */
	newmonitor: function (dbname, values){
		/**
		 * @param {String} dbname TEXT - name of the database ('monitors')
		 * @param {Object} values Object - The inputs from the new monitors form
		 * form fields: agent, date, score, fail, lead
		 */
		
		return new Promise ((resolve, reject) => {
			let test = this.post('monitors', values)
			if(test) {
				return resolve(values)
			} else {
				return reject(values)
			}
			
		}).catch((err) => console.log(err))
	},
	editmonitor: function (values){
		/**
		 * @param {Object} values Validated form values from the Edit Monitor Modal
		 * form fields - agent, date, score, fail, lead, _id
		 */
		return new Promise ((resolve, reject) => {
			let row = {'_id' : values._id},
				query = values
			return this.update('monitors', row, query).then((result) => {
				if (result) {
					return resolve(result)
				} else {
					return reject()
				}
			}).then((result) => {
				return resolve()
			})
		}).catch((err) => console.log(err))
	},
	removemonitor: function (values) {
		return new Promise ((resolve, reject) => {
			let row = {'_id' : values._id}
			return this.remove('monitors', row, false).then((result) => {
				if (result) {
					return resolve(result)
				} else {
					return reject()
				}
			}).then((result) => {
				return resolve()
			})
		}).catch((err) => console.log(err))
		
	},
	addagent: function (values){
		/**
		 * @param {Object} values Form Object - The form from the Add Agent or Add Lead modal
		 * TYPE=LEAD form fields: abbv, name, inactive, _id
		 * TYPE=AGENT form fields: abbv (lastname with first initial), name (last, first), monitors, agentid
		 */
		return new Promise ((resolve, reject) => {
			values.date = new Date()
			let query = values
			return this.post('agentsDb', query).then((result) => {
				if (result) {
					return resolve(result)
				} else {
					return reject()
				}
			}).then((result) => {
				return resolve()
			})
		}).catch((err) => console.log(err))
		
	},
	editagent: function (values){
		/**
		 * @param {Object} values Object - The form submitted from the edit modal
		 * Must have the data attributes on the element that opens the form
		 * TYPE=LEAD form fields: abbv, name, inactive, _id
		 * TYPE=AGENT form fields: abbv (lastname with first initial), name (last, first), monitors, agentid
		 */
		return new Promise ((resolve, reject) => {
			values.date = (values.date) ? values.date : new Date()
			let row = {'_id': values._id}, query = values
			return this.update('agentsDb', row, query).then((result) => {
				
				if (result) {
					return resolve(result)
				} else {
					return reject()
				}
			}).then((result) => {
				return resolve()
			})
		}).catch((err) => console.log(err))
	},
	removeagent: function(values){
		/**
		 * @param {Object} values Object - The form submitted from the remove confirmation modal
		 * Must have the _id from the data attribute on the element that opens the form
		 */
		return new Promise ((resolve, reject) => {
			values.date = new Date()
			let row = {'_id': values._id},
				inactive = (values.inactive == "0") ? "1" : "0"
			values.inactive = inactive

			let query = values
			if (inactive === "0"){
				let claimedcell = document.querySelector('#'+values.abbv+'-claimed')
				if ($(claimedcell).data('claimed') === 'claimed') {
					this.remove('claimedDb', {'agentabbv': values.abbv}, true)
				}
			}
			
			return this.update('agentsDb', row, query).then((result) => {
				if (result) {
					return resolve(result)
				} else {
					return reject()
				}
			}).then((result) => {
				return resolve()
			})
		}).catch((err) => console.log(err))
	},
	addlead: function (values){
		/**
		 * @param {Object} values Object - The form from the Add Agent or Add Lead modal
		 * TYPE=LEAD form fields: abbv, name, inactive, _id
		 * TYPE=AGENT form fields: abbv (lastname with first initial), name (last, first), monitors, agentid
		 */
		return new Promise ((resolve, reject) => {
			values.date = new Date()
			let query = values
			return this.post('leadsDb', query).then((result) => {
				if (result) {
					return resolve(result)
				} else {
					return reject()
				}
			}).then((result) => {
				return resolve()
			})
		}).catch((err) => console.log(err))
		
	},
	editlead: function (values){
		/**
		 * @param {Object} values Object - The form submitted from the edit modal
		 * Must have the data attributes on the element that opens the form
		 * TYPE=LEAD form fields: abbv, name, inactive, _id
		 * TYPE=AGENT form fields: abbv (lastname with first initial), name (last, first), monitors, agentid
		 */
		return new Promise ((resolve, reject) => {
			values.date = new Date()
			let row = {'_id': values._id}, query = values
			return this.update('leadsDb', row, query).then((result) => {
				if (result) {
					return resolve(result)
				} else {
					return reject()
				}
			}).then((result) => {
				return resolve()
			})
		}).catch((err) => console.log(err))
	},
	removelead: function(values){
		/**
		 * @param {Object} values Object - The form submitted from the remove confirmation modal
		 * Must have the _id from the data attribute on the element that opens the form
		 */
		return new Promise ((resolve, reject) => {
			values.date = new Date()
			let row = {'_id': values._id},
				inactive = (values.inactive == "0") ? "1" : "0"
			values.inactive = inactive
			let query = values
			//Clean up the claimed database
			if (inactive === "0"){
				let claimed = document.querySelector('.claimed')
				$(claimed).each((k,v) => {
					if ($(v).data('lead') === values.abbv){
						this.remove('claimedDb', {'leadabbv': values.abbv}, true)
					}
				})
			}
			
			return this.update('leadsDb', row, query).then((result) => {
				if (result) {
					return resolve(result)
				} else {
					return reject()
				}
			}).then((result) => {
				return resolve()
			})
		}).catch((err) => console.log(err))
	},
	/**
	 * DB Transactions
	 */ 
	pull: function (dbname, query, sort){
		/**
		 * @param {String} dbname - Database to use
		 * @param {Object} query - nedb query object
		 * @param {String} sort - column to use for the order of results (defaults to _id ascending order)
		 * 
		 * @return {Object} Promise & Result
		 */
		//var query = {'_id': {'$regex': /^[a-zA-Zd]/}}

		return new Promise((resolve, reject) => {
			return db[dbname].find(query).sort(sort).exec((err, result) => {
				if (err) {
					return reject(err)
				} else {
					return resolve(result)
				}
			})
		}).catch((err) => console.log(err))

		
	},
	post: function (dbname, query){
		/**
		 * @param {String} dbname - Database to use
		 * @param {Object} query - nedb query object
		 * 
		 * @return {Object} Promise & Result
		 */
		query.date = new Date
		return new Promise ((resolve, reject) => {
			return db[dbname].insert(query, function (err, newDoc) {
				if (err) {
					return reject(err) 
				} else {
					return resolve(newDoc)
				}
			})
		}).catch((err) => console.log(err))
	},
	update: function (dbname, row, query){
		/**
		 * @param {String} dbname - Database to use
		 * @param {Object} query - nedb query object
		 * 
		 * @return {Object} Promise & Result (numReplaced)
		 */
		return new Promise((resolve, reject) => {
			return db[dbname].update(row, query, {}, function(err, numReplaced) {
				if (err){
					return reject(err)
				} else {
					return resolve(numReplaced)
				}
			})
		}).catch((err) => console.log(err))
	},
	remove: function (dbname, query, multi=false) {
		/**
		 * @param {String} dbname - Database to use
		 * @param {Object} query - nedb query object
		 * @param {Boolean} multi - remove multiple rows (defaults to false)
		 */
		return new Promise((resolve, reject) => {
			return db[dbname].remove(query, {'multi': multi}, function (err, numRemoved) {
				if (err) {
					return reject(err)
				} else {
					return resolve(numRemoved)
				}
			})
		}).catch((err) => console.log(err))
	},
	clearfields: function (formValues) {
		/**
		 * @param {Object} formValues - Object of the form inputs to be cleared
		 */
		return new Promise ((resolve, reject) => {
			let count = 1, loopLength = Object.keys(formValues).length

				for ( i in formValues ) {
					let field = document.querySelector('form [name="'+i+'"]')
					//$('form [name="'+i+'"]')
					if (i === 'fail'){
						$(field).prop('checked', false)
					}  else if (i === 'date'){
						field.valueAsDate = new Date()
					} else if (i == 'lead') {
						$(field).val(loggedOnUser)
					} else if (i === 'agent') {
						$(field).prop('value', 0)
					}  else {
						$(field).val('')
					}
					if (count == loopLength) {
						return resolve(loopLength)
					} else	{
						count ++
					}
				}

			
		}).catch((err) => console.log(err))
	}
}

/**
 * Import agents and leads from the databases, then throw into global objects of all and active agents/leads.
 */
var BuildStaffDom = {
	//uses DBSubmitTools on each "import..." function
	init: function(){
		return new Promise ((resolve, reject) => {
			return this.importAllAgents().then((result) => {
				return this.allAgentsToObj(result)
			}).then((result) => {
				return this.importActiveAgents()
			}).then((result) => {
				return this.activeAgentsToObj(result)
			}).then((result) => {
				return this.importAllLeads()
			}).then((result) => {
				return this.allLeadsToObj(result)
			}).then((result) => {
				return this.importActiveLeads()
			}).then((result) => {
				return this.activeLeadsToObj(result)
			}).then((result) => {
				return this.agentSelect()
			}).then((result) => {
				return this.leadSelect()
			}).then((result) => {
				return resolve(true)
			})
		}).catch((err) => console.log(err))
	},
	importAllAgents: function (DBquery = null) {
		let query = {abbv: {'$regex': /^[a-zA-Z]/}},
			sort = {'abbv': 1}
		return new Promise ((resolve, reject) => {
			return db.agentsDb.find(query).sort(sort).exec(function(err, result){
				if (err) {
					return reject(err)
				} else {
					return resolve(result)
				}	
			})
		}).catch((err) => console.log(err))
	},
	allAgentsToObj: function (result) {
		agentObj = {}
		return new Promise ((resolve, reject) => {
			let count = 1
			for (var i in result){
				agentsObj[result[i].abbv] = result[i]
				if (count == Object.keys(result).length) {
					return resolve(result)
				} else {
					count++
				}
			}
			
		}).catch((err) => console.log(err))
	},
	importActiveAgents: function (DBquery = null) {
		let query = {inactive: "0"},
			sort = {'abbv': 1}
		return new Promise ((resolve, reject) => {
			return db.agentsDb.find(query).sort(sort).exec((err, result) => {
				if (err) {
					return reject(err)
				} else {
					return resolve(result)
				}
			})
		}).catch((err) => console.log(err))
	},
	activeAgentsToObj: function (result) {
		activeAgentsObj = {}
		return new Promise ((resolve, reject) => {
			let count = 1
			for  (var i in result) {
				activeAgentsObj[result[i].abbv] = result[i]
				if (count == Object.keys(result).length) {
					return resolve(result)
				} else {
					count ++
				}
			}
		}).catch ((err) => console.log(err))
	},
	importAllLeads: function () {
		let query = {abbv: {'$regex': /^[a-zA-Z]/}},
			sort = {'abbv': 1}

		return new Promise ((resolve, reject) => {
			return db.leadsDb.find(query).sort(sort).exec(function(err, result){
				if (err) {
					return reject(err)
				} else {
					return resolve(result)
				}
			})
		}).catch((err) => console.log(err))
	},
	allLeadsToObj: function (result) {
		leadsObj = {}
		return new Promise ((resolve, reject) => {
			let count = 1
			for (var i in result) {
				leadsObj[result[i].abbv] = result[i]

				if (count == Object.keys(result).length) {
					return resolve(activeLeadsObj)
				} else {
					count ++
				}
			}
		}).catch((err) => console.log(err))
	},
	importActiveLeads: function () {
		let query = {inactive: "0"},
			sort = {'abbv': 1}

		return new Promise ((resolve, reject) => {
			return db.leadsDb.find(query).sort(sort).exec(function(err, result){
				if (err) {
					return reject(err)
				} else {
					return resolve(result)
				}
			})
		}).catch((err) => console.log(err))
	},
	activeLeadsToObj: function (result) {
		activeLeadsObj = {}
		return new Promise ((resolve, reject) => {
			let count = 1
			for (var i in result) {
				activeLeadsObj[result[i].abbv] = result[i]

				if (result[i].abbv == loggedOnUser) {
					loggedOnUserFullname = result[i].name
				}
				
				if (count == Object.keys(result).length) {
					return resolve(activeLeadsObj)
				} else {
					count ++
				}
			}
		}).catch((err) => console.log(err))
	},
	agentSelect: function() {
		let select = document.getElementById('select-agent'),
			monitorModalSelect = document.getElementById('edit-monitor-modal-select-agent'),
			defaultOptionHTML = '<option value="0" selected disabled>Select The Agent You Monitored</option>',
			options = [];
		select.innerHTML = ''
		select.innerHTML = defaultOptionHTML
		monitorModalSelect.innerHTML = defaultOptionHTML
		return new Promise ((resolve, reject) =>{
			var length = Object.keys(activeAgentsObj).length, count = 1
			for (var i in activeAgentsObj){
				let option = document.createElement('option'),
					option2 = document.createElement('option')
				// Set the select on new monitor form
				option.value = activeAgentsObj[i].abbv
				option.setAttribute('data-agent-id', activeAgentsObj[i]._id)
				option.innerHTML = activeAgentsObj[i].name
				select.appendChild(option)

				// Set the select on the edit-monitor-modal
				option2.value = activeAgentsObj[i].abbv
				option2.setAttribute('data-agent-id', activeAgentsObj[i]._id)
				option2.innerHTML = activeAgentsObj[i].name
				monitorModalSelect.appendChild(option2)

				if (count == length) {
					return resolve(count)
				} else {
					count++
				}
			}
			
		}).catch((err) => console.log(err))
			
	},
	leadSelect: function() {
		let newMonitorSelect = document.getElementById('select-lead'),
			leadMonitorSelect = document.getElementById('select-lead-search'),
			monitorModalSelect = document.getElementById('edit-monitor-modal-select-lead'),
			defaultOptionHTML = '<option value="0" selected disabled>Select The Lead</option>';
		newMonitorSelect.innerHTML = defaultOptionHTML;
		leadMonitorSelect.innerHTML = defaultOptionHTML;
		monitorModalSelect.innerHTML = defaultOptionHTML;

		return new Promise ((resolve, reject) => {

			var length = Object.keys(activeLeadsObj).length, count = 1
			for (var x in activeLeadsObj) {
				let option1 = document.createElement('option'),
					option2 = document.createElement('option'),
					option3 = document.createElement('option')
				if (loggedOnUser == x) {
					option1.selected = true
					option2.selected = true
				}
				//set select on main form
				option1.value = activeLeadsObj[x].abbv
				option1.setAttribute('data-lead-id', activeLeadsObj[x]._id)
				option1.innerHTML = activeLeadsObj[x].name
				newMonitorSelect.appendChild(option1)

				//set select on monitor search form
				option2.value = activeLeadsObj[x].abbv
				option2.setAttribute('data-lead-id', activeLeadsObj[x]._id)
				option2.innerHTML = activeLeadsObj[x].name
				leadMonitorSelect.appendChild(option2)

				//set select on edit-monitor-modal
				option3.value = activeLeadsObj[x].abbv
				option3.setAttribute('data-lead-id', activeLeadsObj[x]._id)
				option3.innerHTML = activeLeadsObj[x].name
				monitorModalSelect.appendChild(option3)

				if (count == length) {
					return resolve(count)
				} else {
					count++
				}
			}
		}).catch((err) => console.log(err))
	}
}
var LoadMonitors = {
	// Uses DBSubmitTools for each "pull..." function
	init: function () {
		return new Promise ((resolve, reject) => {
			return this.pullNeeded().then((result) => {
				return this.buildNeeded(result); 
			}).then ((result) => {
				return this.pullClaimed()
			}).then ((result) => {
				return this.loadClaimed(result)
			}).then ((result) => {
				return this.pullCompleted()
			}).then ((result) => {
				return this.buildCompleted(result)
			}).then ((result) => {
				return this.pullQuarter()
			}).then ((result) => {
				return this.fillQuarter(result)
			}).then ((result) => {
				return this.pullYear()
			}).then ((result) => {
				return this.fillYear(result)
			}).then ((result) => {
				return this.pullCompleted(null, sort = {'date': 1})
			}).then ((result) => {
				return this.buildCompletedThisMonth(result)
			}).then ((result) => {
				return this.pullLeadMonitors()
			}).then ((result) => {
				return this.leadMonitors(result)
			}).then ((result) => {
				return this.pullLastMonitor()
			}).then ((result) => {
				return this.fillLastMonitor(result)
			}).then ((result) => {
				return this.averageBadges()
			}).then ((result) => {
				return resolve(result)
			}).catch(err => {console.log(err)})
		}).catch(err => {console.log(err)})
	},
	pullNeeded: function () {
		/**
		 * Pulls the monitors for this month
		 */

		let startOfMonth = new Date(year, date.getMonth(), 1),
			endOfMonth = new Date(year, date.getMonth() + 1, 1),
			agent = "",
			query = {'$and': [ {date: { '$gte': startOfMonth }},{date: { '$lte': endOfMonth }} ]},
			sort = {'agent': 1, 'date': 1}
		
		//loop through all staff and pull monitors individuall, then load to a sorted result?
		return new Promise ((resolve, reject) => {
		//	let count = 0, length = Object.keys(activeAgentsObj).length, monitors = []
			return DBSubmitTools.pull('monitors', query, sort).then((result) => {
				//loop through all the monitors to filter the result to show each agent
				if (result) {
					return resolve(result)
				}
			})
		}).catch((err) => console.log(err))
	},
	pullLastMonitor: function () {
		/**
		 * Pulls the monitors for last month
		 */

		//startOfMonth = new Date(year, date.getMonth(), 1),
		let endOfMonth = new Date(year, date.getMonth() + 1, 1),
			startOfLastMonth = new Date(year, date.getMonth() - 1, 1),
			queryTwoMonths = {'$and': [{date: { '$gte': startOfLastMonth }}, {date: { '$lte': endOfMonth }}]},
			sort = {'agent': 1, 'date': 1}
		
		return new Promise ((resolve, reject) => {
			return DBSubmitTools.pull('monitors', queryTwoMonths, sort).then((result) => {
				if (result) {
					return resolve(result)
				}
			})
		}).catch((err) => console.log(err))
	},
	fillLastMonitor: function (result) {
		/**
		 * @param {Object} result Result of two month DB query
		 */

		let count = 1
		return new Promise((resolve, reject) => {
			for (i in activeAgentsObj) {
				monitors = result.filter(x => x.agent == i)
				if (Object.keys(monitors).length > 0){
					let last = Object.keys(monitors).length-1,
						lastmonitor = monitors[last],
						lastMonitorCell = $('#' + lastmonitor.agent+'-last-monitor')
					if (lastMonitorCell){
						let argsDate = new Date(lastmonitor.date)
						let tmpDate = new Date(argsDate.getFullYear(), argsDate.getMonth(), argsDate.getDate(), 12)
						$('#'+lastmonitor.agent+'-last-monitor').html((lastmonitor.score + '% on ' + tmpDate.getFullYear() + '-' + ("0" + (tmpDate.getMonth() + 1)).slice(-2) + '-' + ("0" + (tmpDate.getDate())).slice(-2)))
						if(lastmonitor.fail){
							$(lastMonitorCell).toggleClass('bg-danger')
							$(lastMonitorCell).siblings().toggleClass('bg-danger')
						}
					} 
				} 
				// exit if all agents have been checked
				if (count == Object.keys(activeAgentsObj).length){
					return resolve()
				} else {
					count ++
				}
			}
		}).catch((err) => console.log(err))
	},
	buildNeeded: function(result) {
		/**
		 * @param {Object} result Result of DB query
		 */

		let container = document.getElementById('needed-monitors-tbody')
		container.innerHTML = ''

		return new Promise ((resolve, reject) => {
			if (result) {
				
					return resolve(domTools.domMethods.buildNeeded(container, result, activeAgentsObj))
				
			} else {
				return resolve()
			}
			
		}).catch((err) => console.log(err))
		
			
	},
	pullClaimed: function () {
		/**
		 * Pulls all the currently claimed monitors from the claimed database
		 */
		let startOfMonth = new Date(year, date.getMonth(), 1),
			endOfMonth = new Date(year, date.getMonth() + 1, 1),
			query = {'$and': [ {date: { '$gte': startOfMonth }},{date: { '$lte': endOfMonth }} ]}
	
		return new Promise ((resolve, reject) => {
			return db.claimedDb.find(query).sort({'agent': 1}).exec(function (err, result){
				if (err) {
					return reject (err)
				} else {
					return resolve (result)
				}
			})
		}).catch((err) => console.log(err))
	},
	loadClaimed: function (claimedMonitors) {
		/**
		 * @param {Object} claimedMonitors Result of DB query
		 */

		return new Promise ((resolve, reject) => {
			return domTools.domMethods.setClaimed(claimedMonitors, leadsObj).then((result) => {
				$(function () {
					$('[data-toggle="tooltip"]').tooltip()
				})
				return resolve()
			})
		}).catch((err) => console.log(err))
	},
	pullCompleted: function (month = null, sort = null) {
		/**
		 * @param {DATE} month OPTIONAL - Date for the query
		 * @param {Object} sort OPTIONAL - sort (default is by agent, then date)
		 */
		let start = new Date(year, date.getMonth(), 1),
			end = new Date(year, date.getMonth() + 1, 1),
			tmpDate
		//let start = startOfMonth, end = endOfMonth, tmpDate
		// Month & Sort make this reusable
		if (!sort) {
			sort = {'agent': 1, 'date': 1}
		}
		
		if (month) {
			tmpDate = new Date(month)
			start = new Date(tmpDate.getFullYear(), tmpDate.getMonth(), 1)
			end = new Date(tmpDate.getFullYear(), tmpDate.getMonth() + 1, 1)
		}
		let query = {'$and': [ {date: { '$gte': start }},{date: { '$lte': end }} ]}
		return new Promise ((resolve, reject) => {
			return DBSubmitTools.pull('monitors', query, sort).then(function (result) {
				if (result) {
					thisMonthMonitorsObj = result;
					return resolve(result)
				}
			})
		}).catch((err) => console.log(err))
	},
	pullQuarter: function (argMonth = null) {
		/**
		 * @param {DATE} argMonth OPTIONAL - Date for search
		 */

		let quarterstart = qstart, quarterend = qend
		if (argMonth) {
			// re-write start/end variables declared at the beginning
			let tmpMonth = new Date(argMonth)
			
			// re-write the qstart/end variables declared at the beginning if month is supplied
			if (q1.includes(tmpMonth.getMonth().toString()) )
			{
				quarterstart = new Date(tmpMonth.getFullYear(), 0, 1)
				quarterend = new Date(tmpMonth.getFullYear(), 3, 1)
			} 
			else if (q2.includes(tmpMonth.getMonth().toString()) )
			{
				quarterstart = new Date(tmpMonth.getFullYear(), 3, 1)
				quarterend = new Date(tmpMonth.getFullYear(), 6, 1)
			} 
			else if (q3.includes(tmpMonth.getMonth().toString()) )
			{
				quarterstart = new Date(tmpMonth.getFullYear(), 6, 1)
				quarterend = new Date(tmpMonth.getFullYear(), 9, 1)
			} 
			else 
			{
				quarterstart = new Date(tmpMonth.getFullYear(), 9, 1)
				quarterend = new Date(tmpMonth.getFullYear(), 12, 1)
			}
		}
		let query = {'$and': [ {date: {'$gte': quarterstart}},{date: {'$lte': quarterend}} ]},
			sort = {'agent': 1, 'date': 1}

		return new Promise ((resolve, reject) => {
			return DBSubmitTools.pull('monitors', query, sort).then(function (result) {
				if (result) {
					return resolve(result) 
				}
			})
		}).catch((err) => console.log(err))
	},
	fillQuarter: function (monitors) {
		/**
		 * @param {Object} monitors Result of all monitors from database
		 */

		return new Promise ((resolve, reject) => {
			if (Object.keys(monitors).length > 0) {
				let count = 0
				for (abbv in agentsObj) {
					let agentMonitors = monitors.filter(x => x.agent === abbv),
						avg = 0 
					let qAvg = (agentMonitors.length > 0) ? domTools.domMethods.calcAverage(agentMonitors) : ''

					if (document.getElementById(abbv+'-qAvg')){
						document.getElementById(abbv+'-qAvg').innerHTML = qAvg
					}
					
					count ++
					if (count == Object.keys(agentsObj).length) {
						return resolve(true)
					}
				}
			} else {
				return resolve(true)
			}
		}).catch((err) => console.log(err))
	
	},
	pullYear: function (argYear = null) {
		/**
		 * @param {DATE} argYear OPTIONAL - year for query
		 */

		let tmpYear = year
		if (argYear) {
			let tmpDate = new Date (argYear)
			tmpYear = tmpDate.getFullYear()
		}
		let queryYear = {'$and': [{date: {'$gte': new Date('1/1/'+tmpYear)}},{date: {'$lte': new Date('12/31/'+tmpYear)}} ]},
			sort = {'agent': 1, 'date': 1}
		return new Promise ((resolve, reject) => {
			return DBSubmitTools.pull('monitors', queryYear, sort).then ((result) => {
				if (result) {
					return resolve(result)
				}
			})
		}).catch((err) => console.log(err))
	},
	fillYear: function (monitors) {
		/**
		 * @param {Object} monitors Result of DB query
		 */
		return new Promise ((resolve, reject) => {
			if (Object.keys(monitors).length > 0) {
				let count = 0
				for (abbv in agentsObj) {
					let agentMonitors = monitors.filter(x => x.agent === abbv),
						avg = 0
					let yAvg = (agentMonitors.length > 0) ? domTools.domMethods.calcAverage(agentMonitors) : ''
					if (document.getElementById(abbv+'-yAvg')){
						document.getElementById(abbv+'-yAvg').innerHTML = yAvg
					}

					let averages = ['yAvg', 'qAvg', 'mAvg']
					averages.forEach( i => {
						let avgTd = document.getElementById(abbv + '-' + i),
								// Agents who have been inactive that month will not be present.
								// Check for the agent before trying to get text
								avg = (avgTd) ? avgTd.innerText.slice(0,-2) : null
						
						if (avg && parseInt(avg) < 75) {
							$('#'+abbv+'-'+i).addClass('bg-danger')
						}
					});

					count ++
					if (count == Object.keys(agentsObj).length) {
						
						return resolve(true)
					}
				}
			} else {
				return resolve(true)
			}
		}).catch((err) => console.log(err))
	},
	averageBadges: function () {
		return new Promise ((resolve, reject) => {
			
			let averages = ['yAvg', 'qAvg', 'mAvg'], // array of fields to find
				count = 1 // count to return the promise
			// Loop through columns
			averages.forEach( i => {
				let total = 0, tmpTotal = 0, 
					badge = document.getElementById(i+'-badge'),
					tdsWithValue = Array.from(document.querySelectorAll('.'+i)).filter(y => {
					// Filter out the cells with no value
						if (y.innerText !== '') {
							return y
						}
					})
				tdsWithValue.forEach(x => { // Loop to get values and calculate the team averages
					tmpVal = x.innerText.slice(0,-2)
					if (tmpVal && tmpVal > 0){ // Check for, and remove, empty cells
						total += parseInt(tmpVal)
					}
				})
				// Make sure total exists, then calculate the average
				let totalAvg = (total) ? total / tdsWithValue.length : 0
				// Add to the badge
				badge.innerHTML = totalAvg.toFixed() + '%'
				// Add custom background color based on performance scores
				if (totalAvg && parseInt(totalAvg) < 80) {
					$(badge).parent().addClass('bg-danger')
				} else if (totalAvg && parseInt(totalAvg) >= 80 && parseInt(totalAvg) <= 85) {
					$(badge).parent().addClass('bg-warning')
				} else {
					$(badge).parent().addClass('bg-success')
				}
				// Count to return promise
				if (count === 3){
					return resolve(count)
				} else {
					count ++
				}
				
			});
		}).catch((err) => console.log(err))
		
	},
	buildCompleted: function(result, queryMonth = null) {
		/**
		 * @param {Object} result Result of DB query for the specified month
		 */
		
		let accordionContainer = document.getElementById('agent-accordion-tbody'),
			count = 1,
			head = [], cells = [], // Declared outside of the IF to maintain scope
			completedCount = 0, requiredCount = 0 // Used for the completed badge

		let tmpDate = (queryMonth) ? new Date (queryMonth) : date,
				resultDate = new Date(tmpDate.getFullYear(), tmpDate.getMonth(), 1)

		accordionContainer.innerHTML = ''

		return new Promise ((resolve, reject) => {
			for (var i in agentsObj) {
				let agentRow = document.createElement('tr'),
					row = [],
					well = document.createElement('div'),
					wellTD = document.createElement('td'),
					wellTR = document.createElement('tr'),
					subTable = document.createElement('table'),
					subThead = document.createElement('thead'),
					subTheadRow = document.createElement('tr'),
					headArr = ['Date', 'Score', 'Auto-Fail', 'Lead', 'Edit', 'Remove'],
					subTbody = document.createElement('tbody'),
					agentDate = new Date(agentsObj[i].date.getFullYear(), agentsObj[i].date.getMonth(), 1)
				
				if ((agentsObj[i].inactive === "1") && (new Date(agentDate.getFullYear(), agentDate.getMonth(), 1) < resultDate)){
					// If they were inactive before the current month, skip building the row.
					count++
					continue
				}
				if (agentsObj[i].inactive === "1") {
					$(agentRow).css('text-decoration', 'line-through')
				}
				// Create the subtable's TH elements
				headArr.forEach(function (heading){
					let th = document.createElement('th')
					$(th).html(heading)
					subTheadRow.appendChild(th)
				})
				$(subTbody).attr('id', i + 'tbody')
				$(wellTR).attr('id',  i+'Table').addClass('accordion-body collapse').attr('aria-expanded', false)
				$(wellTD).attr('colspan', '5')
				$(well).addClass('well')
				$(subTable).attr('width', '100%').addClass('table table-striped')

				$(agentRow).attr('id', i+'-panel-head')
					.addClass('accordion-toggle')
					.attr('data-toggle', 'collapse')
					.attr('data-parent', '#agent-accordion-tbody')
					.attr('data-target', `#${i}Table`)
					.attr('area-expanded', false)
					.attr('role', 'button')
				
				if (Object.keys(result).length > 0){
					let monitors = result.filter(x => x.agent === i)
					//Create the content of the agent row (head)
					head = domTools.domMethods.buildAccordionHead(agentsObj[i], monitors, resultDate)
					// Create the content of the sub table
					row = domTools.domMethods.buildAccordionBody(row, agentsObj[i], leadsObj, monitors)
					completedCount += Object.keys(monitors).length

					requiredCount += (agentsObj[i].inactive === "0") ? parseInt(agentsObj[i].monitors) : 
								((new Date(agentDate.getFullYear(), agentDate.getMonth(), 1) >= resultDate)) ? parseInt(agentsObj[i].monitors) : 0
					

				} else {
					head = domTools.domMethods.buildAccordionHead(agentsObj[i], null, resultDate)
					row = domTools.domMethods.buildAccordionBody(row, agentsObj[i], leadsObj)
					requiredCount += (agentsObj[i].inactive === "0") ? parseInt(agentsObj[i].monitors) : 
								((new Date(agentDate.getFullYear(), agentDate.getMonth(), 1) >= resultDate)) ? parseInt(agentsObj[i].monitors) : 0
				}

				// Append the row to the container in order
				$(agentRow).append(head)
				$(row).attr('id', '')
				$(subTbody).append(row)
				$(subThead).append(subTheadRow)
				$(subTable).append(subThead, subTbody)
				$(well).append(subTable)
				$(wellTD).append(well)
				$(wellTR).append(wellTD)
				$(accordionContainer).append(agentRow)
				$(accordionContainer).append(wellTR)
				
				$('#total-badge').html(`${completedCount} / ${requiredCount}`)
				if (count == Object.keys(agentsObj).length){
					// Return to verify the loop is completed
					return resolve()
				} else {
					count ++ // Increase count
				}
			}
		}).catch((err) => console.log(err))
	},
	buildCompletedThisMonth: function(monitors) {
		/**
		 * @param {Object} monitors Build's the accordion table for the month
		 */
		let count = 0,
			elements = {},
			container = document.getElementById('completed-monitors-tbody')
		container.innerHTML = ''
		return new Promise ((resolve, reject) => {
			if (monitors) {
				let rows = []
				for (i in monitors) {
					let resultDate = new Date(monitors[i].date),
						resultYear = resultDate.getFullYear(),	
						resultMM = ("0" + (resultDate.getMonth() + 1)).slice(-2),
						resultDD = ("0" + resultDate.getDate()).slice(-2),
						resultDateString = resultYear + '-' + resultMM + '-' + resultDD
						
						
					
					let row = domTools.domMethods.buildCompletedMonthRow(
							monitors[i], 
							resultDateString, 
							agentsObj[monitors[i].agent].name, 
							leadsObj[monitors[i].lead].name
						)
					
					rows.push(row)
					
					count ++
					
				}
				$(container).append(rows)
				if (count == Object.keys(monitors).length){
					return resolve()
				}
			} else {
				return resolve()
			}
		}).catch((err) => console.log(err))

	},
	pullLeadMonitors: function (lead = null, month = null) {
		/**
		 * @param {String} lead OPTIONAL - Lead name to search
		 * @param {Date} month OPTIONAL - Month to search
		 */

		let leadName = (!lead) ? loggedOnUser : lead, 
			sort = {'date': 1}
			start = new Date(year, date.getMonth(), 1),
			end = new Date(year, date.getMonth() + 1, 1)

		// Rewrite start and end if the month is supplied
		if (month) {
			tmpStart = new Date(month)
			start = new Date(tmpStart.getFullYear(), tmpStart.getMonth(), 1)
			end = new Date(tmpStart.getFullYear(), tmpStart.getMonth() + 1, 1)
		}
		let query = {'$and': [ {date: { '$gte': start }}, {date: { '$lte': end }} ] }
			
		return new Promise ((resolve, reject) => {
			return DBSubmitTools.pull('monitors', query, sort).then(function (result) {
				if (result) {
					resultObj = {"monitors": result, 'lead': leadName}
					return resolve(resultObj)
				}
			})
		}).catch((err) => console.log(err))
	},
	leadMonitors: function(result) {
		/**
		 * @param {Object} result Result from the DB query
		 */

		let container = document.getElementById('leadmonitors-tbody')
		container.innerHTML = ''
		return new Promise ((resolve, reject) => {
			if (result) {
				let monitors = result.monitors.filter(x => x.lead == result.lead),
					count = 0 
				let rows = []
				for (i in monitors) {
					let resultDate = new Date(monitors[i].date),
						resultYear = resultDate.getFullYear(),	
						resultMM = ("0" + (resultDate.getMonth() + 1)).slice(-2),
						resultDD = ("0" + resultDate.getDate()).slice(-2),
						resultDateString = resultYear + '-' + resultMM + '-' + resultDD
							
							
						
					let row = domTools.domMethods.buildCompletedMonthRow(
							monitors[i], 
							resultDateString, 
							agentsObj[monitors[i].agent].name, 
							leadsObj[monitors[i].lead].name
						)
					
					rows.push(row)
					count ++
					
				}
				
				$(container).append(rows)
				if (count == Object.keys(monitors).length){
					return resolve()
				}
				
			} else { // If no result
				container.innerHTML = 'No monitors found'
				return resolve()
			}
		}).catch((err) => console.log(err))
		
	},
	completedPerAgentSearch: function (month){
		/**
		 * Rebuilds the All Monitors Accordion table when the search date is changed
		 * @param {Date} month Date to use in the DB queries
		 */

		let tmpMonth = new Date(month)
		return new Promise((resolve, reject) => {
			return this.pullCompleted(month).then((result) => {
				let result2 = this.buildCompleted(result, month)
				return result2
			}).then ((result) => {
				let result2 = this.pullQuarter(month)
				return result2
			}).then ((result) => {
				let result2 = this.fillQuarter(result)
				return result2
			}).then ((result) => {
				let result2 = this.pullYear(month)
				return result2
			}).then ((result) => {
				let result2 = this.fillYear(result)
				return result2
			}).then ((result) => {
				return this.averageBadges()
			}).then ((result) => {
				let result2 = this.pullCompleted(month, sort = {'date': 1})
				return result2
			}).then ((result) => {
				let result2 = this.buildCompletedThisMonth(result)
				return result2
			})
		}).catch((err) => console.log(err))
	},
	completedByLead: function (lead = null, month) {
		/**
		 * Rebuilds the Monitors By Lead table when the agent or date is changed.
		 * @param {String} lead - REQUIRED - Name of the lead to use in the query
		 * @param {String} month - REQUIRED - Date from the HTML Date <input>
		 */

		 if (!lead){
			 lead = loggedOnUser
		 }

		return new Promise((resolve, reject) => {
			return this.pullLeadMonitors(lead, month).then((result) => {
				return this.leadMonitors(result)
			}).then((result) => {
				return resolve()
			})
		}).catch((err) => console.log(err))
	}
}

/**
 * Build the Agent Maintenance and Lead Maintenance pages
 */
var LoadStaffEdit = {
	init: function(){
		return new Promise ((resolve, reject) => {
			return this.agentMaintenance().then((result) => {
				return this.leadMaintenance()
			}).then((result) => {
				//finally
				return resolve()
			})
		}).catch((err) => console.log(err))
	},
	agentMaintenance: function() {
		/**
		 * Build the Agent Maintnance table
		 */
		let container = document.getElementById('edit-agents-tbody')
		container.innerHTML = ''

		return new Promise ((resolve, reject) => {
			if (domTools.domMethods.buildTable(container, agentsObj, 'agent')){
				return resolve()
			} else {
				return reject()
			}
		}).catch((err) => console.log(err))
		

	},
	leadMaintenance: function() {
		/**
		 * Build the Lead Maintance table
		 */
		let container = document.getElementById('edit-leads-tbody')
		container.innerHTML = ''

		return new Promise ((resolve, reject) => {
			if (domTools.domMethods.buildTable(container, leadsObj, 'lead')) {
				return resolve()
			}
		}).catch((err) => console.log(err))
	}
}

var FormSubmitTools = {
	initModal: function (type,args){
		/**
		 * @param {String} type - The type of modal to pop
		 * @param {Object} args - HTML Element that was clicked to start the modal
		 */
		return new Promise ((resolve, reject) => {
			return this[type](args).then((modal) => {
					return domTools.buildModal.createModal(modal, args, agentsObj, leadsObj)
			}).then ((modal) => {
				$(modal).on('shown.bs.modal', function (e){
					return resolve()
				})
			})
		}).catch ((err) => console.log(err))
	},
	/**
	 * select the modal to pop up
	 */
	addAgent: function (args){
		return new Promise ((resolve, reject) => {
			return resolve(document.getElementById('add-agent-modal'))
		}).catch((err) => console.log(err))
	},
	editAgent: function (args){
		return new Promise ((resolve, reject) => {
			return resolve(document.getElementById('edit-agent-modal'))
		}).catch((err) => console.log(err))
	},
	removeAgent: function (args){
		return new Promise ((resolve, reject) => {
			return resolve(document.getElementById('remove-agent-modal'))
		}).catch((err) => console.log(err))
	},
	addLead: function (args){
		return new Promise ((resolve, reject) => {
			return resolve(document.getElementById('add-lead-modal'))
		}).catch((err) => console.log(err))
	},
	editLead: function (args){
		return new Promise ((resolve, reject) => {
			return resolve(document.getElementById('edit-lead-modal'))
		}).catch((err) => console.log(err))
	},
	removeLead: function (args){
		return new Promise ((resolve, reject) => {
			return resolve(document.getElementById('remove-lead-modal'))
		}).catch((err) => console.log(err))
	},
	editMonitor: function (args){
		return new Promise ((resolve, reject) => {
			return resolve(document.getElementById('edit-monitor-modal'))
		}).catch((err) => console.log(err))
	},
	removeMonitor: function (args){
		return new Promise ((resolve, reject) => {
			return resolve(document.getElementById('remove-monitor-modal'))
		}).catch((err) => console.log(err))
	},
	changeClaimed: function (agent, lead, type) {
		return new Promise((resolve, reject) => {
			let setRemove = (type === 'unclaimed') ? 'setClaimed' : 'removeClaimed'
			return resolve(this[setRemove](agent, lead))
		}).catch((err) => console.log(err))
	},
	setClaimed: function (agent, lead) {
		let query = {agentabbv: agent, leadabbv: lead}
		return new Promise ((resolve, reject) => {
			return DBSubmitTools.post('claimedDb', query).then((result) => {
				if (result) {
					
					return resolve(result)
				}
			})
		}).catch((err) => console.log(err))
	},
	removeClaimed: function (agent) {
		let query = {agentabbv: agent}
		return new Promise ((resolve, reject) => {
			return DBSubmitTools.remove('claimedDb', query, true).then ((result) => {
				if (result) {
					return resolve(result)
				}
			})
		}).catch((err) => console.log(err))
	},
	/**
	 * Submitting
	 */
	modalSubmit: function (form) {
		return new Promise ((resolve, reject) => {
			let formname = $(form).attr('name')
			
			return validation.formValidation.init(formname, form).then ((result) => {
				return DBSubmitTools.init(formname, result)
			}).then ((result) => {
				return ReloadInit.init()
			})
		}).catch((err) => console.log(err))
	},
	submit: function (form) {
		return new Promise ((resolve, reject) => {
			let formname = $(form).attr('name')
		
			// Validate the form fields, then make them into a useable object for the submit.
			 return validation.formValidation.init(formname, form).then ((result) => {
				if (result.fail === true) {
					result.score = "0"
				}
				return DBSubmitTools.newmonitor(formname, result)
			}).then ((result) => {
				return	DBSubmitTools.clearfields(result)
			}).then ((result) => {
				return ReloadInit.init()
			})
		}).catch((err) => console.log(err))	
	}
}

/**
 * Load DOM sections
 */

let navigation =  {
	constants: {
		sectionTemplate: '.section-template',
		contentContainer: '#wrapper',
		startSectionMenuItem: '#main-menu',
		startSection: '#main',
		footerContainer: '#footer',
		footerVersion: '.app-version'
	},

	importSectionsToDOM: function() {
		const links = document.querySelectorAll('link[rel="import"]')
		Array.prototype.forEach.call(links, function (link) {
			let template = link.import.querySelector(navigation.constants.sectionTemplate)
			let clone = document.importNode(template.content, true)
			if ($(link).hasClass('footer-link')){
			document.querySelector(navigation.constants.footerContainer).appendChild(clone)
			document.querySelector(navigation.constants.footerVersion).innerHTML = 'v'+app.getVersion()
			} else {
			document.querySelector(navigation.constants.contentContainer).appendChild(clone)
			}
		})
	},

	setMenuOnClickEvent: function () {
		
		document.body.addEventListener('click', function (event) {
			if (event.target.dataset.section) {
				navigation.hideAllSections()
				navigation.showSection(event)
			}
			if ($('div.navbar-collapse').hasClass('show')){
				$('div.navbar-collapse').removeClass('show')
			}
		})
	},

	showSection: function(event) {
		const sectionId = event.target.dataset.section
		$('#' + sectionId).show()
		$('#' + sectionId + ' section').show()
	},

	showStartSection: function() {
		$(this.constants.startSectionMenuItem).click()
		$(this.constants.startSection).show()
		$(this.constants.startSection + ' section').show()
	},

	hideAllSections: function() {
		$(this.constants.contentContainer + ' section').hide()
	},

	init: function() {
		return new Promise ((resolve, reject) => {
			this.importSectionsToDOM()
			this.hideAllSections()
			this.setMenuOnClickEvent()
			this.showStartSection()
			setDate()
			$('ul.navbar-nav > li > a').click(function(){
				$('ul.navbar-nav > li').removeClass('active');
				$(this).parent().addClass('active');
			})
			return resolve()
		})
		
	}
}


/**
 * HELPERS
 */

// Building the DOM
domTools.domMethods = {
	constants: {
		pencil:   '<i class="fas fa-edit" aria-hidden="true"></i>',
		Xicon:  '<i class="fas fa-times" aria-hidden="true"></i>',
		cog: '<i class="fas fa-cog" aria-hidden="true"></i>',
		checkmark: '<i class="fas fa-check" aria-hidden="true"></i>',
		removeAgent: '<i class="fas fa-user-times" aria-hidden="true"></i>',
		addUser: '<i class="fas fa-user-plus" aria-hidden="true"></i>',
		checkSquare: '<i class="far fa-check-square" aria-hidden="true"></i>',
		uncheckedSquare: '<i class="far fa-square" aria-hidden="true"></i>'

	},
	buildTable: function (container, result, type) {
		/**
		 * Builds a simple table from a dabase result
		 * @param {Object} container - HTML <TBODY> Element
		 * @param {Object} result - Result from the DB query
		 * @param {String} type - Type of table to create
		 */
		if (container && result) {
			container.innerHTML = ""
			let count = 0, length = Object.keys(result).length,
				keys = Object.keys(result),
				// Array of keys from the first object in the result to enter the value into the correct TD
				headers = Object.keys(result[keys[0]])  
				
			for (var i in result) {
				count ++
				let tr = document.createElement ('tr'),
					rows = [],
					inactive = false

				tr.setAttribute('id', result[i]._id+'-tr')
				if (result[i].inactive == 1){
					tr.setAttribute('style', 'text-decoration: line-through;')
				}
				headers.forEach(y => {
					if (y !== '_id' && y !== 'date' && y !== 'inactive') {
						tr.setAttribute('data-'+y, result[i][y])
						rows.push(this.buildTD(y, result[i][y], result[i]._id))
					}
				})

				rows.push(this.buildIcon(result[i]._id, result[i].abbv, 'edit', type, 'pencil', result[i]))
				rows.push(this.buildIcon(result[i]._id, result[i].abbv, 'remove', type, 'Xicon', result[i]))
				$(tr).append(rows)
				container.appendChild(tr)
			}
			if (count == length) {
				$(function(){
					$('[data-tooltip="tooltip"]').tooltip()
				})
				return true
			}
			
		} else {
			return false
		}
		
	},
	buildTD: function (resultTitle, resultContent, id) {
		/**
		 * Builds the TD element
		 * @param {String} resultTitle - Cell name from the database 
		 * @param {String} resultContent - Information pulled from the database
		 * @param {String} id - "_id" from the database
		 */
		let td = document.createElement('td')
		$(td).attr('id', id+'-'+resultTitle).html(resultContent)
		return td
	},
	buildIcon: function (id, abbv, buttonType, type, icon, result = null) {
		/**
		 * Build the edit/remove icon
		 * @param {String} id - id of the agent/lead
		 * @param {String} abbv - agent/lead abbreviation
		 * @param {String} buttonType - edit/remove
		 * @param {String} type - type of table being created (Agent/Lead Maintenance or Completed Monitors)
		 * @param {String} icon - which icon to use, pencil or Xicon (this.constants.)
		 * 
		 */
		
		let elem = document.createElement('td'),
			a = document.createElement('a')
		a.setAttribute('id', 'edit-'+abbv)
		elem.setAttribute('id', id+'-'+type)
		elem.classList.add(buttonType+'-'+type)
		a.innerHTML = this.constants[icon]
		elem.appendChild(a)

		if (result) {
			for (var x in result) {
				elem.setAttribute('data-'+x, result[x])
			}
		}

		return elem
	},
	buildNeeded: function (container, result, activeAgentsObj){
		/**
		 * Builds the needed monitors table on index-main
		 * 
		 * @param {Object} container - HTML <TBODY> Element
		 * @param {Object} result - All monitors found in the query (may be empty)
		 * @param {Object} activeAgentsObj - All active agents - Global Var in js.js
		 */
		let rows = [],
			totalMonitors = 0,
			totalMonitorsLeft,
			totalCompleted = 0, newTotalCompleted = 0
			
		for (num in activeAgentsObj){ // Total number monitors that need to be completed for the month
			
			if (activeAgentsObj[num].inactive !== "1") {
				totalMonitors += parseInt(activeAgentsObj[num].monitors)
			}
		}
		if (result) {
			newTotalCompleted += this.countTotal(result)
		}
		
		for (var i in activeAgentsObj) {
			if (!result) { // No result would mean no monitors have been completed, or there was a DB error
				$('#num-left').html(`${totalMonitors} / ${totalMonitors}`)
				let needed = this.neededRows(activeAgentsObj[i]), newTotalCompleted = 0
				if (needed){
					rows.push(needed)
				}
			} else {
				// there is a result, so filter by agent
				let monitors = result.filter(x => x.agent === i)
				if (Object.keys(monitors).length > 0){
					// create the row and check if the monitor is needed
					let needed = this.neededRows(activeAgentsObj[i], monitors)
					
					if (needed.monitor){// If it is needed add to the array of rows
						totalCompleted += parseInt(needed.completed)
						rows.push(needed.monitor)
					} else { // If not needed, continue through the loop
						totalCompleted += ((parseInt(needed.completed) < parseInt(activeAgentsObj[i].monitors)) ?  parseInt(needed.completed) : parseInt(activeAgentsObj[i].monitors))
						continue
					}
					
					
				} else {
					// the agent did not have any monitors, so create the row
					let needed = this.neededRows(activeAgentsObj[i])
					rows.push(needed.monitor)
				}
				
			}
		}
		//totalMonitorsLeft = totalMonitors - totalCompleted
		$('#num-left').html(`${totalMonitors - newTotalCompleted} / ${totalMonitors}`)
		$(container).append(rows)
		return true
	},
	countTotal: function (monitors){
		/**
		 * Counts through monitors to return the number of completed monitors that were not auto-fails
		 * @param {Object} monitors All the monitors from the query, normally filtered by agent
		 */
		let count = 0
		for (i in monitors){
			count ++
			if (monitors[i].fail){
				count --
			}
		}
		return count
	},
	neededRows: function (agent, monitors = null) {
		/**
		 * Creates the row elements for the needed monitors table on Index-main
		 * 
		 * @param {Object} agent - Agent Information
		 * @param {Object} monitors - OPTIONAL - completed monitors for that agent
		 */
		// need to count the completed monitors, 
		// then subtract that from the required
		// make sure Auto-Fail is flagged and removes a number from the 
		// completed monitors list
		
		let headers = ['date', 'name', 'agentid', 'last-monitor', 'num-left', 'claimed'],
				tr = document.createElement('tr'),
				total = 0,
				numleft = 0,
				tmpDate = new Date(), completed = 0, lastfail
		let thisMonth = tmpDate.getFullYear + '-' + ("0" + (tmpDate.getMonth() + 1)).slice(-2)

			tr.setAttribute('id', 'row-'+agent.abbv)
			$(tr).data('')
			//create <TD>
			headers.forEach((heading) => {
				let td = document.createElement('td')
				td.setAttribute('id', agent.abbv+'-'+heading)
				tr.appendChild(td)
			})
		if (monitors) {
			
			var lastmonitordata = this.countMonitorsNeeded(monitors, agent.monitors)
			lastfail = lastmonitordata.fail
			numleft = parseInt(agent.monitors) - parseInt(lastmonitordata.completed)
			

		} else {
			numleft = parseInt(agent.monitors)
		}
		
		this.fillNeededRow(agent, tr, thisMonth, numleft, lastfail)
		
		if (!lastfail && numleft < 1) {
			return {'monitor': false, "completed": lastmonitordata.completed}
		} else {
			return {"monitor": tr, "completed": numleft}
		}
		
		
	},
	fillNeededRow: function (agent, row, thisMonth, numleft) {
		/**
		 * Fills the row for the needed monitors table on index-main
		 * @param {Object} agent - Object of agent information
		 * @param {Object} row - HTML element <tr>
		 * @param {String} thisMonth - month number
		 * @param {Integer} numLeft - Number of monitors to be completed
		 */
		let argsDate = new Date(thisMonth)
		let tmpDate = new Date(argsDate.getFullYear(), argsDate.getMonth(), argsDate.getDate(), 12)
		let claimedSpan = document.createElement('span'),
			icon = 'fa fa-check-square-o',
			claimedTd = row.querySelector('#'+agent.abbv+'-claimed')
		
		$(row).find('#'+agent.abbv+'-date').html(`${argsDate.getFullYear()}-${("0"+(date.getMonth() + 1)).slice(-2)}`)
		$(row).find('#'+agent.abbv+'-name').html(agent.name)
		$(row).find('#'+agent.abbv+'-agentid').html(agent.agentid)
		$(row).find('#'+agent.abbv+'-num-left').html(`<span id="${agent.abbv}-num-left-span">${numleft}</span> / <span id="${agent.abbv}-total-span">${agent.monitors}</span>`)
		$(claimedSpan).append(this.constants.uncheckedSquare)
		$(claimedTd).addClass('claimed').data('claimed', 'unclaimed').data('agent', agent.abbv)//.attr('title', 'Unclaimed')
				.append(claimedSpan)
				
		claimedTd.setAttribute('title', 'Unclaimed')
		claimedTd.setAttribute('data-toggle', 'tooltip')
	},
	setFlag: function (id, type, icon) {
	},
	setClaimed: function (claimedMonitors, leadsObj) {
		let count = 1
		return new Promise ((resolve, reject) => {
			if (Object.keys(claimedMonitors).length > 0){
				for (x of claimedMonitors) {
					let elem = document.querySelector('#'+x.agentabbv+'-claimed')
					if (elem) {

						elem.setAttribute('title', leadsObj[x.leadabbv].name)
						elem.setAttribute('data-original-title', leadsObj[x.leadabbv].name)
						$(elem).data('claimed', 'claimed').data('lead', leadsObj[x.leadabbv].abbv).data('_id', x._id)
						.find('span').empty().append(this.constants.checkSquare)
					}
					
					if (count == Object.keys(claimedMonitors).length) {
						return resolve()
					} else {
						count ++
					}
				}
			} else {
				return resolve()
			}
		}).catch((err) => console.log(err))
		
	},
	changeClaimed: function (agentabbv, leadfullname, leadabbv, type = null) {
		return new Promise ((resolve, reject) => {
			let elem = document.querySelector('#'+agentabbv+'-claimed')
			if (type == 'unclaimed') {
				elem.setAttribute('title', leadfullname)
				elem.setAttribute('data-original-title', leadfullname)
				$(elem).data('claimed', 'claimed').data('leadabbv', leadabbv)
					.find('span').empty().append(this.constants.checkSquare)
			} else {
				elem.setAttribute('title', 'Unclaimed')
				elem.setAttribute('data-original-title', 'Unclaimed')
				$(elem).data('claimed', 'unclaimed').data('leadabbv', leadabbv)
					.find('span').empty().append(this.constants.uncheckedSquare)
			}
			$(function () {
				$('[data-toggle="tooltip"]').tooltip()
			})
			return resolve()
		}).catch((err) => console.log(err))
		
	},
	countMonitorsNeeded: function (monitors, required) {
		/**
		 * Count monitors that are completed for the agent
		 * @param {Object} monitors - Completed monitors
		 * @param {integer} required - Number of monitors required
		 * @return {Object} {Left: monitors left, completed: count of valid monitors, fail: last monitor was failed, lastmonitor: Last monitor}
		 */
		let count = 0, autofail = false, localMonitorCount = 0, lastmonitor = {}, monitorsLeft
		
		

		for (i in monitors) {
			count ++
			if (monitors[i].fail) {
				autofail = monitors[i].fail
				count --
			}
			lastmonitor = monitors[i]
		}
		monitorsLeft = required - count
		
		return {left: monitorsLeft, completed: count, fail: autofail, lastmonitor: lastmonitor}
	},
	checkAutoFail: function (cell, fail) {
		/**
		 * Check if the monitor was a fail and highlight the row if true
		 * @param {Object} cell - HTML Element for the TR
		 * @param {booleon} fail - auto-fail TRUE/FALSE
		 */
		if (fail) {
			$(cell).toggleClass('bg-danger')
		}
		
		
	},
	buildAccordionHead: function ( agentData, monitors = null) {
		/**
		 * Build the main row for the accordion
		 * 
		 * @param {Object} agentData - Object of Agent Information
		 * @param {Object} monitors - OPTIONAL - monitors completed by the agent
		 */
		let head = ['agent', 'completed', 'mAvg', 'qAvg', 'yAvg'],
			count = 0,
			panelHead = []
		
		//create the top of the panel
		head.forEach((heading) => {
			count ++
			let td = document.createElement('td')
			td.setAttribute('id', agentData.abbv+'-'+heading)
			td.classList.add(heading)
			switch (heading){
				case 'agent':
					td.innerHTML = agentData.name
				break;
				case 'completed':
					td.innerHTML = '<span id="'+agentData.abbv+'-monitors">'+ ((monitors) ? Object.keys(monitors).length : 0) +'</span> / ' + agentData.monitors
				break;
				case 'mAvg':
					if (monitors && Object.keys(monitors).length > 0) {
						let avg = this.calcAverage(monitors)
						td.innerHTML = avg
					}
				break;
				default:
				break;
			}
			panelHead.push(td)
			
		})
		
		return panelHead
	},
	fillAccordionHead: function (agentData) {
		/**
		 * Fill in the main row of the accordion
		 * @param {Object} agentData - Object of Agent Information
		 */
		let nameTD = document.getElementById(agentData.abbv+'-agent'),
			completedTD = document.getElementById(agentData.abbv + '-completed')

		$(`#${agentData.abbv}-agent`).html(agentData.name)
		$(`#${agentData.abv}-completed`).html(`<span "id=${agentData.abbv}-completed"></span> / ${agentData.monitors}`)
	},
	calcAverage: function (monitors) {
		/**
		 * @param  {Object} monitors - All the monitors for the agent
		 */
		let mAvg, avg = 0;
		for (i in monitors) {
			avg += parseInt(monitors[i].score)
		}
		mAvg = (avg >= 0) ? (avg / Object.keys(monitors).length).toFixed() + ' %' : ''
		return mAvg
	},
	buildAccordionBody: function (rows, agentData, leadsObj, monitors = null) {
		/**
		 * Create the subtable of the accordion
		 * 
		 * @param {Array} rows - Array of TR elements
		 * @param {Object} agentData - Object of Agent Information
		 * @param {Object} leadsObj - All the leads - sent from global variable in js.js
		 * @param {Object} monitors - OPTIONAL - all monitors for the agent
		 */
		let cells = ['date', 'score', 'fail', 'lead', 'edit', 'remove'],
			count = 1
		if (monitors) {
			for (i in monitors) {
				let row = document.createElement('tr')
				cells.forEach((cellName) => {
					let td = document.createElement('td')
					td.setAttribute('id', 'monitor-'+monitors[i]._id)
					let lead = leadsObj[monitors[i].lead].name
					if (monitors[i].fail == true) {
						$(td).toggleClass('bg-danger')
					}
					switch(cellName) {
						case 'edit':
							$(td).data('_id', monitors[i]._id)
							$(td).data('score',monitors[i].score)
							$(td).data('fail', monitors[i].fail)
							$(td).data('lead', monitors[i].lead)
							$(td).data('agent', monitors[i].agent)
							$(td).data('date', monitors[i].date)
							$(td).addClass('edit-monitor')
							$(td).html('<a>'+
										this.constants.cog +
										'</a>')
						break;
						case 'remove':
							$(td).data('_id', monitors[i]._id)
							$(td).data('score',monitors[i].score)
							$(td).data('fail', monitors[i].fail)
							$(td).data('lead', monitors[i].lead)
							$(td).data('agent', monitors[i].agent)
							$(td).data('date', monitors[i].date)
							$(td).addClass('remove-monitor')
							$(td).html('<a>'+
										this.constants.Xicon +
										'</a>')
						break;
						case 'fail':
							if (monitors[i].fail == true){
								let span = document.createElement('span')
								$(span).append(this.constants.checkmark)
								td.appendChild(span)
							}
						break;
						case 'score':
							$(td).html(monitors[i].score)
						break;
						case 'lead':
							$(td).html(lead)
						break;
						case 'date':
							let resultDate = new Date(monitors[i].date),
								resultYear = resultDate.getFullYear(),
								resultMM = ("0" + (resultDate.getMonth() + 1)).slice(-2),
								resultDD = ("0" + resultDate.getDate()).slice(-2),
								resultDateString = resultYear + '-' + resultMM + '-' + resultDD
							$(td).html(resultDateString)
						break;
					}
					$(row).append(td)
					rows.push(row)
				})
				if (count == Object.keys(monitors).length) {
					return rows
				} else {
					count++
				}
			}
		} else {
			return rows
		}
	},
	buildCompletedMonthRow: function (monitor, date, agent, lead) {
		/**
		 * @param {Object} monitor - Object of the individual monitor
		 * @param {date} date - date object
		 * @param {string} agent - agent full name
		 * @param {string} lead - lead full name
		 */
		let cells = ['date', 'name', 'score', 'fail', 'lead', 'edit', 'remove'],
			row = document.createElement('tr'),
			count = 0
		
		cells.forEach(cellName => {
			let td = document.createElement('td')
			td.setAttribute('id', 'monitor-by-month-'+monitor._id)
			if (monitor.fail) {
				td.classList.add('bg-danger')
			}
			switch(cellName){
				case 'date':
					td.innerHTML = date
				break;
				case 'name':
					td.innerHTML = agent
				break;
				case 'score':
					td.innerHTML = monitor.score
				break;
				case 'fail':
					if (monitor.fail){
						let span = document.createElement('span')
						$(span).append(this.constants.checkmark)
						$(row).addClass('bg-danger')
						td.appendChild(span)
					}
				break;
				case 'lead':
					td.innerHTML = lead
				break;
				case 'edit':
					$(td).data('_id', monitor._id)
					$(td).data('score',monitor.score)
					$(td).data('fail', monitor.fail)
					$(td).data('lead', monitor.lead)
					$(td).data('agent', monitor.agent)
					$(td).data('date', monitor.date)
					$(td).addClass('edit-monitor')
					$(td).html('<a>'+
								this.constants.cog +
								'</a>')
				break;
				case 'remove':
					$(td).data('_id', monitor._id)
					$(td).data('score',monitor.score)
					$(td).data('fail', monitor.fail)
					$(td).data('lead', monitor.lead)
					$(td).data('agent', monitor.agent)
					$(td).data('date', monitor.date)
					$(td).addClass('remove-monitor')
					$(td).html('<a>'+
								this.constants.Xicon +
								'</a>')
				break;
			}

			row.appendChild(td)
			count ++
			
		})
		if (count == cells.length){
			return row
		}
	},
	buildLeadMonth: function (monitor, date, agent, lead){
		/**
		 * @param {Object} monitors - Object of the monitors completed by the lead
		 */
		let cells = ['date', 'name', 'score', 'fail', 'edit', 'remove'],
			row = document.createElement('tr'),
			count = 0
		
		cells.forEach(cellName => {
			let td = document.createElement('td')
			td.setAttribute('id', 'monitor-by-month-'+monitor._id)
			switch(cellName){
				case 'date':
					td.innerHTML = date
				break;
				case 'name':
					td.innerHTML = agent
				break;
				case 'score':
					td.innerHTML = monitor.score
				break;
				case 'fail':
					if (monitor.fail){
						let span = document.createElement('span')
						$(span).append(this.constants.checkmark)
						$(row).addClass('bg-danger')
						td.appendChild(span)
					}
				break;
				case 'lead':
					td.innerHTML = lead
				break;
				case 'edit':
					$(td).data('_id', monitors[i]._id)
					$(td).data('score',monitors[i].score)
					$(td).data('fail', monitors[i].fail)
					$(td).data('lead', monitors[i].lead)
					$(td).data('agent', monitors[i].agent)
					$(td).data('date', monitors[i].date)
					$(td).addClass('edit-monitor')
					$(td).html('<a>'+
								this.constants.cog +
								'</a>')
				break;
				case 'remove':
					$(td).data('_id', monitors[i]._id)
					$(td).data('score',monitors[i].score)
					$(td).data('fail', monitors[i].fail)
					$(td).data('lead', monitors[i].lead)
					$(td).data('agent', monitors[i].agent)
					$(td).data('date', monitors[i].date)
					$(td).addClass('remove-monitor')
					$(td).html('<a>'+
								this.constants.Xicon +
								'</a>')
				break;
			}

			row.appendChild(td)
			count ++
			
		})
		if (count == cells.length){
			return row
		}
		
	}
}

domTools.buildModal = {
	constants: {
		//Should probably do this without jQuery to preserve {this}
		$this: this
	},
	createModal: function (modal, inputElement, agentsObj = null, leadsObj = null){
		/**
		 * @param {Object} modal Object - HTML <div> Modal
		 * @param {Object} inputElement Object - The HTML element that was clicked (contains all data)
		 */
		//add-agent-modal //add-lead-modal //edit-lead-modal //remove-agent-modal 
		//remove-lead-modal //edit-monitor-modal //remove-monitor-modal
		return new Promise ((resolve, reject) => {
			return this.clearFields(modal).then ((result) => {
				if (modal.id == 'add-agent-modal' || modal.id == 'add-lead-modal'){
					return resolve()
				} else {
					if (agentsObj || leadsObj) {
						// Edit/remove monitor and Edit/remove agent use two different abbreviation structures
						let tmpAbbv = ($(inputElement).data('agent')) ? $(inputElement).data('agent') : $(inputElement).data('abbv'),
							// Get the full name based onthe abbreviation sent from inputElement
							abbv = (agentsObj[tmpAbbv]) ? agentsObj[tmpAbbv] : leadsObj[tmpAbbv]
							
						return this.fillFields(modal, inputElement, abbv.name)
					} else {
						return this.fillFields(modal, inputElement)
					}
					
				}
			}).then ((result) => {
				return resolve($(modal).modal('show'))
			})
			return resolve()
		}).catch((err) => console.log(err))
		
	},
	clearFields: function (modal, lead){
		return new Promise ((resolve, reject) => {
			$(modal).find('.modal-title > span').text('')
			$(modal).find('[name]').each(function(k,v){
				if (v.name === 'fail') {
					$(v).prop('checked', false)
				} else if (v.name === 'date'){
					v.valueAsDate = new Date()
				} else if (v.name === 'lead'){
					$(v).prop('value', 0)
				} else if (v.name === 'agent'){
					$(v).prop('value', 0)
				} else {
					$(v).val('')
				}			
			})
			return resolve()
		}).catch((err) => console.log(err))
		
	},

	fillFields: function(modal, inputData, agent = null){
		/**
		 * @param {string} modal - HTML Modal <DIV>
		 * @param {Object} inputData - used to fill the modal fields if using edit
		 */
		
		return new Promise ((resolve, reject) => {
			let inputElems = document.querySelectorAll('#' + modal.id + ' [name]')//$(modal).find('[name]'),
				count = 0
			if (agent) {
				$('.modal-title > span').text(agent)
			} else {
				
				$('.modal-title > span').text($(inputData).data('name'))
				
			}
			
			if ($(modal).hasClass('remove')){
				this.fillRemoveSpan(modal, inputData, agent)
			}
			
			for (i in inputElems){
				count ++
				if ($(inputElems[i]).attr('type') === 'checkbox' ){
					$(inputElems[i]).prop('checked', $(inputData).data(inputElems[i].name))
				} else if ($(inputElems[i]).attr('type') === 'select'){
					$(inputElems[i]).prop('value', $(inputData).data(inputElems[i].name))
				} else if (inputElems[i].name == 'date'){
					// Make sure a valid date object is being sent to the modal
					let tmpDate = new Date($(inputData).data(inputElems[i].name))
					inputElems[i].valueAsDate = tmpDate
				} else if (inputElems[i].name == 'name'){
					let tmpName = (agent) ? agent : $(inputData).data('name')
					inputElems[i].value = tmpName
				} else {
					inputElems[i].value = $(inputData).data(inputElems[i].name)
				}
				
				if (count == Object.keys(inputElems).length){
					return resolve()
				}
			}
		}).catch((err) => console.log(err))
		
	},
	fillRemoveSpan: function (modal, inputData, agent = null) {
		return new Promise ((resolve, reject) => {
			if (modal.id == 'remove-monitor-modal') {
				let tmpDate = new Date($(inputData).data('date'))
				$('.remove-date').text(`${tmpDate.getDate()}/${tmpDate.getMonth()}/${tmpDate.getFullYear()}`)
				$('.remove-name').text(agent)
			} else {
				$('.remove-name').text($(inputData).data('name'))
				let activeText = (($(inputData).data('inactive') == 1) ? 'Activate' : 'Deactivate')
				$('span.add-remove').text(activeText)
				
			}
			return resolve()
		}).catch((err) => console.log(err))
	}
}

// Form Validation
validation.formValidation = {
	init: function (type, form){
		/**
		 * @param {String} type Name of the form to be validated
		 * @param {Object} form HTML Form Element
		 */
		return new Promise ((resolve, reject) => {
			return this[type](type, form).then((result) => {
				//Return back to the eventhandler to continue with DB submit
				return resolve(result)
			}).catch((err) => {
				//handle errors by sending to the DOM
				if (Object.keys(err).length == 2){
					validation.errorHandling(err)
				} else {
					return reject (err)
				}
				
			})
			
		}).catch((err) => console.log(err))
	},
	fieldValidation: {
		/**
		 * Field Validation
		 * @param {Object} field HTML input element
		 * @returns {Boolean} True or false - also throws an error to be caught in the form function
		 * (false isn't necessary - just there for readability)
		 */
		agent: (field) => {
			if ((!field.value || field.value === "0")){
				throw {message: 'You must select an agent!', field: field}
				return false
			} else {
				return field.value
			}
		},
		date: (field) => {
			let validationDate = new Date()
			let tmpDate = new Date(field.valueAsDate)
			if ((!field.valueAsDate) || !validationDate || (tmpDate > validationDate)) {
				throw {message: 'You cannot enter a date in the future!', field: field}
				return false
			} else {
				return tmpDate
			}
		},
		score: (field) => {
			if (!field.value || field.value < 0) {
				throw {message: 'You must enter a score greater than, or equal to 0!', field: field}
				return false
			} else {
				return field.value
			}
		},
		fail: (field) => {
			if (field.checked !== true && field.checked !== false){
				throw {message: "I'm not sure how you did this one...", field: field}
				return false
			} else {
				return field.checked
			}
		},
		lead: (field) => {
			if (!field.value || field.value === "0"){
				throw {message: 'You must select a lead!', field: field}
				return false
			} else {
				return field.value
			}
		},
		_id: (field) => {
			if (!field.value){
				throw {message: 'Stay out of the dev tools!', field: field}
				return false
			} else {
				return field.value
			}
		},
		abbv: (field) => {
			if (!field.value){
				throw {message: 'You must supply an abbreviation!', field: field}
				return false
			} else {
				return field.value
			}
		},
		name: (field) => {
			if (!field.value){
				throw {message: 'You must enter a full name (Lastname, Firstname)', field: field}
				return false
			} else {
				return field.value
			}
		},
		monitors: (field) => {
			if (!field.value || field.value < 1){
				throw {message: 'You must supply a number of monitors required!', field: field}
				return false
			} else {
				return field.value
			}
		},
		agentid: (field) => {
			if (!field.value || !parseInt(field.value)){
				throw {message: 'You must supply the Agent ID', field: field}
				return false
			} else {
				return field.value
			}
		},
		inactive: (field) => {
			if (field.value > 1){
				throw {message: 'Is this supposed to be inactive?', field: field}
				return false
			} else {
				return field.value
			}
		},
		
	},
	editmonitor: function (type, form) {
		/**
		 * @param {Object} form Form values
		 */
		return new Promise ((resolve, reject) => {
			let formVals = {},
				fields = $(form).find('[name]')
			try{
				$(fields).each((k,v) => {
					let value = this.fieldValidation[v.name](v)
					formVals[`${v.name}`] = value
				})
				if (formVals.fail === true) {
					formVals.score = "0"
				}
				return resolve(formVals)
			} catch (err){
				return reject (err)
			}
		})//.catch((err) => console.log(err))
	},
	removemonitor: function (type, form) {
		/**
		 * @param {Object} form Form values
		 * @return {Object} [formVals, formFields] - {FieldName: Values, Field: FieldObject}
		 */
		return new Promise ((resolve, reject) => {
			let formVals = {},
				fields = $(form).find('[name]')
			try{
				$(fields).each((k,v) => {
					let value = this.fieldValidation[v.name](v)
					formVals[v.name] = value
				})
				return resolve(formVals)
			} catch (err){
				return reject (err)
			}
		})//.catch((err) => console.log(err))
	},


	addagent: function (type, form) {
		/**
		 * @param {Object} form Form values
		 * @return {Object} [formVals, formFields] - {FieldName: Values, Field: FieldObject}
		 */
		return new Promise ((resolve, reject) => {
			let formVals = {},
				fields = $(form).find('[name]')
			try{
				$(fields).each((k,v) => {
					
					let value = this.fieldValidation[v.name](v)
					formVals[v.name] = value
				})
				formVals.inactive = "0"
				return resolve(formVals)
			} catch (err){
				return reject (err)
			}
		})//.catch((err) => console.log(err))
	},
	editagent: function (type, form) {
		/**
		 * @param {Object} form Form values
		 * @return {Object} formVals, formFields - {FieldName: Values, Field: FieldObject}
		 */
		return new Promise ((resolve, reject) => {
			let formVals = {},
				fields = $(form).find('[name]')
				//console.log(fields)
			try{
				$(fields).each((k,v) => {
					//console.log(v.name, v)
					let value = this.fieldValidation[v.name](v)
					formVals[v.name] = value
				})
				return resolve(formVals)
			} catch (err){
				return reject (err)
			}
		})//.catch((err) => console.log(err))
	},
	removeagent: function (type, form) {
		/**
		 * @param {Object} form Form values
		 * @return {Object} [formVals, formFields] - {FieldName: Values, Field: FieldObject}
		 */
		return new Promise ((resolve, reject) => {
			let formVals = {},
				fields = $(form).find('[name]')
			try{
				$(fields).each((k,v) => {
					let value = this.fieldValidation[v.name](v)
					formVals[v.name] = value
				})
				return resolve(formVals)
			} catch (err){
				return reject (err)
			}
		})//.catch((err) => console.log(err))
	},



	addlead: function (type, form) {
		/**
		 * @param {Object} form Form values
		 * @return {Object} [formVals, formFields] - {FieldName: Values, Field: FieldObject}
		 */
		return new Promise ((resolve, reject) => {
			let formVals = {},
				fields = $(form).find('[name]')
			try{
				$(fields).each((k,v) => {
					let value = this.fieldValidation[v.name](v)
					formVals[v.name] = value
				})
				formVals.inactive = "0"
				return resolve(formVals)
			} catch (err){
				return reject (err)
			}
		})//.catch((err) => console.log(err))
	},
	editlead: function (type, form) {
		/**
		 * @param {Object} form Form values
		 * @return {Object} [formVals, formFields] - {FieldName: Values, Field: FieldObject}
		 */
		return new Promise ((resolve, reject) => {
			let formVals = {},
				fields = $(form).find('[name]')
			try{
				$(fields).each((k,v) => {
					let value = this.fieldValidation[v.name](v)
					formVals[v.name] = value
				})
				return resolve(formVals)
			} catch (err){
				return reject (err)
			}
		})//.catch((err) => console.log(err))
	},
	removelead: function (type, form) {
		/**
		 * @param {Object} form Form values
		 * @return {Object} [formVals, formFields] - {FieldName: Values, Field: FieldObject}
		 */
		return new Promise ((resolve, reject) => {
			let formVals = {},
				fields = $(form).find('[name]')
			try{
				$(fields).each((k,v) => {
					let value = this.fieldValidation[v.name](v)
					formVals[v.name] = value
				})
				return resolve(formVals)
			} catch (err){
				return reject (err)
			}
		})//.catch((err) => console.log(err))
	},
	newmonitor: function (type, form) {
		/**
		 * @param {Object} form Form values
		 * @return {Object} [formVals, formFields] - {FieldName: Values, Field: FieldObject}
		 */
		
		return new Promise ((resolve, reject) => {
			let formVals = {},
				fields = $(form).find('[name]')
			try{
				$(fields).each((k,v) => {
					let value = this.fieldValidation[v.name](v)
					formVals[v.name] = value
				})
				return resolve(formVals)
			} catch (err){
				return reject (err)
			}
		})//.catch((err) => console.log(err))
	}
}

validation.errorHandling = 
	/**
	 * Handle errors and send to the help-block field
	 * @param Object HTML input element
	 */
	 (error) => {
		if (error.field === "post") {
			alert(error.message)
		} else {
			$(error.field).addClass('is-invalid')
			var findInput = $(error.field).parents('.form-group')
			var findLabel = $(findInput).find('.helper')
			//$(findInput).addClass('is-invalid')
			$(findLabel).addClass('invalid-feedback').html(error.message)
			var timeout = setTimeout(function() {
				$(error.field).removeClass('is-invalid')
				//$(findInput).removeClass('is-invalid')
				$(findLabel).removeClass('invalid-feedback').html('')
			}, 4000);
		}
	
}












/**
 *	Global Event Listeners
 */
$(window).on('load', function () {
	// Build the Dom for the first time
	return new Promise((resolve, reject) => {
		// Initialize section navigation
		return navigation.init().then ((result) => {
			// Pull agents and leads from the databases then load them into global objects
			return BuildStaffDom.init()
		}).then((result)=>{
			// Build the Agent and Lead Maintenance pages
			return LoadStaffEdit.init()
		}).then((result) => {
			// Pull monitors from the database and load to the pages
			return LoadMonitors.init()
		}).catch((err) => console.log(err))
	}).catch((err) => console.log(err))
	
	// Turn on Bootstrap Tooltips because they look much better than default
	$(function () {
		$('[data-toggle="tooltip"]').tooltip()
	})

	// Catch errors that got missed
	window.addEventListener('unhandledrejection', function(event) {
		// the event object has two special properties:
		console.log(event.promise); // [object Promise] - the promise that generated the error
		console.log(event.reason); // Error: Whoops! - the unhandled error object
	});
})

// Close NavBar
$(window).on('click', function (e) {
	if (e.target.dataset.section != $('.navbar-collapse') && $('.navbar-collapse').hasClass('in')) {
		$('.navbar-collapse').removeClass('in')
	}
})

//Claimed button toggle
$(document).on('click', '.claimed', function (e) {
	e.preventDefault()
	$(function () {
		$('[data-toggle="tooltip"]').tooltip()
	})
	let agent = $(this).data('agent'),
		claimed = ($(this).data('claimed') === 'unclaimed') ? 'unclaimed' : 'remove'
	if ($(this).data('claimed') === 'unclaimed') {
		FormSubmitTools.setClaimed(agent, loggedOnUser, claimed)
		
		.then((result) => {
			return domTools.domMethods.changeClaimed(agent, loggedOnUserFullname, loggedOnUser, claimed)
		})
	} else {
			FormSubmitTools.removeClaimed(agent, loggedOnUser)
			.then((result) => {
			return domTools.domMethods.changeClaimed(agent, loggedOnUserFullname, loggedOnUser, claimed)
		})
	}
})

//Modals

$(document).on('click','.add-agent', function (e) {
	e.preventDefault()
	FormSubmitTools.initModal('addAgent', $(this))
})
$(document).on('click', '.edit-agent', function (e){
	e.preventDefault()
	FormSubmitTools.initModal('editAgent', $(this))
})
$(document).on('click', '.remove-agent', function (e) {
	e.preventDefault()
	FormSubmitTools.initModal('removeAgent', $(this))
})
$(document).on('click', '.add-lead', function (e) {
	e.preventDefault()
	FormSubmitTools.initModal('addLead', $(this))
})
$(document).on('click', '.edit-lead', function (e) {
	e.preventDefault()
	FormSubmitTools.initModal('editLead', $(this))
})
$(document).on('click', '.remove-lead', function (e) {
	e.preventDefault()
	FormSubmitTools.initModal('removeLead', $(this))
})
$(document).on('click', '.edit-monitor', function (e) {
	e.preventDefault()
	FormSubmitTools.initModal('editMonitor', $(this))
})
$(document).on('click', '.remove-monitor', function (e) {
	e.preventDefault()
	FormSubmitTools.initModal('removeMonitor', $(this))
})
$(document).on('change', '#select-lead-search', function (e) {
	e.preventDefault()
	var lead = $(this).val(),
		month = $('#input-date-search').val().replace(/-/g, '\/'),
		tmpDate = new Date(month),
		clearTbody = document.getElementsByClassName('all-monitors-tbody'),
		monthName = months[("0" + (tmpDate.getMonth() + 1)).slice(-2)]
	
	clearTbody.innerHTML = '';
	LoadMonitors.completedByLead(lead, month)
	LoadMonitors.completedPerAgentSearch(tmpDate)
	document.getElementById('monitors-search-date-2').valueAsDate = tmpDate
	document.getElementById('input-date-search').valueAsDate - tmpDate
	document.getElementById('all-monitors-date-2').innerHTML = monthName
	
})
$(document).on('change', '#input-date-search', function (e) {
	e.preventDefault()
	let month = $(this).val().replace(/-/g, '\/'),
		lead = $('#select-lead-search').val(),
		tmpDate = new Date(month),
		clearTbody = document.getElementsByClassName('all-monitors-tbody'),
		monthName = months[("0" + (tmpDate.getMonth() + 1)).slice(-2)]

	clearTbody.innerHTML = '';
	LoadMonitors.completedByLead(lead, month)
	LoadMonitors.completedPerAgentSearch(tmpDate)
	document.getElementById('monitors-search-date').valueAsDate = tmpDate
	document.getElementById('monitors-search-date-2').valueAsDate = tmpDate
	document.getElementById('all-monitors-date-2').innerHTML = monthName
})
$(document).on('change', '#monitors-search-date', function (e) {
	e.preventDefault()
	let month = $(this).val().replace(/-/g, '\/'),
		tmpDate = new Date(month),
		clearTbody = document.getElementsByClassName('all-monitors-tbody'),
		monthName = months[("0" + (tmpDate.getMonth() + 1)).slice(-2)]
		
	clearTbody.innerHTML = '';
	LoadMonitors.completedByLead(null, month)
	LoadMonitors.completedPerAgentSearch(tmpDate)
	document.getElementById('monitors-search-date-2').valueAsDate = tmpDate
	document.getElementById('input-date-search').valueAsDate = tmpDate
	document.getElementById('all-monitors-date-2').innerHTML = monthName
})
$(document).on('change', '#monitors-search-date-2', function (e) {
	e.preventDefault()
	let month = $(this).val().replace(/-/g, '\/'),
		tmpDate = new Date(month),
		clearTbody = document.getElementsByClassName('all-monitors-tbody'),
		monthName = months[("0" + (tmpDate.getMonth() + 1)).slice(-2)]
		
	clearTbody.innerHTML = '';
	LoadMonitors.completedByLead(null, month)
	LoadMonitors.completedPerAgentSearch(tmpDate)
	document.getElementById('monitors-search-date').valueAsDate = tmpDate
	document.getElementById('input-date-search').valueAsDate = tmpDate
	document.getElementById('all-monitors-date-2').innerHTML = monthName
})

// Form Submit (modal and main form)
$(document).on('submit', '#form-monitors', function (e){
	e.preventDefault()
	let form = $(this),
		agent = $(form).find('#select-agent').val(),
		claimedField = $('#'+agent+'-claimed')
	if ($(claimedField).data('claimed') === 'claimed'){
		FormSubmitTools.removeClaimed(agent)
	}
	FormSubmitTools.submit(form)
	return true
})
$('form').on('submit', (e) => {
	e.preventDefault()
})
$(document).on('click', '.modal-submit', function (e){
	e.preventDefault()
	let form = $(this).parent().parent().find('form')
	
	FormSubmitTools.modalSubmit(form)
})

// Move focus
$(document).on('shown.bs.modal', '.modal', function () {
	$('.modal').focus()
})

