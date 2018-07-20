//promise chain example
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
		


//Add Agent
name		id
abbv		add-agent-modal-abbv
fullname	add-agent-modal-name
monitors	add-agent-modal-number
number		add-agent-modal-agent-id








/*
	
	buildRow(id){
		/**
		 * @param {string} id - ResultRow ID to be used as the HTML Element ID
		 */
		return new Promise ((resolve, reject) => {
			let tr = document.createElement('tr')
			tr.setAttribute('id', id+'-tr')
			return resolve(tr)
		})
		
/*	},
	buildElement(id, args){
		/**
		 * @param {string} id - ResultRow ID to be used as the HTML Element ID
		 * @param {Object} args - ResultRow data to be pushed to the data attribute
		 */
/*		var td = document.createElement('td')
		td.setAttribute('id', id+'-td')
		for (var i in args) {
			//console.log(i, args[i])
			td.setAttribute(i, args[i])
			//console.log(td)
		}
		return td;
	},
*/

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

PromiseLoop = {
	constants: {
		count: 0
	},
	test: function () {

		$(document).on('click', '#test', function (e){
			console.log(e)
			let arr = $('#needed-monitors-table tr'), boards = [], promises = []
			$(arr).each(function (k,v) {
				promises.push(
					new Promise ((resolve, reject) => {
						PromiseLoop.testPromise(arr[k]).then((result) => {
							resolve(result)
						}), result => {
							console.log(result)
						}
					})
				)
			})
			console.log(PromiseLoop.constants.count)
			PromiseLoop.constants.count = 0
			console.log(PromiseLoop.constants.count)
			return Promise.all(promises)

		})
	},
	testPromise: function (arg) {
		this.constants.count ++
		return new Promise ((resolve, reject) => {
			console.log(this.constants.count, arg)
		})
	}
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



// Find agents on "needed"

let listedAgents = document.querySelectorAll('.claimed')
		let count = 0, numAgents = Array.from(listedAgents).length
		let agents = new Array
		Array.from(listedAgents).forEach((x) => {
			agents[count] = x.getAttribute('data-agent')
			count++
		})
		console.log(agents)