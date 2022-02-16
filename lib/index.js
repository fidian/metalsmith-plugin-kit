/**
 * Metalsmith Plugin Kit
 *
 * @example
 * var pluginKit = require("metalsmith-plugin-kit");
 *
 * @module metalsmith-plugin-kit
 */
"use strict";

/**
 * This is a typical file object from Metalsmith.
 *
 * Other properties may be defined, but the ones listed here must be defined.
 *
 * @typedef {Object} metalsmithFile
 * @property {Buffer} contents
 * @property {string} mode
 */

/**
 * Metalsmith's collection of files.
 *
 * @typedef {Object.<string,metalsmith-plugin-kit~metalsmithFile>} metalsmithFileCollection
 */

var micromatch;

micromatch = require("micromatch");


/**
 * Adds a file to the files object. Converts the contents for you automatically.
 * Sets the file mode to 0644 as well.
 *
 * The contents can be converted:
 *
 * * Buffers remain intact.
 * * Strings are encoded into Buffer objects.
 * * All other things are passed through `JSON.stringify()` and then encoded
 *   as a buffer.
 *
 * @example
 * // Make a sample plugin that adds hello.txt.
 * return pluginKit.middleware({
 *     after: (files) => {
 *         pluginKit.addFile(files, "hello.txt", "Hello world!");
 *     }
 * });
 *
 * @param {metalsmith-plugin-kit~metalsmithFileCollection} files
 * @param {string} filename
 * @param {(Buffer|string|*)} contents
 * @param {Object} [options]
 * @param {string} [options.encoding=utf8]
 * @param {string} [options.mode=0644]
 */
exports.addFile = (files, filename, contents, options) => {
    options = exports.defaultOptions({
        encoding: "utf8",
        mode: "0644"
    }, options);

    if (!Buffer.isBuffer(contents)) {
        if (typeof contents !== "string") {
            contents = JSON.stringify(contents);
        }

        contents = Buffer.from(contents, options.encoding);
    }

    files[filename] = {
        contents,
        mode: options.mode
    };
};


/**
 * Calls a function and passes it a number of arguments. The function can
 * be synchronous and return a value, asynchronous and return a Promise, or
 * asynchronous and support a Node-style callback.
 *
 * The result of the promise is the value provided by the returned value,
 * the resolved Promise, or the callback's result. If there is an error thrown
 * or one supplied via a Promise rejection or the callback, this function's
 * Promise will be rejected.
 *
 * @example
 * function testSync(message) {
 *     console.log(message);
 * }
 *
 * promise = pluginKit.callFunction(testSync, [ "sample message" ]);
 * // sample message is printed and promise will be resolved asynchronously
 *
 * @example
 * function testPromise(message) {
 *     return new Promise((resolve, reject) => {
 *         setTimeout(() => {
 *             console.log(message);
 *             resolve();
 *         }, 1000);
 *     });
 * }
 *
 * promise = pluginKit.callFunction(testPromise, [ "sample message" ]);
 * // promise will be resolved after message is printed
 *
 * @example
 * function testCallback(message, done) {
 *     setTimeout(() => {
 *         console.log(message);
 *         done();
 *     });
 * }
 *
 * promise = pluginKit.callFunction(testCallback, [ "sample message" ]);
 * // promise will be resolved after message is printed
 *
 * @param {Function} fn Function to call
 * @param {Array.<*>} [args] Arguments to pass to the function.
 * @return {Promise.<*>}
 */
exports.callFunction = (fn, args) => {
    if (!fn) {
        return Promise.resolve();
    }

    if (args && fn.length > args.length) {
        // Supports callbacks
        return new Promise((resolve, reject) => {
            args = args.concat((err, result) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(result);
                }
            });
            fn.apply(null, args);
        });
    }

    // Synchronous and promise-enabled functions
    return new Promise((resolve) => {
        var result;

        result = fn.apply(null, args);
        resolve(result);
    });
};


