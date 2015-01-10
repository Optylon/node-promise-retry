'use strict';

var errcode = require('err-code');
var retry = require('retry');
var Promise = require('bluebird');

var emptyFunc = function () {};

function promiseRetry(fn, options) {
    var operation = retry.operation(options);

    return new Promise(function (resolve, reject) {
        operation.attempt(function () {
            var promise;

            promise = Promise.try(function () {
                return fn(function (err) {
                    if (!err) {
                        throw new Error('Retry called without an error');
                    }

                    if (err.code === 'EPROMISERETRY') {
                        err = err.original;
                    }

                    throw errcode('Retrying', 'EPROMISERETRY', {
                        original: err
                    });
                });
            });

            promise.then(resolve, function (err) {
                if (err && err.code === 'EPROMISERETRY') {
                    err = err.original;

                    if (operation.retry(err)) {
                        throw err;
                    }
                }

                reject(err);
            })
            .done(emptyFunc, emptyFunc);
        });
    });
}

module.exports = promiseRetry;
