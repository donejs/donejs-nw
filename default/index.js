var generator = require('yeoman-generator');
var ejs = require('ejs');
var fs = require('fs');
var Q = require('q');
var _ = require('lodash');

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
      name    : 'width',
      message : 'Width of application window',
    }, {
      type    : 'input',
      name    : 'height',
      message : 'Height of application window',
    }], function (answers) {
      this.config.set('main', answers.main);
      this.config.set('width', answers.width);
      this.config.set('height', answers.height);
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

    // update build.js
    var buildJs = this.destinationPath('build.js');
    if (!this.fs.exists(buildJs)) {
      this.fs.copyTpl(
        this.templatePath('build.ejs'),
        buildJs,
        {}
      );
      buildJsDeferred.resolve();
    } else {
      fs.readFile(buildJs, 'utf8', function(err, data) {
        if (data.indexOf('nwOptions') < 0) {
            var nwOptionsText = this.fs.read(this.templatePath('nwOptions.ejs'), 'utf8');
            var newContent = data + ejs.render(nwOptionsText, {});
            fs.writeFile(buildJs, newContent, function() {
              buildJsDeferred.resolve();
            });
        } else {
          buildJsDeferred.resolve();
        }
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