const path	=	require('path'),
	date	=	new Date(),
	fs		=	require('fs')

exports.domMethods = {
	constants: {
		pencil:   '<span class="glyphicon glyphicon-pencil"></span>',
		Xicon:  '<span class="glyphicon glyphicon-remove"></span>',
		cog: '<span class="glyphicon glyphicon-cog"></span>',
		checkmark: '<span class="glyphicon glyphicon-ok"></span>'
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
			icon = 'glyphicon glyphicon-unchecked',
			claimedTd = row.querySelector('#'+agent.abbv+'-claimed')
		
		$(row).find('#'+agent.abbv+'-date').html(`${argsDate.getFullYear()}-${("0"+(date.getMonth() + 1)).slice(-2)}`)
		$(row).find('#'+agent.abbv+'-name').html(agent.name)
		$(row).find('#'+agent.abbv+'-agentid').html(agent.agentid)
		$(row).find('#'+agent.abbv+'-num-left').html(`<span id="${agent.abbv}-num-left-span">${numleft}</span> / <span id="${agent.abbv}-total-span">${agent.monitors}</span>`)
		$(claimedTd).addClass('claimed').data('claimed', 'unclaimed').data('agent', agent.abbv)//.attr('title', 'Unclaimed')
				.append(claimedSpan).find('span').addClass(icon)
		claimedTd.setAttribute('title', 'Unclaimed')
		claimedTd.setAttribute('data-toggle', 'tooltip')
	},
	setFlag: function (id, type, icon) {
	},
	setClaimed: function (claimedMonitors, leadsObj) {
		let count = 1
		return new Promise ((resolve, reject) => {
			if (Object.keys(claimedMonitors).length > 0){
				console.log(248, claimedMonitors, leadsObj)
				for (x of claimedMonitors) {
					console.log(x)
					let elem = document.querySelector('#'+x.agentabbv+'-claimed')
					if (elem) {
						elem.setAttribute('title', leadsObj[x.leadabbv].name)
						$(elem).data('claimed', 'claimed').data('lead', leadsObj[x.leadabbv].abbv).data('_id', x._id)
						.find('span').removeClass('glyphicon-unchecked').addClass('glyphicon-ok')
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
				$(elem).data('claimed', 'claimed').data('leadabbv', leadabbv).tooltip('fixTitle')
					.find('span').removeClass('glyphicon-unchecked').addClass('glyphicon-ok')
			} else {
				elem.setAttribute('title', 'Unclaimed')
				$(elem).data('claimed', 'unclaimed').data('leadabbv', leadabbv).tooltip('fixTitle')
					.find('span').removeClass('glyphicon-ok').addClass('glyphicon-unchecked')
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
		
		/*if (Object.keys(monitors).length > 0){
			let last = Object.keys(monitors).length
			for (i in monitors) {
				if (localMonitorCount == last) {
					lastmonitor = monitors[i]
				}
				localMonitorCount ++
			}
			
		}*/

		for (i in monitors) {
			count ++
			if (monitors[i].fail) {
				autofail = monitors[i].fail
				count --
			}
			lastmonitor = monitors[i]
		}
		monitorsLeft = required - count
		/*
		if (lastmonitor.fail) {
			autofail = true
		} else {
			autofail = false
		}*/
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
								$(span).addClass('glyphicon glyphicon-ok')
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
						$(span).addClass('glyphicon glyphicon-ok')
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
						$(span).addClass('glyphicon glyphicon-ok')
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

exports.buildModal = {
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
			$(modal).find('.modal-title').text('')
			$(modal).find('[name]').each(function(k,v){
				if (v.name === 'fail') {
					$(v).prop('checked', false)
				} else if (v.name === 'date'){
					v.valueAsdate = new Date()
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
				$('.modal-title').text(agent)
			} else {
				$('.modal-title').text($(inputData).data('name'))
				
			}
			
			if ($(modal).hasClass('remove')){
				this.fillRemoveSpan(modal, inputData, agent)
			}
			
			for (i in inputElems){
				count ++
				if ($(inputElems[i]).attr('type') === 'checkbox' ){
					$(inputElems[i]).prop('checked', $(inputData).data($(inputElems[i]).attr('name')))
				} else if ($(inputElems[i]).attr('type') === 'select'){
					$(inputElems[i]).prop('value', $(inputData).data($(inputElems[i]).attr('name')))
				} else if (inputElems[i].name == 'date'){
					inputElems[i].valueAsDate = $(inputData).data($(inputElems[i]).attr('name'))
				} else {
					inputElems[i].value = $(inputData).data($(inputElems[i]).attr('name'))
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

exports.FormSubmit = {
	constants: {

	},
	init: function (args) {

	},
	modalSubmit: function () {

	}
}