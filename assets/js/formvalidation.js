window.validate = window.validate || {},
function(n) {
	var fs = require('fs'),
		path = require('path'),
		nedb = require('nedb'),
		d = new Date()
		year = d.getFullYear(),
		mm = ("0"+(d.getMonth()+1)).slice(-2),
		yyyymm = year+'-'+mm,
		dbname = 'monitors-'+year+'.db',
		db = new nedb({filename: path.resolve(__dirname, '../../db/', dbname), autoload: true})
	validate.forms = {
		constants: {
			agent: 'select-agent',
			date: 'input-date',
			fail: 'check-fail',
			lead: 'select-lead'
		},
		getToday: function(){
			console.log(window.dates.today.constants.today);
			this.checkFuture('2018/02/16')
		},
		checkFuture: function(d){
			var now = new Date();
			var dd = now.getDate();
			var yyyy = now.getFullYear();
			var mm = ("0"+(now.getMonth()+1)).slice(-2);
			var today = yyyy + '/' + mm + '/' + dd;

			var dateInput = document.getElementById(this.constants.date).value
			var dateObj = new Date(dateInput)
			if (!dateInput || dateInput == "" || dateInput == " "){
				console.log('in blank Date');
				throw 'You must enter a date!'
			} else if (dateObj > now) {
				console.log('in Future');
				throw 'You cannot enter a date in the future!'
			} else {
				return d
				console.log('Date Checked');
			}
		},
		checkAgent: function(a){
			if (!a || a == "" || a == " " || a == 0){
				console.log('in checkAgent');
				throw 'You must select an agent!'
			} else {
				console.log(a);
				return a;
			}
		},
		checkLead: function(l){
			if (!l || l == "" || l == " " || l == 0){
				console.log('in checkLead');
				throw 'You must select an lead!'
			} else {
				console.log(l);
				return l;
			}
		},
		checkFail: function(f){
			console.log(f);
			if (!f || f == ""){
				return false;
			} else {
				return true;
			}
		},
		errorHandling: function(err){
			var errorDiv = document.getElementById('error-text');
			var errorP = document.getElementById('error-p');
			errorP.innerHTML = err;
			errorDiv.style.display='block';
			//$(errorDiv).toggleClass('hidden')
			var timeout = setTimeout(function(){
				errorDiv.style.display='none';
			}, 4000);
		},
		validate: function(d,a,f,l){
			try {
				var date = this.checkFuture(d)
				var agent = this.checkAgent(a)
				var fail = this.checkFail(f)
				var lead = this.checkLead(l)
				this.post({"date":date, "agent":agent, "fail": fail, "lead": lead})
			} catch (err){
				console.log(err);
				this.errorHandling(err)
			}
		},
		post: function(vals){
			db.insert(vals)
		},
		init: function(d,a,f,l){
			//this.getToday();
			this.validate(d,a,f,l);
		},
	}

	n(function(){
		$('#form-monitors').submit(function(e){
			e.preventDefault();
			console.log(e);

			var a = document.getElementById(validate.forms.constants.agent).value
			console.log(a);
			var l = document.getElementById(validate.forms.constants.lead).value
			console.log(l);
			var f = document.getElementById(validate.forms.constants.fail).checked
			console.log(f);
			var d = document.getElementById(validate.forms.constants.date).value
			console.log(d);
			validate.forms.init(d,a,f,l);


		})
	})
}(jQuery);
