import { keywords, symbols } from './keywords.js'

type Token = {
	type: string
	value: string | number
}

enum CharType {
	letter,
	digit,
	symbolFirst,
	symbolRest,
	other,
}

export default class Compiler {
	keywords: string[]
	symbols: string[]
	simpleSymbols: string[] = []
	multipleSymbols: string[] = []
	symbolFirsts: string[] = []
	symbolRests: string[] = []
	tokens: Token[] = []

	constructor() {
		this.keywords = keywords
		this.symbols = symbols

		symbols.forEach((symbol) => {
			this.symbolFirsts.push(symbol[0])
			this.symbolRests = this.symbolRests.concat(
				symbol.slice(1).split('')
			)
		})

		this.symbolFirsts.sort()
		this.symbolRests = [...new Set(this.symbolRests)]

		this.simpleSymbols = [...new Set(this.symbolFirsts.slice())]
		for (let i = 1; i < this.symbolFirsts.length; i++) {
			if (
				this.symbolFirsts[i] === this.symbolFirsts[i - 1] ||
				this.symbolRests.includes(this.symbolFirsts[i])
			) {
				const index = this.simpleSymbols.indexOf(this.symbolFirsts[i])
				if (index !== -1) {
					this.simpleSymbols.splice(index, 1)
				}
			}
		}
		this.multipleSymbols = this.symbols.filter((symbol, _) => {
			return !this.simpleSymbols.includes(symbol)
		})

		console.log(
			'Verifying symbols...\n',
			this.simpleSymbols.length + this.multipleSymbols.length ===
				this.symbols.length
				? 'OK'
				: 'ERROR'
		)
	}

	getCharType(char: string): CharType {
		if (char.match(/[a-z]/i)) {
			return CharType.letter
		} else if (char.match(/[0-9]/)) {
			return CharType.digit
		} else if (this.symbolFirsts.includes(char)) {
			return CharType.symbolFirst
		} else if (this.symbolRests.includes(char)) {
			return CharType.symbolRest
		} else {
			return CharType.other
		}
	}

	analyzeKey(stack: string): Token | undefined {
		if (this.keywords.includes(stack)) {
			return {
				type: stack,
				value: stack,
			}
		}
	}

	analyzeSymbol(stack: string): Token | undefined {
		if (this.symbols.includes(stack)) {
			return {
				type: stack,
				value: stack,
			}
		}
	}

	scanner(code: string) {
		enum ScannerStatus {
			start,
			beginWithChar,
			beginWithDigit,
			symbol,
		}
		let status: ScannerStatus = ScannerStatus.start
		let stack = ''

		const analyzer = (char: string) => {
			switch (status) {
				case ScannerStatus.beginWithChar:
					if (this.getCharType(char) === CharType.other) {
						const token = this.analyzeKey(stack)
						if (!!token) {
							this.tokens.push(token)
						} else {
							this.tokens.push({
								type: 'string',
								value: stack,
							})
						}
						stack = ''
						status = ScannerStatus.start
					}
					break

				case ScannerStatus.beginWithDigit:
					if (this.getCharType(char) !== CharType.digit) {
						this.tokens.push({
							type: 'number',
							value: Number(stack),
						})
						stack = ''
						status = ScannerStatus.start
					}
					break

				case ScannerStatus.symbol:
					if (this.getCharType(char) !== CharType.symbolRest) {
						const token = this.analyzeSymbol(stack + char)
						if (!!token) {
							this.tokens.push(token)
						} else {
							this.tokens.push({
								type: stack,
								value: stack,
							})
						}
						stack = ''
						status = ScannerStatus.start
					}
					break

				default:
					break
			}
			switch (this.getCharType(char)) {
				case CharType.letter:
					status = ScannerStatus.beginWithChar
					stack += char
					break

				case CharType.digit:
					if (status === ScannerStatus.start) {
						status = ScannerStatus.beginWithDigit
					}
					stack += char
					break

				case CharType.symbolFirst:
				case CharType.symbolRest:
					if (status === ScannerStatus.start) {
						if (CharType.symbolFirst) {
							if (this.simpleSymbols.includes(char)) {
								this.tokens.push({
									type: char,
									value: char,
								})
								stack = ''
								status = ScannerStatus.start
								return
							}
						}
						status = ScannerStatus.symbol
					} else if (
						status === ScannerStatus.symbol &&
						CharType.symbolRest
					) {
					} else {
						status = ScannerStatus.beginWithChar
					}
					stack += char
					break

				default:
					break
			}
		}

		Array.from(code).forEach((char, index) => {
			analyzer(char)
			if (index === code.length - 1) {
				analyzer(' ')
			}
		})
	}
}
