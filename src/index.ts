import chalk from 'chalk';
import { execSync } from 'child_process';
import * as spawn from 'cross-spawn';
import * as dns from 'dns';
import * as fs from 'fs-extra';
import * as path from 'path';
import * as url from 'url';
import * as validateProjectName from 'validate-npm-package-name';

export interface IOptions {
  packageName: string;
  description?: string;
  license?: string;
  author?: string;
  'private'?: boolean;
}

interface IPackageJson {
  name: string;
  'private'?: boolean;
  version: string;
  main: string;
  license?: string;
  author?: string;
  description?: string;
  scripts: {
    [script: string]: string;
  };
  'pre-commit': string[];
}

export default class PackageGenerator {
  private static _printValidationResults(results?: string[]) {
    if (typeof results !== 'undefined') {
      results.forEach(error => {
        console.error(chalk.red(`  *  ${error}`));
      });
    }
  }

  private static _isYarnAvailable(): boolean {
    try {
      execSync('yarnpkg --version', { stdio: 'ignore' });
      return true;
    } catch (e) {
      return false;
    }
  }

  private static async _checkYarnIfOnline() {
    return await new Promise(resolve => {
      dns.lookup('registry.yarnpkg.com', err => {
        let proxy;
        if (process.env.https_proxy) {
          proxy = process.env.https_proxy;
        } else {
          try {
            // Trying to read https-proxy from .npmrc
            const httpsProxy = execSync('npm config get https-proxy')
              .toString()
              .trim();
            proxy = httpsProxy !== 'null' ? httpsProxy : undefined;
          } catch (e) {
            // noop.
          }
        }
        if (err && proxy) {
          const hostname = url.parse(proxy).hostname;
          if (!hostname) {
            resolve(false);
          } else {
            dns.lookup(hostname, proxyErr => {
              resolve(proxyErr === null);
            });
          }
        } else {
          resolve(true);
        }
      });
    });
  }

  private _options: IOptions;
  private _packageJsonPath: string;
  private _packageName: string;
  private _root: string;

  constructor(options: IOptions) {
    this._options = options;
    this._root = path.resolve(options.packageName);
    this._packageName = path.basename(this._root);
    this._packageJsonPath = path.resolve(this._root, 'package.json');
  }

  public async exec() {
    this._checkIfOkToGeneratePackage();
    console.log(`Creating a new package in ${chalk.green(this._root)}`);
    this._generatePackageJson();
    if (!PackageGenerator._isYarnAvailable()) {
      throw new Error(`You should install yarnpkg first. https://yarnpkg.com/zh-Hans/docs/install`);
    }
    process.chdir(this._root);
    await this._installDevDependencies();
    this._copyTemplate();
    console.log(chalk.green('Create package succeed! Enjoy your coding.'));
  }

  private _checkIfOkToGeneratePackage() {
    // Check root empty.
    fs.ensureDirSync(this._root);
    const files = fs.readdirSync(this._root);
    if (files.length > 0) {
      throw new Error(`${this._root} is not empty.`);
    }

    // Validate project name.
    const validationResult = validateProjectName(this._packageName);
    if (!validationResult.validForNewPackages) {
      console.error(`Could not create a project called
       ${chalk.red(`"${this._packageName}"`)} because of npm naming restrictions:`);
      PackageGenerator._printValidationResults(validationResult.errors);
      PackageGenerator._printValidationResults(validationResult.warnings);
      throw new Error(`create failed.`);
    }
  }

  private _generatePackageJson() {
    const packageJson: IPackageJson = {
      name: this._packageName,
      version: '0.0.1',
      main: './lib/index.js',
      private: this._options.private,
      license: this._options.license,
      author: this._options.author,
      description: this._options.description,
      scripts: {
        build: 'yarn run lint && yarn test && tsc',
        start: 'node ./lib/index',
        lint: 'tslint -c tslint.json ./src/**/*.ts',
        test: 'mocha --require ts-node/register ./test/*.spec.ts',
        prepublishOnly: 'yarn run build && yarn run test',
      },
      'pre-commit': ['prepublishOnly'],
    };

    fs.writeJsonSync(this._packageJsonPath, packageJson, { spaces: 2 });
  }

  private async _installDevDependencies() {
    const dependencies = [
      '@types/mocha', '@types/node', 'mocha', 'typescript',
      'pre-commit', 'ts-node', 'tslint', 'tslint-clean-code',
    ];
    console.log('Installing dev dependencies.');
    console.log();
    const isYarnOnline = await PackageGenerator._checkYarnIfOnline();
    const command = 'yarnpkg';
    const args = ['add', '--exact', '-D'];
    if (!isYarnOnline) {
      args.push('--offline');
    }
    args.push(...dependencies);
    args.push('--cwd');
    args.push(this._root);

    if (!isYarnOnline) {
      console.log(chalk.yellow('You appear to be offline.'));
      console.log(chalk.yellow('Falling back to the local Yarn cache.'));
      console.log();
    }

    await new Promise((resolve, reject) => {
      spawn(command, args, { stdio: 'inherit' }).on('close', code => {
        if (code !== 0) {
          reject(new Error(`${chalk.cyan(`${command} ${args.join(' ')}`)} execute failed.`));
        } else {
          resolve();
        }
      });
    });
  }

  private _copyTemplate() {
    console.log('Writing template files.');
    const templatePath = path.resolve(__dirname, '../template');
    fs.copySync(templatePath, this._root);
    // rename .gitignor & .npmignore
    fs.renameSync(path.resolve(this._root, 'gitignore'), path.resolve(this._root, '.gitignore'));
    fs.renameSync(path.resolve(this._root, 'npmignore'), path.resolve(this._root, '.npmignore'));
    // write readme
    fs.writeFileSync(path.resolve(this._root, 'README.md'), `# ${this._packageName}

##  ![NPM version](https://img.shields.io/npm/v/${this._packageName}.svg?style=flat)`);
  }
}
