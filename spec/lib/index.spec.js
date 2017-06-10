"use strict";

var pluginKit;

pluginKit = require("../..");
describe("metalsmith-plugin-kit", () => {
    describe(".addFile()", () => {
        it("adds a file", () => {
            var buff, files;

            files = {};
            buff = Buffer.from("blah", "utf8");
            pluginKit.addFile(files, "test", buff);
            expect(files.test).toBeDefined();
            expect(files.test.contents).toBe(buff);
            expect(files.test.mode).toBe("0644");
        });
        it("uses specified character encoding", () => {
            var files;

            files = {};
            pluginKit.addFile(files, "test1", "MTIzNDU2Nzg5");

            // "123456789" is the value when decoded
            pluginKit.addFile(files, "test2", "MTIzNDU2Nzg5", {
                encoding: "base64"
            });
            expect(files.test1.contents.toString("utf8")).toEqual("MTIzNDU2Nzg5");
            expect(files.test2.contents.toString("utf8")).toEqual("123456789");
        });
        it("overwrites files", () => {
            var files;

            files = {};
            pluginKit.addFile(files, "test", "one");
            pluginKit.addFile(files, "test", "two");
            expect(files.test.contents.toString("utf8")).toEqual("two");
        });
        it("sets the mode", () => {
            var files;

            files = {};
            pluginKit.addFile(files, "test", "content", {
                mode: "1755"
            });
            expect(files.test.mode).toBe("1755");
        });
        it("converts to buffers", () => {
            var files;

            files = {};
            pluginKit.addFile(files, "text", "text content");
            pluginKit.addFile(files, "buff", Buffer.from("buffer content", "utf8"));
            pluginKit.addFile(files, "json", {
                json: true
            });
            expect(Buffer.isBuffer(files.text.contents)).toBe(true);
            expect(files.text.contents.toString("utf8")).toBe("text content");
            expect(Buffer.isBuffer(files.buff.contents)).toBe(true);
            expect(files.buff.contents.toString("utf8")).toBe("buffer content");
            expect(Buffer.isBuffer(files.json.contents)).toBe(true);
            expect(files.json.contents.toString("utf8")).toBe("{\"json\":true}");
        });
    });
    describe(".callFunction()", () => {
        /**
         * Node style callback function.
         * Returns the arguments passed as a single array.
         * Supplies an error if the first argument is false.
         *
         * @param {*} lots Fake parameter used to force a callback
         * @param {*} of Fake parameter used to force a callback
         * @param {*} fake Fake parameter used to force a callback
         * @param {*} parameters Fake parameter used to force a callback
         * @param {*} are Fake parameter used to force a callback
         * @param {*} here Fake parameter used to force a callback
         * @return {*} Ignore this value
         */
        function callbackTest(lots, of, fake, parameters, are, here) {
            var args, callback;

            args = [].slice.call(arguments);
            callback = args.pop();
            setTimeout(() => {
                if (args[0] === false) {
                    callback(new Error("This needs to error for the test"));
                }

                callback(null, args);
            }, 50);

            // Used to only get around eslint warning about unused variables.
            // This provides no functionality.
            return here;
        }

        /**
         * Synchronous testing function.
         * Returns the arguments passed.
         *
         * @return {Array.<*>}
         * @throws {Error} if first argument is false.
         */
        function syncTest() {
            if (arguments[0] === false) {
                throw new Error("This needs to throw for the test");
            }

            return [].slice.call(arguments);
        }

        /**
         * Promise testing function.
         * Returns the arguments passed after a minor delay.
         * Rejects the promise if the first argument is false.
         *
         * @return {Promise.<Array.<*>>}
         */
        function promiseTest() {
            var args;

            args = [].slice.call(arguments);

            return new Promise((resolve, reject) => {
                setTimeout(() => {
                    if (args[0] === false) {
                        reject(new Error("This needs to fail for the test"));
                    }

                    resolve(args);
                }, 50);
            });
        }

        [
            callbackTest,
            syncTest,
            promiseTest
        ].forEach((testFunction) => {
            describe(testFunction.name, () => {
                it("works with zero arguments", () => {
                    return pluginKit.callFunction(testFunction, []).then((result) => {
                        expect(result).toEqual([]);
                    });
                });
                it("works with three arguments", () => {
                    return pluginKit.callFunction(testFunction, [
                        "first argument",
                        2,
                        true
                    ]).then((result) => {
                        expect(result).toEqual([
                            "first argument",
                            2,
                            true
                        ]);
                    });
                });
                it("returns failures", () => {
                    return pluginKit.callFunction(testFunction, [
                        false
                    ]).then(jasmine.fail, () => {});
                });
            });
        });
    });
    describe(".clone()", () => {
        it("copies objects", () => {
            var clone, original;

            original = {
                a: {
                    b: {
                        c: true
                    },
                    b2: {
                        c: "some string"
                    }
                },
                a2: () => {}
            };
            clone = pluginKit.clone(original);
            expect(original).not.toBe(clone);
            expect(original.a).not.toBe(clone.a);
            expect(original.a.b).not.toBe(clone.a.b);
            expect(original).toEqual(clone);
            expect(original.a.b.c).toBe(clone.a.b.c);
            expect(original.a2).toBe(clone.a2);
        });
        it("preserves regular expressions", () => {
            var clone, regexp;

            regexp = /test/;
            clone = pluginKit.clone(regexp);
            expect(clone).toBe(regexp);
        });
        it("copies null", () => {
            expect(pluginKit.clone(null)).toEqual(null);
        });
    });
    describe(".defaultOptions()", () => {
        it("overwrites the default value", () => {
            expect(pluginKit.defaultOptions({
                a: "default",
                a2: "default"
            }, {
                a: "new value"
            })).toEqual({
                a: "new value",
                a2: "default"
            });
        });
        it("replaces object values", () => {
            expect(pluginKit.defaultOptions({
                b: {
                    note: "This whole object is REPLACED"
                },
                b2: {
                    note: "Not replaced"
                }
            }, {
                b: {
                    c: "new value"
                }
            })).toEqual({
                b: {
                    c: "new value"
                },
                b2: {
                    note: "Not replaced"
                }
            });
        });
        it("ignores overrides that are not in the defaults", () => {
            expect(pluginKit.defaultOptions({
                c: "keep this value"
            }, {
                c2: "should not get added"
            })).toEqual({
                c: "keep this value"
            });
        });
        it("returns clones of objects", () => {
            var defaults, override, result;

            defaults = {
                a: {
                    b: {}
                }
            };
            override = {};
            result = pluginKit.defaultOptions(defaults, override);
            expect(result).not.toBe(defaults);
            expect(result).not.toBe(override);
            expect(result.a).not.toBe(defaults.a);
            expect(result.a.b).not.toBe(defaults.a.b);
        });
    });
    describe(".filenameMatcher()", () => {
        var fileList;

        fileList = [
            "a.txt",
            ".b.txt",
            "c/d.txt",
            "c/.e.txt",
            ".f/g.txt",
            ".f/.h.txt",
            "i.js",
            "j.json",
            "k.htm",
            "l.html",
            "m.md",
            ".n.swp"
        ];

        /**
         * Tests what would be acceptable to the matcher function given
         * the `match` and `matchOptions`.
         *
         * @param {module:metalsmith-plugin-kit~matchList} match
         * @param {module:metalsmigh-plugin-kit~matchOptions} options
         * @return {Array.<*>} Files that match
         */
        function testMatch(match, options) {
            var fn;

            fn = pluginKit.filenameMatcher(match, options);

            return fileList.filter(fn);
        }

        it("matches a glob", () => {
            expect(testMatch("*.txt")).toEqual([
                "a.txt"
            ]);
        });
        it("matches recursively", () => {
            expect(testMatch("**/*.txt")).toEqual([
                "a.txt",
                "c/d.txt"
            ]);
        });
        it("matches on basename, regardless of path", () => {
            // This also includes directories with leading dots.
            expect(testMatch("*.txt", {
                basename: true
            })).toEqual([
                "a.txt",
                "c/d.txt",
                ".f/g.txt"
            ]);
        });
        it("matches dotfiles", () => {
            expect(testMatch("**/*.txt", {
                dot: true
            })).toEqual([
                "a.txt",
                ".b.txt",
                "c/d.txt",
                "c/.e.txt",
                ".f/g.txt",
                ".f/.h.txt"
            ]);
        });
        it("matches case-insensitively", () => {
            expect(testMatch("*.TXT")).toEqual([]);
            expect(testMatch("*.TXT", {
                nocase: true
            })).toEqual([
                "a.txt"
            ]);
        });
        it("negates a whole pattern", () => {
            // This also matches dot files and any other files that do not
            // specifically match the pattern.
            expect(testMatch("!*.txt")).toEqual([
                ".b.txt",
                "c/d.txt",
                "c/.e.txt",
                ".f/g.txt",
                ".f/.h.txt",
                "i.js",
                "j.json",
                "k.htm",
                "l.html",
                "m.md",
                ".n.swp"
            ]);
        });
        it("negates a particular ending", () => {
            // Does not include c/.e.txt because * doesn't match dot files
            // without the flag.
            expect(testMatch("c/*.!(js)")).toEqual([
                "c/d.txt"
            ]);
        });
        it("matches extglobs", () => {
            expect(testMatch("*.!(htm|html)")).toEqual([
                "a.txt",
                "i.js",
                "j.json",
                "m.md"
            ]);
        });
        it("matches character classes", () => {
            expect(testMatch("*.h[[:alpha:]]m")).toEqual([
                "k.htm"
            ]);
        });
        it("matches brace expansion", () => {
            expect(testMatch("*/{a..z}.txt")).toEqual([
                "c/d.txt"
            ]);
        });
        it("matches character classes", () => {
            expect(testMatch("*.[a-z]??")).toEqual([
                "a.txt", "k.htm"
            ]);
        });
        it("matches logical 'or'", () => {
            expect(testMatch("*.(md|html)")).toEqual([
                "l.html",
                "m.md"
            ]);
        });
        it("matches multiple patterns", () => {
            expect(testMatch([
                "*.md",
                "*.htm*"
            ])).toEqual([
                "k.htm",
                "l.html",
                "m.md"
            ]);
        });
        it("matches regular expressions", () => {
            expect(testMatch(/[AEIOU]/i)).toEqual([
                "a.txt",
                "c/.e.txt",
                "i.js",
                "j.json"
            ]);
        });
        it("matches functions", () => {
            expect(testMatch((filename) => {
                var index;

                index = [
                    "a.txt",
                    "i.js"
                ].indexOf(filename);

                return index !== -1;
            })).toEqual([
                "a.txt",
                "i.js"
            ]);
        });
    });
    describe(".middleware()", () => {
        var files, metalsmith;

        /**
         * Test function to generate the middleware function and then invoke
         * it, wrapping it up in a promise for easier testing.
         *
         * @param {module:metalsmith-plugin-kit~middlewareDefinition} definition
         * @return {Promise.<*>}
         */
        function runMiddleware(definition) {
            var middleware;

            return new Promise((resolve, reject) => {
                middleware = pluginKit.middleware(definition);
                middleware(files, metalsmith, (err) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve();
                    }
                });
            });
        }

        beforeEach(() => {
            files = {
                "test.txt": {}
            };
            metalsmith = {};
        });
        describe(".after", () => {
            it("runs after 'each'", () => {
                var afterRan, eachRan;

                return runMiddleware({
                    after: () => {
                        expect(eachRan).toBe(true);
                        afterRan = true;
                    },
                    each: () => {
                        eachRan = true;
                    }
                }).then(() => {
                    expect(afterRan).toBe(true);
                });
            });
            it("is passed files and metalsmith", () => {
                return runMiddleware({
                    after: (f, m) => {
                        expect(f).toBe(files);
                        expect(m).toBe(metalsmith);
                    }
                });
            });
        });
        describe(".before", () => {
            it("runs before 'each'", () => {
                var beforeRan, eachRan;

                return runMiddleware({
                    before: () => {
                        expect(eachRan).not.toBe(true);
                        beforeRan = true;
                    },
                    each: () => {
                        eachRan = true;
                    }
                }).then(() => {
                    expect(beforeRan).toBe(true);
                });
            });
            it("is passed files and metalsmith", () => {
                return runMiddleware({
                    before: (f, m) => {
                        expect(f).toBe(files);
                        expect(m).toBe(metalsmith);
                    }
                });
            });
        });
        describe(".each", () => {
            it("is called for each file in the set", () => {
                var calls;

                calls = [];

                return runMiddleware({
                    each: (fn, f, fs, ms) => {
                        calls.push([
                            fn,
                            f,
                            fs,
                            ms
                        ]);
                    }
                }).then(() => {
                    expect(calls).toEqual([
                        [
                            "test.txt",
                            files["test.txt"],
                            files,
                            metalsmith
                        ]
                    ]);
                });
            });
        });
        describe(".match", () => {
            beforeEach(() => {
                spyOn(pluginKit, "filenameMatcher").and.callThrough();
            });
            it("defaults to **/*", () => {
                return runMiddleware().then(() => {
                    expect(pluginKit.filenameMatcher).toHaveBeenCalledWith("**/*", jasmine.any(Object));
                });
            });
            it("passes any other value", () => {
                return runMiddleware({
                    match: [
                        "anything",
                        /goes/,
                        function here() {}
                    ]
                }).then(() => {
                    expect(pluginKit.filenameMatcher).toHaveBeenCalledWith([
                        "anything",
                        jasmine.any(RegExp),
                        jasmine.any(Function)
                    ], jasmine.any(Object));
                });
            });
        });
        describe(".matchOptions", () => {
            beforeEach(() => {
                spyOn(pluginKit, "filenameMatcher").and.callThrough();
            });
            it("defaults to an empty object", () => {
                return runMiddleware().then(() => {
                    expect(pluginKit.filenameMatcher).toHaveBeenCalledWith(jasmine.any(String), {});
                });
            });
            it("can be set to anything else", () => {
                var options;

                options = {
                    dot: true
                };

                return runMiddleware({
                    matchOptions: options
                }).then(() => {
                    expect(pluginKit.filenameMatcher).toHaveBeenCalledWith(jasmine.any(String), options);
                });
            });
        });
        describe(".name", () => {
            it("does not name middleware normally", () => {
                var middleware;

                middleware = pluginKit.middleware({});
                expect(middleware.name).not.toBe("some-name-goes-here");
            });
            it("names middleware when defined", () => {
                var middleware;

                middleware = pluginKit.middleware({
                    name: "some-name-goes-here"
                });
                expect(middleware.name).toBe("some-name-goes-here");
            });
        });
    });
    describe(".renameFunction", () => {
        it("renames a named function", () => {
            /**
             * Just a simple function for no purpose.
             */
            function noPurpose() {}
            expect(noPurpose.name).toBe("noPurpose");
            pluginKit.renameFunction(noPurpose, "stillNoPurpose");
            expect(noPurpose.name).toBe("stillNoPurpose");
        });
        it("renames an anonymous function", () => {
            var anon;

            /**
             * Just a simple function for no purpose.
             */
            anon = function () {};
            expect(anon.name).not.toBe("nowNamed");
            pluginKit.renameFunction(anon, "nowNamed");
            expect(anon.name).toBe("nowNamed");
        });
        it("renames an arrow function", () => {
            var arrow;

            arrow = () => {};
            expect(arrow.name).not.toBe("arrowFunctionGoesHere");
            pluginKit.renameFunction(arrow, "arrowFunctionGoesHere");
            expect(arrow.name).toBe("arrowFunctionGoesHere");
        });
    });
});