/**
 * Chains multiple plugins into one
 *
 * @example
 * const plugin1 = require('metalsmith-markdown')();
 * const plugin2 = require('metalsmith-data-loader')();
 * const pluginKit = require('metalsmith-plugin-kit');
 *
 * const combined = pluginKit.chain(plugin1, plugin2);
 * metalsmith.use(combined);
 *
 * @param {Function} plugin... Plugins to combine
 * @return {Function} Combined function
 */
exports.chain = (...args) => {
    return (files, metalsmith, done) => {
        let i;

        i = 0;

        const runNext = (e) => {
            if (e || args.length <= i) {
                done(e);
            } else {
                const plugin = args[i];

                i += 1;
                plugin(files, metalsmith, runNext);
            }
        };

        runNext();
    };
};

/**
 * Lightweight object clone function, primarily designed for plain objects,
 * expecially targeted for options to middleware.
 *
 * Copies functions, regular expressions, Buffers, and other specialty
 * objects; does not close those items. Does not handle circular references.
 *
 * @example
 * a = {};
 * b = pluginKit.clone(a);
 * a.test = true;
 *
 * // This didn't update b because it's a clone.
 * console.log(JSON.stringify(b)); // {}
 *
 * @param {*} original
 * @return {*} clone
 */
exports.clone = (original) => {
    var i, keys, result;

    if (!original || typeof original !== "object") {
        return original;
    }

    if (original instanceof RegExp) {
        return original;
    }

    if (Array.isArray(original)) {
        result = [];
    } else {
        result = {};
    }

    keys = Object.keys(original);

    for (i = 0; i < keys.length; i += 1) {
        result[keys[i]] = exports.clone(original[keys[i]]);
    }

    return result;
};


/**
 * Defaults options by performing a limited, shallow merge of two objects.
 * Returns a new object. Will not assign properties that are not defined in
 * the defaults.
 *
 * @example
 * result = pluginKit.defaultOptions({
 *     a: "default",
 *     b: {
 *         bDefault: "default"
 *     }
 * }, {
 *     b: {
 *         bOverride: "override"
 *     },
 *     c: "override but won't make it to the result"
 * });
 *
 * // result = {
 * //     a: "default"
 * //     b: {
 * //         bOverride: "override"
 * //     }
 * // }
 *
 * @param {Object} defaults
 * @param {Object} override
 * @return {Object}
 */
exports.defaultOptions = (defaults, override) => {
    var result;

    result = {};

    Object.keys(defaults).forEach((key) => {
        result[key] = exports.clone(defaults[key]);
    });

    if (override && typeof override === "object") {
        Object.keys(override).forEach((key) => {
            if (Object.prototype.hasOwnProperty.call(result, key)) {
                result[key] = exports.clone(override[key]);
            }
        });
    }

    return result;
};


/**
 * As a string, this is a single match pattern. It supports the following
 * features, which are taken from the Bash 4.3 specification. With each feature
 * listed, a couple sample examples are shown.
 *
 * * Wildcards: `**`, `*.js`
 * * Negation: `!a/*.js`, `*!(b).js`
 * * Extended globs (extglobs): `+(x|y)`, `!(a|b)`
 * * POSIX character classes: `[[:alpha:][:digit:]]`
 * * Brace expansion: `foo/{1..5}.md`, `bar/{a,b,c}.js`
 * * Regular expression character classes: `foo-[1-5].js`
 * * Regular expression logical "or": `foo/(abc|xyz).js`
 *
 * When a RegExp, the file is tested against the regular expression.
 *
 * When this is a function, the filename is passed as the first argument and
 * the file contents are the second argument. If the returned value is truthy,
 * the file matches. This function may not be asynchronous.
 *
 * When an object, this uses the object's `.test()` method. Make sure one
 * exists.
 *
 * @typedef {(string|RegExp|Function|Object)} matchItem
 * @see {@link https://github.com/micromatch/micromatch#extended-globbing} for extended globbing features.
 */


/**
 * This can be one `matchItem` or an array of `matchItem` values.
 *
 * @typedef {(module:metalsmith-plugin-kit~matchItem|Array.<module:metalsmith-plugin-kit~matchItem>)} matchList
 */


