var config = require(__dirname+'/config.js');
var r = require(__dirname+'/../lib')(config);
var util = require(__dirname+'/util.js');
var assert = require('assert');

var uuid = util.uuid;
var It = util.It;

var uuid = util.uuid;
var dbName, tableName;


It("Init for `transformations.js`", function* (done) {
    try {
        dbName = uuid();
        tableName = uuid();

        var result = yield r.dbCreate(dbName).run();
        assert.deepEqual(result, {created:1});

        result = yield r.db(dbName).tableCreate(tableName).run();
        assert.deepEqual(result, {created:1});

        result = yield r.db(dbName).table(tableName).insert(eval('['+new Array(100).join('{}, ')+'{}]')).run();
        assert.equal(result.inserted, 100);

        result = yield r.db(dbName).table(tableName).update({val: r.js("Math.random()")}, {nonAtomic: true}).run();
        result = yield r.db(dbName).table(tableName).indexCreate('val').run();
        result = yield r.db(dbName).table(tableName).indexWait('val').run();

        pks = result.generated_keys;

        done();
    }
    catch(e) {
        done(e);
    }
})

It("`map` should work on array -- r.row", function* (done) {
    try {
        var result = yield r.expr([1,2,3]).map(r.row).run();
        result = yield result.toArray();
        assert.deepEqual(result, [1,2,3]);
        done();

        result = yield r.expr([1,2,3]).map(r.row.add(1)).run();
        result = yield result.toArray();
        assert.deepEqual(result, [2, 3, 4]);

    }
    catch(e) {
        done(e);
    }
})
It("`map` should work on array -- function", function* (done) {
    try {
        var result = yield r.expr([1,2,3]).map(function(doc) { return doc }).run();
        result = yield result.toArray();
        assert.deepEqual(result, [1,2,3]);

        result = yield r.expr([1,2,3]).map(function(doc) { return doc.add(2)}).run();
        result = yield result.toArray();
        assert.deepEqual(result, [3, 4, 5]);

        done();
    }
    catch(e) {
        done(e);
    }
})
It("`map` should throw if no argument has been passed", function* (done) {
    try {
        result = yield r.db(dbName).table(tableName).map().run();
    }
    catch(e) {
        if (e.message, "First argument of `map` cannot be undefined after:\nr.db(\""+dbName+"\").table(\""+tableName+"\")") {
            done()
        }
        else {
            done(e);
        }
    }
})

It("`withFields` should work on array -- single field", function* (done) {
    try {
        var result = yield r.expr([{a: 0, b: 1, c: 2}, {a: 4, b: 4, c: 5}, {a:9, b:2, c:0}]).withFields("a").run();
        result = yield result.toArray();
        assert.deepEqual(result, [{a: 0}, {a: 4}, {a: 9}]);

        done();
    }
    catch(e) {
        done(e);
    }
})
It("`withFields` should work on array -- multiple field", function* (done) {
    try {
        var result = yield r.expr([{a: 0, b: 1, c: 2}, {a: 4, b: 4, c: 5}, {a:9, b:2, c:0}]).withFields("a", "c").run();
        result = yield result.toArray();
        assert.deepEqual(result, [{a: 0, c: 2}, {a: 4, c: 5}, {a:9, c:0}]);

        done();
    }
    catch(e) {
        done(e);
    }
})
It("`withFields` should throw if no argument has been passed", function* (done) {
    try {
        result = yield r.db(dbName).table(tableName).withFields().run();
    }
    catch(e) {
        if (e.message, "First argument of `withFields` cannot be undefined after:\nr.db(\""+dbName+"\").table(\""+tableName+"\")") {
            done()
        }
        else {
            done(e);
        }
    }
})
It("`concatMap` should work on array -- function", function* (done) {
    try {
        var result = yield r.expr([[1, 2], [3], [4]]).concatMap(function(doc) { return doc}).run();
        result = yield result.toArray();
        assert.deepEqual(result, [1, 2, 3, 4]);

        done();
    }
    catch(e) {
        done(e);
    }
})
It("`concatMap` should work on array -- r.row", function* (done) {
    try {
        var result = yield r.expr([[1, 2], [3], [4]]).concatMap(r.row).run();
        result = yield result.toArray();
        assert.deepEqual(result, [1, 2, 3, 4]);

        done();
    }
    catch(e) {
        done(e);
    }
})
It("`concatMap` should throw if no argument has been passed", function* (done) {
    try {
        result = yield r.db(dbName).table(tableName).concatMap().run();
    }
    catch(e) {
        if (e.message, "First argument of `concatMap` cannot be undefined after:\nr.db(\""+dbName+"\").table(\""+tableName+"\")") {
            done()
        }
        else {
            done(e);
        }
    }
})


