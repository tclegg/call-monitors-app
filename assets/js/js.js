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
	loggedOnUser = process.env['USERPROFILE'].split(path.sep)[2];
// variables for date and database creation/selection
var today = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12),
	year = date.getFullYear(),
	mm = ("0" + (date.getMonth() + 1)).slice(-2),
	dd = ("0" + (date.getDate())).slice(-2),
	thisMonth = year + '-' + mm,
	startOfMonth = new Date(year, date.getMonth(), 1),
	endOfMonth = new Date(year, date.getMonth() + 1, 0),
	startOfLastMOnth = new Date(year, date.getMonth() - 1, 1),
	lastMonth = year + '-' + (("0" + (date.getMonth())).slice(-2)),
	dbname = 'monitors-' + year + '.db',
	db = {},
	loggedOnUserFullname;
//fullDateWithSlashes = year + '/' + mm + '/'+dd,
//fullDateWithDashes =  year + '-' + mm + '-'+dd;
// check for dev
try {
	if (!process.env.TODO_DEV) {
		//////////////////////////
		// Production Datasbase //
		//////////////////////////

		const xDrive = 'X:/helpdesk/Tech Leads/Call Monitors/monitor-database'
		db.monitors = new nedb({
				filename: path.resolve(xDrive, dbname),
				autoload: true
			}),
		db.leadsDb = new nedb({
				filename: path.resolve(xDrive, 'leads.db'),
				autoload: true
			}),
		db.agentsDb = new nedb({
				filename: path.resolve(xDrive, 'agents.db'),
				autoload: true
			}),
		db.claimedDb = new nedb({
				filename: path.resolve(xDrive, 'claimed.db'),
				autoload: true
			})
		if (!db.monitors || !db.leadsDb || !db.agentsDb) {
			throw ('Database connection error')
		}
	} else {
		//////////////////////////
		// Development Database //
		//////////////////////////

		db.monitors = new nedb({
				filename: path.resolve(__dirname, '../../db/', dbname),
				autoload: true
			}),
		db.leadsDb = new nedb({
				filename: path.resolve(__dirname, '../../db/', 'leads.db'),
				autoload: true
			}),
		db.agentsDb = new nedb({
				filename: path.resolve(__dirname, '../../db/', 'agents.db'),
				autoload: true
			}),
		db.claimedDb = new nedb({
				filename: path.resolve(__dirname, '../../db/', 'claimed.db'),
				autoload: true
			})
		if (!db.monitors || !db.leadsDb || !db.agentsDb || !db.claimedDb) {
			throw ('Database connection error')
		}
	}
} catch (e) {
	//location.reload()
	alert(`An Error Has Occurred\nPlease reload the page\n\n${e}`)
}
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

/**
 * DB Tools
 */

