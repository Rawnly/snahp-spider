#! /usr/local/bin node

const got = require('got');
const fs = require('fs');
const {
	JSDOM
} = require('jsdom');
const inquirer = require('inquirer');
const chalk = require('chalk');

const {
	prompt
} = inquirer;
const homeURL = 'https://snahp.it';
const queryURL = 'http://snahp.it/?s=';

const prefix = chalk `{yellow {bold #}}`;
const suffix = chalk ` {yellow {bold #}}`

const printInfo = console.log.bind(console, chalk `{cyan INFO: }`);
String.prototype.removeWords = function (...words) {
	var s = this;

	for (let i = 0; i < words.length; i++) {
		const word = words[i];
		s = this.replace(word, '')
	}

	return s;
}

prompt([{
		name: 'menu',
		prefix,
		message: 'Select an action',
		type: 'list',
		choices: [{
				name: 'Search',
				value: 's'
			},
			{
				name: 'Home List',
				value: 'h'
			}
		]
	}, {
		name: 'search',
		prefix,
		message: 'Insert your query: ',
		filter: v => v.toLowerCase(),
		when: a => a.menu.toLowerCase() === 's'
	}, {
		name: 'movie',
		prefix,
		message: 'Select a movie/serie: ',
		pageSize: 15,
		type: 'list',
		when: a => a.menu.toLowerCase() === 'h',
		choices: async () => {
			const movies = [];
			const response = await got(homeURL);
			const {
				body
			} = response;
			const dom = new JSDOM(body);
			const {
				window
			} = dom;
			const {
				document
			} = window;
			const titles = document.querySelectorAll('h2.post-title.entry-title a');
			const descriptions = document.querySelectorAll('h2.post-title.entry-title + div.entry.excerpt.entry-summary p');

			for (var i = 0; i < titles.length && i < descriptions.length; i++) {
				const movie = {
					title: titles[i].innerHTML.trim(),
					descr: descriptions[i].innerHTML.trim(),
					url: titles[i].getAttribute('href')
				};

				movies.push(movie);
			}

			const list = movies.map(({
				title,
				url
			}) => {
				return {
					name: title,
					value: url
				}
			})

			list.push(new inquirer.Separator())

			return list;
		}
	}])
	.then(async answers => {
		let a = answers;

		try {
			if (answers.search) {
				a = await prompt([{
					name: 'movie',
					message: 'Query result: ',
					type: 'list',
					pageSize: 15,
					choices: async () => {
						const movies = [];
						const response = await got(search(answers.search));
						const {
							body
						} = response;
						const dom = new JSDOM(body);
						const {
							window
						} = dom;
						const {
							document
						} = window;
						const titles = document.querySelectorAll('h2.post-title.entry-title a');
						const descriptions = document.querySelectorAll('h2.post-title.entry-title + div.entry.excerpt.entry-summary p');

						for (var i = 0; i < titles.length && i < descriptions.length; i++) {
							const movie = {
								title: titles[i].innerHTML.trim(),
								descr: descriptions[i].innerHTML.trim(),
								url: titles[i].getAttribute('href')
							};

							movies.push(movie);
						}

						const list = movies.map(({
							title,
							url
						}) => {
							return {
								name: title,
								value: url
							}
						})

						list.push(new inquirer.Separator())

						return list;
					}
				}])
			}

			const {
				movie
			} = a;

			const {
				body
			} = await got(movie);
			const {
				window
			} = new JSDOM(body);
			const {
				document
			} = window;
			var urls = document.querySelectorAll('a')
			var downloadList = [];
			if (!urls.length || typeof urls !== 'object') {
				throw 'NO ARRAY';
			}

			for (let i = 0; i < urls.length; i++) {
				const url = urls[i];
				const href = url.getAttribute('href');

				if (/^http:\/\/links\.snahp\.it\/.*?/g.test(href)) {
					downloadList.push({
						name: url.innerHTML.replace(/(<.*?>|<\/.*?>|Download|from)/g, '').trim(),
						value: href
					})
				}
			}

			console.clear();
			console.log(chalk `{bold {cyan URLS:}}`);
			downloadList.forEach(async link => {
				console.log(chalk `\n{bold ${link.name}}\n{yellow ${link.value}}\n`);
			})
		} catch (error) {
			throw error;
		}
	})
	.catch(console.error.bind(console, chalk `{red Error:}`));


function search(query) {
	query = encodeURIComponent(query)
	return 'http://snahp.it/?s=' + query;
}