// declare constants for node tools
// electron = require('electron')
const {app} = require('electron').remote, // electron.app,
	{ipcRenderer} = require('electron'),
	fs = require('fs'),
	path = require('path'),
	nedb = require('nedb'),
	date = new Date();
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
	loggedOnUser = process.env['USERPROFILE'].split(path.sep)[2];
//fullDateWithSlashes = year + '/' + mm + '/'+dd,
//fullDateWithDashes =  year + '-' + mm + '-'+dd;
// check for dev
try {
	if (!process.env.TODO_DEV) {
		//////////////////////////
		// Production Datasbase //
		//////////////////////////

		const xDrive = 'X:/helpdesk/Tech Leads/Call Monitors/monitor-database'
		var db = new nedb({
				filename: path.resolve(xDrive, dbname),
				autoload: true
			}),
			leadsDb = new nedb({
				filename: path.resolve(xDrive, 'leads.db'),
				autoload: true
			}),
			agentsDb = new nedb({
				filename: path.resolve(xDrive, 'agents.db'),
				autoload: true
			}),
			claimedDb = new nedb({
				filename: path.resolve(xDrive, 'claimed.db'),
				autoload: true
			})
		if (!db || !leadsDb || !agentsDb) {
			throw ('Database connection error')
		}
	} else {
		//////////////////////////
		// Development Database //
		//////////////////////////

		var db = new nedb({
				filename: path.resolve(__dirname, '../../db/', dbname),
				autoload: true
			}),
			leadsDb = new nedb({
				filename: path.resolve(__dirname, '../../db/', 'leads.db'),
				autoload: true
			}),
			agentsDb = new nedb({
				filename: path.resolve(__dirname, '../../db/', 'agents.db'),
				autoload: true
			}),
			claimedDb = new nedb({
				filename: path.resolve(__dirname, '../../db/', 'claimed.db'),
				autoload: true
			})
		if (!db || !leadsDb || !agentsDb || !claimedDb) {
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
 * Table Population Tools
 */
function importLeads() {
	var query = {
		abbv: {
			'$regex': /^[a-zA-Z]/
		}
	}
	leadsDb.find(query).sort({
		name: 1
	}).exec(function (err, data) {
		$.each(data, function (k, v) {
			if (v.inactive != 1) {
				activeLeadsObj[v.abbv] = v;
			}
			leadsObj[v.abbv] = v
		})

		loadToLeadSelect();
		loadLeadsTable(data);
		importAgents()
	})
}

function loadToLeadSelect() {
	//create options and add to the select
	var out = document.getElementById(leadSelect),
		leadsMonitorSelect = document.getElementById('select-lead-search'),
		editMonitorLead = document.getElementById('edit-monitor-modal-select-lead'),
		activeKeys = Object.keys(activeLeadsObj),
		allKeys = Object.keys(leadsObj),
		i = 0,
		x = 0
	out.innerHTML = '<option selected disabled value="0">Select Your Name</option>';
	leadsMonitorSelect.innerHTML = '<option selected disabled value="0">Select Your Name</option>';
	editMonitorLead.innerHTML = '<option selected disabled value="0">Select Your Name</option>'
	$(activeKeys).each(function (k, v) {
		var option = document.createElement('option');
		$(option).val(activeLeadsObj[v].abbv)
			.html(activeLeadsObj[v].name)
			.data('lead-id', activeLeadsObj[v]._id)
		out.appendChild(option);
		if (activeLeadsObj[v].abbv == loggedOnUser){
			$(option).prop('selected', true)
		}
		i++
	})
	$(allKeys).each(function (k, v) {
		let allLeadsOption = document.createElement('option'),
			modalLeadsOption = document.createElement('option');
		$(allLeadsOption).val(leadsObj[v].abbv)
			.html(leadsObj[v].name)
			.attr('data-lead-id', leadsObj[v]._id)
		$(modalLeadsOption).val(leadsObj[v].abbv)
			.html(leadsObj[v].name)
			.attr('data-lead-id', leadsObj[v]._id)
		if (leadsObj[v].abbv == loggedOnUser){
			$(allLeadsOption).prop('selected', true);
			$(modalLeadsOption).prop('selected', true);
		}
		leadsMonitorSelect.appendChild(allLeadsOption);
		editMonitorLead.appendChild(modalLeadsOption);
		x++
	})
	
}

function loadLeadsTable(data) {
	/**
	 * @param {object} data
	 * pulled tom importLeads()
	 */
	// build the Lead Maintenance table
	var tbody = document.getElementById('edit-leads-tbody')
	tbody.innerHTML = '';
	var nameValue;
	var arr = Object.keys(data)
	for (var i = 0; i < arr.length; i++) {
		// create elements
		var nameValue = data[i].name,
			abbreviation = data[i].abbv,
			inactive = data[i].inactive,
			leadId = data[i]._id;


		var fullNameTD = document.createElement('td'),
			abbreviationTD = document.createElement('td'),
			edit = document.createElement('td'),
			remove = document.createElement('td'),
			row = document.createElement('tr'),
			editHTML = '<a class="edit-lead" href="#" id="edit-' + abbreviation + '"><span class="glyphicon glyphicon-pencil"></span></a>',
			removeHTML = '<a class="remove-lead" href="#" id="remove-' + abbreviation + '"><span class="glyphicon glyphicon-remove"></span></a>'
		$(row).attr('data-abbv', data[i].abbv)
			.attr('data-name', data[i].name)
			.attr('data-id', data[i]._id)
			.attr('data-inactive', data[i].inactive)
			.attr('id', data[i]._id);
		if (data[i].inactive == 1) {
			$(row).css('text-decoration', 'line-through')
		}
		// fill TD with data
		fullNameTD.innerHTML = data[i].name
		abbreviationTD.innerHTML = data[i].abbv
		edit.innerHTML = editHTML
		remove.innerHTML = removeHTML
		//Append TD to TR then to TBODY
		row.appendChild(fullNameTD)
		row.appendChild(abbreviationTD)
		row.appendChild(edit)
		row.appendChild(remove)
		tbody.appendChild(row)
	}

	// build event listeners for edit/remove/add
	$('.edit-lead').click(function (e) {
		e.preventDefault();
		var parentData = $(this).parent().parent()
		var args = {
			'type': 'edit-lead',
			'abbv': $(parentData).data('abbv'),
			'name': $(parentData).data('name'),
			'id': $(parentData).data('id'),
			'inactive': $(parentData).data('inactive')
		}
		showModal(args)
	})
	$('.remove-lead').click(function (e) {
		e.preventDefault();
		var parentData = $(this).parent().parent()
		var args = {
			'type': 'remove-lead',
			'id': $(parentData).data('id'),
			'name': $(parentData).data('name'),
			'inactive': $(parentData).data('inactive')
		}
		showModal(args)
	})
	$('.add-lead').click(function (e) {
		e.preventDefault()
		var args = {
			'type': 'add-lead'
		}
		showModal(args)
	})
}

function importAgents() {
	// query agentsDb to get all active agents and inactive agents
	// use both objects to load the select with active agents and all agents to
	// the Agent Maintenance table
	var query = {
		abbv: {
			'$regex': /^[a-zA-z]/
		}
	}
	agentsDb.find(query).sort({
		name: 1
	}).exec(function (err, data) {
		$.each(data, function (k, v) {
			if (v.inactive != 1) {
				activeAgentsObj[v.abbv] = v;
			}
			agentsObj[v.abbv] = v;
		})

		loadToAgentSelect(data)
		loadAgentsTable(data)
		pullThisMonth()
	})
}

function loadToAgentSelect(data) {
	// add the agents, as options, to the select elements
	// selects located on index-main form and the edit-monitor-modal
	var out = document.getElementById(agentSelect),
		editMonitorAgent = document.getElementById('edit-monitor-modal-select-agent');
	out.innerHTML = '<option selected disabled value="0">Select The Agent You Monitored</option>';
	editMonitorAgent.innerHTML = '<option selected disabled value="0">Select The Agent You Monitored</option>';
	for (var i = 0; i < data.length; i++) {
		if (data[i].inactive == 1){
			continue
		}
		var nameValue = data[i].name,
			abbreviation = data[i].abbv,
			agentId = data[i]._id,
			agentOption = document.createElement('option'),
			modalOption = document.createElement('option');
		$(agentOption).val(abbreviation).html(nameValue).attr('data-agent-id', agentId)
		$(modalOption).val(abbreviation).html(nameValue).attr('data-agent-id', agentId)
		out.appendChild(agentOption);
		editMonitorAgent.appendChild(modalOption)
	}
}

function loadAgentsTable(data) {
	// loads all the active agents to the Agent Maintenance page
	var tbody = document.getElementById('edit-agents-tbody')
	var arr = Object.keys(data);
	tbody.innerHTML = '';
	// loop through the array of keys from the result object
	for (var i = 0; i < arr.length; i++) {
		// create elements
		let nameValue = data[i].name,
			abbreviation = data[i].abbv,
			requiredMonitors = data[i].monitors,
			inactive = data[i].inactive,
			agentRowId = data[i]._id,
			agentId = data[i].agentid,
			fullNameTD = document.createElement('td'),
			abbreviationTD = document.createElement('td'),
			agentIdTd = document.createElement('td'),
			edit = document.createElement('td'),
			remove = document.createElement('td'),
			monitors = document.createElement('td'),
			row = document.createElement('tr'),
			editHTML = '<a class="edit-agent" href="#" id="edit-' + abbreviation + '"><span class="glyphicon glyphicon-pencil"></span></a>',
			removeHTML = '<a class="remove-agent" href="#" id="remove-' + abbreviation + '"><span class="glyphicon glyphicon-remove"></span></a>';
		// set attributes for the row
		$(row).attr('data-abbv', abbreviation)
			.attr('data-name', nameValue)
			.attr('data-monitors', requiredMonitors)
			.attr('data-id', agentRowId)
			.attr('data-agentid', agentId)
			.attr('data-inactive', inactive)
			.attr('id', 'row-' + abbreviation);
		if (inactive == 1) {
			$(row).css('text-decoration', 'line-through')
		}
		// fill cells
		fullNameTD.innerHTML = nameValue.toString()
		abbreviationTD.innerHTML = abbreviation
		edit.innerHTML = editHTML
		edit.id = 'edit-' + agentRowId
		agentIdTd.innerHTML = agentId
		$(agentIdTd).addClass('agentid')
		remove.innerHTML = removeHTML
		monitors.innerHTML = requiredMonitors
		//append TD to TR then to TBODY
		row.appendChild(fullNameTD)
		row.appendChild(abbreviationTD)
		row.appendChild(agentIdTd)
		row.appendChild(monitors)
		row.appendChild(edit)
		row.appendChild(remove)
		tbody.appendChild(row)
	}
	// build event listener for the edit/add/remove
	$('.edit-agent').click(function (e) {
		e.preventDefault();
		var parentData = $(this).parent().parent()
		var args = {
			'type': 'edit-agent',
			'abbv': $(parentData).data('abbv'),
			'name': $(parentData).data('name'),
			'id': $(parentData).data('id'),
			'monitors': $(parentData).data('monitors'),
			'agentid': $(parentData).data('agentid'),
			'inactive': $(parentData).data('inactive')
		}
		var oldId = $(parentData).attr('agentid')
		showModal(args, oldId);
	})
	$('.remove-agent').click(function (e) {
		e.preventDefault();
		var parentData = $(this).parent().parent()
		var args = {
			'type': 'remove-agent',
			'id': $(parentData).data('id'),
			'name': $(parentData).data('name'),
			'inactive': $(parentData).data('inactive')
		}
		showModal(args);
	})
	$('.add-agent').click(function (e) {
		e.preventDefault()
		var args = {
			'type': 'add-agent'
		}
		showModal(args)
	})
}
/**
 * Monitors Tools
 */
function post(row) {
	// posts to the monitors(year).db
	// vars: row		object	required

	//need to do this with a promise because the page is reloading too quickly and the ASYNC action isn't going through
	return new Promise(function (resolve, reject) {
		//console.log(db)
		db.insert(row, function (err, result) {
			if (err) {
				reject(err)
			} else {
				resolve(result)
			}
		})
	}).catch(function (err) {
		errorHandling({
			message: err,
			field: 'post'
		})
	})
}

function completed(result) {
	// use the result to build the monitors that have been completed.
	// this fills on the second tab named "This Month"
	var tbody = document.getElementById('completed-monitors-tbody')
	// loop through the result of rows
	$.each(result, function (k, v) {
		// create elements
		let resultDate = new Date(v.date),
			resultYear = resultDate.getFullYear(),
			resultMM = ("0" + (resultDate.getMonth() + 1)).slice(-2),
			resultDD = ("0" + resultDate.getDate()).slice(-2),
			resultDateString = resultYear + '-' + resultMM + '-' + resultDD,
			dateTd = document.createElement('td'),
			nameTd = document.createElement('td'),
			scoreTd = document.createElement('td'),
			failTd = document.createElement('td'),
			leadTd = document.createElement('td'),
			leadAbbv = v.lead.toString(),
			row = document.createElement('tr');
		//set attributes
		row.id = v._id;
		dateTd.innerHTML = resultDateString;
		nameTd.innerHTML = agentsObj[v.agent].name;
		$(row).attr('data-date', v.date)
			.attr('data-agent', v.agent)
			.attr('data-fail', v.fail)
			.attr('data-lead', v.lead)
			.attr('data-id', v._id)
		scoreTd.innerHTML = v.score + ' %';
		if (v.fail == true) {
			failTd.innerHTML = '<span class="glyphicon glyphicon-ok">';
			$(scoreTd).addClass('bg-danger')
		} else {
			failTd.innerHTML = '';
		}
		leadTd.id = v.lead;
		leadTd.innerHTML = leadsObj[v.lead].name
		//append TD to TR, then TR to TBODY
		row.appendChild(dateTd);
		row.appendChild(nameTd);
		row.appendChild(scoreTd);
		row.appendChild(failTd);
		row.appendChild(leadTd);
		tbody.appendChild(row);
	})
}
var ClaimedMonitors = {
	pull: function () {
		/**
		 * @param dateRange Included in the function - does not need to be supplied
		 */
		query = {'$and': [ 
						{date: { '$gte': startOfMonth }},
						{date: { '$lte': endOfMonth }}
					]
				}
		return new Promise(function (resolve, reject){
			claimedDb.find(query).sort({'agent': 1}).exec(function (err, result){
				if (err) {
					reject (err)
				} else {
					resolve (result)
				}
			})
		})
	},
	post: function (leadAbbv, agentAbbv){
		query = {
			'agentAbbv': agentAbbv,
			'leadAbbv': leadAbbv,
			'date': new Date()
		}
		return new Promise(function (resolve, reject){
			claimedDb.insert(query, function(err, result) {
				
				if (err) {
					reject (err)
				} else {
					resolve (result)
				}
			})
		})
	},
	remove: function (agentAbbv) {
		query = {'agentAbbv': agentAbbv}
		return new Promise(function (resolve, reject){
			claimedDb.remove(query, {}, function (err, result){
				if (err) {
					reject (err)
				} else {
					resolve (result)
				}
			})
		})
	}
}
/**
	function pullClaimedMonitors(query, sort) {
		return new Promise(function (resolve, reject){
			claimedDb.find(query).sort(sort).exec(function (err, result){
				if (err) {
					reject (err)
				} else {
					resolve (result)
				}
			})
		})
	}
*/
function pullAgentMonitors(query, sort) {
	// async datastore connction from the montiors db
	// returns the promise that it has completed the pull
	// so the next step can be perfromed

	return new Promise(function (resolve, reject) {
		//console.log(db)
		db.find(query).sort(sort).exec(function (err, result) {
			if (err) {
				reject(err)
			} else {
				resolve(result)
			}
		})
	})
}

function buildRow(agent, monitors) {
	// create elements and find the parent tbody to hold the table
	// this can probably be condensed. The header creation can probably move
	// before the if(monitors>0){}
	var tmpObj = [],
		panelGroup = document.getElementById('agent-accordion-tbody'),
		panelHead = document.createElement('tr'),
		nameTd = document.createElement('td'),
		completedTd = document.createElement('td'),
		avgTd = document.createElement('td'),
		qAvgTd = document.createElement('td'),
		yAvgTd = document.createElement('td'),
		subTableRow = document.createElement('tr'),
		subTableTd = document.createElement('td'),
		subTableDiv = document.createElement('div'),
		subTable = document.createElement('table'),
		subThead = document.createElement('thead'),
		subTbody = document.createElement('tbody'),
		agentName = agentsObj[agent].name
	$(qAvgTd).attr('id', agent + '-qAvg')
	$(yAvgTd).attr('id', agent + '-yAvg')
	if (agentsObj[agent].inactive == 1) {
		$(panelHead).css('text-decoration', 'line-through')
	}
	// if the agent has monitors this month, else only build the row
	if (monitors.length > 0) {
		let score = 0,
			count = 0;
		// Build the Accordion Header, then loop through individual monitors
		// to build the subtable
		$.each(monitors, function (k, v) {
			if (v.fail !== true) {
				score = score + parseInt(v.score)
			}
			count++
			// create elements
			let resultDate = new Date(v.date),
				resultYear = resultDate.getFullYear(),
				resultMM = ("0" + (resultDate.getMonth() + 1)).slice(-2),
				resultDD = ("0" + resultDate.getDate()).slice(-2),
				resultDateString = resultYear + '-' + resultMM + '-' + resultDD,
				row = document.createElement('tr'),
				dateTd = document.createElement('td'),
				scoreTd = document.createElement('td'),
				failTd = document.createElement('td'),
				leadTd = document.createElement('td'),
				editTd = document.createElement('td')
			dateTd.innerHTML = resultDateString
			scoreTd.innerHTML = v.score + ' %'
			// the data attr contains the table row information for the edit modal
			$(editTd).html('<span class="glyphicon glyphicon-cog edit-monitor"></span>')
				.attr('data', 'id').data('id', v._id)
				.attr('data', 'score').data('score', v.score)
				.attr('data', 'name').data('agent', v.agent)
				.attr('data', 'date').data('date', v.date)
				.attr('data', 'fail').data('fail', v.fail)
				.attr('data', 'lead').data('lead', v.lead)
			//let leadName = leadsObj[v.lead].name // <-- this wasn't necessary
			if (v.fail == true) {
				//Add red shading to background if there is a fail
				$(failTd).addClass('bg-danger').html('<span class="glyphicon glyphicon-ok"></span>')
				$(dateTd).addClass('bg-danger')
				$(scoreTd).addClass('bg-danger')
				$(leadTd).addClass('bg-danger')
				$(editTd).addClass('bg-danger')
			}
			leadTd.innerHTML = leadsObj[v.lead].name
			// add each TD to the TR for the subtable
			$(row).append(dateTd, scoreTd, failTd, leadTd, editTd)
				.attr('id', v._id)
			// add the row to the subtable
			$(subTbody).append(row)
		})
		$(subThead).html('<th>Date</th><th>Score</th><th>Auto-Fail</th><th>Lead</th><th>Edit</th>')
		$(subTbody).attr('id', agent + '-tbody')
		$(subTable).attr('width', '100%').addClass('table table-striped')
			.append(subThead).append(subTbody)
		$(subTableDiv).addClass('well').append(subTable)
		$(subTableTd).attr('colspan', '4').append(subTableDiv)
		// accordion stuff
		$(subTableRow).addClass('accordion-body collapse').attr('id', agent + 'Table')
			.append(subTableTd)
		// Averaging
		let avg = score / count
		$(nameTd).html(agentName)
		$(avgTd).html(avg.toFixed() + ' %')
		if (avg < 75) {
			// watch for poor averages
			$(avgTd).addClass('bg-danger')
		}
		$(completedTd).html(count.toString())
		$(panelHead).addClass('accordion-toggle')
			.attr('data-parent', '#agent-accordion-tbody')
			.attr('data-toggle', 'collapse')
			.attr('data-target', '#' + agent + 'Table')
			.append(nameTd).append(completedTd)
			.append(avgTd).append(qAvgTd).append(yAvgTd)
		// add the subtable to the agent's header
		$(panelGroup).append(panelHead).append(subTableRow)
	} else {
		//create a blank header
		if (agentsObj[agent].inactive == 1) {
			return
		}
		$(subThead).html('<th>Date</th><th>Score</th><th>Auto-Fail</th><th>Lead</th>')
		$(subTbody).attr('id', agent + '-tbody')
		$(subTable).attr('width', '100%').addClass('table table-striped')
			.append(subThead).append(subTbody)
		$(subTableDiv).addClass('well').append(subTable)
		$(subTableTd).attr('colspan', '4').append(subTableDiv)

		$(subTableRow).addClass('accordion-body collapse').attr('id', agent + 'Table')
			.append(subTableTd)
		$(nameTd).html(agentName)
		$(panelHead).addClass('accordion-toggle')
			.attr('data-toggle', 'collapse')
			.attr('data-target', '#' + agent + 'Table')
			.append(nameTd).append(completedTd)
			.append(avgTd).append(qAvgTd).append(yAvgTd)

		$(panelGroup).append(panelHead).append(subTableRow)
	}
	$('.accordion-toggle').css('cursor', 'pointer')
}

function fillQuarter(agent, monitors) {
	// calculates the average call monitor score
	// then fill in the quarter abverage field
	let count = 0,
		score = 0,
		qAverage = 0,
		avgTd = document.getElementById(agent + '-qAvg')

	if (monitors.length > 0) {
		$.each(monitors, function (k, v) {
			// loop to get the total score for the average
			count++
			if (v.fail !== true) {
				// add to score if the monitor isn't a fail
				// ignoring if fail prevents accidental scoring from being included
				score += parseInt(v.score)
			}
		})
		// calculate the average
		qAverage = score / count

		if (qAverage < 75) {
			// flag low averages
			$(avgTd).addClass('bg-danger')
		}
		$(avgTd).html(qAverage.toFixed() + ' %')
	}
}

function fillYear(agent, monitors) {
	// calculates the average call monitor score
	// then fill in the quarter abverage field
	let count = 0,
		score = 0,
		yAverage = 0,
		avgTd = document.getElementById(agent + '-yAvg')
	if (monitors.length > 0) {
		$.each(monitors, function (k, v) {
			// loop to get the total score for the average
			count++
			if (v.fail !== true) {
				// add to score if the monitor isn't a fail
				// ignoring if fail prevents accidental scoring from being included
				score += parseInt(v.score)
			}
		})
		// calculate the average
		yAverage = score / count

		if (yAverage < 75) {
			//flag low averages
			$(avgTd).addClass('bg-danger')
		}
		$(avgTd).html(yAverage.toFixed() + ' %')
	}
}

function fillLastMonitor(agent, Monitor) {
	/**
	 * Fill the "Last Monitor" field with the date of the agent's last monitor
	 * @param {string} agent - The agent's name
	 * @param {Object} Monitor - The agent's last monitor
	 */
	let td = document.getElementById(agent + '-last-monitor')
	if (Monitor.length > 0 && td !== null) {
		//console.log(monitor);
		let keys = Object.keys(Monitor),
			last = Monitor[keys.length - 1],
			argsDate = new Date(last.date),
			tmpDate = new Date(argsDate.getFullYear(), argsDate.getMonth(), argsDate.getDate(), 12)
		//fill the cell	
		td.innerHTML = last.score + '% on ' + tmpDate.getFullYear() + '-' + ("0" + (tmpDate.getMonth() + 1)).slice(-2) + '-' + ("0" + (tmpDate.getDate())).slice(-2)
	}

}

function completedPerAgent(argMonth = null) {
	/** 
	 * Calls async function pullAgentMonitors() that returns a promise,
	 * then builds the table row on All Monitors
	 * edit monitor modal control is set here since the async element creation
	 * prevents jQuery from seeing the element at window load
	 * @param {Object} argMonth - Optional - 
	 */
	if (argMonth) {
		// re-write start/end variables declared at the beginning
		startOfMonth = new Date(year, argMonth.getMonth(), 1),
			endOfMonth = new Date(year, argMonth.getMonth() + 1, 0),
			startOfLastMOnth = new Date(year, argMonth.getMonth() - 1, 1),
			lastMonth = year + '-' + (("0" + (argMonth.getMonth())).slice(-2))

		// re-write the qstart/end variables declared at the beginning
		if ($.inArray(argMonth.getMonth(), q1)) {
			qstart = new Date(year, 0, 1)
			qend = new Date(year, 2, 31)
		} else if ($.inArray(argMonth.getMonth(), q2)) {
			qstart = new Date(year, 3, 1)
			qend = new Date(year, 5, 30)
		} else if ($.inArray(argMonth.getMonth(), q3)) {
			qstart = new Date(year, 6, 1)
			qend = new Date(year, 8, 31)
		} else {
			qstart = new Date(year, 9, 1)
			qend = new Date(year, 11, 31)
		}
	}
	var yearStart = new Date('1/1/' + year)

	let query = {'$and': [ {date: { '$gte': startOfMonth }},{date: { '$lte': endOfMonth }} ]},
		queryQuarter = {'$and': [ {date: {'$gte': qstart}},{date: {'$lte': qend}} ]},
		queryYear = {'$and': [{date: {'$gte': yearStart}},{date: {'$lte': today}} ]},
		sort = {agent: 1},
		count = 0;
	pullAgentMonitors(query, sort).then(function (result) {
		//loop through all the agents to filter the result to show each agent
		for (var i in agentsObj) {
			let monitors = result.filter(x => x.agent === i)
			buildRow(i, monitors)
		}
		$('.edit-monitor').on('click', function (e) {
			var parentData = $(this).parent()
			var args = {
				'type': 'edit-monitor',
				'id': $(parentData).data('id'),
				'agent': $(parentData).data('agent'),
				'date': $(parentData).data('date'),
				'score': $(parentData).data('score'),
				'fail': $(parentData).data('fail'),
				'lead': $(parentData).data('lead')
			}
			showModal(args)
		})
	})

	pullAgentMonitors(queryQuarter, sort).then(function (result) {
		// perform another db query to find all monitors for the quarter
		// then loop through the agents to filter and fill in the ${agent}-qAvg field
		for (var i in agentsObj) {
			var monitors = result.filter(x => x.agent === i)
			fillQuarter(i, monitors)
		}
	}).then(
		
		pullAgentMonitors(queryYear, sort).then(function (result) {
			// Perform another db query to find all the monitors for the year
			// then loop through the agents to filter and fill the ${agent}-yAvg field
			for (var i in agentsObj) {
				var monitors = result.filter(x => x.agent === i)
				fillYear(i, monitors)
			}
		})
	)
}

function needed(result) {
	// fill the table on index_main
	// clean up by moving the row creation outside of the if (result != "")
	var tbody = document.getElementById('needed-monitors-tbody'),
		result = result,
		recentFail = false
	//		def = new Deferred();
	var agentKeys = Object.keys(agentsObj),
		monitorsKeys = Object.keys(thisMonthMonitorsObj);
	var n = document.createElement('tr'),
		total = 0,
		numLeftTd = document.getElementById('num-left'),
		tempcount = 0;
	//n.innerHTML = ''
	tbody.appendChild(n)
	// check for blank resuilt
	if (result) {
		// loop through all the agents
		$(agentKeys).each(function (key, val) {
			/**
			 * @param {number} key = numerical key starting at 0
			 * @param {string} val = agent abbreviation
			 */ 
			if (agentsObj[val].inactive == 1){
				return;
			}
			
			var count = 0 //count # of monitors
			total += parseInt(agentsObj[val].monitors)
			var recentFail = false,
				failDate = '';
			// loop through query result to count the completed monitors
			$(result).each(function (key2, val2) {
				// key2 = numerical value of the key
				// val2 = monitor row properties
				let tmpDate = new Date(val2.date)
				if (val2.agent == val && val2.fail != true) {
					count++; // # of monitors found
					total--;
					recentFail = false;
				} else if (val2.agent == val && val2.fail == true) {
					// did not add to count because a failed monitor doesn't count towards the total
					recentFail = true;
					failDate = tmpDate.getFullYear() + '-' + ("0" + (tmpDate.getMonth() + 1)).slice(-2) + '-' + ("0" + (tmpDate.getDate())).slice(-2)

				}
			})
			// count how many monitors are left
			var monitorsLeft = agentsObj[agentKeys[key]].monitors - count;
			// stop checking and counting after all the monitors have been completed
			if (monitorsLeft <= 0) {
				return;
			}
			// create elements
			var row = document.createElement('tr'),
				dateTd = document.createElement('td'),
				nameTd = document.createElement('td'),
				agentIdTd = document.createElement('td'),
				lastTd = document.createElement('td'),
				numberTd = document.createElement('td'),
				dateTdId = agentsObj[agentKeys[key]].abbv,
				nameTdId = agentsObj[agentKeys[key]].abbv + '-name',
				agentIdTdId = agentsObj[agentKeys[key]].abbv + '-agentid',
				numberTdId = agentsObj[agentKeys[key]].abbv + '-id',
				lastTdId = agentsObj[agentKeys[key]].abbv + '-last-monitor',
				claimedTd = document.createElement('td');

			$(dateTd).attr('id', dateTdId).html(thisMonth)
			$(nameTd).attr('id', nameTdId).html(agentsObj[agentKeys[key]].name)
			$(agentIdTd).attr('id', agentIdTdId).html(agentsObj[agentKeys[key]].agentid)
			$(numberTd).attr('id', numberTdId).html(`${monitorsLeft} / ${agentsObj[agentKeys[key]].monitors}`)
			$(lastTd).attr('id', lastTdId)
			$(row).attr('id', 'row-' + agentsObj[agentKeys[key]]._id)
			$(claimedTd).attr('id', agentsObj[agentKeys[key]].abbv + '-claimed').addClass('claim').attr('claimed', false).data('agentAbbv', agentsObj[agentKeys[key]].abbv)
			claimedTd.innerHTML = `<span class="glyphicon glyphicon-unchecked"></span>`
			

			if (recentFail) {
				// Flag a fail
				$(row).attr('data-toggle', 'tooltip').attr('title', `Failed on ${failDate}`)
				$(dateTd).toggleClass('bg-danger')
				$(nameTd).toggleClass('bg-danger')
				$(agentIdTd).toggleClass('bg-danger')
				$(lastTd).toggleClass('bg-danger')
				$(numberTd).toggleClass('bg-danger')
			}
			// append TDs to TR then to TBODY
			row.appendChild(dateTd)
			row.appendChild(nameTd)
			row.appendChild(agentIdTd)
			row.appendChild(lastTd)
			row.appendChild(numberTd)
			row.appendChild(claimedTd)
			tbody.appendChild(row)

			numLeftTd.innerHTML = total.toString();
			count = 0;
			$(function () {
				
				$('[data-toggle="tooltip"]').tooltip()
			})
		})
		
	} else {
		for (var i = 0; i > agentKeys.length; i++) {
			if (agentsObj[agentKeys[i]].inactive == 1){
				continue
			}
			//create elements
			var row = document.createElement('tr'),
				dateTd = document.createElement('td'),
				nameTd = document.createElement('td'),
				agentIdTd = document.createElement('td'),
				numberTd = document.createElement('td'),
				lastTd = document.createElement('td'),
				dateTdId = agentsObj[agentKeys[i]].abbv,
				nameTdId = agentsObj[agentKeys[i]].abbv + '-name',
				agentIdTdId = agentsObj[agentKeys[i]].abbv + '-agentid',
				numberTdId = agentsObj[agentKeys[i]].abbv + '-id',
				lastTdId = agentsObj[agentKeys[i]].abbv + '-last-monitor',
				claimedTd = docuemnt.createElement('td');
			total += parseInt(agentsObj[agentKeys[i]].monitors)
			$(dateTd).attr('id', dateTdId).html(thisMonth)
			$(nameTd).attr('id', nameTdId).html(agentsObj[agentKeys[i]].name)
			$(agentIdTd).attr('id', agentIdTdId).html(agentsObj[agentKeys[i]].name)
			$(lastTd).attr('id', lastTdId)
			$(numberTd).attr('id', numberTdId).html(`${agentsObj[agentKeys[i]].monitors} / ${agentsObj[agentKeys[i]].monitors}`)
			$(row).attr('id', 'row-' + agentsObj[agentKeys[i]]._id)
			$(claimedTd).attr('id', agentsObj[agentKeys[key]].abbv + '-claimed').addClass('claim').attr('claimed', false).data('agentAbbv', agentsObj[agentKeys[key]].abbv)
			claimedTd.innerHTML = `<span class="glyphicon glyphicon-unchecked"></span>`
			// append TDs to TR then to TBODY
			row.appendChild(dateTd)
			row.appendChild(nameTd)
			row.appendChild(agentIdTd)
			row.appendChild(lastTd)
			row.appendChild(numberTd)
			row.appendChild(claimedTd)
			tbody.appendChild(row)

			numLeftTd.innerHTML = total.toString();
		}
	}
	let x = parseInt(numLeftTd.innerHTML)
	switch (true) {
		case (x >= 20):
			$(numLeftTd).parent().addClass('bg-danger')
				.removeClass('bg-warning')
				.removeClass('bg-info')
			break;
		case (x >= 10 && x < 20):
			$(numLeftTd).parent().addClass('bg-warning')
				.removeClass('bg-danger')
				.removeClass('bg-info')
			break;
		default:
			$(numLeftTd).parent().addClass('bg-info')
				.removeClass('bg-warning')
				.removeClass('bg-danger')
			break;
	}
	ClaimedMonitors.pull().then(function nextstep(result){
			loadClaimed(result)
		}).then(function (){
			$('.claim').on('click', function(e){
				if ($(this).data('claimed') === true){
					$(this).empty()
					$(this).html('<span class="glyphicon glyphicon-unchecked"></span>')
					$(this).data('claimed', false)
					ClaimedMonitors.remove($(this).data('agentAbbv'))
				} else {
					$(this).empty()
					$(this).html('<span class="glyphicon glyphicon-ok"></span>')
					$(this).data('claimed', true)
					console.log($(this).data())
					ClaimedMonitors.post(loggedOnUser, $(this).data('agentAbbv'))
				}
			})
		})

}
function loadClaimed (result) {
	if (result.length > 0) {
		$(result).each(function(k,v){
			claimed = document.getElementById(v.agentAbbv+'-claimed')
			claimed.innerHTML = ''
			claimed.innerHTML = '<span class="glyphicon glyphicon-ok"></span>'
			$(claimed).data('claimed', true)
			$(claimed).data('_id', v._id)
		})
	}
}
function createClaimEventListeners(){
	
}
function pullThisMonth() {
	// pull the monitors using async pullAgentMonitors
	// use completed() and needed() to fill the tables
	let query = {
			'$and': [{
				date: {
					'$gte': startOfMonth
				}
			}, {
				date: {
					'$lte': endOfMonth
				}
			}]
		},
		queryTwoMonths = {
			'$and': [{
				date: {
					'$gte': startOfLastMOnth
				}
			}, {
				date: {
					'$lte': endOfMonth
				}
			}]
		},
		sort = {
			date: 1
		}
	pullAgentMonitors(query, sort)
		.then(function (result) {
			completed(result);
			needed(result)

		}).then(function (finished) {
			pullAgentMonitors(queryTwoMonths, sort)
				.then(function (result) {
					for (var i in agentsObj) {
						var monitors = result.filter(x => x.agent === i)
						fillLastMonitor(i, monitors)
					}
				})
		})
	completedPerAgent()
}
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
 * Form Validation Tools
 */
function checkFuture(d, field) {
	if (d == null || d == " ") {
		throw {
			message: 'You must enter a date!',
			field: field
		}
	} else if (d > date) {
		throw {
			message: 'You cannot enter a date in the future!',
			field: field
		}
	} else {
		return d
	}
}

function checkAgent(a, field) {
	if (a == null || a == " " || a === '0') {
		throw {
			message: 'You must select an agent!',
			field: field
		}
	} else {
		return a
	}
}

function checkScore(s, field) {
	if (s == null || s == "" || s < 0) {
		throw {
			message: 'The score must be greater than 0!',
			field: field
		}
	} else {
		return s
	}
}

function checkFail(f, field) {
	if (f !== true && f !== false) {
		throw {
			message: 'You cannot do this!',
			field: field
		}
	} else {
		return f
	}
}

function checkLead(l, field) {
	if (l == null || l == " " || l === '0') {
		throw {
			message: 'You must select an lead!',
			field: field
		}
	} else {
		return l
	}
}

function checkId(i, field) {
	if (!i || i == "" || i == " " || i == 0) {
		throw {
			message: 'Missing the monitor ID. You cannot update the table. Reload the page and try again.',
			field: field
		}
	} else {
		return i
	}
}

function errorHandling(err) {
	// error handling for main form
	if (err.field === "post") {
		alert(err.message)
	} else {
		var findInput = $(err.field).parents('.form-group')
		var findLabel = $(findInput).find('.help-block')
		$(findInput).addClass('has-error')
		$(findLabel).addClass('has-error').html(err.message)
		var timeout = setTimeout(function () {
			$(findInput).toggleClass('has-error')
			$(findLabel).toggleClass('has-error').html('')
		}, 4000);
	}
}

function validate(d, a, f, l, s, fields) {
	/**
	 * validate main form
	 * {date, agent, fail, lead, score, Object{fields} }
	 * @param d - date @param a - agent @param f - fail @param l - lead 
	 * @param s - score @param fields - an object of the HTML elements to validate
	 */
	let inputValues = {
		d,
		a,
		f,
		l,
		s
	}
	try {
		var validDate = checkFuture(d, fields.d),
			validAgent = checkAgent(a, fields.a),
			validScore = checkScore(s, fields.s),
			validFail = checkFail(f, fields.f),
			validLead = checkLead(l, fields.l)
		if (validFail === true) {
			validScore = 0;
		}
		post({
			"date": validDate,
			"agent": validAgent,
			"score": validScore,
			"fail": validFail,
			"lead": validLead
		}).then(
			function (result) {
				console.log(result)
				//location.reload()
				if (!result || Object.keys(result).length < 1) {
					return
				} else {
					location.reload()
				}
			}
		)
	} catch (err) {
		errorHandling(err)
	}
}

/**
 * Modal Functions
 */
function showModal(args, agentRow = null) {
	// switch to control which modal is built
	// received from listners built in
	// loadLeadsTable, loadAgentsTable, and completedPerAgent
	var modalId = '#' + args.type + '-modal'
	$('.modal').on('shown.bs.modal', function () {
		switch (args.type) {
			case 'remove-agent':
				buildRemoveAgentModal(args)
				break;
			case 'remove-lead':
				buildRemoveLeadModal(args)
				break;
			case 'edit-lead':
				//lead
				buildEditLeadModal(args)
				break;
			case 'edit-agent':
				//agent
				buildEditAgentModal(args, agentRow)
				break;
			case 'edit-monitor':
				buildEditScoreModal(args)
			default:
				break;
		}
	})
	$('.modal').on('shown.bs.modal', function () {
		$('.modal').focus()
	})
	
	$(modalId).modal('show')
}

function buildEditLeadModal(args) {
	// builds edit agent modal
	// args {name, id, abbv, inactive}
	$('#edit-lead-modal').find('.modal-title').html(args.name)
	$('#edit-lead-modal-name').val(args.name)
	$('#edit-lead-modal-abbv').val(args.abbv)
	$('#edit-lead-modal-id').val(args.id)
	$('#edit-lead-modal-inactive').val(args.inactive)
}

function buildEditAgentModal(args, agentRow) {
	// builds edit agent modal
	// args {name, id, abbv, monitors, agentid, inactive}
	var modalName = $('#edit-agent-modal-name')
	$('#edit-agent-modal').find('.modal-title').html(args.name)
	$(modalName).val(args.name).data('oldId', args.agentid)
	$('#edit-agent-modal-abbv').val(args.abbv)
	$('#edit-agent-modal-monitors').val(args.monitors)
	$('#edit-agent-modal-agent-id').val(args.agentid)
	$('#edit-agent-modal-id').val(args.id)
	$('#edit-agent-modal-inactive').val(args.inactive)
}

function buildRemoveLeadModal(args) {
	// builds remove lead modal
	// args {name, id, inactive}
	$('#remove-lead-modal').find('.modal-title').text(args.name)
	$('#remove-lead-modal-name').text(args.name)
	$('#remove-lead-modal-id').val(args.id)
	$('#remove-lead-modal-inactive').val(args.inactive)
	if (args.inactive == 1) {
		$('#remove-lead-modal-type').html('Enable')
	} else {
		$('#remove-lead-modal-type').html('Disable')
	}
}

function buildRemoveAgentModal(args) {
	// builds remove agent modal
	// args {name, id, inactive}
	$('#remove-agent-modal').find('.modal-title').html(args.name)
	$('#remove-agent-modal-name').text(args.name)
	$('#remove-agent-modal-id').val(args.id)
	$('#remove-agent-modal-inactive').val(args.inactive)
	if (args.inactive == 1) {
		$('#remove-agent-modal-type').html('Enable')
	} else {
		$('#remove-agent-modal-type').html('Disable')
	}
}

function buildAddLeadModal(args) {
	// builds add lead modal
	// args {name, abbv}
	$('#add-lead-modal-name').val('')
	$('#add-lead-modal-abbv').val('')
}

function buildAddAgentModal(args) {
	// builds add agent modal
	// args {name, abbv, # of monitors}
	$('#edit-agent-modal-name').val('')
	$('#edit-agent-modal-abbv').val('')
	$('#edit-agent-modal-monitors').val('')
	$('#edit-agent-modal-name').data('oldId', '')
	$('#edit-agent-modal-agent-id').val('')
}

function buildEditScoreModal(args) {
	// builds the modal to edit the score
	// args object {agent, date, score, fail, lead, id}
	let argsDate = new Date(args.date),
		tmpDate = new Date(argsDate.getFullYear(), argsDate.getMonth(), argsDate.getDate(), 12),
		dateField = document.getElementById('edit-monitor-modal-input-date')
	dateField.valueAsDate = tmpDate
	$('#edit-monitor-modal').find('.modal-title > span').html(agentsObj[args.agent].name)
	$('#edit-monitor-modal-select-agent').val(args.agent)
	//$('#edit-monitor-modal-input-date').val(tmpDate)
	$('#edit-monitor-modal-score').val(args.score)
	$('#edit-monitor-modal-check-fail').prop('checked', args.fail)
	$('#edit-monitor-modal-select-lead').val(args.lead)
	$('#edit-monitor-modal-id').val(args.id)
}
/**
 *	Add/Edit Modal Controls
 */
function dbAgentUpdate(args, field) {
	// update agentsDb
	// requires args object + field names object
	return new Promise(function (resolve, reject) {
		switch (args.type) {
			case 'edit-agent-modal':
				agentsDb.update({_id: args['edit-agent-modal-id'],}, {
					$set: {
						'abbv': args['edit-agent-modal-abbv'],
						'name': args['edit-agent-modal-name'],
						'monitors': args['edit-agent-modal-monitors'],
						'agentid': args['edit-agent-modal-agent-id'],
						'inactive': args['edit-agent-modal-inactive']
					}
				}, {}, function (error, numReplaced) {
					//done
					if (error) {
						//throw {message: error, field: $(field)}
						reject({
							message: error,
							field: $(field)
						})
					} else {

						return resolve(numReplaced);
					}
				})
				break;

			case 'remove-agent-modal':
			console.log(args)
				if (args['remove-agent-modal-inactive'] == 1) {
					agentsDb.update({_id: args['remove-agent-modal-id']}, {
						'$set': {
							inactive: 0
						}
					}, {}, function (error, numReplaced) {
						//done
						if (error) {
							//throw {message: error, field: $(field)}
							reject({
								message: error,
								field: $(field)
							})
						} else {
							//importAgents()
							return resolve(numReplaced);
						}
					})
				} else {
					agentsDb.update({_id: args['remove-agent-modal-id']}, {
						'$set': {
							inactive: 1
						}
					}, {}, function (error, numReplaced) {
						//done
						if (error) {
							//throw {message: error, field: $(field)}
							reject({
								message: error,
								field: $(field)
							})
						} else {
							//importAgents()
							return resolve(numReplaced);
						}
					})
				}

				break;

		}
	}).catch(function (err) {
		errorHandling({
			message: err,
			field: 'post'
		})
	})

}

function dbLeadUpdate(args, field) {
	// update leadsDb
	// requires args object + field names object
	return new Promise(function (resolve, reject) {
		switch (args.type) {
			case 'edit-lead-modal':
				leadsDb.update({_id: args['edit-lead-modal-id']}, {
					$set: {
						'abbv': args['edit-lead-modal-abbv'],
						'name': args['edit-lead-modal-name'],
						'inactive': args['edit-lead-modal-inactive']
					}
				}, {}, function (error, numReplaced) {
					//done
					if (error) {
						//throw {message: error, field: $(field)}
						reject({
							message: error,
							field: $(field)
						})
					} else {
						//importLeads()
						return resolve(numReplaced);
					}
				})
				break;
			case 'remove-lead-modal':
				if (args['remove-lead-modal-inactive'] == 0) {
					leadsDb.update({_id: args['remove-lead-modal-id']}, {
						'$set': {
							inactive: 1
						}
					}, {}, function (error, numReplaced) {
						if (error) {
							//throw {message: error, field: $(field)}
							reject({
								message: error,
								field: $(field)
							})
						} else {
							//importLeads()
							return resolve(numReplaced);
						}
					})
				} else {
					leadsDb.update({'_id': args['remove-lead-modal-id']}, {
						'$set': {
							inactive: 0
						}
					}, {}, function (error, numReplaced) {
						if (error) {
							//throw {message: error, field: $(field)}
							reject({
								message: error,
								field: $(field)
							})
						} else {
							//importLeads()
							return resolve(numReplaced);
						}
					})
				}
				break;
		}
	}).catch(function (err) {
		errorHandling({
			message: err,
			field: 'post'
		})
	})
}

function dbAddAgent(args, field) {
	// insert a new agent into agentsDb
	var inserted = {
		'abbv': args['add-agent-modal-abbv'],
		'name': args['add-agent-modal-name'],
		'monitors': args['add-agent-modal-monitors'],
		'agentid': args['add-agent-modal-agent-id'],
		'inactive': args['add-agent-modal-inactive']
	}
	return new Promise(function (resolve, reject) {
		agentsDb.insert(inserted, function (error, insertedRow) {
			//done
			if (error) {
				//throw {message: error, field: $(field)}
				return reject({
						message: error,
						field: $(field)
					})
			} else {
				importAgents()
				return resolve(insertedRow);
			}
		})
	}).catch(function (err) {
		errorHandling({
			message: err,
			field: 'post'
		})
	})
}

function dbAddLead(args, field) {
	// insert a new lead into leadsDb
	var inserted = {
		'abbv': args['add-lead-modal-abbv'],
		'name': args['add-lead-modal-name'],
		'inactive': args['add-lead-modal-inactive']
	}
	return new Promise(function (resolve, reject) {
		leadsDb.insert(inserted, function (error, insertedRow) {
			//done
			if (error) {
				//throw {message: error, field: $(field)}
				return reject({
						message: error,
						field: $(field)
					})
			} else {
				importLeads()
				return resolve(insertedRow);
			}
		})
	}).catch(function (err) {
		errorHandling({
			message: err,
			field: 'post'
		})
	})
}

function modalErrorHandling(err) {
	// error handling for edit monitor modal
	// requires err object {err, field}
	var findInput = $(err.field)
	var findLabel = $(findInput).find('.help-block')
	$(findInput).addClass('has-error')
	$(findLabel).addClass('has-error').html(err.message)
	var timeout = setTimeout(function () {
		$(findInput).toggleClass('has-error')
		$(findLabel).toggleClass('has-error').html('')
	}, 4000);
}

function dbUpdate(row, eField) {
	// update the monitors database with the edit from edit-monitor-modal
	return new Promise(function (resolve, reject) {
		//console.log(db)
		db.update({
			'_id': row._id
		}, {
			$set: {
				'date': row.date,
				'agent': row.agent,
				'score': row.score,
				'fail': row.fail,
				'lead': row.lead
			}
		}, {}, function (error, numReplaced) {
			//done
			if (error) {
				return reject({
					message: error,
					field: eField
				})
			} else {
				importLeads()
				return resolve(numReplaced)
			}
		})
	}).catch(function (err) {
		errorHandling({
			message: err,
			field: 'post'
		})
	})

}

function validateEditModal(d, a, f, l, s, i, fields, eField) {
	//console.log(inputValues);
	try {
		let validAgent = checkAgent(a, fields.a),
			validDate = checkFuture(d, fields.d),
			validScore = checkScore(s, fields.s),
			validFail = checkFail(f, fields.f),
			validId = checkId(i, fields.i),
			validLead = checkLead(l, fields.l)
		if (validFail === true) {
			validScore = 0;
		}

		dbUpdate({
				'date': validDate,
				'agent': validAgent,
				'score': validScore,
				'fail': validFail,
				'lead': validLead,
				'_id': validId
			}, eField)
			.then(
				location.reload()
			)
		//location.reload()
	} catch (err) {
		console.log(err.message);
		console.log(err.field);
		modalErrorHandling(err)
	}
}

function validateModal(type, args, eField) {
	try {
		switch (type) {
			case 'edit-agent-modal':
				args.type = 'edit-agent-modal';
				if (!args['edit-agent-modal-abbv']) {
					throw {
						message: 'You must enter an abbreviation for the agent!',
						field: $('#' + type + '-abbv').parent()
					}
				}
				if (!args['edit-agent-modal-name']) {
					throw {
						message: 'You must enter an agent\'s name!',
						field: $('#' + type + '-name').parent()
					}
				}
				if (args['edit-agent-modal-monitors'] < 1) {
					throw {
						message: 'The number of monitors must be greater than zero!',
						field: $('#' + type + '-monitors').parent()
					}
				}
				if (args['edit-agent-modal-agent-id'] < 1) {
					throw {
						message: 'You must enter an agent ID!',
						field: $('#' + type + '-agent-id').parent()
					}
				}
				var divs = $('.agentid'),
					vals = []
				$(divs).each(function (k, v) {
					vals.push(v.innerHTML)
				})
				if (vals.includes(args['edit-agent-modal-agent-id']) && parseInt(args['edit-agent-modal-agent-id']) !== $('#edit-agent-modal-name').data('oldId')) {
					throw {
						message: 'The Agent ID must be unique!',
						field: $('#' + type + '-agent-id').parent()
					}
				}
				dbAgentUpdate(args, $('#' + type + '-success'))
					.then(importAgents())
				break;
			case 'edit-lead-modal':
				args.type = 'edit-lead-modal';
				if (!args['edit-lead-modal-abbv']) {
					throw {
						message: 'You must enter an abbreviation for the lead!',
						field: $('#' + type + '-abbv').parent()
					}
				}
				if (!args['edit-lead-modal-name']) {
					throw {
						message: 'You must enter a lead\'s name!',
						field: $('#' + type + '-name').parent()
					}
				}
				dbLeadUpdate(args, $('#' + type + '-success'))
					.then(importLeads());
				break;
			case 'remove-agent-modal':
				args.type = 'remove-agent-modal';
				dbAgentUpdate(args, $('#' + type + '-success'))
					.then(importAgents());
				break;
			case 'remove-lead-modal':
				args.type = 'remove-lead-modal';
				dbLeadUpdate(args, $('#' + type + '-success'))
					.then(importLeads());
				break;
			case 'add-agent-modal':
				args.type = 'add-agent-modal';
				if (!args['add-agent-modal-abbv']) {
					throw {
						message: 'You must enter an abbreviation for the agent!',
						field: $('#' + type + '-abbv').parent()
					}
				}
				if (!args['add-agent-modal-name']) {
					throw {
						message: 'You must enter an agent\'s name!',
						field: $('#' + type + '-abbv').parent()
					}
				}
				if (args['add-agent-modal-monitors'] < 1) {
					throw {
						message: 'The number of monitors must be greater than zero!',
						field: $('#' + type + '-abbv').parent()
					}
				}
				dbAddAgent(args, $('#' + type + '-success'))
					.then(importAgents());
				break;
			case 'add-lead-modal':
				args.type = 'add-lead-modal';
				if (!args['add-lead-modal-abbv']) {
					throw {
						message: 'You must enter an abbreviation for the lead!',
						field: $('#' + type + '-abbv').parent()
					}
				}
				if (!args['add-lead-modal-name']) {
					throw {
						message: 'You must enter a lead\'s name!',
						field: $('#' + type + '-name').parent()
					}
				}
				dbAddLead(args, $('#' + type + '-success'))
					.then(importLeads());
				break;
			default:
				break;
		}
		$('.modal').modal('hide')

	} catch (err) {
		console.log(err.message);
		console.log(err.field);
		modalErrorHandling(err)
	}
}

function pullLeadMonth(month, lead) {
	month = month.slice(0, -3)
	var reg = new RegExp(month)


	var query = {
			'$and': [{
				date: {
					'$gte': startOfMonth
				}
			}, {
				date: {
					'$lte': endOfMonth
				}
			}, {
				lead: lead
			}]
		},
		sort = {
			date: 1
		}

	pullAgentMonitors(query, sort).then(function (result) {
		if (Object.keys(result).length > 0) {
			loadLeadSearch(result, month)
		} else {
			loadBlankLeadSearch(month)
		}
	})
}

function loadBlankLeadSearch(month) {
	var table = document.getElementById('leadmonitors-tbody')
	table.innerHTML = "";
	var row = document.createElement('tr'),
		dateTd = document.createElement('td');
	row.id = "blankresult";
	dateTd.innerHTML = 'No results found for ' + month;
	$(dateTd).attr('colspan', '4')
	row.appendChild(dateTd)
	table.appendChild(row)

}

function loadLeadSearch(result, month) {
	var table = document.getElementById('leadmonitors-tbody')
	table.innerHTML = "";
	//loop through the result of rows
	$.each(result, function (k, v) {
		//loop through each row
		var resultDate = new Date(v.date),
			resultYear = resultDate.getFullYear(),
			resultMM = ("0" + (resultDate.getMonth() + 1)).slice(-2),
			resultDD = ("0" + resultDate.getDate()).slice(-2),
			resultDateString = resultYear + '-' + resultMM + '-' + resultDD,
			row = document.createElement('tr'),
			dateTd = document.createElement('td'),
			nameTd = document.createElement('td'),
			failTd = document.createElement('td'),
			scoreTd = document.createElement('td');

		row.id = 'leadmonitor-' + v._id
		dateTd.innerHTML = resultDateString;
		nameTd.innerHTML = agentsObj[v.agent].name;
		scoreTd.innerHTML = v.score + ' %';
		$(row).attr('data-date', v.date)
			.attr('data-agent', v.agent)
			.attr('data-fail', v.fail)
			.attr('data-score', v.score)
			.attr('data-id', v._id)
		if (v.fail == true) {
			failTd.innerHTML = '<span class="glyphicon glyphicon-ok">'
		} else {
			failTd.innerHTML = '';
		}

		row.appendChild(dateTd);
		row.appendChild(nameTd);
		row.appendChild(scoreTd);
		row.appendChild(failTd);
		table.appendChild(row);
	})
}

/**
 *	Global Event Listeners
 */
$(window).on('load', function () {
	setDate()
	importLeads()
	// to resolve the crazy timing issue with the agent and lead agentLeadObject
	// importAgents is called within importLeads()
	// pullThisMonth is called within the importAgents() function
	// Edit/Add buttons for managing leads can be found in the event listners function

	$('#form-monitors').submit(function (e) {
		e.preventDefault();
		var aField = document.getElementById(agentSelect),
			lField = document.getElementById(leadSelect),
			fField = document.getElementById(failCheck),
			dField = document.getElementById(dateInput),
			sField = document.getElementById(scoreInput),
			a = aField.value,
			l = lField.value,
			f = fField.checked,
			d = new Date(dField.value.replace(/-/g, '\/')),
			s = sField.value;

		let fields = {
			"a": aField,
			"l": lField,
			"f": fField,
			"d": dField,
			"s": sField
		}
		validate(d, a, f, l, s, fields);
	})

	$('.modal-submit').click(function (e) {
		//delete modalArgs;
		let parentModal = $(this).parent().parent().parent().parent(),
			type = $(parentModal).attr('id'),
			fields = $(this).parents('.modal-content').find('[name]'),
			modalArgs = {'type': type},
			errorFieldName = type.toString() + '-success';

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

	$(window).on('click', function (e) {
		
		if (e.target.dataset.section != $('.navbar-collapse') && $('.navbar-collapse').hasClass('in')) {
			$('.navbar-collapse').removeClass('in')
		}
	})

	$(function () {
		$('[data-toggle="tooltip"]').tooltip()
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
	$('.app-version').html(`v${app.getVersion()}`)
})
