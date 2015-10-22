// Copyright (c) 2015 Uber Technologies, Inc.
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.

'use strict';

var spawn = require('child_process').spawn;
var path = require('path');
var fs = require('fs');
var prompt = require('promptly').prompt;
var camelize = require('camelize');
var format = require('util').format;

function fetchFromGitConfig(key) {
    function readValue(values, callback) {
        var called = false;
        var proc = spawn('git', [
            '--bare',
            'config',
            '--global',
            key
        ]);

        proc.stdout.once('data', function onOut(chunk) {
            called = true;
            callback(null, String(chunk));
        });
        proc.stdout.once('error', callback);
        proc.stdout.once('end', function onErr() {
            if (called) {
                return;
            }

            var message = format('please configure %s in git', key);
            callback(new Error(message));
        });
    }

    return readValue;
}

module.exports = {
    project: 'Project name: ',
    description: function getDescription(values, callback) {
        var pkg = path.join(values.project, 'package.json');

        fs.readFile(pkg, function onFile(err, buf) {
            if (err) {
                return promptFor();
            }

            var json = JSON.parse(String(buf));
            if (!json.description) {
                return promptFor();
            }

            callback(null, json.description);
        });

        function promptFor() {
            prompt('  Project description: ', callback);
        }
    },
    gitName: fetchFromGitConfig('user.name'),
    email: fetchFromGitConfig('user.email'),
    projectNoDash: function readProjectNoDash(values, cb) {
        cb(null, values.project.replace(/\-/g, ''));
    },
    projectName: function readProjectName(values, callback) {
        callback(null, camelize(values.project));
    }
};