It("`orderBy` should work on array -- string", function* (done) {
    try {
        var result = yield r.expr([{a:23}, {a:10}, {a:0}, {a:100}]).orderBy("a").run();
        result = yield result.toArray();
        assert.deepEqual(result, [{a:0}, {a:10}, {a:23}, {a:100}]);

        done();
    }
    catch(e) {
        done(e);
    }
})

It("`orderBy` should work on array -- r.row", function* (done) {
    try {
        var result = yield r.expr([{a:23}, {a:10}, {a:0}, {a:100}]).orderBy(r.row("a")).run();
        result = yield result.toArray();
        assert.deepEqual(result, [{a:0}, {a:10}, {a:23}, {a:100}]);

        done();
    }
    catch(e) {
        done(e);
    }
})

It("`orderBy` should work on a table -- pk", function* (done) {
    try {
        var result = yield r.db(dbName).table(tableName).orderBy({index: "id"}).run();
        result = yield result.toArray();
        for(i=0; i<result.length-1; i++) {
            assert(result[i].id < result[i+1].id);
        }

        done();
    }
    catch(e) {
        done(e);
    }
})
It("`orderBy` should work on a table -- secondary", function* (done) {
    try {
        var result = yield r.db(dbName).table(tableName).orderBy({index: "val"}).run();
        result = yield result.toArray();
        for(i=0; i<result.length-1; i++) {
            assert(result[i].val < result[i+1].val);
        }

        done();
    }
    catch(e) {
        done(e);
    }
})
It("`orderBy` should work on a two fields", function* (done) {
    try {
        var dbName = uuid();
        var tableName = uuid();

        var result = yield r.dbCreate(dbName).run();
        assert.deepEqual(result, {created: 1});

        result = yield r.db(dbName).tableCreate(tableName).run();
        assert.deepEqual(result, {created: 1});

        result = yield r.db(dbName).table(tableName).insert([{a: r.js("Math.random()")},{a: r.js("Math.random()")},{a: r.js("Math.random()")},{a: r.js("Math.random()")},{a: r.js("Math.random()")},{a: r.js("Math.random()")},{a: r.js("Math.random()")},{a: r.js("Math.random()")},{a: r.js("Math.random()")},{a: r.js("Math.random()")},{a: r.js("Math.random()")},{a: r.js("Math.random()")},{a: r.js("Math.random()")},{a: r.js("Math.random()")},{a: r.js("Math.random()")},{a: r.js("Math.random()")},{a: r.js("Math.random()")},{a: r.js("Math.random()")},{a: r.js("Math.random()")},{a: r.js("Math.random()")},{a: r.js("Math.random()")},{a: r.js("Math.random()")},{a: r.js("Math.random()")},{a: r.js("Math.random()")},{a: r.js("Math.random()")},{a: r.js("Math.random()")},{a: r.js("Math.random()")},{a: r.js("Math.random()")},{a: r.js("Math.random()")},{a: r.js("Math.random()")},{a: r.js("Math.random()")},{a: r.js("Math.random()")},{a: r.js("Math.random()")},{a: r.js("Math.random()")},{a: r.js("Math.random()")},{a: r.js("Math.random()")},{a: r.js("Math.random()")},{a: r.js("Math.random()")},{a: r.js("Math.random()")},{a: r.js("Math.random()")},{a: r.js("Math.random()")},{a: r.js("Math.random()")},{a: r.js("Math.random()")},{a: r.js("Math.random()")},{a: r.js("Math.random()")},{a: r.js("Math.random()")},{a: r.js("Math.random()")},{a: r.js("Math.random()")},{a: r.js("Math.random()")},{a: r.js("Math.random()")},{a: r.js("Math.random()")},{a: r.js("Math.random()")},{a: r.js("Math.random()")},{a: r.js("Math.random()")},{a: r.js("Math.random()")},{a: r.js("Math.random()")},{a: r.js("Math.random()")},{a: r.js("Math.random()")},{a: r.js("Math.random()")},{a: r.js("Math.random()")},{a: r.js("Math.random()")},{a: r.js("Math.random()")},{a: r.js("Math.random()")},{a: r.js("Math.random()")},{a: r.js("Math.random()")},{a: r.js("Math.random()")},{a: r.js("Math.random()")},{a: r.js("Math.random()")},{a: r.js("Math.random()")},{a: r.js("Math.random()")},{a: r.js("Math.random()")},{a: r.js("Math.random()")},{a: r.js("Math.random()")},{a: r.js("Math.random()")},{a: r.js("Math.random()")},{a: r.js("Math.random()")},{a: r.js("Math.random()")},{a: r.js("Math.random()")},{a: r.js("Math.random()")},{a: r.js("Math.random()")},{a: r.js("Math.random()")},{a: r.js("Math.random()")},{a: r.js("Math.random()")},{a: r.js("Math.random()")},{a: r.js("Math.random()")},{a: r.js("Math.random()")},{a: r.js("Math.random()")},{a: r.js("Math.random()")},{a: r.js("Math.random()")},{a: r.js("Math.random()")},{a: r.js("Math.random()")},{a: r.js("Math.random()")},{a: r.js("Math.random()")},{a: r.js("Math.random()")},{a: r.js("Math.random()")},{a: r.js("Math.random()")},{a: r.js("Math.random()")},{a: r.js("Math.random()")}]).run();
        assert.deepEqual(result.inserted, 98);

        result = yield r.db(dbName).table(tableName).orderBy("id", "a").run();
        result = yield result.toArray();
        assert(Array.isArray(result));
        assert(result[0].id<result[1].id);

        done();
    }
    catch(e) {
        done(e);
    }
})
It("`orderBy` should throw if no argument has been passed", function* (done) {
    try {
        result = yield r.db(dbName).table(tableName).orderBy().run();
    }
    catch(e) {
        if (e.message, "First argument of `orderBy` cannot be undefined after:\nr.db(\""+dbName+"\").table(\""+tableName+"\")") {
            done()
        }
        else {
            done(e);
        }
    }
})
It("`desc` is not defined after a term", function* (done) {
    try {
        var result = yield r.expr(1).desc("foo").run();
    }
    catch(e) {
        if (e.message === "`desc` is not defined after:\nr.expr(1)") {
            done()
        }
        else {
            done(e)
        }
    }
})
It("`asc` is not defined after a term", function* (done) {
    try {
        var result = yield r.expr(1).asc("foo").run();
    }
    catch(e) {
        if (e.message === "`asc` is not defined after:\nr.expr(1)") {
            done()
        }
        else {
            done(e)
        }
    }
})

