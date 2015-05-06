
module.exports = {

	routes: {
		"foobaz": "_foobaz"
	},

	index: function() {
		this.res.send('default index');
	},

	getFoobar: function() {
		this.res.send('default foobar');
	},

	_foobaz: function() {
		this.res.send('default foobaz');
	}

};
