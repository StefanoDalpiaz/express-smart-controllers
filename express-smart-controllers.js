/**
 * @file Provides functionality to automatically load controllers and routes in Node.js Express, using a convention-over-configuration pattern
 * @name Express Smart Controllers
 * @author Stefano Dalpiaz
 * @license MIT
 */

var fs = require('fs');
var path = require('path');
var recursive = require('recursive-readdir');

var trimPattern = /^\s+|\s+$/g;
var implicitMethodPattern = /^(get|post|put|patch|delete)/;
var explicitMethodPattern = /^\{\s*(GET|POST|PUT|DELETE|PATCH)\s*\}\s*/;
var explicitAuthPattern = /\s*\!$/;
var implicitAuthPattern = /\s*\!$/;
var explicitIgnoreAuthPattern = /\s*\?$/;
var implicitIgnoreAuthPattern = /\s*\?$/;


/**
 * The main loader class
 *
 * @constructor
 *
 * @param {object} router The Express router (required)
 * @param {object} options Initialisation options (optional)
 */
var ExpressControllers = function(router, options) {
	this.router = router;
	this.options = options || {};

	// set default value options if not provided
	this.options.controllerPath = this.options.controllerPath || './controllers';
	this.options.loginUrl = this.options.loginUrl || '/login';
	this.options.checkAuthFn = this.options.checkAuthFn || null;

};

/**
 * Gets the Express middleware function that will be used to check if the user is authenticated
 *
 * @returns {function} The Express middleware function that will be used to check if the user is authenticated
 */
ExpressControllers.prototype.requireAuthentication = function() {
	var that = this;
	return function (req, res, next) {
		// this is to avoid calling doCheck twice in cases when the custom checkAuthFn function returns a bool and calls the callback at the same time
		var hasChecked = false;
		var doCheck = function(isAuth) {
			if (!hasChecked) {
				hasChecked = true;
				return isAuth ? next() : res.redirect(that.options.loginUrl);
			}
		};
		if (that.options.checkAuthFn) {
			// checkAuthFn can return a bool immediately, or call a callback with a bool parameter
			var isAuth = that.options.checkAuthFn(req, doCheck);
			if (isAuth === true || isAuth === false) {
				return doCheck(isAuth);
			}
		}
		else
			doCheck(!req.isAuthenticated || req.isAuthenticated());
	};
};

/**
 * Gets the parameter names that a function accepts
 *
 * @param {function} fn The function to reflect
 *
 * @returns {array} A list of parameter names
 */
ExpressControllers.prototype.getParameterNames = function(fn) {
	// http://stackoverflow.com/questions/6921588/is-it-possible-to-reflect-the-arguments-of-a-javascript-function
	var args = fn.toString().match (/^\s*function\s+(?:\w*\s*)?\((.*?)\)/);
	args = args ? (args[1] ? args[1].trim().split (/\s*,\s*/) : []) : null;
	return args;
};

/**
 * Adds a route handler to the Express router
 *
 * @param {string} method The HTTP method to use (possible values: 'get, 'post', 'put', 'patch', 'delete')
 * @param {string} pathName The URL path for the current route, relative to the URL base of the router
 * @param {string} viewBaseName The base path that contains the view. By default this is the controller name (i.e. the file name without extension and stripped of the suffix 'Controller' or 'Ctrl')
 * @param {string} actionName The name of the function to execute when handling this route
 * @param {boolean} authenticate Whether the current route requires authentication
 * @param {object} controllerDef The user-defined controller object
 */
