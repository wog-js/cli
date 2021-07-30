// Require modules
const chalk = require('chalk');
const yargs = require('yargs');

const cli = yargs
  .exitProcess(false)
  .version(false)
  .scriptName('')
  .usage('<command> [options]')
  .demandCommand()
  .strict()
  .wrap(yargs.terminalWidth())
  .fail((msg, err, _yargs) => {
    if (msg) {
      console.error(chalk.red(msg));
    }
    if (err) {
      console.error(err);
    }
  })
  .option('dry-run', {
    type: 'boolean',
    description: 'Simulates persistent changes, but actually executes none of them.'
  });

module.exports = cli;
