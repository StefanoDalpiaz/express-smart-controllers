
module.exports = {

	routes: {
		"bar": "_bar"
	},

	index: function() {
		this.res.send('another index');
	},

	getFoo: function() {
		this.res.send('another foo');
	},

	_bar: function() {
		this.res.send('another bar');
	}

};