ExpressControllers.prototype.addRoute = function(method, pathName, viewBaseName, actionName, args, authenticate, controllerDef) {
	// addedClasses will act as a cache, so that the generated classes can be reused across routes for the same controller
	if (!this.addedClasses)
		this.addedClasses = [];

	var ControllerClass;

	// check if a class for the current controller definition has already been created
	var addedObj = this.addedClasses.filter(function(item) { return item.controllerDef === controllerDef; });
	if (addedObj && addedObj.length > 0) {
		ControllerClass = addedObj[0].controllerClass;
	}
	else {
		// create a class that uses the current controller definition as a prototype. This class will be resused
		// across all of the routes for the same controller
		ControllerClass = function(req, res, next, method, pathName, viewBaseName, actionName, authenticate) {
			this.req = req;
			this.res = res;
			this.next = next;

			// define a render method, that allows the view path to be implicit
			this.render = function() {
				var viewName = actionName.replace(implicitAuthPattern, '').replace(implicitIgnoreAuthPattern, '');
				var data = {};
				if (typeof(arguments[0]) === 'string') {
					// a view name was specified, so the data was passed as second argument
					viewName = arguments[0] || viewName;
					data = arguments[1] || data;
				}
				else {
					// a view name was not specified, so the data was passed as first argument
					data = arguments[0] || data;
				}
				res.render(viewBaseName + '/' + viewName, data);
			};
		};
		ControllerClass.prototype = controllerDef;

		// add the generated class to the cache
		this.addedClasses.push({ controllerDef: controllerDef, controllerClass: ControllerClass });

	}

	// the function that will be passed to the Express router to handle the current route
	var actionFn = function(req, res, next) {
		actionArgs = (args || []).map(function(arg) {
			return req.params[arg];
		});
		var controller = new ControllerClass(req, res, next, method, pathName, viewBaseName, actionName, authenticate);
		controller[actionName].apply(controller, actionArgs);
	};

	if (authenticate) {
		this.router[method]('/' + pathName.replace(/^\/+/, ''), this.requireAuthentication(), actionFn);
	}
	else {
		this.router[method]('/' + pathName.replace(/^\/+/, ''), actionFn);
	}
};

/**
 * Parses the current route path to determine whether it requires the user to be authenticated
 *
 * @param {string} pathName The current route path
 * @param {boolean} authenticateAll Whether the current controller has been configured to require authentication for all routes by default
 * @param {boolean} isExplicit Whether the route to be parsed is explicit or implicit
 *
 * @returns {boolean} Whether the current route path requires authentication
 */
ExpressControllers.prototype.needsAuthentication = function(pathName, authenticateAll, isExplicit) {
	var authenticate = authenticateAll;
	if (!authenticate) {
		// the controller does not require all routes to be authenticated, so check if this route does
		var authPattern = isExplicit ? explicitAuthPattern : implicitAuthPattern;
		authenticate = authPattern.test(pathName);
	}
	else {
		// the controller requires all routes to be authenticated, so check if this route is an exception
		var ignoreAuthPattern = isExplicit ? explicitIgnoreAuthPattern : implicitIgnoreAuthPattern;
		authenticate = !ignoreAuthPattern.test(pathName);
	}
	return authenticate;
};


/**
 * Gets the base data associated to the current controller, which includes:
 * - controllerDef: the controller definition itself
 * - controllerName: the name of the controller read from the user-defined configuration value, or, if missing, from the cleaned file name
 * - viewBaseName: the base path for the views to render in the current controller
 * - authenticateAll: whether the current controller requires the user to be authenticated for all routes
 *
 * @param {object} controller The current controller
 * @param {string} fileName The name of the file that contains the current controller
 *
 * @returns {object} The controller data
 */
ExpressControllers.prototype.getControllerData = function(controller, fileName) {
	var controllerName = controller.controllerName || fileName.replace(/(controller|ctrl)?\.js/i, '');
	var viewBaseName = controller.viewBaseName || controllerName;
	var authenticateAll = !!controller.authenticateAll;
	return {
		controllerDef: controller,
		controllerName: controllerName,
		viewBaseName: viewBaseName,
		authenticateAll: authenticateAll
	};
};


/**
 * Parses the current route path to determine which HTTP method should be used
 *
 * @param {string} pathName The current route path
 * @param {boolean} isExplicit Whether the route to be parsed is explicit or implicit
 *
 * @returns {string} The HTTP method for the current route. Possible values: 'get, 'post', 'put', 'patch', 'delete'.
 */
ExpressControllers.prototype.getMethod = function(pathName, isExplicit) {
	var methodPattern = isExplicit ? explicitMethodPattern : implicitMethodPattern;
	var methodMatch = methodPattern.exec(pathName);
	var method = 'get';
	if (methodMatch && methodMatch[1]) {
		method = methodMatch[1].toLowerCase();
	}
	return method;
};


/**
 * Loads all the routes that are explicitly defined by the user for the current controller
 *
 * @param {object} controllerData The current controller data, as provided by the {@link ExpressControllers.prototype.getControllerData} function
 */
