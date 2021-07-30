// Require modules
const path = require('path');
const readline = require('readline');
const { Store } = require('data-store');

const HISTORY_KEY = 'history';
const HISTORY_SIZE = 100;

/**
 * Utility class for reading input from the command-line.
 */
class Reader {

  /**
   * Constructs a new Reader instance.
   *
   * @param {string} prompt An optional prefix to prepend to all prompts.
   */
  constructor(prompt = '$') {
    this.running = true;

    // TODO: use the store for cli history storage and loading (similar to .bash_history)
    this._store = new Store({
      path: path.join(process.cwd(), '.cli.json'),
      debounce: 1000
    });
    this._store.load();

    this._interface = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      history: this._store.get(HISTORY_KEY),
      historySize: HISTORY_SIZE,
      prompt
    });
    this._interface.pause();
  }

  /**
   * Awaits the next command input.
   *
   * Rejects when the interface is closed (e.g. by `Ctrl+D`).
   * Resolves when the user hits `Enter` (with input) or `Ctrl+C` (without input).
   *
   * @returns {Promise<string?>}
   */
  async prompt() {
    if (! this.running) return;

    this._interface.prompt();
    const result = await new Promise((resolve, reject) => {
      this._interface.once('line', line => resolve(line));
      this._interface.once('SIGINT', () => {
        this.clear();
        resolve(null);
      });
      this._interface.once('close', () => {
        this.close();
        reject();
      });
    });
    this._interface.removeAllListeners();
    this._interface.pause();
    return result;
  }

  /**
   * Clears the current line.
   */
  clear() {
    if (! this.running) return;

    readline.clearLine(process.stdout, 0);
  }

  /**
   * Closes this Reader instance and releases all associated resources.
   */
  close() {
    if (! this.running) return;

    this.running = false;
    this.clear();
    this._interface.close();
    this._store.save();
  }
}

module.exports = Reader;
