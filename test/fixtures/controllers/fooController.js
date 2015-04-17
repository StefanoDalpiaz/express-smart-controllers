
module.exports = {

	routes: {
		"relative" : "_relative",
		"/fooAbsolute" : "_absolute",
		"{POST} explicit" : "_postExplicit",
		"{GET} explicitGet" : "_getExplicit",
		"oneParameterExplicit/:one" : "_oneParameterExplicit",
		"twoParametersExplicit/:one/:two" : "_twoParametersExplicit",
	},

	get: function() {
		this.res.send('get');
	},

	getImplicit: function() {
		this.res.send('getImplicit');
	},

	normalImplicit: function() {
		this.res.send('normalImplicit');
	},

	post: function() {
		this.res.send('post');
	},

	postImplicit: function() {
		this.res.send('postImplicit');
	},

	_postExplicit: function() {
		this.res.send('postExplicit');
	},

	_getExplicit: function() {
		this.res.send('getExplicit');
	},

	_relative: function() {
		this.res.send('relative');
	},

	_absolute: function() {
		this.res.send('absolute');
	},

	oneParameterImplicit: function(one) {
		this.res.send('oneParameterImplicit ' + one);
	},

	twoParametersImplicit: function(one, two) {
		this.res.send('twoParametersImplicit ' + one + ' ' + two);
	},

	_oneParameterExplicit: function(one) {
		this.res.send('oneParameterExplicit ' + one);
	},

	_twoParametersExplicit: function(one, two) {
		this.res.send('twoParametersExplicit ' + one + ' ' + two);
	}

};
