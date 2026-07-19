const CUSTOM_INDEX_PROFILE_KIND = "hyperspectral-custom-index"
const CUSTOM_INDEX_FORMULA_VERSION = "custom-index-formula-v1"

const DEFAULT_DATA_SYMBOL = "D"
const DEFAULT_ESTIMATE_SYMBOL = "E"

const normalizeDataType = ( value = "" ) => {
	const normalized = String( value ?? "" ).trim().toLowerCase()
	if( normalized === "hyperraman" || normalized === "raman" ){
		return "hyperraman"
	}
	return "hypercars"
}

const normalizePositiveLayerNumber = ( value ) => {
	const layerNumber = Number.parseInt( String( value ?? "" ), 10 )
	return Number.isInteger( layerNumber ) && layerNumber > 0 ? layerNumber : null
}

const normalizeNumericAxisValues = ( axisValues = [] ) => {
	return ( Array.isArray( axisValues ) ? axisValues : [] )
		.map(( value, index ) => ({
			index,
			value: Number( value )
		}))
		.filter(( item ) => Number.isFinite( item.value ))
}

const nearestAxisIndexForValue = ( targetValue, axisValues = [] ) => {
	const numericTarget = Number( targetValue )
	if( Number.isFinite( numericTarget ) === false ){
		return null
	}

	const numericAxisValues = normalizeNumericAxisValues( axisValues )
	if( numericAxisValues.length === 0 ){
		return null
	}

	let best = numericAxisValues[0]
	let bestDistance = Math.abs( best.value - numericTarget )
	for( const candidate of numericAxisValues.slice( 1 ) ){
		const distance = Math.abs( candidate.value - numericTarget )
		if( distance < bestDistance ){
			best = candidate
			bestDistance = distance
		}
	}

	return best.index
}

const normalizeCustomIndexExpressionReferences = ( expression = "", axisValues = [] ) => {
	const source = String( expression ?? "" ).trim()
	if( source.length === 0 ){
		return source
	}

	return source.replace(/\b([DE])\s*\(\s*([+-]?(?:(?:\d+(?:\.\d*)?)|(?:\.\d+))(?:[eE][+-]?\d+)?)\s*\)/gi, ( match, symbol, rawValue ) => {
		const nearestIndex = nearestAxisIndexForValue( rawValue, axisValues )
		if( nearestIndex === null ){
			return match
		}
		return `${String( symbol ).toUpperCase()}_{${nearestIndex + 1}}`
	})
}

const normalizeSymbolSettings = ( value = {} ) => {
	const dataSymbol = String( value?.data ?? value?.measurement ?? DEFAULT_DATA_SYMBOL ).trim()
	const estimateSymbol = String( value?.estimate ?? DEFAULT_ESTIMATE_SYMBOL ).trim()

	return {
		data: dataSymbol.length > 0 ? dataSymbol : DEFAULT_DATA_SYMBOL,
		estimate: estimateSymbol.length > 0 ? estimateSymbol : DEFAULT_ESTIMATE_SYMBOL
	}
}

const customIndexOperandKey = ( operand = {} ) => {
	const symbol = String( operand?.symbol ?? "" ).trim().toUpperCase() === "E" ? "E" : "D"
	const layerNumber = normalizePositiveLayerNumber( operand?.layerNumber )
	return layerNumber === null ? "" : `${symbol}_${layerNumber}`
}

const uniqueCustomIndexOperands = ( operands = [] ) => {
	const seen = new Set()
	const normalizedOperands = []

	for( const operand of Array.isArray( operands ) ? operands : [] ){
		const normalized = normalizeCustomIndexOperand( operand )
		if( normalized === null ){
			continue
		}

		const key = customIndexOperandKey( normalized )
		if( key.length === 0 || seen.has( key )){
			continue
		}

		seen.add( key )
		normalizedOperands.push( normalized )
	}

	return normalizedOperands.sort(( left, right ) => {
		if( left.symbol !== right.symbol ){
			return left.symbol.localeCompare( right.symbol )
		}
		return left.layerNumber - right.layerNumber
	})
}