It("`skip` should work", function* (done) {
    try {
        var result = yield r.expr([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]).skip(3).run();
        result = yield result.toArray();
        assert.deepEqual(result, [3, 4, 5, 6, 7, 8, 9]);

        done();
    }
    catch(e) {
        done(e);
    }
})
It("`skip` should throw if no argument has been passed", function* (done) {
    try {
        result = yield r.db(dbName).table(tableName).skip().run();
    }
    catch(e) {
        if (e.message, "First argument of `skip` cannot be undefined after:\nr.db(\""+dbName+"\").table(\""+tableName+"\")") {
            done()
        }
        else {
            done(e);
        }
    }
})

It("`limit` should work", function* (done) {
    try {
        var result = yield r.expr([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]).limit(3).run();
        result = yield result.toArray();
        assert.deepEqual(result, [0, 1, 2]);

        done();
    }
    catch(e) {
        done(e);
    }
})
It("`limit` should throw if no argument has been passed", function* (done) {
    try {
        result = yield r.db(dbName).table(tableName).limit().run();
    }
    catch(e) {
        if (e.message, "First argument of `limit` cannot be undefined after:\nr.db(\""+dbName+"\").table(\""+tableName+"\")") {
            done()
        }
        else {
            done(e);
        }
    }
})
It("`slice` should work", function* (done) {
    try {
        var result = yield r.expr([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]).slice(3, 5).run();
        result = yield result.toArray();
        assert.deepEqual(result, [3, 4]);

        done();
    }
    catch(e) {
        done(e);
    }
})
It("`slice` should work -- with options", function* (done) {
    try {
        var result = yield r.expr([0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22, 23]).slice(5, 10, {rightBound:'closed'}).run();
        result = yield result.toArray();
        assert.deepEqual(result, [5, 6, 7, 8, 9, 10]);

        result = yield r.expr([0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22, 23]).slice(5, 10, {rightBound:'open'}).run();
        result = yield result.toArray();
        assert.deepEqual(result, [5, 6, 7, 8, 9]);

        result = yield r.expr([0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22, 23]).slice(5, 10, {leftBound:'open'}).run();
        result = yield result.toArray();
        assert.deepEqual(result, [6, 7, 8, 9]);

        result = yield r.expr([0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22, 23]).slice(5, 10, {leftBound:'closed'}).run();
        result = yield result.toArray();
        assert.deepEqual(result, [5, 6, 7, 8, 9]);

        result = yield r.expr([0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22, 23]).slice(5, 10, {leftBound:'closed', rightBound: 'closed'}).run();
        result = yield result.toArray();
        assert.deepEqual(result, [5, 6, 7, 8, 9, 10]);

        done();
    }
    catch(e) {
        done(e);
    }
})
It("`slice` should throw if no argument has been passed", function* (done) {
    try {
        result = yield r.db(dbName).table(tableName).slice().run();
    }
    catch(e) {
        if (e.message, "First argument of `slice` cannot be undefined after:\nr.db(\""+dbName+"\").table(\""+tableName+"\")") {
            done()
        }
        else {
            done(e);
        }
    }
})
It("`nth` should work", function* (done) {
    try {
        var result = yield r.expr([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]).nth(3).run();
        assert(result, 3);

        done();
    }
    catch(e) {
        done(e);
    }
})
It("`nth` should throw if no argument has been passed", function* (done) {
    try {
        result = yield r.db(dbName).table(tableName).nth().run();
    }
    catch(e) {
        if (e.message, "First argument of `nth` cannot be undefined after:\nr.db(\""+dbName+"\").table(\""+tableName+"\")") {
            done()
        }
        else {
            done(e);
        }
    }
})
It("`indexesOf` should work - datum", function* (done) {
    try {
        var result = yield r.expr([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]).nth(3).run();
        assert(result, 3);

        done();
    }
    catch(e) {
        done(e);
    }
})

