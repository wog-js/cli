// Require modules
const chalk = require('chalk');
const cli = require('./util/create-cli');
const Reader = require('./util/reader');
const pkg = require('./package.json');

const reader = new Reader(`${chalk.green('wog')} $ `);

/**
 * Starts the CLI interface.
 *
 * @param {import('awilix').AwilixContainer} container
 * @returns {Promise<void>}
 */
module.exports = async (container) => {
  // Register commands
  require('./commands/accounts')(cli, container);
  cli.command('exit', 'Exit the application', {}, (_argv) => reader.close());
  cli.command('version', 'Prints version information', {}, (_argv) => {
    const wogVersion = container.resolve('wogVersion');

    console.log();
    console.log(`${chalk.bold('wog')} v${chalk.cyan.bold(wogVersion)}`);
    console.log(`${chalk.bold('wog cli')} v${chalk.cyan.bold(pkg.version)}`);
    console.log();
  });

  console.log(`${chalk.dim('=====')} ${chalk.bold('wog cli')} v${chalk.cyan.bold(pkg.version)} ${chalk.dim('=====')}`);
  console.log('');
  console.log('Welcome! Type "help" for help.');
  console.log('');

  while(reader.running) {
    try {
      const input = await reader.prompt();
      if (typeof input === 'string') await cli.parseAsync(input.split(' '));
    } catch (err) {
      if (err) console.error(err);
    }
  }
};
