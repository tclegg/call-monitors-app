const path	=	require('path'),
	date	=	new Date(),
	fs		=	require('fs')

exports.formValidation = {
	/**
	 * Validate the main submit form
	 * @param values Object - All form values
	 * @param fields Object - All the form elements
	 */
	/////////////////////////////////
	//// doesn't seem to be used ////
	/////////////////////////////////
	constants: {
		message: ''
	},
	newMonitor: function (values, fields) {
		try {
			if (!this.checkFuture(values.d)) {throw {message: "You cannot enter a date in the future!", field: fields.f}}
			if (!this.checkAgent(values.a)) {throw {message: "You must select an agent!", field: fields.a}}
			if (!this.checkScore(values.s)) { throw {message: "The score must be greater than 0!", field: fields.s}}
			if (!this.checkFail(values.f)) {throw {message: "How did you even do this?", field: fields.f}}
			if (!this.checkLead(values.l)) {throw {message: "You must select a lead!", field: fields.l}}
			if (values.i){
				if (!this.checkId(values.i)) {throw {message: "Missing the monitor ID. You cannot update the table. Reload the page and try again!", field: fields.i}}
			}
			return true
		} catch (err) {
			exports.errorHandling.errorHandling(err)
		}
	},
	// Check if the submitted date is in the future
	checkFuture: (d) => (d > date) ? false : true,
	// Check if the agent was selected (not left at the default value)
	checkAgent: (a) => (a == " " || a == "0") ? false : true,
	// Check if score is submitted
	checkScore: (s) => (s == "" || s < 0) ? false : true,
	// Check if fail has been hijacked
	checkFail: (f) => (f !== true && f !== false) ? false : true,
	// Check if the lead was selected (not left at the default value)
	checkLead: (l) => (l == null || l == " " || l === "0") ? false : true,
	// Check if the ID was supplied (when used as an update)
	checkId: (i) => (!i || i == "" || i == 0) ? false : true,
	
	
}

