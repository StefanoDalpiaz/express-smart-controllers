
module.exports = {

	routes: {
		"relative" : "_relative",
		"/fooAbsolute" : "_absolute",
		"{POST} explicit" : "_postExplicit",
		"{GET} explicitGet" : "_getExplicit",
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
	}

};
