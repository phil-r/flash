#!/usr/bin/env node

const os = require('os');
const fs = require('fs-extra');
const path = require('path');
const inquirer = require('inquirer');
const filenamify = require('filenamify');
const Rx = require('rxjs/Rx');

const CONFIG_DIR = path.join(os.homedir(), '.flash');
const COLLECTIONS_DIR = path.join(CONFIG_DIR, 'collections');
const CONFIG_PATH = path.join(CONFIG_DIR, 'config');

const router = new Rx.Subject();
router.subscribe(async ({ path, ...args }) => {
  if (path === 'main') {
    router.next(await mainMenu());
  } else if (path === 'start') {
    router.next(await mainMenu());
  } else if (path === 'create') {
    router.next(await createCollection());
  } else if (path === 'addCard') {
    router.next(await addCard(args));
  } else if (path === 'edit') {
    router.next(await mainMenu());
  } else if (path === 'settings') {
    router.next(await mainMenu());
  } else if (path === 'exit') {
    process.exit(0);
  } else {
    console.log('Unknown path');
    process.exit(1);
  }
});

(async () => {
  const configExists = await fs.pathExists(CONFIG_PATH);
  console.log(configExists);

  let config;
  if (configExists) {
    console.log('Welcome Back!');
    config = await fs.readJson(CONFIG_PATH);
    console.log('config', config);
    router.next({ path: 'main' });
  } else {
    console.log(
      "Hello! It looks like it's your first run of `flash`! Welcome!"
    );
    config = { hello: 'world' };
    await fs.outputJson(CONFIG_PATH, config);
    console.log('Lets start by creating your first collection!');
    router.next({ path: 'create' });
  }
})();

async function mainMenu() {
  const answers = await inquirer.prompt({
    type: 'list',
    name: 'choice',
    message: 'What do you want to do?',
    choices: [
      { value: 'start', name: 'Start training' },
      { value: 'create', name: 'Create new collection' },
      { value: 'edit', name: 'Edit collections' },
      { value: 'settings', name: 'Change settings' },
      { value: 'exit', name: 'Exit' }
    ]
  });
  return { path: answers.choice };
}

async function createCollection() {
  const answers = await inquirer.prompt({
    type: 'input',
    name: 'name',
    message: 'What is the name of collection?'
  });
  const { name } = answers;
  const filename = `${filenamify(name)}.json`;
  const collection = { name, cards: [] };
  // TODO: Check if it exists already
  await fs.outputJson(path.join(COLLECTIONS_DIR, filename), collection);
  return { path: 'addCard', collection, filename };
}

async function addCard({ collection, filename, ask }) {
  if (ask) {
    const answers = await inquirer.prompt({
      type: 'confirm',
      name: 'continue',
      message: 'Want to add another card?',
      default: true
    });
    if (!answers.continue) {
      return { path: 'main' };
    }
  }
  const card = await inquirer.prompt([
    {
      type: 'input',
      name: 'front',
      message: "What's on the front of the card?"
    },
    {
      type: 'input',
      name: 'back',
      message: "What's on the back of the card?"
    }
  ]);

  console.log(card);

  collection.cards.push(card);

  await fs.outputJson(path.join(COLLECTIONS_DIR, filename), collection);
  console.log('Card added!');
  return { path: 'addCard', collection, filename, ask: true };
}
