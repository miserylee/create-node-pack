import * as assert from 'assert';
import { execSync } from 'child_process';
import * as fs from 'fs-extra';
import 'mocha';
import * as path from 'path';
import PackageGenerator, { IOptions } from '../src';

const packageName = 'demo';
const packagePath = path.resolve(__dirname, '..', packageName);
const packageJsonPath = path.resolve(packagePath, 'package.json');

const options: IOptions = {
  packageName: packagePath,
  license: 'MIT',
};

describe('PackageGenerator', function() {
  this.timeout(60000);
  it('should create package.json correctly', done => {
    fs.emptyDirSync(packagePath);
    const generator = new PackageGenerator(options);
    generator.exec().then(() => {
      assert(fs.existsSync(packageJsonPath), 'package.json is not exists.');
      const packageJson = fs.readJsonSync(packageJsonPath);
      assert(packageJson.name === packageName);
      done();
    }).catch(err => {
      done(err);
    });
  });
  it('should not create again', done => {
    const generator = new PackageGenerator(options);
    generator.exec().then(() => {
      done(new Error('create again.'));
    }).catch(err => {
      done();
    });
  });
  it('demo should start succeed.', () => {
    process.chdir(packagePath);
    console.log(execSync('yarn build').toString());
    console.log(execSync('yarn start').toString());
  });
});