/**
 * These options control the matching library, which is only used when a
 * string is passed as the `matchItem`. All listed options will be
 * supported, even in the unlikely future that the matching library is
 * replaced.
 *
 * Other options are also available from the library itself.
 *
 * @typedef {Object} matchOptions
 * @property {boolean} [basename=false] Allow glob patterns without slashes to match a file path based on its basename.
 * @property {boolean} [dot=false] Enable searching of files and folders that start with a dot.
 * @property {boolean} [nocase=false] Enable case-insensitive searches.
 * @see {@link https://github.com/micromatch/micromatch#options} for additional options supported by current backend library.
 */


/**
 * The function that's returned by `filenameMatcher`. Pass it your filenames
 * and it will synchronously determine if that matches any of the patterns that
 * were previously passed into `filenameMatcher`.
 *
 * @callback matchFunction
 * @param {string} filename
 * @return {boolean}
 * @see {@link module:metalsmith-plugin-kit.filenameMatcher}
 */

/**
 * Builds a function to determine if a file matches patterns.
 *
 * The chance that we switch from micromatch is extremely remote, but it could
 * happen. If another library is used, all existing Plugin Kit tests must
 * continue to pass unchanged. It is the duty of this function to remap
 * options or perform the calls in another way so the alternate library can
 * work. All of the flags documented below must continue to work as expected.
 *
 * @example
 * var matcher;
 *
 * matcher = pluginKit.filenameMatcher("*.txt");
 * [
 *     "test.txt",
 *     "test.html"
 * ].forEach((fileName) => {
 *     console.log(fileName, matcher(fileName));
 *     // test.txt true
 *     // test.html false
 * });
 *
 * @param {module:metalsmith-plugin-kit~matchList} match
 * @param {module:metalsmith-plugin-kit~matchOptions} [options]
 * @return {module:metalsmith-plugin-kit~matchFunction}
 */
exports.filenameMatcher = (match, options) => {
    match = [].concat(match);

    if (!match.length) {
        return () => {
            return false;
        };
    }

    match = match.map((singleMatch) => {
        if (typeof singleMatch === "string") {
            return micromatch.matcher(singleMatch, options);
        }

        if (typeof singleMatch === "function") {
            return singleMatch;
        }

        return singleMatch.test.bind(singleMatch);
    });

    if (match.length === 1) {
        return (item) => {
            return match[0](item);
        };
    }

    return (filename) => {
        return match.some((singleMatch) => {
            return singleMatch(filename);
        });
    };
};


/**
 * Middleware defintion object.
 *
 * @typedef {Object} middlewareDefinition
 * @property {module:metalsmith-plugin-kit~endpointCallback} [after] Called after all files are processed.
 * @property {module:metalsmith-plugin-kit~endpointCallback} [before] Called before any files are processed.
 * @property {module:metalsmith-plugin-kit~eachCallback} [each] Called  once for each file that matches.
 * @property {module:metalsmith-plugin-kit~matchList} [match] Defaults to all files
 * @property {module:metalsmith-plugin-kit~matchOptions} [matchOptions={}]
 * @property {string} [name] When supplied, renames the middleware function that's returned to the given name. Useful for `metalsmith-debug-ui`, for instance.
 * @see {@link module:metalsmith-plugin-kit.middleware}
 * @see {@link https://github.com/leviwheatcroft/metalsmith-debug-ui)
 */


/**
 * A callback that is called before processing any file or after processing
 * any file.
 *
 * Uses Node-style callbacks if your function expects more than 2 parameters.
 *
 * @callback endpointCallback
 * @param {module:metalsmith-plugin-kit~metalsmithFiles} files
 * @param {external:metalsmith} metalsmith
 * @param {Function} [done]
 * @see {@link module:metalsmith-plugin-kit.callFunction}
 * @see {@link module:metalsmith-plugin-kit~middlewareDefinition}
 */


/**
 * This is the function that will be fired when a file matches your match
 * criteria. It will be executed once for each file. It also could run
 * concurrently with other functions when you are performing asynchronous
 * work.
 *
 * Uses Node-style callbacks if your function expects more than 4 parameters.
 *
 * @callback eachCallback
 * @param {string} filename
 * @param {module:metalsmith-plugin-kit~metalsmithFile} file
 * @param {module:metalsmith-plugin-kit~metalsmithFiles} files
 * @param {external:metalsmith} metalsmith
 * @param {Function} [done]
 * @see {@link module:metalsmith-plugin-kit.callFunction}
 * @see {@link module:metalsmith-plugin-kit~middlewareDefinition}
 */