var DBSubmitTools = {
	test: function(vals, fields){
		console.log('in DBSubmitTools')
	},
	init: function(id, form){
		switch(id){
			// main form
			case "new-monitor":
				this.newMonitor(form)
			break;
			// edit monitor
			case "edit-monitor":
				this.editMonitor(form)
			break;
			// add agent/lead
			case "add-staff":
				this.addStaff(form)
			break;
			// edit agent/lead
			case "edit-staff":
				this.editStaff(form)
			break;
			// remove agent/lead
			case "remove-staff":
				this.removeStaff(form)
			break;
			
			default:
				return "you must supply a form name"
			break;
		}
	},
	newMonitor: function (dbname, values){
		/**
		 * form fields: agent, date, score, fail, lead
		 */
		let dbFields = ["agent", "date", "score", "fail", "lead"],
			postObject = {}
		console.log(values)
		
		try {
			for (i of dbFields) {
				console.log(i, dbFields)
				postObject[i] = values[i.charAt(0)]
			}
			console.log(dbFields, values, postObject)
			var posted = this.post(dbname, postObject).then(function(returnVal){
				console.log("test = ", returnVal)
			}).then(
				this.pull(dbname, {'_id': {'$regex': /^[a-zA-Zd]/}}, {'date': 1}).then(
					function(result){
						console.log(result)
					})
				)
			if (!posted) {
				throw {message: err, field: 'post'}
			}
		} catch (err) {
			validate.errorHandling(err)
		}
		
		
		
		
		/*
		 let formElements = $(form).find('[name]'),
			inputVals = {}
		for (i of formElements){
			//should create the values to send to the validation.formValidation.init()
			inputVals[i.name.charAt(0)] = i.value
		}
		
		let query = ''
		let dbname = 'agent'
		try{
			let postArr = {
				"agent": inputVals['agent-name'],
				"machine": inputVals['agent-machine'],
				"mon1": inputVals['agent-monitor-1'],
				"mon2": inputVals['agent-monitor-2']
			}
			
			var posted = DbFunc.post(dbname, postArr).then(function(returnVal){
				console.log('test = ',returnVal)
			}).then(
				DbFunc.pull(dbname, {'_id': {'$regex': /^[a-zA-Zd]/}}, {'date': 1}).then(
					function(result){
						helpers.buildDomMethods.buildTable(document.getElementById('agent-machines-tbody'), result)
					})
			)
			if (!posted) {
				throw err = posted
			}
			
		} catch (err) {
	
		}
		*/
	},
	editMonitor: function (form){
		/*
		let formElements = $(form).find('[name]'),
			inputVals = {}
		for (i of formElements){
			inputVals[i.name] = i.value
		}
		
		let query = ''
		let dbname = 'lab'
		try{
			let postArr = {
				"name": inputVals['lab-machine-name'],
				"machine": inputVals['lab-machine'],
				"mon1": inputVals['lab-monitor-1'],
				"mon2": inputVals['lab-monitor-2']
				
			}
			var posted = DbFunc.post(dbname, postArr).then(function(returnVal){
			}).then(
				DbFunc.pull(dbname, {'_id': {'$regex': /^[a-zA-Zd]/}}, {'date': 1}).then(
					function(result){
						helpers.buildDomMethods.buildTable(document.getElementById('lab-machines-tbody'), result)
					})
			)
			if (!posted) {
				throw err = posted
			}
			
		} catch (err) {
	
		}
		*/
	},
	addStaff: function (form){
		/*
		let formElements = $(form).find('[name]'),
			inputVals = {}
		for (i of formElements){
			inputVals[i.name] = i.value
		}
		
		let query = ''
		let dbname = 'routers'
		try{
			let postArr = {
				"routername": inputVals['router-name'],
				"routertag": inputVals['router-tag'],
				"routermfg": inputVals['router-mfg'],
				"routermodel": inputVals['router-model']
			}
			console.log(postArr)
			var posted = DbFunc.post(dbname, postArr).then(function(returnVal){
				console.log('test = ',returnVal)
			}).then(
				DbFunc.pull(dbname, {'_id': {'$regex': /^[a-zA-Zd]/}}, {'_id': 1}).then(
					function(result){
						helpers.buildDomMethods.buildTable(document.getElementById('routers-tbody'), result)
					})
			)
			if (!posted) {
				throw err = posted
			}
			
		} catch (err) {
	
		}
		*/
	},
	editStaff: function (form){

	},
	removeStaff: function(form){

	},
	pull: function (dbname, query, sort){
		/**
		 * @param {string} dbname - Database to use
		 * @param {Object} query - nedb query object
		 * @param {string} sort - column to use for the order of results (defaults to _id ascending order)
		 * 
		 * @return {Object} Promise & Result
		 */
		//var query = {'_id': {'$regex': /^[a-zA-Zd]/}}
		return new Promise((resolve, reject) => {
			db[dbname].find(query).sort(sort).exec(function (err, result) {
				if (err) {
					return reject(err)
				} else {
					return resolve(result)
				}
			})
		}).catch((err) => err)
	},
	post: function (dbname, query, sort){
		/**
		 * @param {string} dbname - Database to use
		 * @param {Object} query - nedb query object
		 * 
		 * @return {Object} Promise & Result
		 */
		query.date = new Date
		return new Promise ((resolve, reject) => {
			db[dbname].insert(query, function(err, newDoc){
				console.log(newDoc)
				if (err) {
					return reject(err)
				} else {
					return resolve(newDoc)
				}
			})
		}).catch((err) => err)
	},
	update: function (dbname, row, query){
		/**
		 * @param {string} dbname - Database to use
		 * @param {Object} query - nedb query object
		 * 
		 * @return {Object} Promise & Result (numReplaced)
		 */
		return new Promise((resolve, reject) => {
			db[dbname].update(row, query, {}, function(err, numReplaced) {
				if (err){
					return reject(err)
				} else {
					return resolve(numReplaced)
				}
			})
		}).catch((err) => err)
	}
}