ExpressControllers.prototype.loadExplicitRoutes = function(controllerData) {
	var controller = controllerData.controllerDef;
	if (controller.routes) {

		for (var route in controller.routes) {
			if (controller.routes.hasOwnProperty(route)) {
				var actionName = controller.routes[route];

				var pathName = route.replace(trimPattern, '');

				// check if authentication is required
				var authenticate = this.needsAuthentication(pathName, controllerData.authenticateAll, true);
				pathName = pathName.replace(explicitAuthPattern, '').replace(explicitIgnoreAuthPattern, '');

				// check method name
				var method = this.getMethod(pathName, true);
				pathName = pathName.replace(explicitMethodPattern, '');
				var controllerName = controllerData.controllerName == "default" ? "" : controllerData.controllerName;

				if (pathName) {
					// explicit paths starting with '/' are relative to the router root url, while paths starting with
					// something else are relative to the current controller base url
					if (pathName.charAt(0) !== '/')
						pathName = controllerName + '/' + pathName;
					else
						pathName = pathName.substr(1);
				}

				// check if the path contains dynamic parameters. They will be passed as function arguments to the handler
				var args = [];
				var splitPath = pathName.split('/');
				for (var i = 0; i < splitPath.length; i++) {
					if (splitPath[i].charAt(0) === ':')
						args.push(splitPath[i].replace(/^\:/, ''));
				}

				this.addRoute(method, pathName, controllerData.viewBaseName, actionName, args, authenticate, controller);
			}
		}
	}
};


/**
 * Reads all the method defined in the current controller and creates implicit routes
 *
 * @param {object} controllerData The current controller data, as provided by the {@link ExpressControllers.prototype.getControllerData} function
 */
ExpressControllers.prototype.loadImplicitRoutes = function(controllerData) {
	var controller = controllerData.controllerDef;

	for (var fnName in controller) {
		if (typeof(controller[fnName]) === 'function' && controller.hasOwnProperty(fnName) && fnName.charAt(0) !== '_') {
			var pathName = fnName.replace(trimPattern, '');

			// check if authentication is required
			var authenticate = this.needsAuthentication(pathName, controllerData.authenticateAll, false);
			// clean the path name by removing the characters used to define authentication
			pathName = pathName.replace(implicitAuthPattern, '').replace(implicitIgnoreAuthPattern, '');

			// check method name
			var method = this.getMethod(pathName, false);
			// as a convention, the 'index' method will handle a GET request for the base path of the current controller (same way as the 'get' action)
			if (pathName === 'index')
				pathName = '';
			// clean the path name by removing the characters used to define the HTTP method
			if (implicitMethodPattern.test(pathName)) {
				pathName = pathName.replace(implicitMethodPattern, '');
				if (pathName)
					pathName = pathName.charAt(0).toLowerCase() + pathName.substr(1);
			}

			// check if the function accepts arguments. If it does, route paramters will be created
			var args = this.getParameterNames(controller[fnName]);
			if (args) {
				for (var i = 0; i < args.length; i++) {
					pathName += (pathName ? '/' : '') + ':' + args[i];
				}
			}

			var controllerName = controllerData.controllerName == "default" ? "" : controllerData.controllerName;

			this.addRoute(method, controllerName + (pathName ? '/' + pathName : ''), controllerData.viewBaseName, fnName, args, authenticate, controller);

		}
	}
};


/**
 * Retrieves the list of existing controllers in the configured location in the file system, and sets all the implicit and explicit routes
 *
 * @param {function} callback The function to execute when all routes have been loaded
 */
ExpressControllers.prototype.loadControllers = function(callback) {
	// determine the absolute path to the directory that contains the controllers
	var localPath;
	if (module.parent)
		localPath = path.resolve(path.dirname(module.parent.filename));
	else
		localPath = __dirname;

	var controllersFullPath = path.resolve(localPath, this.options.controllerPath);
	var that = this;

	// get a list of all files in the controllers directory
	recursive(controllersFullPath, function (err, files) {
		if (err)
			throw err;
		files.forEach(function(file) {
			var relativePath = path.relative(controllersFullPath, file).replace('\\', '/');
			var extension = path.extname(relativePath);
			if (extension === '.js') {
				var controller = require(file);
				if (controller) {
					var controllerData = that.getControllerData(controller, relativePath);
					that.loadExplicitRoutes(controllerData);
					that.loadImplicitRoutes(controllerData);
				}
			}
		});
		if (callback && typeof(callback) === 'function')
			callback.apply(that, [that.router]);
	});
};


/**
 * A shortcut method for creating a new instance of {@link ExpressControllers} and immediately calling the {@link ExpressControllers.prototype.loadControllers} function
 *
 * @constructor
 *
 * @param {object} router The Express router (required)
 * @param {object} options Initialisation options (optional)
 * @param {function} callback The function to execute when all routes have been loaded
 */
ExpressControllers.load = function(router, options, callback) {
	var expressControllers = new ExpressControllers(router, options);
	expressControllers.loadControllers(callback);
	return expressControllers.router;
};



module.exports = ExpressControllers;