const normalizeCustomIndexOperand = ( operand = {} ) => {
	const symbol = String( operand?.symbol ?? "" ).trim().toUpperCase() === "E" ? "E" : "D"
	const layerNumber = normalizePositiveLayerNumber( operand?.layerNumber )
	if( layerNumber === null ){
		return null
	}

	const layerIndex = Number.parseInt( String( operand?.layerIndex ?? layerNumber - 1 ), 10 )
	const axisValue = Number( operand?.axisValue )

	return {
		symbol,
		sourceKind: symbol === "E" ? "estimate" : "data",
		layerNumber,
		layerIndex: Number.isInteger( layerIndex ) && layerIndex >= 0 ? layerIndex : layerNumber - 1,
		axisValue: Number.isFinite( axisValue ) ? axisValue : null,
		axisUnit: typeof operand?.axisUnit === "string" && operand.axisUnit.trim().length > 0
			? operand.axisUnit.trim()
			: null
	}
}

const extractCustomIndexOperandRefs = ( expression = "" ) => {
	const source = String( expression ?? "" )
	const operands = []
	const pattern = /\b([DE])\s*_\s*(?:\{\s*(\d+)\s*\}|(\d+)\b)/gi
	let match = pattern.exec( source )

	while( match !== null ){
		const symbol = String( match[1] ?? "D" ).toUpperCase()
		const layerNumber = normalizePositiveLayerNumber( match[2] ?? match[3] )
		if( layerNumber !== null ){
			operands.push({
				symbol,
				sourceKind: symbol === "E" ? "estimate" : "data",
				layerNumber,
				layerIndex: layerNumber - 1,
				axisValue: null,
				axisUnit: null
			})
		}
		match = pattern.exec( source )
	}

	return uniqueCustomIndexOperands( operands )
}

const extractCustomIndexOperandDisplayRefs = ({
	expression = "",
	axisValues = [],
	axisUnit = null
} = {}) => {
	const source = String( expression ?? "" )
	const candidates = []
	const layerPattern = /\b([DE])\s*_\s*(?:\{\s*(\d+)\s*\}|(\d+)\b)/gi
	const axisValuePattern = /\b([DE])\s*\(\s*([+-]?(?:(?:\d+(?:\.\d*)?)|(?:\.\d+))(?:[eE][+-]?\d+)?)\s*\)/gi

	let layerMatch = layerPattern.exec( source )
	while( layerMatch !== null ){
		const symbol = String( layerMatch[1] ?? "D" ).toUpperCase()
		const layerNumber = normalizePositiveLayerNumber( layerMatch[2] ?? layerMatch[3] )
		if( layerNumber !== null ){
			candidates.push({
				matchIndex: layerMatch.index,
				symbol,
				layerNumber,
				layerIndex: layerNumber - 1,
				referenceKind: "layer",
				referenceValue: null
			})
		}
		layerMatch = layerPattern.exec( source )
	}

	let axisValueMatch = axisValuePattern.exec( source )
	while( axisValueMatch !== null ){
		const symbol = String( axisValueMatch[1] ?? "D" ).toUpperCase()
		const referenceValue = String( axisValueMatch[2] ?? "" ).trim()
		const layerIndex = nearestAxisIndexForValue( referenceValue, axisValues )
		if( layerIndex !== null ){
			candidates.push({
				matchIndex: axisValueMatch.index,
				symbol,
				layerNumber: layerIndex + 1,
				layerIndex,
				referenceKind: "axisValue",
				referenceValue
			})
		}
		axisValueMatch = axisValuePattern.exec( source )
	}

	const seen = new Set()
	return candidates
		.sort(( left, right ) => left.matchIndex - right.matchIndex )
		.map(( candidate ) => {
			const operand = buildCustomIndexOperand( candidate, axisValues, axisUnit )
			return operand === null
				? null
				: {
					...operand,
					referenceKind: candidate.referenceKind,
					referenceValue: candidate.referenceValue
				}
		})
		.filter(( operand ) => {
			if( operand === null ){
				return false
			}
			const key = customIndexOperandKey( operand )
			if( key.length === 0 || seen.has( key )){
				return false
			}
			seen.add( key )
			return true
		})
}