exports.formValidation = {
	init: function (type, form){
		/**
		 * @param {String} type Name of the form to be validated
		 * @param {Object} form HTML Form Element
		 */
		return new Promise ((resolve, reject) => {
			return this[type](type, form).then((result) => {
				//Return back to the eventhandler to continue with DB submit
				return resolve(result)
			}).catch((err) => {
				//handle errors by sending to the DOM
				if (Object.keys(err).length == 2){
					exports.errorHandling.errorHandling(err)
				} else {
					return reject (err)
				}
				
			})
			
		}).catch((err) => console.log(err))
	},
	fieldValidation: {
		/**
		 * Field Validation
		 * @param {Object} field HTML input element
		 * @returns {Boolean} True or false - also throws an error to be caught in the form function
		 * (false isn't necessary - just there for readability)
		 */
		agent: (field) => {
			if ((!field.value || field.value === "0")){
				throw {message: 'You must select an agent!', field: field}
				return false
			} else {
				return field.value
			}
		},
		date: (field) => {
			let validationDate = new Date()
			let tmpDate = new Date(field.value)
			if ((!field.value) || !validationDate || (tmpDate > validationDate)) {
				throw {message: 'You cannot enter a date in the future!', field: field}
				return false
			} else {
				return tmpDate
			}
		},
		score: (field) => {
			if (!field.value || field.value < 0) {
				throw {message: 'You must enter a score greater than, or equal to 0!', field: field}
				return false
			} else {
				return field.value
			}
		},
		fail: (field) => {
			if (field.checked !== true && field.checked !== false){
				throw {message: "I'm not sure how you did this one...", field: field}
				return false
			} else {
				return field.checked
			}
		},
		lead: (field) => {
			if (!field.value || field.value === "0"){
				throw {message: 'You must select a lead!', field: field}
				return false
			} else {
				return field.value
			}
		},
		_id: (field) => {
			if (!field.value){
				throw {message: 'Stay out of the dev tools!', field: field}
				return false
			} else {
				return field.value
			}
		},
		abbv: (field) => {
			if (!field.value){
				throw {message: 'You must supply an abbreviation!', field: field}
				return false
			} else {
				return field.value
			}
		},
		name: (field) => {
			if (!field.value){
				throw {message: 'You must enter a full name (Lastname, Firstname)', field: field}
				return false
			} else {
				return field.value
			}
		},
		monitors: (field) => {
			if (!field.value || field.value < 1){
				throw {message: 'You must supply a number of monitors required!', field: field}
				return false
			} else {
				return field.value
			}
		},
		agentid: (field) => {
			if (!field.value || !parseInt(field.value)){
				throw {message: 'You must supply the Agent ID', field: field}
				return false
			} else {
				return field.value
			}
		},
		inactive: (field) => {
			if (field.value > 1){
				throw {message: 'Is this supposed to be inactive?', field: field}
				return false
			} else {
				return field.value
			}
		},
		
	},
	editmonitor: function (type, form) {
		/**
		 * @param {Object} form Form values
		 */
		return new Promise ((resolve, reject) => {
			let formVals = {},
				fields = $(form).find('[name]')
			try{
				$(fields).each((k,v) => {
					let value = this.fieldValidation[v.name](v)
					console.log(k,v)
					formVals[`${v.name}`] = value
				})
				if (formVals.fail === true) {
					formVals.score = "0"
				}
				
				return resolve(formVals)
			} catch (err){
				return reject (err)
			}
		}).catch((err) => console.log(err))
	},
	removemonitor: function (type, form) {
		/**
		 * @param {Object} form Form values
		 * @return {Object} [formVals, formFields] - {FieldName: Values, Field: FieldObject}
		 */
		return new Promise ((resolve, reject) => {
			let formVals = {},
				fields = $(form).find('[name]')
			try{
				$(fields).each((k,v) => {
					let value = this.fieldValidation[v.name](v)
					formVals[v.name] = value
				})
				return resolve(formVals)
			} catch (err){
				return reject (err)
			}
		}).catch((err) => console.log(err))
	},


	addagent: function (type, form) {
		/**
		 * @param {Object} form Form values
		 * @return {Object} [formVals, formFields] - {FieldName: Values, Field: FieldObject}
		 */
		return new Promise ((resolve, reject) => {
			let formVals = {},
				fields = $(form).find('[name]')
			try{
				$(fields).each((k,v) => {
					
					let value = this.fieldValidation[v.name](v)
					formVals[v.name] = value
				})
				formVals.inactive = "0"
				return resolve(formVals)
			} catch (err){
				return reject (err)
			}
		}).catch((err) => console.log(err))
	},
	editagent: function (type, form) {
		/**
		 * @param {Object} form Form values
		 * @return {Object} formVals, formFields - {FieldName: Values, Field: FieldObject}
		 */
		console.log('editagent')
		return new Promise ((resolve, reject) => {
			let formVals = {},
				fields = $(form).find('[name]')
			try{
				$(fields).each((k,v) => {
					let value = this.fieldValidation[v.name](v)
					formVals[v.name] = value
				})
				return resolve(formVals)
			} catch (err){
				return reject (err)
			}
		}).catch((err) => console.log(err))
	},
	removeagent: function (type, form) {
		/**
		 * @param {Object} form Form values
		 * @return {Object} [formVals, formFields] - {FieldName: Values, Field: FieldObject}
		 */
		return new Promise ((resolve, reject) => {
			let formVals = {},
				fields = $(form).find('[name]')
			try{
				$(fields).each((k,v) => {
					let value = this.fieldValidation[v.name](v)
					formVals[v.name] = value
				})
				return resolve(formVals)
			} catch (err){
				return reject (err)
			}
		}).catch((err) => console.log(err))
	},



	addlead: function (type, form) {
		/**
		 * @param {Object} form Form values
		 * @return {Object} [formVals, formFields] - {FieldName: Values, Field: FieldObject}
		 */
		return new Promise ((resolve, reject) => {
			let formVals = {},
				fields = $(form).find('[name]')
			try{
				$(fields).each((k,v) => {
					let value = this.fieldValidation[v.name](v)
					formVals[v.name] = value
				})
				formVals.inactive = "0"
				return resolve(formVals)
			} catch (err){
				return reject (err)
			}
		}).catch((err) => console.log(err))
	},
	editlead: function (type, form) {
		/**
		 * @param {Object} form Form values
		 * @return {Object} [formVals, formFields] - {FieldName: Values, Field: FieldObject}
		 */
		return new Promise ((resolve, reject) => {
			let formVals = {},
				fields = $(form).find('[name]')
			try{
				$(fields).each((k,v) => {
					let value = this.fieldValidation[v.name](v)
					formVals[v.name] = value
				})
				return resolve(formVals)
			} catch (err){
				return reject (err)
			}
		}).catch((err) => console.log(err))
	},
	removelead: function (type, form) {
		/**
		 * @param {Object} form Form values
		 * @return {Object} [formVals, formFields] - {FieldName: Values, Field: FieldObject}
		 */
		return new Promise ((resolve, reject) => {
			let formVals = {},
				fields = $(form).find('[name]')
			try{
				$(fields).each((k,v) => {
					let value = this.fieldValidation[v.name](v)
					formVals[v.name] = value
				})
				return resolve(formVals)
			} catch (err){
				return reject (err)
			}
		}).catch((err) => console.log(err))
	},
	newmonitor: function (type, form) {
		/**
		 * @param {Object} form Form values
		 * @return {Object} [formVals, formFields] - {FieldName: Values, Field: FieldObject}
		 */
		
		return new Promise ((resolve, reject) => {
			let formVals = {},
				fields = $(form).find('[name]')
			try{
				$(fields).each((k,v) => {
					let value = this.fieldValidation[v.name](v)
					formVals[v.name] = value
				})
				return resolve(formVals)
			} catch (err){
				return reject (err)
			}
		}).catch((err) => console.log(err))
	}
}

exports.errorHandling = {
	/**
	 * Handle errors and send to the help-block field
	 * @param Object HTML input element
	 */
	errorHandling: (error) => {
		if (error.field === "post") {
			alert(error.message)
		} else {
			var findInput = $(error.field).parents('.form-group')
			var findLabel = $(findInput).find('.help-block')
			$(findInput).addClass('has-error')
			$(findLabel).addClass('has-error').html(error.message)
			var timeout = setTimeout(function() {
				$(findInput).toggleClass('has-error')
				$(findLabel).toggleClass('has-error').html('')
			}, 4000);
		}
	}
}