var BuildStaffDom = {
	//uses DBSubmitTools
	init: function(){
		//var first = this.importAgents()
		//var order = [this.importAgents(), this.agentSelect(), this.importLeads()]
		return new Promise ((resolve, reject) => {
			this.importAgents().then((result) => {
				return this.agentsToObj(result)
			}).then((result) => {
				return this.agentSelect()
			}).then((result) => {
				return this.importLeads()
			}).then((result) => {
				return this.leadsToObj(result)
			}).then((result) => {
				return this.leadSelect()
			}).then((result) => {
				return resolve()
			})
		}).catch((err) => console.log(err))
		
		
	},
	importAgents: function (DBquery = null) {
		let query = {abbv: {'$regex': /^[a-zA-Z]/}},
			sort = {abbv: 1},
			activeResult = {}
		return new Promise (function (resolve, reject) {
			db.agentsDb.find(query).sort(sort).exec(function(err, result){
				if (err) {
					return reject()
				} else {
					return resolve(result)
				}
				
			})
		})
		},
		agentsToObj: function (result) {
			return new Promise (function (resolve, reject){
				for (var i of result){
					if (i.inactive != 1) {
						activeAgentsObj[i.abbv] = i
					}
					agentsObj[i.abbv] = i
				}
				if (Object.keys(agentsObj).length == result.length) {
					resolve(result)
				} else {
					reject()
				}
			})
		},
		importLeads: function () {
			let query = {abbv: {'$regex': /^[a-zA-Z]/}},
				sort = {abbv: 1}

			return new Promise (function(resolve, reject){
				db.leadsDb.find(query).sort(sort).exec(function(err, result){
					if (err) {
						return reject()
					} else {
						return resolve(result)
					}
				})
			})
			
			//this.leadSelect(activeStaf)
		},
		leadsToObj: function (result) {
			return new Promise (function (resolve, reject){
				for (var i of result) {
					if (i.inactive == 0) {
						activeLeadsObj[i.abbv] = i
					}
					if (i.abbv == loggedOnUser) {
						loggedOnUserFullname = i.name
					}
					leadsObj[i.abbv] = i
					if (Object.keys(leadsObj).length == result.length) {
						return resolve(activeLeadsObj)
					}
				}
			})
		},
		agentSelect: function() {
			let select = document.getElementById('select-agent'),
				options = []
				select.innerHTML = ''
				select.innerHTML = '<option value="0" selected disabled>Select The Agent You Monitored</option>'
			return new Promise ((resolve, reject) =>{

				var length = Object.keys(activeAgentsObj).length, count = 1
				for (var i in activeAgentsObj){
					let option = document.createElement('option')
					option.value = activeAgentsObj[i].abbv
					option.setAttribute('data-agent-id', activeAgentsObj[i]._id)
					option.innerHTML = activeAgentsObj[i].name
					select.appendChild(option)

					if (count == length) {
						return resolve(count)
					} else {
						count++
					}
				}
				
			})
				
		},
		leadSelect: function() {
			let newMonitorSelect = document.getElementById('select-lead'),
				leadMonitorSelect = document.getElementById('select-lead-search'),
				defaultOptionHTML = '<option value="0" selected disabled>Select The Agent You Monitored</option>';
			newMonitorSelect.innerHTML = defaultOptionHTML;
			leadMonitorSelect.innerHTML = defaultOptionHTML;

			return new Promise ((resolve, reject) => {

				var length = Object.keys(activeLeadsObj).length, count = 1
				for (var x in activeLeadsObj) {
					let option1 = document.createElement('option'),
						option2 = document.createElement('option')
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
					if (count == length) {
						return resolve(count)
					} else {
						count++
					}
				}
			})
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
			this.pullNeeded().then((result) => {
				return this.buildNeeded(result)
			}).then ((result) => {
				return this.pullCompleted()
			}).then ((result) => {
				return this.buildCompleted()
			}).then ((result) => {
				return resolve()
			})
		})
	},
	pullNeeded: function () {
		let agent = "",
		query = {'$and': [ {date: { '$gte': startOfMonth }},{date: { '$lte': endOfMonth }} ]},
		sort = {'agent': 1}
		
		//loop through all staff and pull monitors individuall, then load to a sorted result?
		return new Promise ((resolve, reject) => {
			let count = 0, length = Object.keys(activeAgentsObj).length, monitors = []
			DBSubmitTools.pull('monitors', query, sort).then((result) => {
				//loop through all the monitors to filter the result to show each agent
				domTools.domMethods.buildNeeded(document.getElementById('needed-monitors-tbody'), result, activeAgentsObj)
			})
		
		/*	for (i in activeAgentsObj) {
				console.log(count, length, i)
				let agent = activeAgentsObj[i].abbv, 
					query = {'$and': [ {date: { '$gte': startOfMonth }},{date: { '$lte': endOfMonth }} ]},
					sort = {'agent': 1}
				return new Promise((resolve, reject) => {
					console.log(count, length, activeAgentsObj[i])
					console.log('-----------')
					console.log(query)
					console.log('-----------')
					var result = DBSubmitTools.pull('monitors', query, sort).then((result) => {
						if (result) { 
							console.log(result)
							monitors.push(result)
							return resolve(result)
						} else {
							return reject(result)
						}
					})
				})
				if (count == length) {
					return resolve(monitors)
				} else {
					count ++
				}
			}*/
			/*	for (i of activeAgentsObj) {
				console.log(i.abbv)
				DBSubmitTools.pull(
					'monitors', query, sort
				).then(
						function(result){

						}
				)
			}
		*/	
		
		})
	},
	buildNeeded: function(result) {
		let container = document.getElementById('needed-monitors-tbody')
		container.innerHTML = ''
			
	},
	pullCompleted: function () {
		let query = {'$and': [ {date: { '$gte': startOfMonth }},{date: { '$lte': endOfMonth }} ]},
			queryQuarter = {'$and': [ {date: {'$gte': qstart}},{date: {'$lte': qend}} ]},
			queryYear = {'$and': [{date: {'$gte': yearStart}},{date: {'$lte': today}} ]},
			sort = {'agent': 1}

		DBSubmitTools.pull('monitors', query, sort)
			.then((result) => {
					console.log(result)
					return this.buildCompleted(result)
				}
			)
	},
	buildCompleted: function(result) {
		let accordionContainer = document.getElementById('agent-accordion-tbody')
		accordionContainer.innerHTML = ''

		for (var i in agentsObj) {
			let monitors = result.filter(x => x.agent === i)
			domTools.domMethods.buildAccordion(i, monitors)
		}
		
	},
	buildCompletedThisMonth: function(result) {
		let container = document.getElementById('completed-monitors-tbody')
		container.innerHTML = ''
	},
	leadMonitors: function() {
		let container = document.getElementById('leadmonitors-tbody')
		container.innerHTML = ''
	}
}

