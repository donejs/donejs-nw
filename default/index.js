var os = require('os');
var generator = require('yeoman-generator');
var ejs = require('ejs');
var fs = require('fs');
var Q = require('q');
var _ = require('lodash');
var is = {
  macos: os.platform() === 'darwin',
  linux: os.platform() === 'linux',
  windows: os.platform() === 'win32'
};

module.exports = generator.Base.extend({
  prompting: function () {
    var done = this.async();
    this.prompt([{
      type    : 'input',
      name    : 'main',
      message : 'Main HTML file for your app',
      default : 'production.html'
    }, {
      type    : 'input',
      name    : 'version',
      message : 'The nw.js version you want to use (http://dl.nwjs.io/)',
      default : 'latest'
    }, {
      type    : 'input',
      name    : 'width',
      message : 'Width of application window',
      default: 1000
    }, {
      type    : 'input',
      name    : 'height',
      message : 'Height of application window',
      default: 600
    }, {
      type: 'checkbox',
      name: 'platforms',
      message: 'What platforms would you like to support',
      choices: [{
        name: 'osx32',
        checked: is.macos
      }, {
        name: 'osx64',
        checked: is.macos
      }, {
        name: 'win32',
        checked: is.windows
      }, {
        name: 'win64',
        checked: is.windows
      }, {
        name: 'linux32',
        checked: is.linux
      }, {
        name: 'linux64',
        checked: is.linux
      }]
    }], function (answers) {
      this.config.set('main', answers.main);
      this.config.set('width', answers.width);
      this.config.set('height', answers.height);
      this.config.set('platforms', answers.platforms);
      this.config.set('version', answers.version);
      done();
    }.bind(this));
  },
  installingStealnw: function() {
    this.npmInstall(['steal-nw'], { 'saveDev': true });
  },
  writing: function () {
    var done = this.async();
    var buildJsDeferred = Q.defer();
    var packageJsonDeferred = Q.defer();
    var options = {
      platforms: this.config.get('platforms'),
      version: this.config.get('version')
    };

    // update build.js
    var buildJs = this.destinationPath('build.js');
    if (!this.fs.exists(buildJs)) {
      this.fs.copyTpl(
        this.templatePath('build.ejs'),
        buildJs,
        options
      );
      buildJsDeferred.resolve();
    } else {
      fs.readFile(buildJs, 'utf8', function(err, data) {
        var commentStartText = this.fs.read(this.templatePath('commentStart.ejs'), 'utf8'),
            commentEndText = this.fs.read(this.templatePath('commentEnd.ejs'), 'utf8'),
            nwOptionsText = this.fs.read(this.templatePath('nwOptions.ejs'), 'utf8'),
            commentStartIndex = data.indexOf(commentStartText),
            commentEndIndex = data.indexOf(commentEndText),
            newContent;

        if (commentStartIndex < 0 && commentEndIndex < 0) {
            // add nwOptions
            newContent = data +
                ejs.render(commentStartText, options) +
                ejs.render(nwOptionsText, options) +
                ejs.render(commentEndText, options);
        } else {
            // replace existing nwOptions
            newContent = data.substring(data, commentStartIndex) +
                ejs.render(commentStartText, options) +
                ejs.render(nwOptionsText, options) +
                ejs.render(commentEndText, options) +
                data.substring(commentEndIndex + commentEndText.length);
        }

        fs.writeFile(buildJs, newContent, function() {
          buildJsDeferred.resolve();
        });
      }.bind(this));
    }

    // update package.json
    var packageJson = this.destinationPath('package.json');
    fs.readFile(packageJson, 'utf8', function(err, data) {
      var json = data && JSON.parse(data) || {};
      json.main = this.config.get('main');
      json.window = _.extend({}, json.window, {
        width: this.config.get('width'),
        height: this.config.get('height'),
        toolbar: false
      });
      fs.writeFile(packageJson, JSON.stringify(json), function() {
        packageJsonDeferred.resolve();
      });
    }.bind(this));

    // complete writing once build.js and package.json are updated
    Q.all([
      buildJsDeferred.promise,
      packageJsonDeferred.promise
    ])
    .then(function() {
      done();
    });
  }
});