const buildCustomIndexOperand = ( operandRef = {}, axisValues = [], axisUnit = null ) => {
	const normalizedRef = normalizeCustomIndexOperand( operandRef )
	if( normalizedRef === null ){
		return null
	}

	const axisValue = Array.isArray( axisValues ) ? Number( axisValues[normalizedRef.layerIndex] ) : Number.NaN

	return {
		...normalizedRef,
		axisValue: Number.isFinite( axisValue ) ? axisValue : null,
		axisUnit: typeof axisUnit === "string" && axisUnit.trim().length > 0 ? axisUnit.trim() : null
	}
}

const buildCustomIndexFormulaModel = ({
	expression = "",
	outputLabel = "",
	outputUnit = "",
	axisValues = [],
	axisUnit = null
} = {}) => {
	const normalizedExpression = normalizeCustomIndexExpressionReferences( expression, axisValues )
	const refs = extractCustomIndexOperandRefs( normalizedExpression )
	const operands = uniqueCustomIndexOperands(
		refs
			.map(( ref ) => buildCustomIndexOperand( ref, axisValues, axisUnit ))
			.filter(( operand ) => operand !== null )
	)

	return {
		version: CUSTOM_INDEX_FORMULA_VERSION,
		expression: normalizedExpression,
		operands,
		outputLabel: String( outputLabel ?? "" ).trim(),
		outputUnit: String( outputUnit ?? "" ).trim() || null
	}
}

const normalizeCustomIndexFormulaModel = ( value = {} ) => {
	return {
		version: CUSTOM_INDEX_FORMULA_VERSION,
		expression: String( value?.expression ?? "" ).trim(),
		operands: uniqueCustomIndexOperands( value?.operands ),
		outputLabel: String( value?.outputLabel ?? "" ).trim(),
		outputUnit: String( value?.outputUnit ?? "" ).trim() || null
	}
}

const serializeCustomIndexFormulaModel = ( value = {} ) => {
	return JSON.stringify( normalizeCustomIndexFormulaModel( value ))
}

const serializeCustomIndexComputationModel = ( value = {} ) => {
	const normalized = normalizeCustomIndexFormulaModel( value )
	return JSON.stringify({
		version: normalized.version,
		expression: normalized.expression,
		operands: normalized.operands
	})
}

const formatCustomIndexDataType = ( value ) => {
	const normalized = normalizeDataType( value )
	return normalized === "hyperraman" ? "HyperRaman" : "HyperCARS"
}

const formatCustomIndexProfileLabel = ( profile = {} ) => {
	const friendlyName = String( profile?.friendlyName ?? "" ).trim()
	const profileID = String( profile?.profileID ?? "" ).trim()
	return friendlyName || profileID || "Custom index"
}

const formatCustomIndexOperandToken = ( operand = {}, symbolSettings = {} ) => {
	const normalized = normalizeCustomIndexOperand( operand )
	if( normalized === null ){
		return ""
	}

	const symbols = normalizeSymbolSettings( symbolSettings )
	const displaySymbol = normalized.symbol === "E" ? symbols.estimate : symbols.data
	return `${displaySymbol}_{${normalized.layerNumber}}`
}

