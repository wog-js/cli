// Require modules
const chalk = require('chalk');
const enquirer = require('enquirer');
const { printTable } = require('console-table-printer');

/**
 * @param {import('yargs')} cli
 * @param {import('awilix').AwilixContainer} container
 */
module.exports = (cli, container) => {
  /** @type {import('@wogjs/types').Accounts} */
  const accounts = container.resolve('accounts');

  /** @type {import('@wogjs/types').DatabaseManager} */
  const database = container.resolve('database');

  cli.command('accounts:list', 'List user accounts.', () => {},
    async function(_args) { // TODO: paginate
      const all = await accounts.all();
      printTable(all);
    }
  );

  cli.command('accounts:find <username>', 'Find an account by username.',
    (yargs) => yargs.positional('username', {
      describe: 'The username to search for',
      type: 'string'
    }),
    async function(args) {
      const found = await accounts.findByUsername(args.username);
      if (found) {
        delete found.password;
        printTable([found]);
      }
      else {
        console.log(chalk.red(`No matching account found for "${args.username}"!`));
      }
    }
  );

  cli.command('accounts:create', 'Create a new user account.',
    (_yargs) => {},
    async (_args) => {
      console.log();
      const answers = await enquirer.prompt([
        {
          type: 'input',
          name: 'username',
          message: 'What will be the username?',
          validate: async (username) => {
            const found = await accounts.findByUsername(username);
            if (found !== undefined) {
              return `A user with the name ${chalk.bold(username)} does already exist!`;
            }
            return true;
          }
        },
        {
          type: 'input',
          name: 'email',
          message: 'What\'s the email address?',
          validate: async (email) => {
            const found = await database.get('SELECT * FROM accounts WHERE email = ?', [email]);
            if (found !== undefined) {
              return 'That email address has already been registered!';
            }
            return true;
          }
        },
        {
          type: 'select',
          name: 'role',
          message: 'Select the user role:',
          choices: async () => Promise.resolve(['user', 'admin']) // TODO: Fetch from somewhere ...
        },
        {
          type: 'password',
          name: 'password',
          message: 'Set a password:',
          validate: value => !! value
        }
      ]);
      console.log();

      try {
        await accounts.create(answers);
        console.log(`${chalk.green('The user')} ${chalk.bold(answers.username)} ${chalk.green('has been created!')}`);
      } catch (err) {
        console.error('Something went wrong: ' + err);
      }

      console.log();
    }
  );

  cli.command('accounts:delete', 'Delete a user account.', // TODO: allow for mass deletion
    (_yargs) => {},
    async (_args) => {
      console.log();

      const selection = await enquirer.prompt([
        {
          type: 'autocomplete',
          message: 'Select the user to delete',
          name: 'user',
          choices: async () => {
            return (await accounts.all()).map(user => ({ name: user.username, value: user }));
          },
          validate: answer => {
            if (answer.id === 1) {
              return 'The initial admin account can\'t be deleted!';
            }
            return true;
          }
        },
        {
          type: 'confirm',
          name: 'confirmed',
          message: 'Are you sure? This action can\'t be reversed!',
          default: false
        }
      ]);
      console.log();

      if (selection.confirmed) {
        try {
          await accounts.deleteUser(selection.user.id);
          console.log(chalk.red('The user has been deleted.'));
        } catch (err) {
          console.error('Something went wrong: ' + err);
        }
      }
      else {
        console.log(chalk.green('Deletion canceled.'));
      }

      console.log();
    });
};
