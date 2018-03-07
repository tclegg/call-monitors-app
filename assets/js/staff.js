window.navigation = window.navigation || {},
function (n) {
	var fs = require('fs'),
			path = require('path'),
			nedb = require('nedb'),
			leadsDb = new nedb({filename: path.resolve(__dirname, '../../db/', 'leads.db'), autoload: true}),
			agentsDb = new nedb({filename: path.resolve(__dirname, '../../db/', 'agents.db'), autoload: true})

	navigation.starting = {
		constants: {
			leads: 'select-lead',
			agents: 'select-agent',
		},
		importLeads: function(){
			//console.log('leads - ' + navigation.starting.constants.leads);
			leadsDb.find({abbv: {'$regex': /^[a-z]/}}, function(err, data){
				//console.log(data)
				navigation.starting.loadToLeadSelect(data)
				navigation.starting.loadLeadsTable(data)
			})
		},
		loadToLeadSelect: function(data){
			var out = document.getElementById(navigation.starting.constants.leads);
			//console.log(Object.keys(data));
			//var arr = Object.keys(data);
			for (i=0; i < data.length; i++) {
				var nameValue = data[i].name,
						abbreviation = data[i].abbv,
						leadId = data[i]._id;
				var option = document.createElement('option');
				$(option).val(abbreviation).html(nameValue)

				out.appendChild(option);
			}
		},
		loadLeadsTable: function(data){
			var table = document.getElementById('edit-leads-tbody')
			//var arr = Object.keys(data);
			var nameValue;

			var arr = Object.keys(data)
			for (i=0; i < arr.length; i++){
				var nameValue = data[i].name,
						abbreviation = data[i].abbv,
						leadId = data[i]._id;

				//var nameValue = data[name];
				var fullNameTD = document.createElement('td')
				var abbreviationTD = document.createElement('td')
				var edit = document.createElement('td')
				var remove = document.createElement('td')
				var row = document.createElement('tr')
				var editHTML = '<a class="edit" href="#" id="edit-'+abbreviation+'"><span class="icon major fa-edit"></span></a>'
				var removeHTML = '<a class="remove" href="#" id="remove-'+abbreviation+'"><span class="icon major fa-times"></span></a>'
				$(row).attr('data-abbv', abbreviation)
							.attr('data-name', nameValue)
							.attr('data-id', leadId)
							.attr('id', leadId);
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
		},
		importAgents: function(){
			agentsDb.find({abbv: {'$regex': /^[a-z]/}}, function(err, data){
				//console.log(data);
				navigation.starting.loadToAgentSelect(data)
				navigation.starting.loadAgentsTable(data)
			})
		},
		loadToAgentSelect: function(data){
			var out = document.getElementById(navigation.starting.constants.agents);
			//console.log(Object.keys(data));
			for (i=0; i < data.length; i++) {
				var nameValue = data[i].name,
						abbreviation = data[i].abbv,
						agentId = data[i]._id;
				var option = document.createElement('option');
				$(option).val(abbreviation).html(nameValue)
				out.appendChild(option);
			}
		},
		loadAgentsTable: function(data){
			var table = document.getElementById('edit-agents-tbody')
			var arr = Object.keys(data);

			for (i=0; i < arr.length; i++){
				var nameValue = data[i].name,
						abbreviation = data[i].abbv,
						requiredMonitors = data[i].monitors
						agentId = data[i]._id;
				var fullNameTD = document.createElement('td')
				var abbreviationTD = document.createElement('td')
				var edit = document.createElement('td')
				var remove = document.createElement('td')
				var monitors = document.createElement('td')
				var row = document.createElement('tr')
				var editHTML = '<a class="edit" href="#" id="edit-'+abbreviation+'"><span class="icon major fa-edit"></span></a>'
				var removeHTML = '<a class="remove" href="#" id="remove-'+abbreviation+'"><span class="icon major fa-times"></span></a>'
				$(row).attr('data-abbv', abbreviation)
							.attr('data-name', nameValue)
							.attr('data-monitors', requiredMonitors)
							.attr('data-id', agentId)
							.attr('id', agentId);

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
		},
		init: function(){
			this.importLeads()
			this.importAgents()

		}
	};

	n(function() {
		navigation.starting.init()

	})
}(jQuery);