const formatCustomIndexOperandReferenceToken = ( operand = {}, symbolSettings = {} ) => {
	const normalized = normalizeCustomIndexOperand( operand )
	if( normalized === null ){
		return ""
	}

	const symbols = normalizeSymbolSettings( symbolSettings )
	const displaySymbol = normalized.symbol === "E" ? symbols.estimate : symbols.data
	const referenceValue = String( operand?.referenceValue ?? "" ).trim()
	if( operand?.referenceKind === "axisValue" && referenceValue.length > 0 ){
		return `${displaySymbol}(${referenceValue})`
	}

	return `${displaySymbol}_{${normalized.layerNumber}}`
}

const formatCustomIndexOperandDescription = ( operand = {}, symbolSettings = {}, estimatesAvailable = true ) => {
	const normalized = normalizeCustomIndexOperand( operand )
	if( normalized === null ){
		return ""
	}

	const token = formatCustomIndexOperandToken( normalized, symbolSettings )
	const source = normalized.symbol === "E" ? "Estimate" : "Measurement"
	const layerLabel = `Layer ${normalized.layerNumber}`
	const axisText = normalized.axisValue === null
		? "axis value unavailable"
		: `${normalized.axisValue}${normalized.axisUnit ? ` ${normalized.axisUnit}` : ""}`
	const availability = normalized.symbol === "E" && estimatesAvailable === false
		? "estimate unavailable"
		: "available"

	return `${token} | ${layerLabel} | ${source} | ${axisText} | ${availability}`
}

const FORMULA_NODE_PRECEDENCE = {
	sum: 1,
	product: 2,
	power: 3,
	unary: 4,
	atom: 5
}

const LATEX_FUNCTION_NAMES = new Set([ "abs", "sqrt", "log", "log10", "exp", "min", "max", "pow" ])

const escapeLatexIdentifier = ( value = "" ) => {
	return String( value ?? "" ).replace(/[^A-Za-z0-9]/g, "" ) || "value"
}

