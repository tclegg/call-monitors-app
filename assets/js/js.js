const {ipcRenderer} = require('electron')
		fs = require('fs'),
		path = require('path'),
		nedb = require('nedb'),
		date = new Date();
var today = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12),
		year = date.getFullYear(),
		mm = ("0"+(date.getMonth()+1)).slice(-2),
		dd = date.getDate(),
		thisMonth = year+'-'+mm,
		startOfMonth = new Date(year, date.getMonth(), 1),
		endOfMonth = new Date(year, date.getMonth()+1, 0),
		lastMonth = year+'-'+(("0"+(date.getMonth())).slice(-2)),
		dbname = 'monitors-'+year+'.db',
		fullDateWithSlashes = year + '/' + mm + '/'+dd,
		fullDateWithDashes =  year + '-' + mm + '-'+dd;

	if (!process.env.TODO_DEV){
			//////////////////////////
			// Production Datasbase //
			//////////////////////////

			var xDrive = 'X:/helpdesk/Tech Leads/Call Monitors/monitor-database'
			var	db = new nedb({filename: path.resolve(xDrive, dbname), autoload: true}),
					leadsDb = new nedb({filename: path.resolve(xDrive, 'leads.db'), autoload: true}),
					agentsDb = new nedb({filename: path.resolve(xDrive, 'agents.db'), autoload: true})
					console.log(xDrive);

		} else {
			//////////////////////////
			// Development Database //
			//////////////////////////

			var db = new nedb({filename: path.resolve(__dirname, '../../db/', dbname), autoload: true}),
					leadsDb = new nedb({filename: path.resolve(__dirname, '../../db/', 'leads.db'), autoload: true}),
					agentsDb = new nedb({filename: path.resolve(__dirname, '../../db/', 'agents.db'), autoload: true})
		}
