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
		it('should load with app parameter', function() {
			smartControllers.load(app, { controllerPath: controllerPath }, function() {
				var addedRoutes = getAllRoutes(app._router.stack);
				expect(addedRoutes).to.be.an('array')
					.and.to.contain('GET: /foo')
					.and.to.contain('GET: /bar');
				done();
			});
		});

		it('should load with router parameter', function() {
			var router = express.Router();
			smartControllers.load(router, { controllerPath: controllerPath }, function() {
				var addedRoutes = getAllRoutes(app._router.stack);
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
	});

	describe('route handling', function() {

		beforeEach(function(done) {
			smartControllers.load(app, { controllerPath: controllerPath }, function() {
				done();
			});
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
	});
});