const tokenizeFormulaExpression = ( expression = "" ) => {
	const source = String( expression ?? "" )
	const tokens = []
	let index = 0
	const numberPattern = /^(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?/
	const identifierPattern = /^[A-Za-z][A-Za-z0-9]*/

	while( index < source.length ){
		const remaining = source.slice( index )
		const char = source[index]

		if( /\s/.test( char )){
			index += 1
			continue
		}

		const numberMatch = remaining.match( numberPattern )
		if( numberMatch !== null ){
			tokens.push({ type: "number", value: numberMatch[0] })
			index += numberMatch[0].length
			continue
		}

		const identifierMatch = remaining.match( identifierPattern )
		if( identifierMatch !== null ){
			tokens.push({ type: "identifier", value: identifierMatch[0] })
			index += identifierMatch[0].length
			continue
		}

		if( "+-*/^".includes( char )){
			tokens.push({ type: "operator", value: char })
			index += 1
			continue
		}

		if( char === "(" || char === ")" || char === "," || char === "_" || char === "{" || char === "}" ){
			tokens.push({ type: char, value: char })
			index += 1
			continue
		}

		tokens.push({ type: "raw", value: char })
		index += 1
	}

	tokens.push({ type: "eof", value: "" })
	return tokens
}

const createFormulaLatexParser = ( tokens ) => {
	let position = 0

	const current = () => tokens[position] ?? { type: "eof", value: "" }
	const consume = () => {
		const token = current()
		position += 1
		return token
	}
	const consumeIf = ( type, value = null ) => {
		const token = current()
		if( token.type !== type ){
			return null
		}
		if( value !== null && token.value !== value ){
			return null
		}
		return consume()
	}

	const parseExpression = () => parseAdditive()

	const parseAdditive = () => {
		let node = parseMultiplicative()
		while( current().type === "operator" && ( current().value === "+" || current().value === "-" )){
			const operator = consume().value
			node = {
				type: "binary",
				operator,
				left: node,
				right: parseMultiplicative()
			}
		}
		return node
	}

	const parseMultiplicative = () => {
		let node = parsePower()
		while( current().type === "operator" && ( current().value === "*" || current().value === "/" )){
			const operator = consume().value
			node = {
				type: "binary",
				operator,
				left: node,
				right: parsePower()
			}
		}
		return node
	}

	const parsePower = () => {
		let node = parseUnary()
		if( current().type === "operator" && current().value === "^" ){
			consume()
			node = {
				type: "binary",
				operator: "^",
				left: node,
				right: parsePower()
			}
		}
		return node
	}

	const parseUnary = () => {
		if( current().type === "operator" && ( current().value === "-" || current().value === "+" )){
			return {
				type: "unary",
				operator: consume().value,
				argument: parseUnary()
			}
		}
		return parsePrimary()
	}

	const parseLayerReference = ( symbol ) => {
		consumeIf( "_")
		let layerNumber = null
		if( consumeIf( "{" ) !== null ){
			const layerToken = consumeIf( "number" )
			layerNumber = normalizePositiveLayerNumber( layerToken?.value )
			consumeIf( "}" )
		}else{
			const layerToken = consumeIf( "number" )
			layerNumber = normalizePositiveLayerNumber( layerToken?.value )
		}

		if( layerNumber === null ){
			return { type: "identifier", name: symbol }
		}

		return {
			type: "layerReference",
			symbol: String( symbol ).toUpperCase(),
			layerNumber
		}
	}

	const parseArguments = () => {
		const args = []
		consumeIf( "(" )
		if( current().type === ")" ){
			consume()
			return args
		}

		while( current().type !== "eof" ){
			args.push( parseExpression() )
			if( consumeIf( "," ) !== null ){
				continue
			}
			consumeIf( ")" )
			break
		}

		return args
	}

	const parseIdentifier = () => {
		const name = consume().value
		const upperName = String( name ).toUpperCase()
		if(( upperName === "D" || upperName === "E" ) && current().type === "_" ){
			return parseLayerReference( upperName )
		}
		if( current().type === "(" ){
			const args = parseArguments()
			if( upperName === "D" || upperName === "E" ){
				return {
					type: "physicalReference",
					symbol: upperName,
					argument: args[0] ?? { type: "raw", value: "" }
				}
			}
			return {
				type: "call",
				name,
				args
			}
		}

		return {
			type: "identifier",
			name
		}
	}

	const parsePrimary = () => {
		const token = current()
		if( token.type === "number" ){
			return { type: "number", value: consume().value }
		}
		if( token.type === "identifier" ){
			return parseIdentifier()
		}
		if( consumeIf( "(" ) !== null ){
			const expressionNode = parseExpression()
			consumeIf( ")" )
			return {
				type: "group",
				expression: expressionNode
			}
		}
		if( token.type === "raw" ){
			return { type: "raw", value: consume().value }
		}
		return { type: "raw", value: consume().value }
	}

	return {
		parse: () => parseExpression()
	}
}

const formulaNodePrecedence = ( node = {} ) => {
	if( node?.type === "group" ){
		return formulaNodePrecedence( node.expression )
	}
	if( node?.type === "unary" ){
		return FORMULA_NODE_PRECEDENCE.unary
	}
	if( node?.type === "binary" ){
		if( node.operator === "+" || node.operator === "-" ){
			return FORMULA_NODE_PRECEDENCE.sum
		}
		if( node.operator === "*" || node.operator === "/" ){
			return FORMULA_NODE_PRECEDENCE.product
		}
		if( node.operator === "^" ){
			return FORMULA_NODE_PRECEDENCE.power
		}
	}
	return FORMULA_NODE_PRECEDENCE.atom
}

const wrapLatexInParens = ( value = "" ) => `\\left(${value}\\right)`

const renderFormulaLatexNode = ( node = {}, symbolSettings = {}, parentPrecedence = 0 ) => {
	const symbols = normalizeSymbolSettings( symbolSettings )

	if( node?.type === "number" ){
		return String( node.value ?? "" )
	}
	if( node?.type === "raw" ){
		return String( node.value ?? "" ).replace(/\\/g, "\\backslash " )
	}
	if( node?.type === "identifier" ){
		return `\\operatorname{${escapeLatexIdentifier( node.name )}}`
	}
	if( node?.type === "layerReference" ){
		const displaySymbol = node.symbol === "E" ? symbols.estimate : symbols.data
		return `${displaySymbol}_{${node.layerNumber}}`
	}
	if( node?.type === "physicalReference" ){
		const displaySymbol = node.symbol === "E" ? symbols.estimate : symbols.data
		return `${displaySymbol}\\left(${renderFormulaLatexNode( node.argument, symbolSettings )}\\right)`
	}
	if( node?.type === "group" ){
		const inner = renderFormulaLatexNode( node.expression, symbolSettings )
		return parentPrecedence > formulaNodePrecedence( node.expression )
			? wrapLatexInParens( inner )
			: inner
	}
	if( node?.type === "call" ){
		return renderFormulaFunctionLatex( node, symbolSettings )
	}
	if( node?.type === "unary" ){
		const latex = node.operator === "+"
			? renderFormulaLatexNode( node.argument, symbolSettings, FORMULA_NODE_PRECEDENCE.unary )
			: `-${renderFormulaLatexNode( node.argument, symbolSettings, FORMULA_NODE_PRECEDENCE.unary )}`
		return parentPrecedence > FORMULA_NODE_PRECEDENCE.unary ? wrapLatexInParens( latex ) : latex
	}
	if( node?.type === "binary" ){
		return renderFormulaBinaryLatex( node, symbolSettings, parentPrecedence )
	}

	return ""
}

const renderFormulaPowerBaseLatex = ( node = {}, symbolSettings = {} ) => {
	const latex = renderFormulaLatexNode( node, symbolSettings )
	return formulaNodePrecedence( node ) < FORMULA_NODE_PRECEDENCE.atom
		? wrapLatexInParens( latex )
		: latex
}

const renderFormulaFunctionLatex = ( node = {}, symbolSettings = {} ) => {
	const name = String( node.name ?? "" ).trim()
	const normalizedName = name.toLowerCase()
	const args = Array.isArray( node.args ) ? node.args : []
	const renderedArgs = args.map(( arg ) => renderFormulaLatexNode( arg, symbolSettings ))
	const joinedArgs = renderedArgs.join( ", " )

	if( LATEX_FUNCTION_NAMES.has( normalizedName ) === false ){
		return `\\operatorname{${escapeLatexIdentifier( name )}}\\left(${joinedArgs}\\right)`
	}
	if( normalizedName === "abs" ){
		return `\\left|${renderedArgs[0] ?? ""}\\right|`
	}
	if( normalizedName === "sqrt" ){
		return `\\sqrt{${renderedArgs[0] ?? ""}}`
	}
	if( normalizedName === "log10" ){
		return `\\log_{10}\\left(${renderedArgs[0] ?? ""}\\right)`
	}
	if( normalizedName === "log" || normalizedName === "exp" ){
		return `\\${normalizedName}\\left(${renderedArgs[0] ?? ""}\\right)`
	}
	if( normalizedName === "min" || normalizedName === "max" ){
		return `\\${normalizedName}\\left(${joinedArgs}\\right)`
	}
	if( normalizedName === "pow" && args.length >= 2 ){
		return `${renderFormulaPowerBaseLatex( args[0], symbolSettings )}^{${renderFormulaLatexNode( args[1], symbolSettings )}}`
	}
	return `\\operatorname{${escapeLatexIdentifier( name )}}\\left(${joinedArgs}\\right)`
}

const renderFormulaBinaryLatex = ( node = {}, symbolSettings = {}, parentPrecedence = 0 ) => {
	const precedence = formulaNodePrecedence( node )
	let latex = ""

	if( node.operator === "/" ){
		latex = `\\frac{${renderFormulaLatexNode( node.left, symbolSettings )}}{${renderFormulaLatexNode( node.right, symbolSettings )}}`
	}else if( node.operator === "*" ){
		latex = `${renderFormulaLatexNode( node.left, symbolSettings, precedence )} \\times ${renderFormulaLatexNode( node.right, symbolSettings, precedence )}`
	}else if( node.operator === "^" ){
		latex = `${renderFormulaPowerBaseLatex( node.left, symbolSettings )}^{${renderFormulaLatexNode( node.right, symbolSettings )}}`
	}else if( node.operator === "-" ){
		latex = `${renderFormulaLatexNode( node.left, symbolSettings, precedence )} - ${renderFormulaLatexNode( node.right, symbolSettings, precedence + 1 )}`
	}else{
		latex = `${renderFormulaLatexNode( node.left, symbolSettings, precedence )} + ${renderFormulaLatexNode( node.right, symbolSettings, precedence )}`
	}

	return parentPrecedence > precedence ? wrapLatexInParens( latex ) : latex
}

const parseFormulaExpressionForLatex = ( expression = "" ) => {
	return createFormulaLatexParser( tokenizeFormulaExpression( expression )).parse()
}

const expressionToLatex = ( expression = "", symbolSettings = {} ) => {
	try{
		return renderFormulaLatexNode(
			parseFormulaExpressionForLatex( expression ),
			symbolSettings
		)
	} catch{
		return String( expression ?? "" ).replace(/\\/g, "\\backslash " )
	}
}

const isMissingCustomIndexApiError = ( error ) => {
	const status = Number( error?.status )
	return status === 404 || status === 501
}

const normalizeCustomIndexAssignmentEntries = ( value = [] ) => {
	const entries = Array.isArray( value?.entries ) ? value.entries : ( Array.isArray( value ) ? value : [] )
	return entries
		.map(( entry, index ) => ({
			...entry,
			profileID: String( entry?.profileID ?? entry?.profile?.profileID ?? "" ).trim(),
			order: Number.isInteger( Number( entry?.order )) ? Number( entry.order ) : index
		}))
		.filter(( entry ) => entry.profileID.length > 0 )
		.sort(( left, right ) => left.order - right.order )
		.map(( entry, index ) => ({ ...entry, order: index }))
}

const normalizeCustomIndexProfileListResponse = ( response ) => {
	if( Array.isArray( response )){
		return response
	}
	if( Array.isArray( response?.items )){
		return response.items
	}
	if( Array.isArray( response?.profiles )){
		return response.profiles
	}
	return []
}

const normalizeCustomIndexMatrixResponse = ( response ) => {
	if( Array.isArray( response ) ){
		return response
	}
	if( Array.isArray( response?.matrix ) ){
		return response.matrix
	}
	if( Array.isArray( response?.data ) ){
		return response.data
	}
	return null
}

export {
	CUSTOM_INDEX_FORMULA_VERSION,
	CUSTOM_INDEX_PROFILE_KIND,
	DEFAULT_DATA_SYMBOL,
	DEFAULT_ESTIMATE_SYMBOL,
	buildCustomIndexFormulaModel,
	customIndexOperandKey,
	expressionToLatex,
	extractCustomIndexOperandDisplayRefs,
	extractCustomIndexOperandRefs,
	formatCustomIndexDataType,
	formatCustomIndexOperandDescription,
	formatCustomIndexOperandReferenceToken,
	formatCustomIndexOperandToken,
	formatCustomIndexProfileLabel,
	isMissingCustomIndexApiError,
	normalizeCustomIndexAssignmentEntries,
	normalizeCustomIndexFormulaModel,
	normalizeCustomIndexMatrixResponse,
	normalizeCustomIndexOperand,
	normalizeCustomIndexExpressionReferences,
	normalizeCustomIndexProfileListResponse,
	normalizeDataType,
	normalizeSymbolSettings,
	serializeCustomIndexComputationModel,
	serializeCustomIndexFormulaModel
}
