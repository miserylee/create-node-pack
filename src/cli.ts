#!/usr/bin/env node

import chalk from 'chalk';
import * as commander from 'commander';
import * as fs from 'fs-extra';
import * as path from 'path';
import * as rl from 'readline-sync';
import PackageGenerator, { E_PROJECT_TYPE, IOptions } from './index';

const packageJson = fs.readJsonSync(path.resolve(__dirname, '../package.json'));

new commander.Command(packageJson.name)
  .version(packageJson.version)
  .option('-t --target [npm|koa]', 'Select a target. Default [npm]')
  .arguments('<project-directory>')
  .usage(`${chalk.green('<project-directory>')} [options]`)
  .action((name, command) => {
    run(name, command.target);
  }).allowUnknownOption()
  .parse(process.argv);

function run(packageName: string, target: 'koa' | 'npm' = 'npm') {
  const projectType = E_PROJECT_TYPE[target] || E_PROJECT_TYPE.npm;
  if (typeof packageName === 'undefined') {
    packageName = rl.question(chalk.green('What`s your package name [required]: '));
  }
  if (!packageName) {
    console.log('Please specify the project directory.');
    process.exit(1);
  } else {
    let options: IOptions;
    switch (projectType) {
      case E_PROJECT_TYPE.npm:
        const description = rl.question(chalk.green('Please describe your package [optional]: '));
        const license = rl.question(chalk.green('Specify the license of the package [optional] (MIT): '), {
          defaultInput: 'MIT',
        });
        const authorName = rl.question(chalk.green('The author`s name [optional]: '));
        const authorEmail = rl.question(chalk.green('The author`s email [optional]: '));
        const isPrivate = rl.keyInYNStrict(chalk.green('Is the package private? [required]: '));
        let author = '';
        if (authorName) {
          author = authorName;
        }
        if (authorEmail) {
          author = `${author} <${authorEmail}>`;
        }
        options = {
          packageName,
          description,
          license,
          author,
          'private': isPrivate as boolean,
          projectType: E_PROJECT_TYPE.npm,
        };
        break;
      case E_PROJECT_TYPE.koa:
        options = {
          packageName,
          'private': true,
          projectType: E_PROJECT_TYPE.koa,
        };
        break;
      default:
    }
    new PackageGenerator(options!).exec().then(() => {
      console.log(`Now run command: 'cd ${packageName} && yarn build' to see the magic!`);
      if (projectType === E_PROJECT_TYPE.koa) {
        console.log(`And also you can run command: 'yarn start' to start a Koa server.`);
      }
      console.log();
      process.exit(0);
    }).catch(err => {
      console.error(chalk.red(err.message));
      process.exit(-1);
    });
  }
}
