// declare constants for node tools
// electron = require('electron')
const {app} = require('electron').remote, // electron.app,
	{ipcRenderer} = require('electron'),
	fs = require('fs'),
	path = require('path'),
	nedb = require('nedb'),
	date = new Date(),
	validation = require('callmonitorhelpers/cmvalidationhelpers'),
	domTools = require('callmonitorhelpers/cmdomhelpers'),
	dbhelper = require('callmonitorhelpers/cmdbhelpers'),
	loggedOnUser = process.env['USERPROFILE'].split(path.sep)[2],
	xDrive = 'X:/helpdesk/Tech Leads/Call Monitors/monitor-database';
	
// variables for date and database creation/selection
var today = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12),
	year = date.getFullYear(),
	mm = ("0" + (date.getMonth() + 1)).slice(-2),
	dd = ("0" + (date.getDate())).slice(-2),
	thisMonth = year + '-' + mm,
	startOfMonth = new Date(year, date.getMonth(), 1),
	endOfMonth = new Date(year, date.getMonth() + 1, 1),
	startOfLastMonth = new Date(year, date.getMonth() - 1, 1),
	lastMonth = year + '-' + (("0" + (date.getMonth())).slice(-2)),
	dbname = 'monitors-' + year + '.db',
	db = {},
	loggedOnUserFullname,
	globalCount = 0;
//fullDateWithSlashes = year + '/' + mm + '/'+dd,
//fullDateWithDashes =  year + '-' + mm + '-'+dd;
// check for dev
let prodPath = xDrive, // Production Database
	devPath = path.resolve(__dirname, '../../db/') //Dev Database

//set the database location
let datastorePath = (!process.env.TODO_DEV) ? path.resolve(xDrive) : path.resolve(devPath)

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



/*function(){
	(async function (){
	  await Promise.resolve();
	  var a1 = await new Promise(function(resolve) { setTimeout(resolve,800,"foo"); });
	  var a2 = await new Promise(function(resolve) { setTimeout(resolve,800,"bar"); });
	  if (a1 + a2 === "foobar") {
		asyncTestPassed();
	  }
	}());
}*/

