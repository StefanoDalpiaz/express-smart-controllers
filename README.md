# express-smart-controllers

`express-smart-controllers` is a [node.js](https://nodejs.org/) module to be used with [Express](http://expressjs.com/). It simplifies route management by automatically loading controllers and generating routes based on controller methods.

## Installation

Use Node Package Manager (npm) to download the module and install it in your project:

    npm install express-smart-controllers --save


## Basic Usage

In your Express application, simply require the module and call its `load` method passing the Express app as parameter. Example:

    var express = require('express');
    var smartControllers = require('express-smart-controllers');

    var app = express();
    smartControllers.load(app);

    app.listen(process.env.PORT || 80);

The above code will load all controllers located on the default directory `./controllers`, and will parse all its methods and properties to generate routes.


## Controller files

Below is an example of a controller file:

    // file name: /controllers/testController.js
    module.exports = {

        // optional controller name. If not specified, the file name will be used (without the 'Controller.js' part)
        controllerName: 'test',

        // optional base path for views. If not specified, the controller name will be used
        viewBasePath: 'test',


        // implicit GET method
        // will handle path GET /test
        get: function() {
            this.res.send('hello controllers');
        },

        // implicit GET method
        // will handle path GET /test/something
        getSomething: function() {
            // renders the view with path 'test/something'
            this.render({
                // data to pass to view
            });
        },

        // implicit GET method
        // will handle path GET /test/somethingElse
        getSomethingElse: function() {
            // renders the view with path 'test/customView'
            this.render('customView', {
                // data to pass to view
            });
        },

        // implicit POST method
        // will handle path POST /test
        post: function() {
            this.res.send('hello controllers');
        },

        // implicit POST method
        // will handle path POST /test/something
        postSomething: function() {
            this.res.send('hello controllers');
        },

        // hidden method
        // will not handle any implicit routes. Can be referenced by explicit routes
        _someHiddenMethod: function() {
            this.res.send('hello controllers');
        },

        // hidden method
        // will not handle any implicit routes. Can be referenced by explicit routes
        _someOtherHiddenMethod: function() {
            this.res.send('hello controllers');
        },

        // hidden method
        // will not handle any implicit routes. Can be referenced by explicit routes
        _yetAnotherHiddenMethod: function() {
            this.res.send('hello controllers');
        },


        // optional explicit routes
        routes: {
            "/explicitAbsoluteRoute": "_someHiddenMethod",         // will handle GET /explicitAbsoluteRoute by calling the method '_someHiddenMethod'
            "explicitRelativeRoute":  "_someOtherHiddenMethod",    // will handle GET /test/explicitRelativeRoute by calling the method '_someOtherHiddenMethod'
            "{POST} explicitPost":    "_yetAnotherHiddenMethod"    // will handle GET /test/explicitPost by calling the method '_yetAnotherHiddenMethod'
        }
   };

## Initialisation options:

 - **controllerPath** (string): specifies the file system location (relative to the root path of the Express application) where the controller files are located.

## Additional details
TODO

## Tests

Tests are provided to verify the correct execution of the module. To run those tests:

 - from the Console (or Command Prompt in Windows), navigate to the directory where the project has been saved

 - make sure that all the dependencies have been installed, by running `npm install`. This is only required once, and only in cases where the module has been installed using a method different from `npm install express-smart-controllers` - like cloning the GitHub repo or extracting from zip.

 - run `npm test`