var LoadStaffEdit = {
	init: function(){
		return new Promise ((resolve, reject) => {
			this.agentMaintenance().then((result) => {
				return this.leadMaintenance()
			}).then((result) => {
				//finally
				return resolve()
			})
		}).catch((err) => console.log(err))
	},
	agentMaintenance: function() {
		let container = document.getElementById('edit-agents-tbody')
		container.innerHTML = ''

		return new Promise ((resolve, reject) => {
			if (domTools.domMethods.buildTable(container, agentsObj)){
				return resolve()
			} else {
				return reject()
			}
		})
		

	},
	leadMaintenance: function() {
		let container = document.getElementById('edit-leads-tbody')
		container.innerHTML = ''

		return new Promise ((resolve, reject) => {
			if (domTools.domMethods.buildTable(container, leadsObj)) {
				return resolve()
			}
		})
	}
}














































/**
 *	Global Event Listeners
 */
$(window).on('load', function () {
	setDate()
	//DBSubmitTools.post('monitors', {"date": new Date(), "agent":"vetterp","score":"81.11","fail":false,"lead":"cleggt"}, {agent: 1})
	// Build the Dom for the first time
	var load = new Promise((resolve, reject) => {
		BuildStaffDom.init().then((result)=>{
			//return LoadMonitors.init()
			return LoadStaffEdit.init()
		}).then((result) => {
			//return LoadStaffEdit.init()
			return LoadMonitors.init()
		})
	}).catch((err) => {
		console.log(err)
	})
	
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

	$('#form-monitors').submit(function (e) {
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

	
	
	$('#select-lead-search').on('change', function () {
		var lead = $(this).val(),
			month = $('#input-date-search').val();
		pullLeadMonth(month, lead);
	})
	$('#monitors-search-date').change(function () {

		let month = $(this).val().replace(/-/g, '\/'),
			tmpDate = new Date(month),
			clearTbody = document.getElementById('agent-accordion-tbody')

		clearTbody.innerHTML = '';
		completedPerAgent(tmpDate)

	})

	$(window).on('click', function (e) {
		
		if (e.target.dataset.section != $('.navbar-collapse') && $('.navbar-collapse').hasClass('in')) {
			$('.navbar-collapse').removeClass('in')
		}
	})
	$('.app-version').html(`v${app.getVersion()}`)
	$(function () {
		$('[data-toggle="tooltip"]').tooltip()
	})
})
