import chalk = require('chalk');
import { execSync } from 'child_process';
import * as spawn from 'cross-spawn';
import * as dns from 'dns';
import * as fs from 'fs-extra';
import * as path from 'path';
import * as url from 'url';
import * as validateProjectName from 'validate-npm-package-name';

export enum E_PROJECT_TYPE {
  npm,
  koa,
}

export interface IOptions {
  packageName: string;
  description?: string;
  license?: string;
  author?: string;
  'private'?: boolean;
  projectType: E_PROJECT_TYPE;
}

interface IPackageJson {
  name: string;
  'private'?: boolean;
  version?: string;
  main: string;
  typings?: string;
  license?: string;
  author?: string;
  description?: string;
  scripts: {
    [script: string]: string;
  };
  'pre-commit'?: string[];
}

const TEMPLATES_ROOT = path.resolve(__dirname, '../templates');

export default class PackageGenerator {
  private static _printValidationResults(results?: string[]) {
    if (typeof results !== 'undefined') {
      results.forEach(error => {
        console.error(chalk.red(`  *  ${error}`));
      });
    }
  }

  private static _isCommandAvailable(command: string): boolean {
    try {
      execSync(command, { stdio: 'ignore' });
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

  private static async _runCommand(command: string, args: string[]) {
    return await new Promise((resolve, reject) => {
      spawn(command, args, { stdio: 'inherit' }).on('close', code => {
        if (code !== 0) {
          reject(new Error(`${chalk.cyan(`${command} ${args.join(' ')}`)} execute failed.`));
        } else {
          resolve();
        }
      });
    });
  }

  private static async _initializeGitRepository() {
    console.log();
    console.log(chalk.cyan('Initializing git repository.'));
    console.log();
    await PackageGenerator._runCommand('git', ['init']);
  }

  private static async _commitRepository() {
    console.log();
    console.log(chalk.cyan('Commit git repository.'));
    console.log();
    await PackageGenerator._runCommand('git', ['add', '-A']);
    await PackageGenerator._runCommand('git', ['commit', '-m', '"Initialized package."']);
  }

  private _options: IOptions;
  private _packageJsonPath: string;
  private _packageName: string;
  private _root: string;
  private _templateRoot: string;

  constructor(options: IOptions) {
    this._options = options;
    this._root = path.resolve(options.packageName);
    this._packageName = path.basename(this._root);
    this._packageJsonPath = path.resolve(this._root, 'package.json');
    this._templateRoot = path.resolve(TEMPLATES_ROOT, E_PROJECT_TYPE[options.projectType]);
  }

  public async exec() {
    this._checkIfOkToGeneratePackage();
    console.log(`Creating a new package in ${chalk.green(this._root)}. Project type is ${chalk.green(E_PROJECT_TYPE[this._options.projectType])}`);
    this._generatePackageJson();
    if (!PackageGenerator._isCommandAvailable('yarn --version')) {
      throw new Error(`You should install yarn first. https://yarnpkg.com/zh-Hans/docs/install`);
    }
    process.chdir(this._root);
    const isGitAvailable = PackageGenerator._isCommandAvailable('git --version');
    if (isGitAvailable) {
      await PackageGenerator._initializeGitRepository();
    }
    await this._installDevDependencies();
    if (this._options.projectType === E_PROJECT_TYPE.koa) {
      await this._installDependenciesOfKoaProject();
    }
    this._copyTemplate();
    if (isGitAvailable) {
      await PackageGenerator._commitRepository();
    }
    console.log(chalk.green('Create package succeed! Enjoy your coding.'));
  }

  private _checkIfOkToGeneratePackage() {
    // Check root empty.
    fs.ensureDirSync(this._root);
    const files = fs.readdirSync(this._root).filter(v => v[0] !== '.');
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
      main: './build/index.js',
      scripts: {
        build: 'tsc',
        clean: 'rm -rf ./build',
        start: 'node ./build/index',
        'start-ts': 'ts-node ./src/index',
        lint: 'tslint -c tslint.json ./src/**/*.ts',
      },
    };

    const projectType = this._options.projectType;
    switch (projectType) {
      case E_PROJECT_TYPE.npm:
        packageJson.version = '0.0.1';
        packageJson.private = !!this._options.private;
        packageJson.license = this._options.license;
        packageJson.author = this._options.author;
        packageJson.description = this._options.description;
        packageJson.typings = './build/index.d.ts';
        packageJson.scripts.prebuild = 'yarn run lint && yarn test && yarn run clean';
        packageJson.scripts.prepublishOnly = 'yarn build';
        packageJson.scripts.test = 'mocha --require ts-node/register ./test/*.spec.ts';
        packageJson['pre-commit'] = ['prepublishOnly'];
        break;
      case E_PROJECT_TYPE.koa:
        packageJson.private = true;
        packageJson.scripts.prebuild = 'yarn run lint && yarn run clean';
        packageJson['pre-commit'] = ['build'];
        break;
      default:
    }

    fs.writeJsonSync(this._packageJsonPath, packageJson, { spaces: 2 });
  }

  private async _installDevDependencies() {
    console.log();
    const dependencies = [
      '@types/node', 'typescript',
      'pre-commit', 'ts-node', 'tslint', 'tslint-clean-code',
    ];
    const projectType = this._options.projectType;
    switch (projectType) {
      case E_PROJECT_TYPE.npm:
        dependencies.push('@types/mocha', 'mocha');
        break;
      case E_PROJECT_TYPE.koa:
        break;
      default:
    }
    console.log(chalk.cyan('Installing dev dependencies.'));
    console.log();
    await this._install(dependencies);
  }

  private async _installDependenciesOfKoaProject() {
    console.log();
    const deps = [
      '@types/jsonwebtoken', 'jsonwebtoken',
      '@types/kcors', 'kcors',
      '@types/koa', 'koa',
      '@types/koa-compress', 'koa-compress',
      '@types/mongoose', 'mongoose',
      '@types/dotenv', 'dotenv',
      'koa-erz-logger', 'koact',
      'mongoose-explain-checker', 'mongoose-finder-enhancer',
      'schema.io', 'erz',
    ];
    console.log(chalk.cyan('Installing dependencies of koa project.'));
    console.log();
    await this._install(deps, false);
  }

  private async _install(dependencies: string[], dev: boolean = true) {
    const isYarnOnline = await PackageGenerator._checkYarnIfOnline();
    const command = 'yarn';
    const args = ['add', '--exact'];
    if (dev) {
      args.push('-D');
    }
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

    await PackageGenerator._runCommand(command, args);
  }

  private _copyTemplate() {
    console.log();
    console.log(chalk.cyan('Writing template files.'));
    fs.copySync(this._templateRoot, this._root);
    // rename .gitignor & .npmignore
    fs.renameSync(path.resolve(this._root, 'gitignore'), path.resolve(this._root, '.gitignore'));
    fs.renameSync(path.resolve(this._root, 'tslint'), path.resolve(this._root, 'tslint.json'));
    fs.renameSync(path.resolve(this._root, 'tsconfig'), path.resolve(this._root, 'tsconfig.json'));

    switch (this._options.projectType) {
      case E_PROJECT_TYPE.koa:
        fs.renameSync(path.resolve(this._root, 'env'), path.resolve(this._root, '.env'));
        // write readme
        fs.writeFileSync(path.resolve(this._root, 'README.md'), `# ${this._packageName}`);
        break;
      case E_PROJECT_TYPE.npm:
        fs.renameSync(path.resolve(this._root, 'npmignore'), path.resolve(this._root, '.npmignore'));
        fs.renameSync(path.resolve(this._root, 'test', 'tsconfig'), path.resolve(this._root, 'test', 'tsconfig.json'));
        // write readme
        fs.writeFileSync(path.resolve(this._root, 'README.md'), `# ${this._packageName}

##  ![NPM version](https://img.shields.io/npm/v/${this._packageName}.svg?style=flat)`);
        break;
      default:
    }

  }

}