It("`indexesOf` should work - r.row", function* (done) {
    try {
        var result = yield r.expr([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]).indexesOf(r.row.eq(3)).run();
        result = yield result.toArray();
        assert.equal(result, 3);

        done();
    }
    catch(e) {
        done(e);
    }
})
It("`indexesOf` should work - function", function* (done) {
    try {
        var result = yield r.expr([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]).indexesOf(function(doc) { return doc.eq(3)}).run();
        result = yield result.toArray();
        assert.equal(result, 3);

        done();
    }
    catch(e) {
        done(e);
    }
})
It("`indexesOf` should throw if no argument has been passed", function* (done) {
    try {
        result = yield r.db(dbName).table(tableName).indexesOf().run();
    }
    catch(e) {
        if (e.message, "First argument of `indexesOf` cannot be undefined after:\nr.db(\""+dbName+"\").table(\""+tableName+"\")") {
            done()
        }
        else {
            done(e);
        }
    }
})
It("`isEmpty` should work", function* (done) {
    try {
        var result = yield r.expr([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]).isEmpty().run();
        assert.equal(result, false);

        result = yield r.expr([]).isEmpty().run();
        assert.equal(result, true);

        done();
    }
    catch(e) {
        done(e);
    }
})

It("`union` should work", function* (done) {
    try{
        var result = yield r.expr([0, 1, 2]).union([3, 4, 5]).run();
        result = yield result.toArray();
        assert.deepEqual(result, [0, 1, 2, 3, 4, 5]);

        done()
    }
    catch(e) {
        done(e);
    }
})
It("`union` should throw if no argument has been passed", function* (done) {
    try {
        result = yield r.db(dbName).table(tableName).union().run();
    }
    catch(e) {
        if (e.message, "First argument of `union` cannot be undefined after:\nr.db(\""+dbName+"\").table(\""+tableName+"\")") {
            done()
        }
        else {
            done(e);
        }
    }
})
It("`sample` should work", function* (done) {
    try{
        var result = yield r.expr([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]).sample(2).run();
        result = yield result.toArray();
        assert.equal(result.length, 2);

        done()
    }
    catch(e) {
        done(e);
    }
})
It("`sample` should throw if given -1", function* (done) {
    try{
        var result = yield r.expr([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]).sample(-1).run();
    }
    catch(e) {
        if (e.message.match("Number of items to sample must be non-negative, got `-1`")) {
            done()
        }
        else {
            done(e);
        }
    }
})
It("`sample` should throw if no argument has been passed", function* (done) {
    try {
        result = yield r.db(dbName).table(tableName).sample().run();
    }
    catch(e) {
        if (e.message, "First argument of `sample` cannot be undefined after:\nr.db(\""+dbName+"\").table(\""+tableName+"\")") {
            done()
        }
        else {
            done(e);
        }
    }
})
