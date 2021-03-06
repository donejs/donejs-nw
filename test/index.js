var path = require('path');
var helpers = require('yeoman-test');
var assert = require('assert');
var fs = require('fs-extra');

describe('donejs-nw', function() {
  describe('should create/update build.js', function() {
    describe('when no build.js exists', function() {
      before(function(done) {
        helpers.run(path.join(__dirname, '..', 'default'))
          .withPrompts({
            version: '0.0.0',
            platforms: ['x']
          })
          .on('end', done);
      });

      it('should write build.js', function() {
        assert.file(['build.js']);
        assert.fileContent('build.js', /steal-tools/);
        assert.fileContent('build.js', /steal-nw/);
        assert.fileContent('build.js', /version: "0.0.0"/);
        assert.fileContent('build.js', /platforms: \["x"\]/);
      });
    });

    describe('when build.js was already created by generator-donejs', function() {
      before(function(done) {
        helpers.run(path.join(__dirname, '..', 'default'))
        .withPrompts({
          version: '0.0.0',
          platforms: ['x']
        })
        .inTmpDir(function(dir) {
          var done = this.async();
          fs.copy(path.join(__dirname, 'templates/generator-donejs'), dir, done);
        })
        .on('end', done);
      });

      it('should add nwOptions to build.js', function() {
        assert.file(['build.js']);
        assert.fileContent('build.js', /generator-donejs build\.js/);
        assert.fileContent('build.js', /steal-tools/);
        assert.fileContent('build.js', /steal-nw/);
        assert.fileContent('build.js', /version: "0.0.0"/);
        assert.fileContent('build.js', /platforms: \["x"\]/);
      });
    });

    describe('when build.js was already created by generator-donejs and updated by donejs-nw', function() {
      before(function(done) {
        helpers.run(path.join(__dirname, '..', 'default'))
          .withPrompts({
            version: '0.0.0',
            platforms: ['x']
          })
          .inTmpDir(function(dir) {
            var done = this.async();
            fs.copy(path.join(__dirname, 'templates/donejs-nw'), dir, done);
          })
          .on('end', done);
      });

      it('should replace existing donejs-nw options', function() {
        assert.file(['build.js']);
        assert.fileContent('build.js', /generator-donejs \+ donejs-nw build\.js/);
        assert.fileContent('build.js', /steal-tools/);
        assert.fileContent('build.js', /steal-nw/);
        assert.noFileContent('build.js', /previous nw options/);
      });
    });
  });

  describe('should update package.json', function() {
    before(function(done) {
      helpers.run(path.join(__dirname, '..', 'default'))
        .inTmpDir(function(dir) {
          var done = this.async();
          fs.copy(path.join(__dirname, 'templates/package-json'), dir, done);
        })
        .withPrompts({
          main: 'app.html',
          width: '800',
          height: '600',
          version: '0.0.0',
          baseURL: 'https://foo.com',
          platforms: ['x']
        })
        .on('end', done);
    });

    it('with correct nw.js configuration', function() {
      assert.file(['package.json']);
      assert.JSONFileContent('package.json', { main: 'app.html' });
      assert.JSONFileContent('package.json', { window: { width: 800, height: 600, toolbar: false } });
      assert.JSONFileContent('package.json', { steal: { envs: { 'nw-production': {'serviceBaseURL': 'https://foo.com'}}}});
    });
  });
});