var	agentSelect = 'select-agent',
		dateInput = 'input-date',
		failCheck = 'check-fail',
		leadSelect = 'select-lead',
		scoreInput = 'score-agents',
		months= {
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
		q1 = ["0", "1", "2"],
		q2 = ["3", "4", "5"],
		q3 = ["6", "7", "8"],
		q4 = ["9", "10", "11"],
		dateField = 'input-date',
		leadsObj = {},
		activeLeadsObj = {},
		agentsObj = {},
		activeAgentsObj = {},
		thisMonthMonitorsObj = {},
		lastMonthMonitorsObj = {},
		agentsArray = [],
		leadsArray = [],
		thisMonthMonitorsArray = [],
		quarterlyMonitorsArray = [],
		dbInterval = 60000,
		qstart = '',
		qend = '',
		qm = new Date()

		if ($.inArray(qm.getMonth(), q1)){
			qstart = new Date(year, 0, 1)
			qend = new Date(year, 2,31)
			} else if ($.inArray(qm.getMonth(), q2)) {
				qstart = new Date(year, 3, 1)
				qend = new Date(year, 5, 30)
				} else if ($.inArray(qm.getMonth(), q3)) {
					qstart = new Date(year, 6, 1)
					qend = new Date(year, 8, 31)
					} else {
						qstart = new Date(year, 9, 1)
						qend = new Date(year, 11, 31)
					}

		//db.persistence.setAutocompactionInterval(dbInterval)
		//leadsDb.persistence.setAutocompactionInterval(dbInterval)
		//agentsDb.persistence.setAutocompactionInterval(dbInterval)



/**
* Table Population Tools
*/
function importLeads(){
	var query = {abbv: {'$regex': /^[a-zA-Z]/}}
	leadsDb.find(query).sort({name:1}).exec(function(err, data){
		$.each(data, function(k,v){
			if (v.inactive != 1){
				activeLeadsObj[v.abbv] = v;
			}
			leadsObj[v.abbv] = v
		})

		loadToLeadSelect();
		loadLeadsTable(data);
		importAgents()
	})
}
function loadToLeadSelect(){
	//create options and add to the select
	var out = document.getElementById(leadSelect),
			leadsMonitorSelect = document.getElementById('select-lead-search'),
			editMonitorLead = document.getElementById('edit-monitor-modal-select-lead')
			activeKeys = Object.keys(activeLeadsObj),
			allKeys = Object.keys(leadsObj),
			i = 0,
			x = 0
	out.innerHTML = '<option selected disabled value="0">Select Your Name</option>';
	leadsMonitorSelect.innerHTML = '<option selected disabled value="0">Select Your Name</option>';
	editMonitorLead.innerHTML = '<option selected disabled value="0">Select Your Name</option>'
	$(activeKeys).each(function(k, v){
		var option = document.createElement('option');
		$(option).val(activeLeadsObj[v].abbv)
						.html(activeLeadsObj[v].name)
						.data('lead-id', activeLeadsObj[v]._id)
		out.appendChild(option);
		i++
	})
	$(allKeys).each(function(k,v){
		let allLeadsOption = document.createElement('option'),
				modalLeadsOption = document.createElement('option');
		$(allLeadsOption).val(leadsObj[v].abbv)
							.html(leadsObj[v].name)
							.attr('data-lead-id', leadsObj[v]._id)
		$(modalLeadsOption).val(leadsObj[v].abbv)
							.html(leadsObj[v].name)
							.attr('data-lead-id', leadsObj[v]._id)

		leadsMonitorSelect.appendChild(allLeadsOption);
		editMonitorLead.appendChild(modalLeadsOption);
		x++
	})
}
function loadLeadsTable(data){
	var table = document.getElementById('edit-leads-tbody')
	table.innerHTML = '';
	//var arr = Object.keys(data);
	var nameValue;
	var arr = Object.keys(data)
	for (i=0; i < arr.length; i++){
		var nameValue = data[i].name,
				abbreviation = data[i].abbv,
				inactive = data[i].inactive,
				leadId = data[i]._id;

		//var nameValue = data[name];
		var fullNameTD = document.createElement('td'),
				abbreviationTD = document.createElement('td'),
				edit = document.createElement('td'),
				remove = document.createElement('td'),
				row = document.createElement('tr'),
				editHTML = '<a class="edit-lead" href="#" id="edit-'+abbreviation+'"><span class="glyphicon glyphicon-pencil"></span></a>',
				removeHTML = '<a class="remove-lead" href="#" id="remove-'+abbreviation+'"><span class="glyphicon glyphicon-remove"></span></a>'
		$(row).attr('data-abbv', abbreviation)
					.attr('data-name', nameValue)
					.attr('data-id', leadId)
					.attr('data-inactive', inactive)
					.attr('id', leadId);
		if (inactive == 1){
			$(row).css('text-decoration', 'line-through')
		}
		fullNameTD.innerHTML = nameValue
		abbreviationTD.innerHTML = abbreviation

		edit.innerHTML = editHTML
		remove.innerHTML = removeHTML
		row.appendChild(fullNameTD)
		row.appendChild(abbreviationTD)
		row.appendChild(edit)
		row.appendChild(remove)
		table.appendChild(row)
	}
	$('.edit-lead').click( function (e) {
		e.preventDefault();
		var parentData = $(this).parent().parent()
		var args = {'type': 'edit-lead',
								'abbv': $(parentData).data('abbv'),
								'name': $(parentData).data('name'),
								'id': $(parentData).data('id'),
								'inactive': $(parentData).data('inactive')}
		showModal(args)
	})
	$('.remove-lead').click(function(e){
		e.preventDefault();
		var parentData = $(this).parent().parent()
		var args = {'type': 'remove-lead',
								'id': $(parentData).data('id'),
								'name': $(parentData).data('name'),
								'inactive': $(parentData).data('inactive')}
		showModal(args)
	})
	$('.add-lead').click(function(e){
		e.preventDefault()
		var args = {'type': 'add-lead'}
		showModal(args)
	})
}
function importAgents(){
	var query = {abbv: {'$regex': /^[a-z]/}}
	agentsDb.find(query).sort({name:1}).exec(function(err, data){
		$.each(data, function(k,v){
			if(v.inactive != 1){
				activeAgentsObj[v.abbv] = v;
			}
			agentsObj[v.abbv] = v;
		})

		loadToAgentSelect(data)
		loadAgentsTable(data)
		pullThisMonth()
		pullLastMonth()
	})
}
function loadToAgentSelect(data){
	var out = document.getElementById(agentSelect),
			editMonitorAgent = document.getElementById('edit-monitor-modal-select-agent');
	out.innerHTML = '<option selected disabled value="0">Select The Agent You Monitored</option>';
	editMonitorAgent.innerHTML = '<option selected disabled value="0">Select The Agent You Monitored</option>';
	for (i=0; i < data.length; i++) {
		var nameValue = data[i].name,
				abbreviation = data[i].abbv,
				agentId = data[i]._id,
				agentOption = document.createElement('option')
				modalOption = document.createElement('option');
		$(agentOption).val(abbreviation).html(nameValue).attr('data-agent-id', agentId)
		$(modalOption).val(abbreviation).html(nameValue).attr('data-agent-id', agentId)
		out.appendChild(agentOption);
		editMonitorAgent.appendChild(modalOption)
	}
}
function loadAgentsTable(data){
	var table = document.getElementById('edit-agents-tbody')
	var arr = Object.keys(data);
	table.innerHTML = '';

	for (i=0; i < arr.length; i++){
		let nameValue = data[i].name,
				abbreviation = data[i].abbv,
				requiredMonitors = data[i].monitors,
				inactive = data[i].inactive,
				agentId = data[i]._id,
				fullNameTD = document.createElement('td'),
				abbreviationTD = document.createElement('td'),
				edit = document.createElement('td'),
				remove = document.createElement('td'),
				monitors = document.createElement('td'),
				row = document.createElement('tr'),
				editHTML = '<a class="edit-agent" href="#" id="edit-'+abbreviation+'"><span class="glyphicon glyphicon-pencil"></span></a>',
				removeHTML = '<a class="remove-agent" href="#" id="remove-'+abbreviation+'"><span class="glyphicon glyphicon-remove"></span></a>';
		$(row).attr('data-abbv', abbreviation)
					.attr('data-name', nameValue)
					.attr('data-monitors', requiredMonitors)
					.attr('data-id', agentId)
					.attr('data-inactive', inactive)
					.attr('id', agentId);
		if (inactive == 1){
			$(row).css('text-decoration', 'line-through')
		}
		fullNameTD.innerHTML = nameValue.toString()
		abbreviationTD.innerHTML = abbreviation
		edit.innerHTML = editHTML
		edit.id = 'edit-'+agentId
		remove.innerHTML = removeHTML
		monitors.innerHTML = requiredMonitors
		row.appendChild(fullNameTD)
		row.appendChild(abbreviationTD)
		row.appendChild(monitors)
		row.appendChild(edit)
		row.appendChild(remove)
		table.appendChild(row)
	}
	$('.edit-agent').click( function (e) {
		e.preventDefault();
		var parentData = $(this).parent().parent()
		var args = {'type': 'edit-agent',
								'abbv': $(parentData).data('abbv'),
								'name': $(parentData).data('name'),
								'id': $(parentData).data('id'),
								'monitors': $(parentData).data('monitors'),
								'inactive': $(parentData).data('inactive')}
		showModal(args);
	})
	$('.remove-agent').click(function(e){
		e.preventDefault();
		var parentData = $(this).parent().parent()
		var args = {'type':'remove-agent',
								'id': $(parentData).data('id'),
								'name': $(parentData).data('name'),
								'inactive': $(parentData).data('inactive')}
		showModal(args);
	})
	$('.add-agent').click(function(e){
		e.preventDefault()
		var args = {'type': 'add-agent'}
		showModal(args)
	})
}
/**
* Monitors Tools
*/
function post(row){
	/**
	posts to the monitors(year).db
	vars: row		object	required
	*/
	db.insert(row)
	location.reload()
}
function completed(result){
	var table = document.getElementById('completed-monitors-tbody')
	//console.log(result);
	//loop through the result of rows
	$.each(result, function(k, v){
		//loop through each row
		let resultDate = new Date(v.date)
				resultYear = resultDate.getFullYear(),
				resultMM = ("0"+(resultDate.getMonth()+1)).slice(-2),
				resultDD = ("0"+resultDate.getDate()).slice(-2),
				resultDateString = resultYear+'-'+resultMM+'-'+resultDD,
				dateTd = document.createElement('td'),
				nameTd = document.createElement('td'),
				scoreTd = document.createElement('td'),
				failTd = document.createElement('td'),
				leadTd = document.createElement('td'),
				leadAbbv = v.lead.toString()
				row = document.createElement('tr');

		row.id = v._id;
		dateTd.innerHTML = resultDateString;
		nameTd.innerHTML = agentsObj[v.agent].name;
		$(row).attr('data-date', v.date)
					.attr('data-agent', v.agent)
					.attr('data-fail', v.fail)
					.attr('data-lead', v.lead)
					.attr('data-id', v._id)
		scoreTd.innerHTML = v.score+' %';
		if(v.fail == true){
			failTd.innerHTML = '<span class="glyphicon glyphicon-ok">';
			$(scoreTd).addClass('bg-danger')
		} else {
			failTd.innerHTML = '';
		}
		leadTd.id = v.lead;
		leadTd.innerHTML = leadsObj[v.lead].name

		row.appendChild(dateTd);
		row.appendChild(nameTd);
		row.appendChild(scoreTd);
		row.appendChild(failTd);
		row.appendChild(leadTd);
		table.appendChild(row);
	})
}
function pullAgentMonitors(query, sort){
	// async datastore connction from the montiors db
	// returns the promise that it has completed the pull
	// so the next step can be perfromed

	return new Promise(function(resolve, reject){
		db.find(query).sort(sort).exec(function (err, result){
			if (err) {
				reject(err)
			} else {
				resolve(result)
			}
		})
	})
}
function buildRow(agent, monitors){
	var tmpObj = [],
			panelGroup = document.getElementById('agent-accordion-tbody'),
			panelHead = document.createElement('tr'),
			nameTd = document.createElement('td'),
			completedTd = document.createElement('td'),
			avgTd = document.createElement('td'),
			qAvgTd = document.createElement('td'),
			subTableRow = document.createElement('tr'),
			subTableTd = document.createElement('td'),
			subTableDiv = document.createElement('div'),
			subTable = document.createElement('table'),
			subThead = document.createElement('thead'),
			subTbody = document.createElement('tbody'),
			agentName = agentsObj[agent].name
	$(qAvgTd).attr('id', agent+'-qAvg')
	if (monitors.length > 0){
		let score = 0,
		 		count = 0;
		//Accordion Header Tools
		$.each(monitors, function(k,v){
			if (v.fail !== true){
				score = score + parseInt(v.score)
			}
			count++
			let resultDate = new Date(v.date)
					resultYear = resultDate.getFullYear(),
					resultMM = ("0"+(resultDate.getMonth()+1)).slice(-2),
					resultDD = ("0"+resultDate.getDate()).slice(-2),
					resultDateString = resultYear+'-'+resultMM+'-'+resultDD,
					row = document.createElement('tr'),
					dateTd = document.createElement('td'),
					scoreTd = document.createElement('td'),
					failTd = document.createElement('td'),
					leadTd = document.createElement('td'),
					editTd = document.createElement('td')
			dateTd.innerHTML = resultDateString
			scoreTd.innerHTML = v.score+' %'
			$(editTd).html('<span class="glyphicon glyphicon-cog edit-monitor"></span>')
							.attr('data', 'id').data('id', v._id)
							.attr('data', 'score').data('score', v.score)
							.attr('data', 'name').data('agent', v.agent)
							.attr('data', 'date').data('date', v.date)
							.attr('data', 'fail').data('fail', v.fail)
							.attr('data', 'lead').data('lead', v.lead)
			let leadName = leadsObj[v.lead].name
			if (v.fail == true) {
				$(failTd).addClass('bg-danger').html('<span class="glyphicon glyphicon-ok"></span>')
				$(dateTd).addClass('bg-danger')
				$(scoreTd).addClass('bg-danger')
				$(leadTd).addClass('bg-danger')
				$(editTd).addClass('bg-danger')
			}
			leadTd.innerHTML = leadName
			$(row).append(dateTd, scoreTd, failTd, leadTd, editTd)
						.attr('id', v._id)
			$(subTbody).append(row)
		})
		$(subThead).html('<th>Date</th><th>Score</th><th>Auto-Fail</th><th>Lead</th><th>Edit</th>')
		$(subTbody).attr('id', agent+'-tbody')
		$(subTable).attr('width', '100%').addClass('table table-striped')
							 .append(subThead).append(subTbody)
		$(subTableDiv).addClass('well').append(subTable)
		$(subTableTd).attr('colspan', '4').append(subTableDiv)

		$(subTableRow).addClass('accordion-body collapse').attr('id', agent+'Table')
									.append(subTableTd)
		let avg = score/count
		$(nameTd).html(agentName)
		$(avgTd).html(avg.toFixed()+' %')
		if (avg < 75){
			$(avgTd).addClass('bg-danger')
		}
		$(completedTd).html(count)
		$(panelHead).addClass('accordion-toggle')
								.attr('data-parent', '#agent-accordion-tbody')
								.attr('data-toggle', 'collapse')
								.attr('data-target', '#'+agent+'Table')
								.append(nameTd).append(completedTd)
								.append(avgTd).append(qAvgTd)

		$(panelGroup).append(panelHead).append(subTableRow)
	} else {

		$(subThead).html('<th>Date</th><th>Score</th><th>Auto-Fail</th><th>Lead</th>')
		$(subTbody).attr('id', agent+'-tbody')
		$(subTable).attr('width', '100%').addClass('table table-striped')
							 .append(subThead).append(subTbody)
		$(subTableDiv).addClass('well').append(subTable)
		$(subTableTd).attr('colspan', '4').append(subTableDiv)

		$(subTableRow).addClass('accordion-body collapse').attr('id', agent+'Table')
									.append(subTableTd)
		$(nameTd).html(agentName)
		$(panelHead).addClass('accordion-toggle')
								.attr('data-toggle', 'collapse')
								.attr('data-target', '#'+agent+'Table')
								.append(nameTd).append(completedTd)
								.append(avgTd).append(qAvgTd)

		$(panelGroup).append(panelHead).append(subTableRow)
	}
	$('.accordion-toggle').css('cursor', 'pointer')
			//console.log(agent, monitors);
}
function fillQuarter(agent, monitors){
	let count = 0, score = 0, qAverage = 0, avgTd = document.getElementById(agent+'-qAvg')

	if(monitors.length > 0){
		$.each(monitors, function(k,v){
			count++
			if (v.fail !== true){
				score += parseInt(v.score)
			}
			//console.log(score);
		})

		qAverage = score/count

		if (qAverage < 75){
			$(avgTd).addClass('bg-danger')
		}
		$(avgTd).html(qAverage.toFixed() + ' %')
		//console.log(avgTd, qAverage, avgTd.innerHTML);
	}
}
function completedPerAgent(){

	let query={'$and':[{date: {'$gte': startOfMonth}}, {date: {'$lte': endOfMonth}}]},
			queryQuarter={'$and':[{date: {'$gte': qstart}}, {date: {'$lte': qend}}]},
			sort = {agent: 1},
			count = 0
	pullAgentMonitors(query, sort).then(function(result){
		for (i in agentsObj){
			let monitors = result.filter(x => x.agent === i)
		//	console.log(monitors.length);
			//row.appendChild(nameTd).appendChild(scoreTd).
			//panelGroup.appendChild(row)
			buildRow(i, monitors)
			//console.log('in build');
		}
		$('.edit-monitor').on('click', function(e){
			var parentData = $(this).parent()
			var args = {'type': 'edit-monitor',
									'id': $(parentData).data('id'),
									'agent': $(parentData).data('agent'),
									'date': $(parentData).data('date'),
									'score': $(parentData).data('score'),
									'fail': $(parentData).data('fail'),
									'lead': $(parentData).data('lead')}
			showModal(args)
		})

		let timeout = setTimeout(function () {
			$('#agent-acordion-tbody:first-child').collapse('show');
		}, 1000);
	})
	pullAgentMonitors(queryQuarter, sort).then(function(result){
		for (i in agentsObj){
			var monitors = result.filter(x => x.agent ===i)
			fillQuarter(i, monitors)
			//console.log('in fill')
		}
	})

}

/*function agentsToArray(){
	var tmpArr = [],
			agentKeys = Object.keys(agentsObj);
	$(agentKeys).each(function (k,v){
		$(agentsObj[v]).each(function(key, val){
			var tmpKeys = Object.keys(agentsObj[v])
			console.log(v, val);
			tmpArr[v] = [["abbv", val.abbv],["name", val.name],["monitors", val.monitors],["inactive", val.inactive], ["_id", val._id]]
			//console.log(key,val.abbv);
		})
		//console.log(agentsObj[v]);
		//tmpArr[v] = Array.from(agentsObj[v])
	})
	//console.log(tmpArr);
	//console.log(Array.from(agentsObj));
}
*/
function resultToArray(){

}

function needed(result){
	var table = document.getElementById('needed-monitors-tbody'),
			result = result,
			recentFail = false;
	var agentKeys = Object.keys(agentsObj),
			monitorsKeys = Object.keys(thisMonthMonitorsObj);
	//WhereAmI
	var n = document.createElement('tr')
	//n.innerHTML = ''
	table.appendChild(n)

	if (result != ""){
		// loop through all the agents

		$(agentKeys).each(function(key, val){
			//key = numerical key
			//val = agent abbreviation
			var count = 0
			var recentFail = false, failDate = '';
			$(result).each(function(key2, val2){
				//key2 = numerical value of the key
				//val2 = monitor row properties

				if (val2.agent == val && val2.fail != true){
					count++;
				} else	if (val2.agent == val && val2.fail == true) {
					recentFail = true;
					failDate = val2.date
				}
			})
			var monitorsLeft = agentsObj[agentKeys[key]].monitors - count;
			if (monitorsLeft <= 0){return;}

			var row = document.createElement('tr'),
					dateTd = document.createElement('td'),
					nameTd = document.createElement('td'),
					numberTd = document.createElement('td'),
					dateTdId = agentsObj[agentKeys[key]].abbv,
					nameTdId = agentsObj[agentKeys[key]].abbv + '-name',
					numberTdId = agentsObj[agentKeys[key]].abbv + '-id';
			$(dateTd).attr('id', dateTdId).html(thisMonth)
			$(nameTd).attr('id', nameTdId).html(agentsObj[agentKeys[key]].name)
			$(numberTd).attr('id', numberTdId).html(monitorsLeft)
			$(row).attr('id', 'row-'+agentsObj[agentKeys[key]]._id)
			if (recentFail == true){
				$(row).attr('data-toggle', 'tooltip').attr('title', `Failed on ${failDate}`)
				$(dateTd).addClass('bg-danger')
				$(nameTd).addClass('bg-danger')
				$(numberTd).addClass('bg-danger')
			}
			row.appendChild(dateTd)
			row.appendChild(nameTd)
			row.appendChild(numberTd)
			table.appendChild(row)
			count = 0;
			$(function(){
				$('[data-toggle="tooltip"]').tooltip()
			})
		})
	} else {
		for (var i=0; i>agentKeys.length; i++){
				var row = document.createElement('tr'),
						dateTd = document.createElement('td'),
						nameTd = document.createElement('td'),
						numberTd = document.createElement('td')
						dateTdId = agentsObj[agentKeys[i]].abbv,
						nameTdId = agentsObj[agentKeys[i]].abbv + '-name',
						numberTdId = agentsObj[agentKeys[i]].abbv + '-id';
				$(dateTd).attr('id', dateTdId).html(thisMonth)
				$(nameTd).attr('id', nameTdId).html(agentsObj[agentKeys[i]].name)
				$(numberTd).attr('id', numberTdId).html(agentsObj[agentKeys[i]].monitors)
				$(row).attr('id', 'row-'+agentsObj[agentKeys[i]]._id)
				row.appendChild(dateTd)
				row.appendChild(nameTd)
				row.appendChild(numberTd)
				table.appendChild(row)
		}
	}
}
function pullThisMonth(){
	let query = {'$and': [{date: {'$gte': startOfMonth}}, {date: {'$lte':endOfMonth}}]},
			sort = {date: 1}
	pullAgentMonitors(query, sort).then(function(result){
		completed(result);
		needed(result);
	})

	completedPerAgent()
}
function pullQuarter(q){

}
function pullLastMonth(){
	var reg = new RegExp(lastMonth)
	var query = {date: {'$regex': reg}}
	db.find(query).sort({date:1}).exec(
		function(err, result){
			lastMonthMonitorsObj = result;
			//needed(result)
		}
	)
}
/**
* Date Tools
*/
function setDate(){
	//Sets the date index-main.html and allmonitors.html
	let inputdate = document.getElementById(dateField),
			monitorsH2 = document.getElementById('monitorsH2'),
			leadsSearchDate = document.getElementById('input-date-search')

	inputdate.valueAsDate = today;
	leadsSearchDate.valueAsDate = today;
	monitorsH2.innerHTML = 'Monitors for '+monthName;

}
/**
* Form Validation Tools
*/
function checkFuture(d, field){
	if (d == null || d == " "){
		throw {message: 'You must enter a date!', field:field}
	} else if (d > date) {
		throw {message:'You cannot enter a date in the future!', field:field}
	} else {
		return d
	}
}
function checkAgent(a, field){
	if (a == null || a == " " || a === '0'){
		throw {message: 'You must select an agent!', field: field}
	}	else {
		return a
	}
}
function checkScore(s, field){
	if (s == null || s == "" || s < 0){
		throw{message: 'The score must be greater than 0!', field: field}
	} else {
		return s
	}
}
function checkFail(f, field){
	if (f !== true && f !== false){
		throw{message: 'You cannot do this!', field: field}
	} else {
		return f
	}
}
function checkLead(l, field){
	if (l == null || l == " " || l === '0'){
		throw {message:'You must select an lead!', field: field}
	} else {
		return l
	}
}
function checkId(i, field){
	if (!i || i == "" || i == " " || i == 0){
		throw{message: 'Missing the monitor ID. You cannot update the table. Reload the page and try again.', field: fields.i}
	} else {
		return i
	}
}

function errorHandling(err){
	var findInput = $(err.field).parents('.form-group')
	var findLabel = $(findInput).find('.help-block')
	$(findInput).addClass('has-error')
	$(findLabel).addClass('has-error').html(err.message)
	var timeout = setTimeout(function(){
		$(findInput).toggleClass('has-error')
		$(findLabel).toggleClass('has-error').html('')
	}, 4000);
}
function validate(d,a,f,l,s, fields){
	let inputValues = {d,a,f,l,s}

	try {
		var validDate = checkFuture(d, fields.d),
				validAgent = checkAgent(a, fields.a),
				validScore = checkScore(s, fields.s),
				validFail = checkFail(f, fields.f),
				validLead = checkLead(l, fields.l)
		if (validFail === true){
			validScore = 0;
		}
		post({"date": validDate, "agent":validAgent, "score":validScore, "fail": validFail, "lead": validLead})
	} catch (err){
		errorHandling(err)
	}
}

/**
* Modal Functions
*/
function showModal(args){
	var modalId = '#'+args.type+'-modal'
	$('.modal').on('shown.bs.modal', function(){
		switch (args.type){
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
				buildEditAgentModal(args)
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
function buildEditLeadModal(args){
	$('#edit-lead-modal').find('.modal-title').html(args.name)
	$('#edit-lead-modal-name').val(args.name)
	$('#edit-lead-modal-abbv').val(args.abbv)
	$('#edit-lead-modal-id').val(args.id)
	$('#edit-lead-modal-inactive').val(args.inactive)
}
function buildEditAgentModal(args){
	$('#edit-agent-modal').find('.modal-title').html(args.name)
	$('#edit-agent-modal-name').val(args.name)
	$('#edit-agent-modal-abbv').val(args.abbv)
	$('#edit-agent-modal-monitors').val(args.monitors)
	$('#edit-agent-modal-id').val(args.id)
	$('#edit-agent-modal-inactive').val(args.inactive)
}

function buildRemoveLeadModal(args){
	$('#remove-lead-modal').find('.modal-title').text(args.name)
	$('#remove-lead-modal-name').text(args.name)
	$('#remove-lead-modal-id').val(args.id)
	$('#remove-lead-modal-inactive').val(args.inactive)
	if (args.inactive == 1){
		$('#remove-lead-modal-type').html('Enable')
	} else {
		$('#remove-lead-modal-type').html('Disable')
	}
}
function buildRemoveAgentModal(args){
	$('#remove-agent-modal').find('.modal-title').html(args.name)
	$('#remove-agent-modal-name').text(args.name)
	$('#remove-agent-modal-id').val(args.id)
	$('#remove-agent-modal-inactive').val(args.inactive)
	if (args.inactive == 1){
		$('#remove-agent-modal-type').html('Enable')
	} else {
		$('#remove-agent-modal-type').html('Disable')
	}
}

function buildAddLeadModal(args){
	//$('#add-lead-modal').find('.modal-title').html(args.name)
	$('#add-lead-modal-name').val('')
	$('#add-lead-modal-abbv').val('')
	//$('#add-lead-modal-id').val('')
	//$('#edit-lead-modal-inactive').val(args.inactive)
}
function buildAddAgentModal(args){
	//$('#edit-agent-modal').find('.modal-title').html(args.name)
	$('#edit-agent-modal-name').val('')
	$('#edit-agent-modal-abbv').val('')
	$('#edit-agent-modal-monitors').val('')
	//$('#edit-agent-modal-id').val(args.id)
	//$('#edit-agent-modal-inactive').val(args.inactive)
}

function buildEditScoreModal(args){
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
function changeEditError (err){
	let errorField = $(err.field).parents('.form-group')
	let errorHelper = $(errorField).parent().find($('.help-block'))
	$(errorField).addClass('has-error')
	$(errorHelper).html(err.message).addClass('has-error')
	var timeout = setTimeout(function(){
		$(errorField).toggleClass('has-error')
		$(errorHelper).toggleClass('has-error').html('')
	}, 4000);
}
function dbAgentUpdate(args, field){
	// update database name
	// Names: leadsDb and agentsDb
	switch(args.type){
		case 'edit-agent-modal':
			agentsDb.update({_id: args['edit-agent-modal-id'], }, {$set: {'abbv': args['edit-agent-modal-abbv'], 'name': args['edit-agent-modal-name'], 'monitors': args['edit-agent-modal-monitors'], 'inactive': args['edit-agent-modal-inactive']}}, {}, function(error, numReplaced){
				//done
				if (error) {
					throw {message: error, field: $(field)}
				} else {
					importAgents()
					return true;
				}
			})
			break;

		case 'remove-agent-modal':
			if (args['remove-agent-modal-inactive'] == 1){
				agentsDb.update({_id: args['remove-agent-modal-id']}, {'$set': {inactive: 0}}, {}, function(error, numReplaced){
					//done
					if (error) {
						throw {message: error, field: $(field)}
					} else {
						importAgents()
						return true;
					}
				})
			} else {
				agentsDb.update({_id: args['remove-agent-modal-id']}, {'$set': {inactive: 1}}, {}, function(error, numReplaced){
					//done
					if (error) {
						throw {message: error, field: $(field)}
					} else {
						importAgents()
						return true;
					}
				})
			}

			break;

	}
}
function dbLeadUpdate(args, field){
	switch (args.type){
		case 'edit-lead-modal':
			leadsDb.update({_id: args['edit-lead-modal-id']}, {$set: {
							'abbv': args['edit-lead-modal-abbv'],
							'name': args['edit-lead-modal-name'],
							'inactive': args['edit-lead-modal-inactive']}
						}, {}, function(error, numReplaced){
				//done
				if (error) {
					throw {message: error, field: $(field)}
				} else {
					importLeads()
					return true;
				}
			})
			break;
		case 'remove-lead-modal':
			if (args['remove-lead-modal-inactive'] == 0){
				leadsDb.update({_id: args['remove-lead-modal-id']}, {'$set': {inactive: 1}}, {}, function(error, numReplaced){
					if (error) {
						throw {message: error, field: $(field)}
					} else {
						importLeads()
						return true;
					}
				})
			} else {
				leadsDb.update({'_id': args['remove-lead-modal-id']}, {'$set': {inactive: 0}}, {}, function(error, numReplaced){
					if (error) {
						throw {message: error, field: $(field)}
					} else {
						importLeads()
						//return true;
					}
				})
			}
			break;
	}
}
function dbAddAgent(args, field){
	var inserted = {'abbv': args['add-agent-modal-abbv'], 'name': args['add-agent-modal-name'], 'monitors': args['add-agent-modal-monitors'], 'inactive': args['add-agent-modal-inactive']}

	agentsDb.insert(inserted, function(error, insertedRow){
		//done
		if (error) {
			throw {message: error, field: $(field)}
		} else {
			importAgents()
			return true;
		}
	})
}
function dbAddLead(args, field){
	var inserted = {'abbv': args['add-lead-modal-abbv'], 'name': args['add-lead-modal-name'], 'inactive': args['add-lead-modal-inactive']}
	leadsDb.insert(inserted, function(error, insertedRow){
		//done
		if (error) {
			throw {message: error, field: $(field)}
		} else {
			importLeads()
			return true;
		}
	})
}
function modalErrorHandling(err){
	var findInput = $(err.field)
	var findLabel = $(findInput).find('.help-block')
	$(findInput).addClass('has-error')
	$(findLabel).addClass('has-error').html(err.message)
	var timeout = setTimeout(function(){
		$(findInput).toggleClass('has-error')
		$(findLabel).toggleClass('has-error').html('')
	}, 4000);
}
function dbUpdate(row){
	db.update({'_id': row._id}, {$set: {
					'date': row.date,
					'agent': row.agent,
					'score': row.score,
					'fail': row.fail,
					'lead': row.lead}
				}, {}, function(error, numReplaced){
		//done
		if (error) {
			throw {message: error, field: $(field)}
		} else {
			importLeads()
			return true;
		}
	})
}
function validateEditModal(d,a,f,l,s,i, fields){
	//console.log(inputValues);
	try {
		let validAgent = checkAgent(a, fields.a),
				validDate = checkFuture(d, fields.d),
				validScore = checkScore(s, fields.s),
				validFail = checkFail(f, fields.f),
				validId = checkId(i, fields.i),
				validLead = checkLead(l, fields.l)

		dbUpdate({'date': validDate, 'agent': validAgent, 'score': validScore, 'fail': validFail, 'lead': validLead, '_id': validId})
		location.reload()
	} catch (err){
		console.log(err.message);
		console.log(err.field);
		modalErrorHandling(err)
	}
}
function validateModal(type, args){
	try {
		switch(type){
			case 'edit-agent-modal':
				args.type = 'edit-agent-modal';
				if(!args['edit-agent-modal-abbv']){
					throw {message: 'You must enter an abbreviation for the agent!',
								field: $('#'+type+'-abbv').parent()}
				}
				if(!args['edit-agent-modal-name']){
					throw {message: 'You must enter an agent\'s name!',
								field: $('#'+type+'-name').parent()}
				}
				if(args['edit-agent-modal-monitors']<1){
					throw {message: 'The number of monitors must be greater than zero!',
								field: $('#'+type+'-monitors').parent()}
				}
				dbAgentUpdate(args, $('#'+type+'-success'));
				break;
			case 'edit-lead-modal':
				args.type = 'edit-lead-modal';
				if(!args['edit-lead-modal-abbv']){
					throw {message: 'You must enter an abbreviation for the lead!',
								field: $('#'+type+'-abbv').parent()}
				}
				if(!args['edit-lead-modal-name']){
					throw {message: 'You must enter a lead\'s name!',
								field: $('#'+type+'-name').parent()}
				}
				dbAgentUpdate(args, $('#'+type+'-success'));
				break;
			case 'remove-agent-modal':
				args.type = 'remove-lead-modal';
				dbLeadUpdate(args, $('#'+type+'-success'));
				break;
			case 'remove-lead-modal':
				args.type = 'remove-lead-modal';
				dbLeadUpdate(args, $('#'+type+'-success'));
				break;
			case 'add-agent-modal':
				args.type = 'add-agent-modal';
				//console.log(args);
				if(!args['add-agent-modal-abbv']){
					throw {message: 'You must enter an abbreviation for the agent!',
								field: $('#'+type+'-abbv').parent()}
				}
				if(!args['add-agent-modal-name']){
					throw {message: 'You must enter an agent\'s name!',
								field: $('#'+type+'-abbv').parent()}
				}
				if(args['add-agent-modal-monitors']<1){
					throw {message: 'The number of monitors must be greater than zero!',
								field: $('#'+type+'-abbv').parent()}
				}
				dbAddAgent(args, $('#'+type+'-success'))
				break;
			case 'add-lead-modal':
				args.type = 'add-lead-modal';
				if(!args['add-lead-modal-abbv']){
					throw {message: 'You must enter an abbreviation for the lead!',
								field: $('#'+type+'-abbv').parent()}
				}
				if(!args['add-lead-modal-name']){
					throw {message: 'You must enter a lead\'s name!',
								field: $('#'+type+'-name').parent()}
				}
				dbAddLead(args, $('#'+type+'-success'))
				break;
			default:
				break;
		}
		$('.modal').modal('hide')

	} catch (err){
		console.log(err.message);
		console.log(err.field);
		modalErrorHandling(err)
	}
}

function pullLeadMonth(month, lead){
	month = month.slice(0, -3)
	var reg = new RegExp(month)


	var query = {'$and': [{date: {'$gte': startOfMonth}}, {date: {'$lte':endOfMonth}}, {lead: lead}]},
			sort = {date: 1}

	pullAgentMonitors(query, sort).then(function(result){
		if (Object.keys(result).length > 0){
			loadLeadSearch(result, month)
		} else {
			loadBlankLeadSearch(month)
		}
	})
/*
	db.find(query).sort({date: 1}).exec(function(err, result){


	})*/
}
function loadBlankLeadSearch(month){
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
function loadLeadSearch(result, month){
	var table = document.getElementById('leadmonitors-tbody')
	table.innerHTML = "";
	//loop through the result of rows
	$.each(result, function(k, v){
		//loop through each row
		var resultDate = new Date(v.date)
				resultYear = resultDate.getFullYear(),
				resultMM = ("0"+(resultDate.getMonth()+1)).slice(-2),
				resultDD = ("0"+resultDate.getDate()).slice(-2),
				resultDateString = resultYear+'-'+resultMM+'-'+resultDD,
				row = document.createElement('tr'),
				dateTd = document.createElement('td'),
				nameTd = document.createElement('td'),
				failTd = document.createElement('td'),
				scoreTd = document.createElement('td');

		row.id = 'leadmonitor-'+v._id
		dateTd.innerHTML = resultDateString;
		nameTd.innerHTML = agentsObj[v.agent].name;
		scoreTd.innerHTML = v.score+' %';
		$(row).attr('data-date', v.date)
					.attr('data-agent', v.agent)
					.attr('data-fail', v.fail)
					.attr('data-score', v.score)
					.attr('data-id', v._id)
		if(v.fail == true){
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
*	Event Listeners
*/
$(window).on('load', function(){
	setDate()
	importLeads()
	// to resolve the crazy timing issue with the agent and lead agentLeadObject
	// importAgents is called within importLeads()
	// pullThisMonth is called within the importAgents() function
	// Edit/Add buttons for managing leads can be found in the event listners function

	$('#form-monitors').submit(function(e){
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

		let fields = {"a": aField, "l": lField, "f": fField, "d": dField, "s": sField}
		validate(d,a,f,l,s,fields);
	})

	$('.modal-submit').click( function (e) {
		//delete modalArgs;
		let parentModal = $(this).parent().parent().parent().parent(),
				type = $(parentModal).attr('id'),
				fields = $(this).parents('.modal-content').find('[name]')
				modalArgs = {'type': type};

		$(fields).each(function(k,v){
			modalArgs[$(v).attr('id')] = $(v).val();
		})

		if (type == 'edit-monitor-modal'){
			let tmpArgs = {'type': type}
			let aField = document.getElementById('edit-monitor-modal-select-agent'),
					lField = document.getElementById('edit-monitor-modal-select-lead'),
					fField = document.getElementById('edit-monitor-modal-check-fail'),
					dField = document.getElementById('edit-monitor-modal-input-date'),
					sField = document.getElementById('edit-monitor-modal-score'),
					iField = document.getElementById('edit-monitor-modal-id');

			let a = aField.value,
					l = lField.value,
					f = fField.checked,
					d = new Date(dField.value.replace(/-/g, '\/')),
					s = sField.value,
					i = iField.value;

			let fields = {'a':aField, 'l':lField, 'f':fField, 'd':dField, 's':sField, 'i':iField}
			validateEditModal(d,a,f,l,s,i, fields)
		} else {
			validateModal(type, modalArgs);
		}
	})

	$(window).on('click', function(e){
		if (e.target.dataset.section != $('.navbar-collapse') && $('.navbar-collapse').hasClass('in')){
			$('.navbar-collapse').removeClass('in')
		}
	})

	$(function(){
		$('[data-toggle="tooltip"]').tooltip()
	})

	$('#select-lead-search').on('change', function(){
		var lead = $(this).val(),
				month = $('#input-date-search').val();
		pullLeadMonth(month, lead);
	})
})
