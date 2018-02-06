#!/usr/bin/env node

import chalk from 'chalk';
import * as commander from 'commander';
import * as fs from 'fs-extra';
import * as path from 'path';
import * as rl from 'readline-sync';
import PackageGenerator, { IOptions } from './index';

const packageJson = fs.readJsonSync(path.resolve(__dirname, '../package.json'));

new commander.Command(packageJson.name)
  .version(packageJson.version)
  .arguments('<project-directory>')
  .usage(`${chalk.green('<project-directory>')} [options]`)
  .action(name => {
    run(name);
  }).allowUnknownOption()
  .parse(process.argv);

function run(packageName: string) {

  if (typeof packageName === 'undefined') {
    packageName = rl.question(chalk.green('What`s your package name [required]: '));
  }
  if (!packageName) {
    console.log('Please specify the project directory.');
    process.exit(1);
  } else {
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
    const options: IOptions = {
      packageName,
      description,
      license,
      author,
      'private': isPrivate as boolean,
    };
    new PackageGenerator(options).exec().then(() => {
      console.log(`Now run command: 'cd ${packageName} && yarn run build' to see the magic!`);
      console.log();
      process.exit(0);
    }).catch(err => {
      console.error(chalk.red(err.message));
      process.exit(-1);
    });
  }
}