/**
 * Return middleware function. This is why Plugin Kit was created. It helps
 * handle asynchronous tasks, eliminates the need for using your own
 * matcher and you no longer iterate through the files with `Object.keys()`.
 *
 * @example
 * var fileList;
 *
 * return pluginKit.middleware({
 *     after: (files) => {
 *         pluginKit.addFile(files, "all-files.json", fileList);
 *     },
 *     before: () => {
 *         fileList = [];
 *     },
 *     each: (filename) => {
 *         fileList.push(filename);
 *     }
 * });
 *
 * @example
 * // This silly plugin changes all instances of "fidian" to lower case
 * // in all text-like files.
 * return pluginKit.middleware({
 *     each: (filename, file) => {
 *         var contents;
 *
 *         contents = file.contents.toString("utf8");
 *         contents = contents.replace(/fidian/ig, "fidian");
 *         file.contents = Buffer.from(contents, "utf8");
 *     },
 *     match: "*.{c,htm,html,js,json,md,txt}",
 *     matchOptions: {
 *         basename: true
 *     },
 *
 *     // Providing a name will rename this middleware so it can be displayed
 *     // by metalsmith-debug-ui and other tools.
 *     name: "metalsmith-lowercase-fidian"
 * });
 *
 * @example
 * // Illustrates asynchronous processing.
 * return pluginKit.middleware({
 *     after: (files) => {
 *         // Promise-based. Delay 5 seconds when done building.
 *         return new Promise((resolve) => {
 *             setTimeout(() => {
 *                 console.log("I paused for 5 seconds");
 *                 resolve();
 *             }, 5000);
 *         });
 *     },
 *     before: (files, metalsmith, done) => {
 *         // Callback-based. Add a file to the build.
 *         fs.readFile("content.txt", (err, buffer) => {
 *             if (!err) {
 *                 pluginKit.addFile(files, "content.txt", buffer);
 *             }
 *             done(err);
 *         });
 *     }
 * });
 *
 * @param {module:metalsmith-plugin-kit~middlewareDefinition} [options]
 * @return {Function} middleware function
 */
exports.middleware = (options) => {
    var matcher, middlewareFn;

    options = exports.defaultOptions({
        after: () => {},
        before: () => {},
        each: () => {},
        match: "**/*",
        matchOptions: {},
        name: null
    }, options);
    matcher = exports.filenameMatcher(options.match, options.matchOptions);
    middlewareFn = (files, metalsmith, done) => {
        return exports.callFunction(options.before, [
            files,
            metalsmith
        ]).then(() => {
            var promises;

            promises = Object.keys(files).filter((filename) => {
                return matcher(filename);
            }).map((filename) => {
                // Files can be deleted before they get processed.
                if (!files[filename]) {
                    return null;
                }

                return exports.callFunction(options.each, [
                    filename,
                    files[filename],
                    files,
                    metalsmith
                ]);
            });

            return Promise.all(promises);
        }).then(() => {
            return exports.callFunction(options.after, [
                files,
                metalsmith
            ]);
        }).then(done.bind(null), done);
    };

    if (options.name) {
        exports.renameFunction(middlewareFn, options.name);
    }

    return middlewareFn;
};


/**
 * Renames a function by assigning the name property. This isn't as simple
 * as just using `yourFunction.name = "new name"`. Because it was done in
 * Plugin Kit, it is also exposed in the unlikely event that plugins want to
 * use it.
 *
 * @example
 * x = () => {};
 * console.log(x.name); // Could be undefined, could be "x".
 * pluginKit.renameFunction(x, "MysteriousFunction");
 * console.log(x.name); // "MysteriousFunction"
 *
 * @param {Function} fn
 * @param {string} name
 */
exports.renameFunction = (fn, name) => {
    Object.defineProperty(fn, "name", {
        configurable: true,
        enumerable: false,
        writable: false,
        value: name
    });
};