// main form inputs
var agentSelect = 'select-agent',
	dateInput = 'input-date',
	failCheck = 'check-fail',
	leadSelect = 'select-lead',
	scoreInput = 'score-agents',
	dateField = 'input-date',
	// month tools
	months = {
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
	// objects to store query data
	leadsObj = {},
	activeLeadsObj = {},
	agentsObj = {},
	activeAgentsObj = {},
	thisMonthMonitorsObj = {},
	lastMonthMonitorsObj = {},
	// arrays for looping
	agentsArray = [],
	leadsArray = [],
	thisMonthMonitorsArray = [],
	quarterlyMonitorsArray = [],
	// interval for persistence
	dbInterval = 60000,
	// quarter calculation tools
	q1 = ["0", "1", "2"],
	q2 = ["3", "4", "5"],
	q3 = ["6", "7", "8"],
	q4 = ["9", "10", "11"],
	qstart = {},
	qend = {},
	qm = new Date()

if ($.inArray(qm.getMonth().toString(), q1)) {
	qstart = new Date(year, 0, 1)
	qend = new Date(year, 2, 31)
} else if ($.inArray(qm.getMonth().toString(), q2)) {
	qstart = new Date(year, 3, 1)
	qend = new Date(year, 5, 30)
} else if ($.inArray(qm.getMonth().toString(), q3)) {
	qstart = new Date(year, 6, 1)
	qend = new Date(year, 8, 31)
} else {
	qstart = new Date(year, 9, 1)
	qend = new Date(year, 11, 31)
}
/*
 * DB persistence tools - unused, but saved here just in case
 */
//db.persistence.setAutocompactionInterval(dbInterval)
//leadsDb.persistence.setAutocompactionInterval(dbInterval)
//agentsDb.persistence.setAutocompactionInterval(dbInterval)

/**
 * Date Tools
 */
function setDate() {
	// Sets the date index-main.html, allmonitors.html, and leadsmonitors.html
	// today = new Date(date.getFullYear(), date.getMonth(), date.getDate())
	let inputdate = document.getElementById(dateField),
		monitorsH2 = document.getElementById('monitorsH2'),
		leadsSearchDate = document.getElementById('input-date-search'),
		monitorsByAgentDate = document.getElementById('monitors-search-date')

	
	inputdate.valueAsDate = today;
	
	leadsSearchDate.valueAsDate = startOfMonth;
	monitorsH2.innerHTML = 'Monitors for ' + monthName;
	
	monitorsByAgentDate.valueAsDate = startOfMonth;

}
var ReloadInit = {
	init: function () {
		return new Promise ((resolve, reject) => {
			//console.log(result)
			let returnval =  BuildStaffDom.init()
			console.log(returnval)
			return resolve(returnval)
		}).then((result) => {
			console.log(178, result)
			return LoadStaffEdit.init()
		}).then((result) => {
			console.log(181, result)
			return LoadMonitors.init()
		}).catch(err => console.log(err))
	}
}


/**
 * DB Tools
 */

var DBSubmitTools = {
	test: function(vals, fields){
		console.log('in DBSubmitTools')
	},
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
				//if (formName === 'newmonitor') {
				//	location.reload()
				//}
				let returnval = this.clearfields(formValues)
				console.log(returnval)
				return returnval
			}).then((result) => {
				console.log(result)
				return ReloadInit.init()
			})
		}).catch((err) => console.log(err))
	},
	submitStep2: function () {
		return ReloadInit.init()
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
			/*for (i of dbFields) {
				console.log(i, dbFields)
				postObject[i] = values[i.charAt(0)]
			}*/
			//console.log(values)
			let test = this.post('monitors', values)
			console.log(test)
			if(test) {
				return resolve(values)
			} else {
				return reject(values)
			}
			
		})/*.then((returnVal) => {
			//go to loading init()
			console.log(returnVal)
			return resolve(returnVal)
		})*/.catch((err) => console.log(err))
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
					return resolve()
				} else {
					return reject(err)
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
		 * @param {Object} form Form Object - The form from the Add Agent or Add Lead modal
		 * TYPE=LEAD form fields: abbv, name, inactive, _id
		 * TYPE=AGENT form fields: abbv (lastname with first initial), name (last, first), monitors, agentid
		 */
		return new Promise ((resolve, reject) => {
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
		 * @param {Object} form Form Object - The form submitted from the edit modal
		 * Must have the data attributes on the element that opens the form
		 * TYPE=LEAD form fields: abbv, name, inactive, _id
		 * TYPE=AGENT form fields: abbv (lastname with first initial), name (last, first), monitors, agentid
		 */
		return new Promise ((resolve, reject) => {
			let row = {'_id': values._id}, query = values
			//console.log(row, query)
			
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
		 * @param {Object} form Form Object - The form submitted from the remove confirmation modal
		 * Must have the _id from the data attribute on the element that opens the form
		 */
		return new Promise ((resolve, reject) => {
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
		 * @param {Object} form Form Object - The form from the Add Agent or Add Lead modal
		 * TYPE=LEAD form fields: abbv, name, inactive, _id
		 * TYPE=AGENT form fields: abbv (lastname with first initial), name (last, first), monitors, agentid
		 */
		return new Promise ((resolve, reject) => {
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
		 * @param {Object} form Form Object - The form submitted from the edit modal
		 * Must have the data attributes on the element that opens the form
		 * TYPE=LEAD form fields: abbv, name, inactive, _id
		 * TYPE=AGENT form fields: abbv (lastname with first initial), name (last, first), monitors, agentid
		 */
		return new Promise ((resolve, reject) => {
			let row = {'_id': values._id}, query = values
			console.log(row, query)
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
		 * @param {Object} form Form Object - The form submitted from the remove confirmation modal
		 * Must have the _id from the data attribute on the element that opens the form
		 */
		return new Promise ((resolve, reject) => {
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
		console.log('in post', dbname)

		return new Promise ((resolve, reject) => {
			return db[dbname].insert(query, function (err, newDoc) {
				
				if (err) {
					throw new Error(err)
					return reject(err) 
				} else {
					console.log(newDoc)
					return resolve(newDoc)
				}
			})/*.then ((result) => {
				return resolve(result)
			})*/
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
					console.log(err)
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
		})
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

			
		})
	}
}

var BuildStaffDom = {
	//uses DBSubmitTools
	init: function(){
		//var first = this.importAgents()
		//var order = [this.importAgents(), this.agentSelect(), this.importLeads()]
		return new Promise ((resolve, reject) => {
			return this.importAgents().then((result) => {
				return this.agentsToObj(result)
			}).then((result) => {
				return this.importLeads()
			}).then((result) => {
				return this.leadsToObj(result)
			}).then((result) => {
				return this.agentSelect()
			}).then((result) => {
				return this.leadSelect()
			}).then((result) => {
				console.log(result)
				return resolve(true)
			})
		}).catch((err) => console.log(err))
		
		
	},
	importAgents: function (DBquery = null) {
		let query = {abbv: {'$regex': /^[a-zA-Z]/}},
			sort = {abbv: 1},
			activeResult = {}
		return new Promise (function (resolve, reject) {
			return db.agentsDb.find(query).sort(sort).exec(function(err, result){
				if (err) {
					return reject(err)
				} else {
					return resolve(result)
				}	
			})
		}).catch((err) => console.log(err))
	},
	agentsToObj: function (result) {
		return new Promise (function (resolve, reject){
			let count = 1
			for (var i in result){
				if (result[i].inactive != 1) {
					activeAgentsObj[result[i].abbv] = result[i]
				}
				agentsObj[result[i].abbv] = result[i]
				
				if (count == Object.keys(result).length) {
					return resolve(result)
				} else {
					count++
				}
			}
			
		}).catch((err) => console.log(err))
	},
	importLeads: function () {
		let query = {abbv: {'$regex': /^[a-zA-Z]/}},
			sort = {abbv: 1}

		return new Promise (function(resolve, reject){
			return db.leadsDb.find(query).sort(sort).exec(function(err, result){
				if (err) {
					return reject(err)
				} else {
					return resolve(result)
				}
			})
		}).catch((err) => console.log(err))
	},
	leadsToObj: function (result) {
		return new Promise (function (resolve, reject){
			let count = 1
			for (var i in result) {
				if (result[i].inactive == 0) {
					activeLeadsObj[result[i].abbv] = result[i]
				}
				if (result[i].abbv == loggedOnUser) {
					loggedOnUserFullname = result[i].name
				}
				leadsObj[result[i].abbv] = result[i]
				if (count == Object.keys(result).length) {
					return resolve(activeLeadsObj)
				} else {
					count ++
				}
			}
		})
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
	},
	allAgents: function () {
		
	},
	activeAgents: function() {

	},
	allLeads: function() {

	},
	activeLeads: function() {

	}
}
var LoadMonitors = {
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
				return this.pullCompleted()
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
			})/*.then ((result) => {
					return this.eventListeners()
			})/*.then ((result) => {
				return this.alternateRefresh()
			})*/.then ((result) => {
				return resolve(result)
			}).catch(err => {console.log(err)})
		}).catch(err => {console.log(err)})
	},
	pullNeeded: function () {
		/**
		 * Pulls the monitors for this month
		 */

		let agent = "",
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

		let queryTwoMonths = {'$and': [{date: { '$gte': startOfLastMonth }}, {date: { '$lte': endOfMonth }}]},
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
				let built = domTools.domMethods.buildNeeded(container, result, activeAgentsObj)
				if (built) {
					return resolve()
				}
			} else {
				return resolve()
			}
			
		}).catch((err) => console.log(err))
		
			
	},
	pullClaimed: function () {
		/**
		 * Pulls all the currently claimed monitors from the claimed database
		 */
		let query = {'$and': [ {date: { '$gte': startOfMonth }},{date: { '$lte': endOfMonth }} ]}
	
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

		let start = startOfMonth, end = endOfMonth, tmpDate
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
			if ($.inArray(tmpMonth.getMonth().toString(), q1)) {
				quarterstart = new Date(year, 0, 1)
				quarterend = new Date(year, 2, 31)
			} else if ($.inArray(tmpMonth.getMonth().toString(), q2)) {
				quarterstart = new Date(year, 3, 1)
				quarterend = new Date(year, 5, 30)
			} else if ($.inArray(tmpMonth.getMonth().toString(), q3)) {
				quarterstart = new Date(year, 6, 1)
				quarterend = new Date(year, 8, 31)
			} else {
				quarterstart = new Date(year, 9, 1)
				quarterend = new Date(year, 11, 31)
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
					
					document.getElementById(abbv+'-qAvg').innerHTML = qAvg
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
					document.getElementById(abbv+'-yAvg').innerHTML = yAvg

					let averages = ['yAvg', 'qAvg', 'mAvg']
					averages.forEach( i => {
						let avg = document.getElementById(abbv + '-' + i).innerText.slice(0,-2)
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
		})
		
	},
	buildCompleted: function(result) {
		/**
		 * @param {Object} result Result of DB query for the specified month
		 */
		
		let accordionContainer = document.getElementById('agent-accordion-tbody'),
			count = 1,
			head = [], cells = [] // Declared outisde of the IF to maintain scope
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
					headArr = ['Date', 'Score', 'Auto-Fail', 'Lead', 'Edit', 'Remove'],
					subTbody = document.createElement('tbody')
				
				// Create the subtable's TH elements
				headArr.forEach(function (heading){
					let th = document.createElement('th')
					$(th).html(heading)
					subThead.appendChild(th)
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
				
				if (Object.keys(result).length > 0){
					let monitors = result.filter(x => x.agent === i)
					//Create the content of the agent row (head)
					head = domTools.domMethods.buildAccordionHead(agentsObj[i], monitors)
					// Create the content of the sub table
					row = domTools.domMethods.buildAccordionBody(row, agentsObj[i], leadsObj, monitors)
				} else {
					head = domTools.domMethods.buildAccordionHead(agentsObj[i])
					row = domTools.domMethods.buildAccordionBody(row, agentsObj[i], leadsObj)
				}

				// Append the row to the container in order
				$(agentRow).append(head)
				$(row).attr('id', '')
				$(subTbody).append(row)
				$(subTable).append(subThead, subTbody)
				$(well).append(subTable)
				$(wellTD).append(well)
				$(wellTR).append(wellTD)
				$(accordionContainer).append(agentRow)
				$(accordionContainer).append(wellTR)
				
				
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
			elements = {}
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

		let leadName = loggedOnUser, sort = {'date': 1}
			start = startOfMonth, end = endOfMonth
		if (lead) {
			leadName = lead
		}

		if (month) {
			tmpStart = new Date(month)
			start = new Date(tmpStart.getFullYear(), tmpStart.getMonth(), 1)
			end = new Date(tmpStart.getFullYear(), tmpStart.getMonth() + 1, 1)
			//console.log(month, tmpStart, start, end)
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
				let result2 = this.buildCompleted(result)
				return result2
			}).then ((result) => {
				let result2 = this.pullQuarter()
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
				let lastMonth = new Date(tmpMonth.getFullYear(), tmpMonth.getMonth()-1, 1)
				let result2 = this.pullCompleted(lastMonth)
				return result2
			}).then ((result) => {
				let result2 = this.buildCompletedThisMonth(result)
				return result2
			})
		}).catch((err) => console.log(err))
	},
	completedByLead: function (lead, month) {
		/**
		 * Rebuilds the Monitors By Lead table when the agent or date is changed.
		 * @param {String} lead - REQUIRED - Name of the lead to use in the query
		 * @param {String} month - REQUIRED - Date from the HTML Date <input>
		 */
		 
		return new Promise((resolve, reject) => {
			return this.pullLeadMonitors(lead, month).then((result) => {
				return this.leadMonitors(result)
			}).then((result) => {
				return resolve()
			})
		}).catch((err) => console.log(err))
	}/*,
	/*eventListeners: function() {
		/**
		 * All the event listners - Has to be here because the DOM is created after load
		 * @return Promise RESOLVE() when all listeners are created
		 */
		/*console.log('event listeners')
		return new Promise ((resolve, reject) => {
				
				return resolve('Event Listeners Created')
			
		}).catch((err) => console.log(err))*/
	/*}/*,
	runOnce: function (count){
		if (count % 2 > 0){
			return true
		}
	}*/
}

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
				//if (modal.id == 'edit-monitor-modal' || modal.id == 'remove-monitor-modal') {
					return domTools.buildModal.createModal(modal, args, agentsObj)
			/*	} else {
					return domTools.buildModal.createModal(modal, args)
				}
			*/	
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
			let test =  this[setRemove](agent, lead)
			console.log(test)
			return resolve(test)
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
			return validation.formValidation.init(formname, form).then((result) => {
				return DBSubmitTools.init(formname, result)
			}).then ((result) => {
				return resolve(document.getElementById(form))
			})
		}).catch((err) => console.log(err))
	},
	submit: function (form) {
		//return new Promise ((resolve, reject) => {
			let formname = $(form).attr('name')
			
			console.log('holy crap it worked', form, formname)
			// Validate the form fields, then make them into a useable object for the submit.
			 validation.formValidation.init(formname, form).then ((result) => {
				if (result.fail === true) {
					result.score = "0"
				}
				console.log('in .then()')
				return DBSubmitTools.newmonitor(formname, result)//.then ((result) => {return resolve()})
			}).then ((result) => {
				return	DBSubmitTools.clearfields(result)
				 //	ReloadInit.init()
			})
			.then ((result) => {
				return ReloadInit.init()
			})
			
			
		//}).catch((err) => console.log(err))
	}

}





































