import Compiler from './analyzer.js'
import { readFile, writeFile } from 'fs'

const compiler = new Compiler()

readFile('./source.txt', 'utf-8', (err, data) => {
	if (err) {
		console.log(err)
		return
	}
	compiler.scanner(data)
	writeFile('./tokens.json', JSON.stringify(compiler.tokens), (err) => {
		if (err) {
			console.log(err)
		}
	})
})
