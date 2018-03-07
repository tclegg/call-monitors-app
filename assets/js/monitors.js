window.__monitors = window.__monitors || {},
function (n) {
			/*agentsDb = new nedb({filename: path.resolve(__dirname, '../../db/', 'agents'), autoload: true})*/
	__monitors.monitors = {
		constants: {
			query: {month: mm}
		},
		post: function(row){
			db.insert(row)
		},
		completed: function(result, leadArr, agentsArr){
			var table = document.getElementById('completed-monitors-tbody')

			//loop through the result of rows
			$.each(result, function(k, v){
				//loop through each row
					var row = document.createElement('tr')
					row.id = v._id
					var dateTd = document.createElement('td'),
							nameTd = document.createElement('td'),
							failTd = document.createElement('td'),
							leadTd = document.createElement('td'),
							leadAbbv = v.lead,
							agentAbbv = v.agent;
					dateTd.innerHTML = v.date;
					nameTd.innerHTML = agentsArr[agentAbbv];
					$(row).attr('data-date', v.date)
								.attr('data-agent', v.agent)
								.attr('data-fail', v.fail)
								.attr('data-lead', v.lead)
								.attr('data-id', v._id)
					if(v.fail == 'true'){
						failTd.innerHTML = '<span class="icon major fa-check-circle">'
					} else {
						failTd.innerHTML = '';
					}
					leadTd.id = v.lead;
					leadTd.innerHTML = leadArr[leadAbbv]

					row.appendChild(dateTd);
					row.appendChild(nameTd);
					row.appendChild(failTd);
					row.appendChild(leadTd);
					table.appendChild(row);
			})
		},
		needed: function(result, agentsArr){
			console.log('in needed');
			var table = document.getElementById('needed-monitors-tbody')
			var result = result;
			var count = 0;
			console.log(result);
			Object.keys(result, function(k){
				console.log('key = '+result[key]);
			})

			if (result != ""){
				console.log(agentsArr);
				//console.log(result);
				Object.keys(agentsArr, function(key){

					var row = document.createElement('tr'),
							dateTd = document.createElement('td'),
							nameTd = document.createElement('td'),
							numberTd = document.createElement('td')
							dateTdId = agentsArr[key].abbv,
							nameTdId = agentsArr[key].abbv + '-name',
							numberTdId = agentsArr[key].abbv + '-id';
					$(dateTd).attr('id', dateTdId).html(thisMonth)
					$(nameTd).attr('id', nameTdId).html(agentsArr[key].name)
					$(numberTd).attr('id', numberTdId).html(agentsArr[key].monitors)
					$(row).attr('id', 'row-'+agentsArr[key]._id)
					row.appendChild(dateTd)
					row.appendChild(nameTd)
					row.appendChild(numberOfMonitors)
					table.appendChild(row)
				})
				/*$.each(agentsArr, function(k, v){
					//loop through each row
						var row = document.createElement('tr')
						row.id = v._id
						var dateTd = document.createElement('td'),
								nameTd = document.createElement('td'),
								failTd = document.createElement('td'),
								leadTd = document.createElement('td'),
								leadAbbv = v.lead,
								agentAbbv = v.agent;
						dateTd.innerHTML = v.date;
						nameTd.innerHTML = agentsArr[agentAbbv];
						$(row).attr('data-date', v.date)
									.attr('data-agent', v.agent)
									.attr('data-fail', v.fail)
									.attr('data-lead', v.lead)
									.attr('data-id', v._id)
						if(v.fail == 'true'){
							failTd.innerHTML = '<span class="icon major fa-check-circle">'
						} else {
							failTd.innerHTML = '';
						}
						leadTd.id = v.lead;
						leadTd.innerHTML = leadArr[leadAbbv]

						row.appendChild(dateTd);
						row.appendChild(nameTd);
						row.appendChild(failTd);
						row.appendChild(leadTd);
						table.appendChild(row);
				})*/
			} else {
				Object.keys(agentsArr).forEach(function(key){

						var row = document.createElement('tr'),
								dateTd = document.createElement('td'),
								nameTd = document.createElement('td'),
								numberTd = document.createElement('td')
								dateTdId = agentsArr[key].abbv,
								nameTdId = agentsArr[key].abbv + '-name',
								numberTdId = agentsArr[key].abbv + '-id';
						$(dateTd).attr('id', dateTdId).html(thisMonth)
						$(nameTd).attr('id', nameTdId).html(agentsArr[key].name)
						$(numberTd).attr('id', numberTdId).html(agentsArr[key].monitors)
						$(row).attr('id', 'row-'+agentsArr[key]._id)
						row.appendChild(dateTd)
						row.appendChild(nameTd)
						row.appendChild(numberTd)
						table.appendChild(row)

				})
			}



		},
		pullAgent: function(){
			var row = {

			}
			agentsDb.insert(row)
		},
		pullLeads: function(){
			//leadsDb.insert(row)

			leadsDb.find({abbv: {'$regex': /^[a-z]/}}, function(err, data){
				return data;
			})
		},
		pullMonth: function(queryMonth){
			var reg = new RegExp(queryMonth)
			var query = {date: {'$regex': reg}}

			db.find(query, function(err, result){
				var leadArr = new Array();
				var agentsArr = new Array();
				var newagents = new Array();
				var leads = $('#edit-leads-tbody > tr').each(function(key, val){
					leadArr[$(this).data('abbv')] = $(this).data('name');
				})
				var agents = $('#edit-agents-tbody > tr').each(function(key, val){
					agentsArr[$(this).data('abbv')] = $(this).data('name');
				})

				var agents2 = $('#edit-agents-tbody > tr').each(function(key, val){
					newagents[$(this).data('abbv')] = {"abbv":$(this).data('abbv'), "name":$(this).data('name'), "monitors":$(this).data('monitors')}
				})
				if (queryMonth == thisMonth){
					__monitors.monitors.completed(result, leadArr, agentsArr)
				} else {
					__monitors.monitors.needed(result, newagents)
				}

			})
		},
		init: function(){
			$(document).on('ready', function(e){
				__monitors.monitors.pullMonth(thisMonth)
				__monitors.monitors.pullMonth(lastMonth)
			})
		}
	};

	n(function(){
		__monitors.monitors.init()

	})
}(jQuery);