/**
 *	Global Event Listeners
 */
$(window).on('load', function () {
	setDate()
	//DBSubmitTools.post('claimedDb', {"date": new Date(), "agentabbv":"bourayx", "leadabbv":"cleggt"}, {agent: 1})
	//DBSubmitTools.post('monitors', {"date": new Date(), "agent":"bourayx", "lead":"cleggt", score:"91.11", "fail": true}, {agent: 1})
	// Build the Dom for the first time

	/*const firstLoad = async () => {
		let query = {'$and': [ {date: { '$gte': startOfMonth }},{date: { '$lte': endOfMonth }} ]},
			sort = {'agent': 1, 'date': 1}
		let monitors = await pull('monitors', query, sort)
		let loaded = await load(monitors)

//		throw new Error('oops')
	}
	
	firstLoad().catch(err => {console.log(err)})
*/

	
	return new Promise((resolve, reject) => {
		return BuildStaffDom.init().then((result)=>{
			//return LoadMonitors.init()
			return LoadStaffEdit.init()
		}).then((result) => {
			//return LoadStaffEdit.init()
			return LoadMonitors.init()
		}).catch((err) => console.log(err))
	}).catch((err) => console.log(err))
	
	/*
	Promise.all([getAgents, getLeads]).then(results => {
		console.log('done')
		BuildDom.needed()
		BuildDom.agentSelect()
		BuildDom.leadSelect()
	})
*/
	//importLeads()
	// to resolve the crazy timing issue with the agent and lead agentLeadObject
	// importAgents is called within importLeads()
	// pullThisMonth is called within the importAgents() function
	// Edit/Add buttons for managing leads can be found in the event listeners function

	/*$('#form-monitors').submit(function (e) {
		// Gets the values of the form and sends two objects to 
		// validation.formValidation.newMonitor(), inputVals and inputElems
		// converts array of elements into an object to be used in error handling
		e.preventDefault();
		var inputElems = document.querySelectorAll('#form-monitors [name]')//$(this).find('[name]'),
			inputVals = {},
			fields = {}

		for (i of inputElems){
			if (i.type == "date") {
				inputVals[i.name.charAt(0)] = new Date(i.value.replace(/-/g, '\/'))
			} else if (i.type == "checkbox") {
				inputVals[i.name.charAt(0)] = i.checked
			} else {//everything else
				inputVals[i.name.charAt(0)] = i.value
			}
			fields[i.name.charAt(0)] = i
		}
		var validate = validation.formValidation.newMonitor(inputVals, fields);
		if (validate) {
			DBSubmitTools.newMonitor('monitors', inputVals)
		}
	})
	*/
/*
	$('.modal-submit').click(function (e) {
		//delete modalArgs;
		let parentModal = $(this).parent().parent().parent().parent(),
			type = $(parentModal).attr('id'),
			form = $(type+'-form'),
			fields = $(this).parents('.modal-content').find('[name]'),
			modalArgs = {'type': type},
			errorFieldName = type.toString() + '-success';
		console.log(form)
		$(fields).each(function (k, v) {
			modalArgs[$(v).attr('id')] = $(v).val();
		})
		
		if (type == 'edit-monitor-modal') {
			let tmpArgs = {
				'type': type
			}
			let aField = document.getElementById('edit-monitor-modal-select-agent'),
				lField = document.getElementById('edit-monitor-modal-select-lead'),
				fField = document.getElementById('edit-monitor-modal-check-fail'),
				dField = document.getElementById('edit-monitor-modal-input-date'),
				sField = document.getElementById('edit-monitor-modal-score'),
				iField = document.getElementById('edit-monitor-modal-id'),
				eField = document.getElementById(errorFieldName);

			let a = aField.value,
				l = lField.value,
				f = fField.checked,
				d = new Date(dField.value.replace(/-/g, '\/')),
				s = sField.value,
				i = iField.value;

			let fields = {
				'a': aField,
				'l': lField,
				'f': fField,
				'd': dField,
				's': sField,
				'i': iField
			}
			validateEditModal(d, a, f, l, s, i, fields, eField)
		} else {
			validateModal(type, modalArgs, eField = document.getElementById(errorFieldName));
		}
	})
*/
	
	/*
	$('#select-lead-search').on('change', function () {
		var lead = $(this).val(),
			month = $('#input-date-search').val();
		pullLeadMonth(lead, month);
	})
	$('#monitors-search-date').change(function () {

		let month = $(this).val().replace(/-/g, '\/'),
			tmpDate = new Date(month),
			clearTbody = document.getElementById('agent-accordion-tbody')

		clearTbody.innerHTML = '';
		completedPerAgent(tmpDate)

	})*/

	$(window).on('click', function (e) {
		
		if (e.target.dataset.section != $('.navbar-collapse') && $('.navbar-collapse').hasClass('in')) {
			$('.navbar-collapse').removeClass('in')
		}
	})
	$('.app-version').html(`v${app.getVersion()}`)
	$(function () {
		$('[data-toggle="tooltip"]').tooltip()
	})
	window.addEventListener('unhandledrejection', function(event) {
		// the event object has two special properties:
		console.log(event.promise); // [object Promise] - the promise that generated the error
		console.log(event.reason); // Error: Whoops! - the unhandled error object
	});
	
	
})


