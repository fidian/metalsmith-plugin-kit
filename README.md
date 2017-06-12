Metalsmith Plugin Kit
=====================

Remove the boring part of making [Metalsmith] plugins and simply your life. Rely on tested code to do the menial tasks. Reuse the same base libraries in order to try to mitigate the explosion of files in the `node_modules/` folder.

**This is not a plugin!** It helps you make one.

[![npm version][npm-badge]][npm-link]
[![Build Status][travis-badge]][travis-link]
[![Dependencies][dependencies-badge]][dependencies-link]
[![Dev Dependencies][devdependencies-badge]][devdependencies-link]
[![codecov.io][codecov-badge]][codecov-link]


Overview
--------

An example goes a long way.

    // This is based on the plugin skeleton from Metalsmith.io
    var debug = require("debug")("metalsmith-myplugin");
    var multimatch = require("multimatch");

    module.exports = function myplugin(opts) {
        var matchFunction;

        if (!opts || typeof opts !== "object") {
            opts = {};
        }

        opts.pattern = opts.pattern || [];

        return function (files, metalsmith, done) {
            Object.keys(files).forEach(function(file) {
                if (multimatch(file, opts.pattern).length) {
                    debug("myplugin working on: %s", file);
                    //
                    // here would be your code
                    //
                }
            });
            done();
        };
    }

Plugin Kit helps remove the need for a matching library and iterating over the properties of the `files` object. Here's the same plugin rewritten for Plugin Kit.

    // Now, the same plugin written using Plugin Kit
    var debug = require("debug")("metalsmith-myplugin");
    var pluginKit = require("metalsmith-plugin-kit");

    module.exports = function myplugin(opts) {
        opts = pluginKit.defaultOptions({
            pattern: []
        }, opts);

        return pluginKit.middleware({
            each: function (filename, fileObject) {
                //
                // here would be your code
                //
            };
            match: opts.pattern
        });
    }

There are two huge benefits to this. The first shows up when you want to perform asynchronous tasks because all of the callbacks can return a value (synchronous), return a `Promise` (asynchronous) or accept a node-style callback (asynchronous).

The second big bonus you get is you don't need to test the file matching code nor do you need to construct tests that confirm the order of events. That's handled and tested by `metalsmith-plugin-kit`.

There's additional helper methods that simplify common tasks that plugins need to perform, such as creating files, cloning data structures, matching file globs, and renaming functions. The example above shows how to default options and it illustrates the middleware function.

If that wasn't enough, you should make sure you're not underestimating the positive aspects of being able to shift responsibility away from your code and into someone else's. You no longer need to make sure you are matching files correctly. It's not a problem for you to start to use asynchronous processing. When Metalsmith requires a property for a file to be properly created, this library handles it instead of you. I take on that responsibility and will work to maintain and test the features this module exposes.


Installation
------------

Use `npm` to install this package easily.

    $ npm install --save metalsmith-plugin-kit

Alternately you may edit your `package.json` and add this to your `dependencies` object:

    {
        ...
        "dependencies": {
            ...
            "metalsmith-plugin-kit": "*"
            ...
        }
        ...
    }

If you relied on a library like `micromatch`, `minimatch`, or `multimatch`, you can safely remove those lines.


API
---

<a name="module_metalsmith-plugin-kit"></a>

## metalsmith-plugin-kit
Metalsmith Plugin Kit

**Example**  
```js
var pluginKit = require("metalsmith-plugin-kit");
```

