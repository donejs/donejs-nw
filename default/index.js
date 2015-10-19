var generator = require('yeoman-generator');
var ejs = require('ejs');
var fs = require('fs');

module.exports = generator.Base.extend({
  prompting: function () {
    // var done = this.async();
    // this.prompt([{
    //   type    : 'input',
    //   name    : 'name',
    //   message : 'Name of project for nw',
    //   default : this.appname // Default to current folder name
    // }, {
    //   type    : 'input',
    //   name    : 'id',
    //   message : 'ID of project for nw',
    // }], function (answers) {
    //   this.config.set('name', answers.name);
    //   this.config.set('id', answers.id);
    //   done();
    // }.bind(this));
  },
  installingStealnw: function() {
    this.npmInstall(['steal-nw'], { 'saveDev': true });
  },
  writing: function () {
    var done = this.async();
    var outputBuildjs = this.destinationPath('build.js');

    if (!this.fs.exists(outputBuildjs)) {
      this.fs.copyTpl(
        this.templatePath('build.ejs'),
        outputBuildjs,
        {}
      );
      done();
    } else {
      fs.readFile(outputBuildjs, 'utf8', function(err, data) {
        if (data.indexOf('nwOptions') < 0) {
            var nwOptionsText = this.fs.read(this.templatePath('nwOptions.ejs'), 'utf8');
            var newContent = data + ejs.render(nwOptionsText, {});
            fs.writeFile(outputBuildjs, newContent, done);
        } else {
          done();
        }
      }.bind(this));
    }
  }
});