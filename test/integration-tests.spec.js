var request = require('supertest');
var express = require('express');
var assert = require('assert');
var smartControllers = require('../express-smart-controllers');
var chai = require('chai');
var expect = chai.expect;

var app = null;
var controllerPath = './fixtures/controllers';

function getAllRoutes(routes) {
	var table = [];
	for (var key in routes) {
		if (routes.hasOwnProperty(key)) {
			var val = routes[key];
			if(val.route) {
				val = val.route;
				table.push(val.stack[0].method.toUpperCase() + ": " + val.path);
			}
		}
	}
	return table;
}

describe('express-smart-controllers', function() {

	beforeEach(function() {
		app = express();
	});

	describe('init arguments', function() {
		it('should load with app parameter', function(done) {
			smartControllers.load(app, { controllerPath: controllerPath }, function() {
				var addedRoutes = getAllRoutes(app._router.stack);
				expect(addedRoutes).to.be.an('array')
					.and.to.contain('GET: /foo')
					.and.to.contain('GET: /bar');
				done();
			});
		});

		it('should load with router parameter', function(done) {
			var router = express.Router();
			smartControllers.load(router, { controllerPath: controllerPath }, function() {
				var addedRoutes = getAllRoutes(router.stack);
				expect(addedRoutes).to.be.an('array')
					.and.to.contain('GET: /foo')
					.and.to.contain('GET: /bar');
				done();
			});
		});
	});

	describe('route loading', function() {
		var addedRoutes = null;

		beforeEach(function(done) {
			smartControllers.load(app, { controllerPath: controllerPath }, function() {
				addedRoutes = getAllRoutes(app._router.stack);
				done();
			});
		});

		it('should load default controller default get', function() {
			expect(addedRoutes).to.be.an('array')
				.and.to.contain('GET: /');
		});

		it('should load default controller implicit get', function() {
			expect(addedRoutes).to.be.an('array')
				.and.to.contain('GET: /foobar');
		});

		it('should load default controller explicit get', function() {
			expect(addedRoutes).to.be.an('array')
				.and.to.contain('GET: /foobaz');
		});

		it('should load default get', function() {
			expect(addedRoutes).to.be.an('array')
				.and.to.contain('GET: /foo');
		});

		it('should load default index', function() {
			expect(addedRoutes).to.be.an('array')
				.and.to.contain('GET: /bar');
		});

		it('should load relative path', function() {
			expect(addedRoutes).to.be.an('array')
				.and.to.contain('GET: /foo/relative');
		});

		it('should load absolute path', function() {
			expect(addedRoutes).to.be.an('array')
				.and.to.contain('GET: /fooAbsolute');
		});

		it('should load implicit get', function() {
			expect(addedRoutes).to.be.an('array')
				.and.to.contain('GET: /foo/implicit');
		});

		it('should load explicit get', function() {
			expect(addedRoutes).to.be.an('array')
				.and.to.contain('GET: /foo/explicitGet');
		});

		it('should load normal implicit', function() {
			expect(addedRoutes).to.be.an('array')
				.and.to.contain('GET: /foo/normalImplicit');
		});

		it('should load default post', function() {
			expect(addedRoutes).to.be.an('array')
				.and.to.contain('POST: /foo');
		});

		it('should load implicit post', function() {
			expect(addedRoutes).to.be.an('array')
				.and.to.contain('POST: /foo/implicit');
		});

		it('should load explicit post', function() {
			expect(addedRoutes).to.be.an('array')
				.and.to.contain('POST: /foo/explicit');
		});

		it('should load implicit with one parameter', function() {
			expect(addedRoutes).to.be.an('array')
				.and.to.contain('GET: /foo/oneParameterImplicit/:one');
		});

		it('should load implicit with two parameters', function() {
			expect(addedRoutes).to.be.an('array')
				.and.to.contain('GET: /foo/twoParametersImplicit/:one/:two');
		});

		it('should load explicit with one parameter', function() {
			expect(addedRoutes).to.be.an('array')
				.and.to.contain('GET: /foo/oneParameterExplicit/:one');
		});

		it('should load explicit with two parameters', function() {
			expect(addedRoutes).to.be.an('array')
				.and.to.contain('GET: /foo/twoParametersExplicit/:one/:two');
		});
	});

	describe('route handling', function() {

		beforeEach(function(done) {
			smartControllers.load(app, { controllerPath: controllerPath }, function() {
				done();
			});
		});

		it('should handle default controller default get', function(done) {
			request(app)
				.get('/')
				.expect(200, 'default index', done);
		});

		it('should handle default controller implicit get', function(done) {
			request(app)
				.get('/foobar')
				.expect(200, 'default foobar', done);
		});

		it('should handle default controller explicit get', function(done) {
			request(app)
				.get('/foobaz')
				.expect(200, 'default foobaz', done);
		});

		it('should handle default get', function(done) {
			request(app)
				.get('/foo')
				.expect(200, 'get', done);
		});

		it('should handle default index', function(done) {
			request(app)
				.get('/bar')
				.expect(200, 'index', done);
		});

		it('should handle relative path', function(done) {
			request(app)
				.get('/foo/relative')
				.expect(200, 'relative', done);
		});

		it('should handle absolute path', function(done) {
			request(app)
				.get('/fooAbsolute')
				.expect(200, 'absolute', done);
		});

		it('should handle implicit get', function(done) {
			request(app)
				.get('/foo/implicit')
				.expect(200, 'getImplicit', done);
		});

		it('should handle explicit get', function(done) {
			request(app)
				.get('/foo/explicitGet')
				.expect(200, 'getExplicit', done);
		});

		it('should handle normal implicit', function(done) {
			request(app)
				.get('/foo/normalImplicit')
				.expect(200, 'normalImplicit', done);
		});

		it('should handle default post', function(done) {
			request(app)
				.post('/foo')
				.expect(200, 'post', done);
		});

		it('should handle implicit post', function(done) {
			request(app)
				.post('/foo/implicit')
				.expect(200, 'postImplicit', done);
		});

		it('should handle explicit post', function(done) {
			request(app)
				.post('/foo/explicit')
				.expect(200, 'postExplicit', done);
		});

		it('should handle implicit with one parameter', function(done) {
			request(app)
				.get('/foo/oneParameterImplicit/first')
				.expect(200, 'oneParameterImplicit first', done);
		});

		it('should handle implicit with two parameters', function(done) {
			request(app)
				.get('/foo/twoParametersImplicit/first/second')
				.expect(200, 'twoParametersImplicit first second', done);
		});

		it('should handle explicit with one parameter', function(done) {
			request(app)
				.get('/foo/oneParameterExplicit/first')
				.expect(200, 'oneParameterExplicit first', done);
		});

		it('should handle explicit with two parameters', function(done) {
			request(app)
				.get('/foo/twoParametersExplicit/first/second')
				.expect(200, 'twoParametersExplicit first second', done);
		});
	});
});
