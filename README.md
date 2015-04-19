# express-smart-controllers

**THIS DOCUMENTATION IS UNDER CONSTRUCTION!**

`express-smart-controllers` is a [node.js](https://nodejs.org/) module to be used with [Express](http://expressjs.com/). It simplifies route management by automatically loading controllers and generating routes based on controller methods.

## Installation

Use Node Package Manager (npm) to download the module and install it in your project:

    npm install express-smart-controllers --save


## Basic Usage

In your Express application, simply require the module and call its `load` method passing the Express app as parameter. Example:

```javascript
var express = require('express');
var smartControllers = require('express-smart-controllers');

var app = express();
smartControllers.load(app);

app.listen(process.env.PORT || 80);
```

The above code will load all controllers located on the default directory `./controllers`, and will parse all its methods and properties to generate routes.

It is also possible to load routes using an Express router instead of the Express application:

```javascript
var router = express.Router();
smartControllers.load(router);
app.use('/router-base-url', router);
```

## Controllers

Controller files should export a simple object with functions (called actions). Those functions will be used to create the routes. In its simplest form, a controller has the following structure:

```javascript
// filename: testController.js
module.exports = {

    action1: function() {
        this.res.send('ok');
    },

    action2: function() {
        this.render();
    },

    // ...
}
```

The above controller will handle the paths "/test/action1" and "/test/action2" without the need for any configuration.

The `this` context during the execution of the actions will be the controller itself, which will be injected with the following properties:

 - `this.req`: the request object that was provided by Express
 - `this.res`: the response object that was provided by Express
 - `this.render`: a utility method to simplify view rendering

Routing methods and view rendering will be explained in detail in the next sections.

## Routing

There are two different ways of creating a route: **implicit routes** and **explicit routes**.

### Implicit routes

Implicit routes can be simply defined by creating a function method in a controller object. The module will take care of creating the route automatically. Every function in the controller (with a few exceptions described later on) will correspond to a route. The generated routes will be used to handle the appropriate HTTP method, with a path that follows the pattern:

    /controllerName/actionName/optionalParameter1/optionalParameter2/...

The route will be created by extracting the following information:

 - **HTTP method** *(GET, POST, PUT, PATCH or DELETE)*: if the name of the function in the controller starts with an HTTP method (e.g. `getUser`, `postUser`, `deleteUser`, etc.), then that method will be used to handle that action. If the action has any other name (e.g. `news`, `home`, `about`, etc.), the GET method will be used.

 - **controllerName**: the controller name will be used as the first segment for the generated route URL. If not manually specified, the name of the file will be used, cleaned of the *.js* extension and any *Controller* or *Ctrl* suffix. For example, a controller that is defined in a file called `userController.js`, will have `user` as its controller name. It is also possible to override this by manually specifying the value. To do that, simply create a string property in the controller called `controllerName`, and assign it the appropriate value.

 - **actionName**: the action name will be used as the second segment for the generated route URL. Its value will be parsed from the name of the function that defines the route, minus the HTTP method name and other special configration characters described in later sections. For example, the methods `user`, getUser`, `postUser`, `deleteUser` will all take the action name `user`.

- **optionalParameter1**, **optionalParameter2**, etc.: if the function that defines the action accepts arguments, then those arguments will be used as additional segments for the route. When a URL is called which will be handled by the current action, the arguments will passed with the value of the parameter read from the URL. For example, a function defined as `search(name)` in a controller called `project`, will handle the path `/project/search/:name`. When a user opens the URL `/project/search/node`, then the function `search` will be executed, passing the value "node" to the argument `name`

**Special actions**: assigning one of the following names to an action will handle a particular path:

 - index
 - get
 - post
 - put
 - patch
 - delete

In all the above cases, the handled path will be just */controllerName*, using the HTTP verb specified in the action name. The action name `index` is the only one that is not the name of an HTTP verb; it handles the GET verb and is useful for default pages in a controller. The rest of the action names are intended for REST APIs.

**Hidden actions**: sometimes a developer might want to define a function which shouldn't be used to generate an implicit route. In order to "hide" a method from the implicit routing system, you can define the function by giving it a name that starts with an underscore "_". For example, if a controller has a method called `_loadFile`, that method will not be used to create any implicit route. The method, however, can still be used in explicit routes, which are described in the next section.

### Explicit routes

In many cases, you might want to define a route with a URL that does not strictly follow the conventions of implicit routing (controller name, followed by action name), so sometimes more flexibility is needed. To address that, the module provides an easy way to define any URL path for any controller action via explicit routes. To define the explicit routes, create an object property called `routes` in the controller object, in the format:

```javascript
{
    '/custom/absolute/path': 'functionName1',
    'custom/relative/path': 'functionName2',
    // other explicit routes
}
```

The key of each property will be the path to be used for the route. There are two ways of defining a path: absolute and relative.

 - Absolute paths start with a forward slash */* and will handle URLs relative to the application root.
 
 - Relative paths do not start with a forward slash, and will handle the paths relative to the current controller name. For example the second route defined above will handle the path */controllerName/custom/relative/path*.

By default, all explicit routes will handle the HTTP GET method. It is possible to specify the method by prefixing the path with the verb name wrapped in curly braces. Example:

```javascript
    '{POST} /some/path': 'someFunctionName'
```

Note that referencing a function in an explicit route does not prevent that function from being used for generating implicit routes. For example, take the following controller:

```javascript
{
    controllerName: 'test',

    routes: {
        '/custom': 'testFunction'
    },

    function testFunction() {
        // ...
    }
}
```

The above controller will ultimately handle two routes:

 - the explicit route defined with path */custom*

 - the implicit route generated for `testFunction`, with path */test/testFunction*

In order to avoid creating both explicit and implicit paths, unless that is the desired effect, it is recommended to give the function a name that starts with an underscore:

```javascript
{
    controllerName: 'test',

    routes: {
        '/custom': '_testFunction'
    },

    function _testFunction() {
        // ...
    }
}
```

The above controller will only generate the explicit route, because the `_testFunction` method is hidden, as it starts with an underscore.

## View rendering
When using a view engine to render the views, the module offers a quick way to render the right view without the need to specify its path. It works in a similar way to how the path for the route is constructed. Example:

```javascript
// fileName: testController.js
module.exports = {
    action1: function() {
        this.render({
            // optional data object
        });
    }
};
```

In the above controller, the `this.render` method call will be equivalent to calling `this.res.render('test/action1', {});`. The first segment of that path ("test") will be inferred from the file name (in the same way as the controller name for the route path URL), while the second segment, as in route paths, will be inferred from the action name. It is possible to manually specify the value of the first segment, by creating a property called `viewBaseName`.

It is also possible to specify the name of the view to render. So by calling `this.render('customView', {});` will render the view with path "/test/customView".

The `this.render` function only allows rendering of views under the same *viewBaseName* path. If you want to render a view under another path, you can normally use the "old" function `this.res.render`.

## Protected routes
**TODO: document this**

## Controller examples

Below is an example of a controller file:

```javascript
// file name: /controllers/testController.js
module.exports = {

    // optional controller name. If not specified, the file
    // name will be used (without the 'Controller.js' part)
    controllerName: 'test',

    // optional base path for views. If not specified, the
    // controller name will be used
    viewBasePath: 'test',


    // implicit GET method.
    // will handle path GET /test
    get: function() {
        this.res.send('hello controllers');
    },

    // implicit GET method.
    // will handle path GET /test/something
    getSomething: function() {
        // renders the view with path 'test/something'
        this.render({
            // data to pass to view
        });
    },

    // implicit GET method.
    // will handle path GET /test/somethingElse
    getSomethingElse: function() {
        // renders the view with path 'test/customView'
        this.render('customView', {
            // data to pass to view
        });
    },

    // implicit GET method with function parameters.
    // will handle path GET /test/withParameters/:foo/:bar
    getWithParameters: function(foo, bar) {
        // renders the view with path 'test/customView'
        this.res.json({ foo: foo, bar: bar });
    },

    // implicit POST method.
    // will handle path POST /test
    post: function() {
        this.res.send('hello controllers');
    },

    // implicit POST method.
    // will handle path POST /test/something
    postSomething: function() {
        this.res.send('hello controllers');
    },

    // hidden method.
    // will not handle any implicit routes. Can be referenced
    // by explicit routes
    _someHiddenMethod: function() {
        this.res.send('hello controllers');
    },

    // hidden method.
    // will not handle any implicit routes. Can be referenced
    // by explicit routes
    _someOtherHiddenMethod: function() {
        this.res.send('hello controllers');
    },

    // hidden method.
    // will not handle any implicit routes. Can be referenced
    // by explicit routes
    _yetAnotherHiddenMethod: function() {
        this.res.send('hello controllers');
    },


    // optional explicit routes
    routes: {
        "/explicitAbsoluteRoute": "_someHiddenMethod",         // will handle GET /explicitAbsoluteRoute by calling the method '_someHiddenMethod'
        "explicitRelativeRoute":  "_someOtherHiddenMethod",    // will handle GET /test/explicitRelativeRoute by calling the method '_someOtherHiddenMethod'
        "{POST} explicitPost":    "_yetAnotherHiddenMethod"    // will handle POST /test/explicitPost by calling the method '_yetAnotherHiddenMethod'
    }
};
```

## Initialisation options:

 - **controllerPath** (string): specifies the file system location (relative to the root path of the Express application) where the controller files are located.

## Tests

Tests are provided to verify the correct execution of the module. To run those tests:

 - from the Console (or Command Prompt in Windows), navigate to the directory where the project has been saved

 - make sure that all the dependencies have been installed, by running `npm install`. This is only required once, and only in cases where the module has been installed using a method different from `npm install express-smart-controllers` - like cloning the GitHub repo or extracting from zip.

 - run `npm test`