* [metalsmith-plugin-kit](#module_metalsmith-plugin-kit)
    * _static_
        * [.addFile(files, filename, contents, [options])](#module_metalsmith-plugin-kit.addFile)
        * [.callFunction(fn, args)](#module_metalsmith-plugin-kit.callFunction) ⇒ <code>Promise.&lt;\*&gt;</code>
        * [.clone(original)](#module_metalsmith-plugin-kit.clone) ⇒ <code>\*</code>
        * [.defaultOptions(defaults, override)](#module_metalsmith-plugin-kit.defaultOptions) ⇒ <code>Object</code>
        * [.filenameMatcher(match, [options])](#module_metalsmith-plugin-kit.filenameMatcher) ⇒ [<code>matchFunction</code>](#module_metalsmith-plugin-kit..matchFunction)
        * [.middleware([options])](#module_metalsmith-plugin-kit.middleware) ⇒ <code>function</code>
        * [.renameFunction(fn, name)](#module_metalsmith-plugin-kit.renameFunction)
    * _inner_
        * [~metalsmithFile](#module_metalsmith-plugin-kit..metalsmithFile) : <code>Object</code>
        * [~metalsmithFileCollection](#module_metalsmith-plugin-kit..metalsmithFileCollection) : <code>Object.&lt;string, metalsmith-plugin-kit~metalsmithFile&gt;</code>
        * [~matchItem](#module_metalsmith-plugin-kit..matchItem) : <code>string</code> \| <code>RegExp</code> \| <code>function</code>
        * [~matchList](#module_metalsmith-plugin-kit..matchList) : [<code>matchItem</code>](#module_metalsmith-plugin-kit..matchItem) \| [<code>Array.&lt;matchItem&gt;</code>](#module_metalsmith-plugin-kit..matchItem)
        * [~matchOptions](#module_metalsmith-plugin-kit..matchOptions) : <code>Object</code>
        * [~matchFunction](#module_metalsmith-plugin-kit..matchFunction) ⇒ <code>boolean</code>
        * [~middlewareDefinition](#module_metalsmith-plugin-kit..middlewareDefinition) : <code>Object</code>
        * [~endpointCallback](#module_metalsmith-plugin-kit..endpointCallback) : <code>function</code>
        * [~eachCallback](#module_metalsmith-plugin-kit..eachCallback) : <code>function</code>

<a name="module_metalsmith-plugin-kit.addFile"></a>

### metalsmith-plugin-kit.addFile(files, filename, contents, [options])
Adds a file to the files object. Converts the contents for you automatically.
Sets the file mode to 0644 as well.

The contents can be converted:

* Buffers remain intact.
* Strings are encoded into Buffer objects.
* All other things are passed through `JSON.stringify()` and then encoded
  as a buffer.

**Kind**: static method of [<code>metalsmith-plugin-kit</code>](#module_metalsmith-plugin-kit)  
**Params**

- files <code>metalsmith-plugin-kit~metalsmithFileCollection</code>
- filename <code>string</code>
- contents <code>Buffer</code> | <code>string</code> | <code>\*</code>
- [options] <code>Object</code>
    - [.encoding] <code>string</code> <code> = &quot;utf8&quot;</code>
    - [.mode] <code>string</code> <code> = &quot;0644&quot;</code>

**Example**  
```js
// Make a sample plugin that adds hello.txt.
return pluginKit.middleware({
    after: (files) => {
        pluginKit.addFile(files, "hello.txt", "Hello world!");
    }
});
```
<a name="module_metalsmith-plugin-kit.callFunction"></a>

### metalsmith-plugin-kit.callFunction(fn, args) ⇒ <code>Promise.&lt;\*&gt;</code>
Calls a function and passes it a number of arguments. The function can
be synchronous and return a value, asynchronous and return a Promise, or
asynchronous and support a Node-style callback.

The result of the promise is the value provided by the returned value,
the resolved Promise, or the callback's result. If there is an error thrown
or one supplied via a Promise rejection or the callback, this function's
Promise will be rejected.

**Kind**: static method of [<code>metalsmith-plugin-kit</code>](#module_metalsmith-plugin-kit)  
**Params**

- fn <code>function</code> - Function to call
- args <code>Array.&lt;\*&gt;</code> - Arguments to pass to the function.

**Example**  
```js
function testSync(message) {
    console.log(message);
}

promise = pluginKit.callFunction(testSync, [ "sample message" ]);
// sample message is printed and promise will be resolved asynchronously
```
**Example**  
```js
function testPromise(message) {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            console.log(message);
            resolve();
        }, 1000);
    });
}

promise = pluginKit.callFunction(testPromise, [ "sample message" ]);
// promise will be resolved after message is printed
```
**Example**  
```js
function testCallback(message, done) {
    setTimeout(() => {
        console.log(message);
        done();
    });
}

promise = pluginKit.callFunction(testCallback, [ "sample message" ]);
// promise will be resolved after message is printed
```
<a name="module_metalsmith-plugin-kit.clone"></a>

### metalsmith-plugin-kit.clone(original) ⇒ <code>\*</code>
Lightweight object clone function, primarily designed for plain objects,
expecially targeted for options to middleware.

Copies functions, regular expressions, Buffers, and other specialty
objects; does not close those items. Does not handle circular references.

**Kind**: static method of [<code>metalsmith-plugin-kit</code>](#module_metalsmith-plugin-kit)  
**Returns**: <code>\*</code> - clone  
**Params**

- original <code>\*</code>

**Example**  
```js
a = {};
b = pluginKit.clone(a);
a.test = true;

// This didn't update b because it's a clone.
console.log(JSON.stringify(b)); // {}
```
<a name="module_metalsmith-plugin-kit.defaultOptions"></a>

### metalsmith-plugin-kit.defaultOptions(defaults, override) ⇒ <code>Object</code>
Defaults options by performing a limited, shallow merge of two objects.
Returns a new object. Will not assign properties that are not defined in
the defaults.

**Kind**: static method of [<code>metalsmith-plugin-kit</code>](#module_metalsmith-plugin-kit)  
**Params**

- defaults <code>Object</code>
- override <code>Object</code>

**Example**  
```js
result = pluginKit.defaultOptions({
    a: "default",
    b: {
        bDefault: "default"
    }
}, {
    b: {
        bOverride: "override"
    },
    c: "override but won't make it to the result"
});

// result = {
//     a: "default"
//     b: {
//         bOverride: "override"
//     }
// }
```
<a name="module_metalsmith-plugin-kit.filenameMatcher"></a>

### metalsmith-plugin-kit.filenameMatcher(match, [options]) ⇒ [<code>matchFunction</code>](#module_metalsmith-plugin-kit..matchFunction)
Builds a function to determine if a file matches patterns.

The chance that we switch from micromatch is extremely remote, but it could
happen. If another library is used, all existing Plugin Kit tests must
continue to pass unchanged. It is the duty of this function to remap
options or perform the calls in another way so the alternate library can
work. All of the flags documented below must continue to work as expected.

**Kind**: static method of [<code>metalsmith-plugin-kit</code>](#module_metalsmith-plugin-kit)  
**Params**

- match [<code>matchList</code>](#module_metalsmith-plugin-kit..matchList)
- [options] [<code>matchOptions</code>](#module_metalsmith-plugin-kit..matchOptions)

**Example**  
```js
var matcher;

matcher = pluginKit.filenameMatcher("*.txt");
[
    "test.txt",
    "test.html"
].forEach((fileName) => {
    console.log(fileName, matcher(fileName));
    // test.txt true
    // test.html false
});
```
<a name="module_metalsmith-plugin-kit.middleware"></a>

### metalsmith-plugin-kit.middleware([options]) ⇒ <code>function</code>
Return middleware function. This is why Plugin Kit was created. It helps
handle asynchronous tasks, eliminates the need for using your own
matcher and you no longer iterate through the files with `Object.keys()`.

**Kind**: static method of [<code>metalsmith-plugin-kit</code>](#module_metalsmith-plugin-kit)  
**Returns**: <code>function</code> - middleware function  
**Params**

- [options] [<code>middlewareDefinition</code>](#module_metalsmith-plugin-kit..middlewareDefinition)

**Example**  
```js
var fileList;

return pluginKit.middleware({
    after: (files) => {
        pluginKit.addFile(files, "all-files.json", fileList);
    },
    before: () => {
        fileList = [];
    },
    each: (filename) => {
        fileList.push(filename);
    }
});
```
**Example**  
```js
// Renames the returned function so it can be displayed by
// metalsmith-debug-ui and other tools.
// This silly plugin changes all instances of "fidian" to lower case
// in all text-like files.
return pluginKit.middleware({
    each: (filename, file) => {
        var contents;

        contents = file.contents.toString("utf8");
        contents = contents.replace(/fidian/ig, "fidian");
        file.contents = Buffer.from(contents, "utf8");
    },
    match: "*.{c,htm,html,js,json,md,txt}",
    matchOptions: {
        basename: true
    },
    name: "metalsmith-lowercase-fidian"
});
```
**Example**  
```js
// Illustrates asynchronous processing.
return pluginKit.middleware({
    after: (files) => {
        // Promise-based. Delay 5 seconds when done building.
        return new Promise((resolve) => {
            setTimeout(() => {
                console.log("I paused for 5 seconds");
                resolve();
            }, 5000);
        });
    },
    before: (files, metalsmith, done) => {
        // Callback-based. Add a file to the build.
        fs.readFile("content.txt", (err, buffer) => {
            if (!err) {
                pluginKit.addFile(files, "content.txt", buffer);
            }
            done(err);
        });
    }
});
```
<a name="module_metalsmith-plugin-kit.renameFunction"></a>

### metalsmith-plugin-kit.renameFunction(fn, name)
Renames a function by assigning the name property. This isn't as simple
as just using `yourFunction.name = "new name"`. Because it was done in
Plugin Kit, it is also exposed in the unlikely event that plugins want to
use it.

**Kind**: static method of [<code>metalsmith-plugin-kit</code>](#module_metalsmith-plugin-kit)  
**Params**

- fn <code>function</code>
- name <code>string</code>

**Example**  
```js
x = () => {};
console.log(x.name); // Could be undefined, could be "x".
pluginKit.renameFunction(x, "MysteriousFunction");
console.log(x.name); // "MysteriousFunction"
```
<a name="module_metalsmith-plugin-kit..metalsmithFile"></a>

### metalsmith-plugin-kit~metalsmithFile : <code>Object</code>
This is a typical file object from Metalsmith.

Other properties may be defined, but the ones listed here must be defined.

**Kind**: inner typedef of [<code>metalsmith-plugin-kit</code>](#module_metalsmith-plugin-kit)  
**Properties**

| Name | Type |
| --- | --- |
| contents | <code>Buffer</code> | 
| mode | <code>string</code> | 

<a name="module_metalsmith-plugin-kit..metalsmithFileCollection"></a>

### metalsmith-plugin-kit~metalsmithFileCollection : <code>Object.&lt;string, metalsmith-plugin-kit~metalsmithFile&gt;</code>
Metalsmith's collection of files.

**Kind**: inner typedef of [<code>metalsmith-plugin-kit</code>](#module_metalsmith-plugin-kit)  
<a name="module_metalsmith-plugin-kit..matchItem"></a>

### metalsmith-plugin-kit~matchItem : <code>string</code> \| <code>RegExp</code> \| <code>function</code>
As a string, this is a single match pattern. It supports the following
features, which are taken from the Bash 4.3 specification. With each feature
listed, a couple sample examples are shown.

* Wildcards: `**`, `*.js`
* Negation: `!a/*.js`, `*!(b).js`
* Extended globs (extglobs): `+(x|y)`, `!(a|b)`
* POSIX character classes: `[[:alpha:][:digit:]]`
* Brace expansion: `foo/{1..5}.md`, `bar/{a,b,c}.js`
* Regular expression character classes: `foo-[1-5].js`
* Regular expression logical "or": `foo/(abc|xyz).js`

When a RegExp, the file is tested against the regular expression.

When this is a function, the filename is passed as the first argument and
the file contents are the second argument. If the returned value is truthy,
the file matches. This function may not be asynchronous.

**Kind**: inner typedef of [<code>metalsmith-plugin-kit</code>](#module_metalsmith-plugin-kit)  
**See**: [https://github.com/micromatch/micromatch#extended-globbing](https://github.com/micromatch/micromatch#extended-globbing) for extended globbing features.  
<a name="module_metalsmith-plugin-kit..matchList"></a>

### metalsmith-plugin-kit~matchList : [<code>matchItem</code>](#module_metalsmith-plugin-kit..matchItem) \| [<code>Array.&lt;matchItem&gt;</code>](#module_metalsmith-plugin-kit..matchItem)
This can be one `matchItem` or an array of `matchItem` values.

**Kind**: inner typedef of [<code>metalsmith-plugin-kit</code>](#module_metalsmith-plugin-kit)  
<a name="module_metalsmith-plugin-kit..matchOptions"></a>

### metalsmith-plugin-kit~matchOptions : <code>Object</code>
These options control the matching library, which is only used when a
string is passed as the `matchItem`. All listed options will be
supported, even in the unlikely future that the matching library is
replaced.

Other options are also available from the library itself.

**Kind**: inner typedef of [<code>metalsmith-plugin-kit</code>](#module_metalsmith-plugin-kit)  
**See**: [https://github.com/micromatch/micromatch#options](https://github.com/micromatch/micromatch#options) for additional options supported by current backend library.  
**Properties**

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| basename | <code>boolean</code> | <code>false</code> | Allow glob patterns without slashes to match a file path based on its basename. |
| dot | <code>boolean</code> | <code>false</code> | Enable searching of files and folders that start with a dot. |
| nocase | <code>boolean</code> | <code>false</code> | Enable case-insensitive searches. |

<a name="module_metalsmith-plugin-kit..matchFunction"></a>

### metalsmith-plugin-kit~matchFunction ⇒ <code>boolean</code>
The function that's returned by `filenameMatcher`. Pass it your filenames
and it will synchronously determine if that matches any of the patterns that
were previously passed into `filenameMatcher`.

**Kind**: inner typedef of [<code>metalsmith-plugin-kit</code>](#module_metalsmith-plugin-kit)  
**See**: [filenameMatcher](#module_metalsmith-plugin-kit.filenameMatcher)  
**Params**

- filename <code>string</code>

<a name="module_metalsmith-plugin-kit..middlewareDefinition"></a>

### metalsmith-plugin-kit~middlewareDefinition : <code>Object</code>
Middleware defintion object.

**Kind**: inner typedef of [<code>metalsmith-plugin-kit</code>](#module_metalsmith-plugin-kit)  
**See**

- [middleware](#module_metalsmith-plugin-kit.middleware)
- {@link https://github.com/leviwheatcroft/metalsmith-debug-ui)

**Properties**

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| after | [<code>endpointCallback</code>](#module_metalsmith-plugin-kit..endpointCallback) |  | Called after all files are processed. |
| before | [<code>endpointCallback</code>](#module_metalsmith-plugin-kit..endpointCallback) |  | Called before any files are processed. |
| each | [<code>eachCallback</code>](#module_metalsmith-plugin-kit..eachCallback) |  | Called  once for each file that matches. |
| match | [<code>matchList</code>](#module_metalsmith-plugin-kit..matchList) |  | Defaults to all files |
| matchOptions | [<code>matchOptions</code>](#module_metalsmith-plugin-kit..matchOptions) | <code>{}</code> |  |
| name | <code>string</code> |  | When supplied, renames the middleware function that's returned to the given name. Useful for `metalsmith-debug-ui`, for instance. |

<a name="module_metalsmith-plugin-kit..endpointCallback"></a>

### metalsmith-plugin-kit~endpointCallback : <code>function</code>
A callback that is called before processing any file or after processing
any file.

Uses Node-style callbacks if your function expects more than 2 parameters.

**Kind**: inner typedef of [<code>metalsmith-plugin-kit</code>](#module_metalsmith-plugin-kit)  
**See**

- [callFunction](#module_metalsmith-plugin-kit.callFunction)
- [middlewareDefinition](#module_metalsmith-plugin-kit..middlewareDefinition)

**Params**

- files <code>module:metalsmith-plugin-kit~metalsmithFiles</code>
- metalsmith <code>external:metalsmith</code>
- [done] <code>function</code>

<a name="module_metalsmith-plugin-kit..eachCallback"></a>

### metalsmith-plugin-kit~eachCallback : <code>function</code>
This is the function that will be fired when a file matches your match
criteria. It will be executed once for each file. It also could run
concurrently with other functions when you are performing asynchronous
work.

Uses Node-style callbacks if your function expects more than 4 parameters.

**Kind**: inner typedef of [<code>metalsmith-plugin-kit</code>](#module_metalsmith-plugin-kit)  
**See**

- [callFunction](#module_metalsmith-plugin-kit.callFunction)
- [middlewareDefinition](#module_metalsmith-plugin-kit..middlewareDefinition)

**Params**

- filename <code>string</code>
- file [<code>metalsmithFile</code>](#module_metalsmith-plugin-kit..metalsmithFile)
- files <code>module:metalsmith-plugin-kit~metalsmithFiles</code>
- metalsmith <code>external:metalsmith</code>
- [done] <code>function</code>



License
-------

This software is licensed under a [MIT license][LICENSE] that contains additional non-advertising and patent-related clauses.  [Read full license terms][LICENSE]


[codecov-badge]: https://img.shields.io/codecov/c/github/fidian/metalsmith-plugin-kit/master.svg
[codecov-link]: https://codecov.io/github/fidian/metalsmith-plugin-kit?branch=master
[dependencies-badge]: https://img.shields.io/david/fidian/metalsmith-plugin-kit.svg
[dependencies-link]: https://david-dm.org/fidian/metalsmith-plugin-kit
[devdependencies-badge]: https://img.shields.io/david/dev/fidian/metalsmith-plugin-kit.svg
[devdependencies-link]: https://david-dm.org/fidian/metalsmith-plugin-kit#info=devDependencies
[LICENSE]: LICENSE.md
[Metalsmith]: http://www.metalsmith.io/
[npm-badge]: https://img.shields.io/npm/v/metalsmith-plugin-kit.svg
[npm-link]: https://npmjs.org/package/metalsmith-plugin-kit
[travis-badge]: https://img.shields.io/travis/fidian/metalsmith-plugin-kit/master.svg
[travis-link]: http://travis-ci.org/fidian/metalsmith-plugin-kit