$(document).on('click', '.claimed', function (e) {
	e.preventDefault()
	console.log('claimed clicked at 1690')
	$(function () {
		console.log('fire 1320')
		$('[data-toggle="tooltip"]').tooltip('fixTitle')
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
$(document).on('click','.add-agent', function (e) {
	//$(this).off('click')
	FormSubmitTools.initModal('addAgent', $(this))
})
$(document).on('click', '.edit-agent', function (e){
//	$(this).off('click')
	FormSubmitTools.initModal('editAgent', $(this))
})
$(document).on('click', '.remove-agent', function (e) {
//	$(this).off('click')
	FormSubmitTools.initModal('removeAgent', $(this))
})
$(document).on('click', '.add-lead', function (e) {
//	$(this).off('click')
	FormSubmitTools.initModal('addLead', $(this))
})
$(document).on('click', '.edit-lead', function (e) {
//	$(this).off('click')
	FormSubmitTools.initModal('editLead', $(this))
})
$(document).on('click', '.remove-lead', function (e) {
//	$(this).off('click')
	FormSubmitTools.initModal('removeLead', $(this))
})
$(document).on('click', '.edit-monitor', function (e) {
//	$(this).off('click')
	e.preventDefault()
	FormSubmitTools.initModal('editMonitor', $(this))
})
$(document).on('click', '.remove-monitor', function (e) {
//	$(this).off('click')
	FormSubmitTools.initModal('removeMonitor', $(this))
})

$(document).on('change', '#select-lead-search', function () {
//	$(this).off('change')
	var lead = $(this).val(),
		month = $('#input-date-search').val().replace(/-/g, '\/');
	LoadMonitors.completedByLead(lead, month)
})
$(document).on('change', '#input-date-search', function () {
//	$(this).off('change')
	let month = $(this).val().replace(/-/g, '\/')
		lead = $('#select-lead-search').val()
	LoadMonitors.completedByLead(lead, month)
})
$(document).on('change', '#monitors-search-date', function () {
	//$(this).off('change')
	let month = $(this).val().replace(/-/g, '\/'),
		tmpDate = new Date(month),
		clearTbody = document.getElementById('agent-accordion-tbody')
	clearTbody.innerHTML = '';
	LoadMonitors.completedPerAgentSearch(tmpDate)
	

})

$(document).on('submit', '#form-monitors', function (e){
	e.preventDefault()
	//$(this).off('submit')
		console.log('here')
		let form = $(this),
			agent = $(form).find('#select-agent').val(),
			claimedField = $('#'+agent+'-claimed')
		if ($(claimedField).data('claimed') === 'claimed'){
			FormSubmitTools.removeClaimed(agent)
		}
		FormSubmitTools.submit(form)
		return true
	
	console.log(x)
	

})
$(document).on('click', '.modal-submit', function (e){
	$(this).off('click')
	let form = $(this).parent().parent().find('form')
	FormSubmitTools.modalSubmit(form)
})
$(document).on('shown.bs.modal', '.modal', function () {
	$('.modal').focus()
})
