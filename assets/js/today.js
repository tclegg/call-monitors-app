window.dates = window.dates || {},
function(n) {
	dates.today = {
		constants: {
			dateField: 'input-date',
			today: '',
			months: {
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
			}
		},
		getDate: function(){

		},
		setDate: function(){

			var inputdate = document.getElementById(this.constants.dateField);
			var monitorsH2 = document.getElementById('monitorsH2')
			var d = new Date()
			var m = ("0"+(d.getMonth()+1)).slice(-2)
			var month = this.constants.months[m]
			console.log(month);
			inputdate.valueAsDate = d;
			this.constants.today = inputdate.value;
			monitorsH2.innerHTML = 'Monitors for '+month;

		},
		init: function(){
			this.setDate();
		}
	};

	n(function() {
		dates.today.init();

	})
}(jQuery);
