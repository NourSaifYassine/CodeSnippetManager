#!/usr/bin/env node

const { Command } = require('commander');
const inquirer = require('inquirer');
const fs = require('fs');
const path = process.env.SNIPPETS_PATH || './snippets.json';
const program = new Command();

if (!fs.existsSync(path)) {
  fs.writeFileSync(path, JSON.stringify([]));
}

const loadSnippets = () => {
  return JSON.parse(fs.readFileSync(path));
};

const saveSnippets = (snippets) => {
  fs.writeFileSync(path, JSON.stringify(snippets, null, 2));
};

const getCodeFromFile = async () => {
  const { filePath } = await inquirer.prompt([
    { type: 'input', name: 'filePath', message: 'Enter the file path of your code snippet:' }
  ]);

  if (!fs.existsSync(filePath)) {
    console.log('File does not exist. Please check the file path and try again.');
    process.exit(1);
  }

  return fs.readFileSync(filePath, 'utf8');
};

program
  .command('add')
  .description('Add a new code snippet')
  .action(async () => {
    try {
      const answers = await inquirer.prompt([
        { type: 'input', name: 'title', message: 'Snippet Title:' },
        { type: 'input', name: 'description', message: 'Snippet Description:' },
        { type: 'input', name: 'language', message: 'Language:' },
        { type: 'input', name: 'tags', message: 'Tags (comma-separated):' },
      ]);

      const code = await getCodeFromFile();

      const snippets = loadSnippets();
      const newSnippet = {
        id: snippets.length ? snippets[snippets.length - 1].id + 1 : 1,
        ...answers,
        code,
        tags: answers.tags.split(',').map(tag => tag.trim())
      };
      snippets.push(newSnippet);
      saveSnippets(snippets);
      console.log('Snippet added successfully!');
    } catch (error) {
      console.error('Error adding snippet:', error);
    }
  });

program
  .command('list')
  .description('List all code snippets')
  .action(() => {
    try {
      const snippets = loadSnippets();
      const formattedSnippets = snippets.map(({ id, title, description, language, tags, code }) => ({
        ID: id,
        Title: title,
        Description: description,
        Language: language,
        Tags: tags.join(', ')
      }));
      
      console.table(formattedSnippets);

      snippets.forEach(({ id, code }) => {
        console.log(`\nCode for Snippet ID ${id}:\n`);
        console.log(code);
        console.log('---------------------------------------------');
      });
    } catch (error) {
      console.error('Error listing snippets:', error);
    }
  });

program
  .command('search <tag>')
  .description('Search for snippets by tag')
  .action((tag) => {
    try {
      const snippets = loadSnippets();
      const filtered = snippets.filter(snippet => snippet.tags.includes(tag));
      const formattedSnippets = filtered.map(({ id, title, description, language, tags }) => ({
        ID: id,
        Title: title,
        Description: description,
        Language: language,
        Tags: tags.join(', ')
      }));
      
      console.table(formattedSnippets);

      filtered.forEach(({ id, code }) => {
        console.log(`\nCode for Snippet ID ${id}:\n`);
        console.log(code);
        console.log('---------------------------------------------');
      });
    } catch (error) {
      console.error('Error searching snippets:', error);
    }
  });

program
  .command('delete <id>')
  .description('Delete a snippet by ID')
  .action((id) => {
    try {
      let snippets = loadSnippets();
      snippets = snippets.filter(snippet => snippet.id !== parseInt(id, 10));
      saveSnippets(snippets);
      console.log('Snippet deleted successfully!');
    } catch (error) {
      console.error('Error deleting snippet:', error);
    }
  });

program
  .command('edit <id>')
  .description('Edit a snippet by ID')
  .action(async (id) => {
    try {
      const snippets = loadSnippets();
      const snippet = snippets.find(snippet => snippet.id === parseInt(id, 10));
      if (!snippet) {
        console.log('Snippet not found');
        return;
      }
      const answers = await inquirer.prompt([
        { type: 'input', name: 'title', message: 'New Snippet Title:', default: snippet.title },
        { type: 'input', name: 'description', message: 'New Snippet Description:', default: snippet.description },
        { type: 'input', name: 'language', message: 'New Language:', default: snippet.language },
        { type: 'input', name: 'tags', message: 'New Tags (comma-separated):', default: snippet.tags.join(', ') },
      ]);

      const code = await getCodeFromFile();

      const index = snippets.findIndex(snippet => snippet.id === parseInt(id, 10));
      snippets[index] = { id: parseInt(id, 10), ...answers, code, tags: answers.tags.split(',').map(tag => tag.trim()) };
      saveSnippets(snippets);
      console.log('Snippet updated successfully!');
    } catch (error) {
      console.error('Error editing snippet:', error);
    }
  });

program.parse(process.argv);
