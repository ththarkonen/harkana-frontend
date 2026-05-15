function readFiniteNumber( value, fallback = 0 ){
	const numericValue = Number( value )
	return Number.isFinite( numericValue ) ? numericValue : fallback
}

function buildDefaultIncludedOrders( polynomialOrder = 0 ){
	const resolvedOrder = Math.max( Math.trunc( readFiniteNumber( polynomialOrder, 0 ) ), 0 )
	return Array.from({ length: resolvedOrder + 1 }, ( _, index ) => index )
}

function normalizeIncludedOrders( includedOrders = [], polynomialOrder = 0 ){
	const resolvedOrder = Math.max( Math.trunc( readFiniteNumber( polynomialOrder, 0 ) ), 0 )
	const fallbackOrders = buildDefaultIncludedOrders( resolvedOrder )
	if( Array.isArray( includedOrders ) === false ){
		return fallbackOrders
	}

	const normalizedOrders = Array.from( new Set(
		includedOrders
			.map(( order ) => Math.trunc( Number( order ) ) )
			.filter(( order ) => Number.isInteger( order ) && order >= 0 && order <= resolvedOrder )
	)).sort(( left, right ) => left - right )

	if( normalizedOrders.length === 0 ){
		return fallbackOrders
	}

	if( normalizedOrders.includes( resolvedOrder ) === false ){
		normalizedOrders.push( resolvedOrder )
		normalizedOrders.sort(( left, right ) => left - right )
	}

	return normalizedOrders
}

function normalizeCalibrationPoint( point = {}, index = 0 ){
	const sourceX = readFiniteNumber( point?.sourceX, 0 )
	const targetX = Number.isFinite( Number( point?.targetX ) ) ? Number( point.targetX ) : null
	const fallbackID = `calibration-point-${index + 1}`
	const id = String( point?.id ?? fallbackID ).trim() || fallbackID

	return {
		id,
		sourceX,
		targetX
	}
}

function normalizeCalibrationModel( calibration = {} ){
	const legacyOffset = readFiniteNumber( calibration?.x, 0 )
	const rawPoints = Array.isArray( calibration?.points ) ? calibration.points : []
	const points = rawPoints.map(( point, index ) => normalizeCalibrationPoint( point, index ))
	const validPointCount = points.filter(( point ) => Number.isFinite( point.targetX ) ).length
	const maxPolynomialOrder = Math.max( validPointCount - 1, 0 )
	const requestedOrder = Math.trunc( readFiniteNumber( calibration?.polynomialOrder, 0 ) )
	const polynomialOrder = Math.min( Math.max( requestedOrder, 0 ), maxPolynomialOrder )
	const includedOrders = normalizeIncludedOrders( calibration?.includedOrders, polynomialOrder )

	return {
		x: legacyOffset,
		polynomialOrder,
		includedOrders,
		points
	}
}

function cloneCalibrationModel( calibration = {} ){
	const normalizedCalibration = normalizeCalibrationModel( calibration )
	return {
		x: normalizedCalibration.x,
		polynomialOrder: normalizedCalibration.polynomialOrder,
		includedOrders: [ ...normalizedCalibration.includedOrders ],
		points: normalizedCalibration.points.map(( point ) => ({ ...point }))
	}
}

function validCalibrationPoints( calibration = {} ){
	const normalizedCalibration = normalizeCalibrationModel( calibration )
	const uniquePointsBySource = new Map()

	for( const point of normalizedCalibration.points ){
		if( Number.isFinite( point.targetX ) === false ){
			continue
		}

		uniquePointsBySource.set( point.sourceX, point )
	}

	return Array.from( uniquePointsBySource.values() )
}

function calibrationMaxPolynomialOrder( calibration = {} ){
	return Math.max( validCalibrationPoints( calibration ).length - 1, 0 )
}

function calibrationRequiredPointCount( calibration = {} ){
	const normalizedCalibration = normalizeCalibrationModel( calibration )
	return normalizedCalibration.includedOrders.length
}

function buildZeroPolynomial( polynomialOrder = 0, constant = 0 ){
	const resolvedOrder = Math.max( Math.trunc( readFiniteNumber( polynomialOrder, 0 ) ), 0 )
	const coefficients = Array.from({ length: resolvedOrder + 1 }, () => 0 )
	coefficients[0] = readFiniteNumber( constant, 0 )
	return coefficients
}

function buildDensePolynomial( polynomialOrder = 0, includedOrders = [], sparseCoefficients = [] ){
	const resolvedOrder = Math.max( Math.trunc( readFiniteNumber( polynomialOrder, 0 ) ), 0 )
	const denseCoefficients = Array.from({ length: resolvedOrder + 1 }, () => 0 )

	for( let index = 0; index < includedOrders.length; index++ ){
		const order = Math.trunc( Number( includedOrders[index] ) )
		if( Number.isInteger( order ) === false || order < 0 || order > resolvedOrder ){
			continue
		}

		denseCoefficients[order] = readFiniteNumber( sparseCoefficients[index], 0 )
	}

	return denseCoefficients
}

function meanCalibrationDelta( points = [], fallbackOffset = 0 ){
	if( Array.isArray( points ) === false || points.length === 0 ){
		return readFiniteNumber( fallbackOffset, 0 )
	}

	return points.reduce(( sum, point ) => {
		return sum + ( readFiniteNumber( point.targetX, 0 ) - readFiniteNumber( point.sourceX, 0 ) )
	}, 0 ) / points.length
}

function buildFallbackPolynomial( points = [], polynomialOrder = 0, includedOrders = [], fallbackOffset = 0 ){
	const normalizedOrders = normalizeIncludedOrders( includedOrders, polynomialOrder )
	if( normalizedOrders.includes( 0 ) ){
		return buildDensePolynomial(
			polynomialOrder,
			normalizedOrders,
			normalizedOrders.map(( order ) => order === 0 ? meanCalibrationDelta( points, fallbackOffset ) : 0 )
		)
	}

	const highestOrder = normalizedOrders[ normalizedOrders.length - 1 ] ?? 0
	let numerator = 0
	let denominator = 0

	for( const point of points ){
		const x = readFiniteNumber( point.sourceX, 0 )
		const delta = readFiniteNumber( point.targetX, 0 ) - x
		const basisValue = Math.pow( x, highestOrder )
		numerator += delta * basisValue
		denominator += basisValue * basisValue
	}

	const highestCoefficient = Math.abs( denominator ) > 1e-12 ? numerator / denominator : 0

	return buildDensePolynomial(
		polynomialOrder,
		normalizedOrders,
		normalizedOrders.map(( order ) => order === highestOrder ? highestCoefficient : 0 )
	)
}

function gaussianSolve( matrix, values ){
	const size = Array.isArray( matrix ) ? matrix.length : 0
	if( size === 0 ){
		return []
	}

	const augmented = matrix.map(( row, rowIndex ) => {
		const safeRow = Array.isArray( row ) ? row : []
		return [
			...safeRow.map(( value ) => readFiniteNumber( value, 0 )),
			readFiniteNumber( values?.[rowIndex], 0 )
		]
	})

	for( let pivotIndex = 0; pivotIndex < size; pivotIndex++ ){
		let maxRowIndex = pivotIndex

		for( let candidateIndex = pivotIndex + 1; candidateIndex < size; candidateIndex++ ){
			if( Math.abs( augmented[candidateIndex][pivotIndex] ) > Math.abs( augmented[maxRowIndex][pivotIndex] ) ){
				maxRowIndex = candidateIndex
			}
		}

		if( Math.abs( augmented[maxRowIndex][pivotIndex] ) < 1e-12 ){
			return null
		}

		if( maxRowIndex !== pivotIndex ){
			const temporaryRow = augmented[pivotIndex]
			augmented[pivotIndex] = augmented[maxRowIndex]
			augmented[maxRowIndex] = temporaryRow
		}

		const pivotValue = augmented[pivotIndex][pivotIndex]
		for( let columnIndex = pivotIndex; columnIndex <= size; columnIndex++ ){
			augmented[pivotIndex][columnIndex] /= pivotValue
		}

		for( let rowIndex = 0; rowIndex < size; rowIndex++ ){
			if( rowIndex === pivotIndex ){
				continue
			}

			const factor = augmented[rowIndex][pivotIndex]
			for( let columnIndex = pivotIndex; columnIndex <= size; columnIndex++ ){
				augmented[rowIndex][columnIndex] -= factor * augmented[pivotIndex][columnIndex]
			}
		}
	}

	return augmented.map(( row ) => row[size] )
}

function solveDeltaPolynomial( points = [], requestedOrder = 0, includedOrders = [], fallbackOffset = 0 ){
	const normalizedPoints = Array.isArray( points ) ? points : []
	const pointCount = normalizedPoints.length
	const resolvedOrder = Math.min(
		Math.max( Math.trunc( readFiniteNumber( requestedOrder, 0 ) ), 0 ),
		Math.max( pointCount - 1, 0 )
	)
	const resolvedIncludedOrders = normalizeIncludedOrders( includedOrders, resolvedOrder )
	const coefficientCount = resolvedIncludedOrders.length

	if( pointCount === 0 ){
		return buildZeroPolynomial( resolvedOrder, fallbackOffset )
	}

	if( coefficientCount === 1 && resolvedIncludedOrders[0] === 0 ){
		return buildZeroPolynomial( resolvedOrder, meanCalibrationDelta( normalizedPoints, fallbackOffset ) )
	}

	const matrix = Array.from({ length: coefficientCount }, () => Array.from({ length: coefficientCount }, () => 0 ))
	const values = Array.from({ length: coefficientCount }, () => 0 )

	for( const point of normalizedPoints ){
		const x = readFiniteNumber( point.sourceX, 0 )
		const delta = readFiniteNumber( point.targetX, 0 ) - x
		for( let rowIndex = 0; rowIndex < coefficientCount; rowIndex++ ){
			const rowOrder = resolvedIncludedOrders[rowIndex]
			const rowBasis = Math.pow( x, rowOrder )
			values[rowIndex] += delta * rowBasis

			for( let columnIndex = 0; columnIndex < coefficientCount; columnIndex++ ){
				const columnOrder = resolvedIncludedOrders[columnIndex]
				matrix[rowIndex][columnIndex] += rowBasis * Math.pow( x, columnOrder )
			}
		}
	}

	const solvedCoefficients = gaussianSolve( matrix, values )
	if( Array.isArray( solvedCoefficients ) === false ){
		return buildFallbackPolynomial( normalizedPoints, resolvedOrder, resolvedIncludedOrders, fallbackOffset )
	}

	return buildDensePolynomial( resolvedOrder, resolvedIncludedOrders, solvedCoefficients )
}

function evaluatePolynomial( coefficients = [], xValue = 0 ){
	const x = readFiniteNumber( xValue, 0 )
	let sum = 0

	for( let coefficientIndex = coefficients.length - 1; coefficientIndex >= 0; coefficientIndex-- ){
		sum = sum * x + readFiniteNumber( coefficients[coefficientIndex], 0 )
	}

	return sum
}

function resolveCalibrationPolynomial( calibration = {} ){
	const normalizedCalibration = normalizeCalibrationModel( calibration )
	const points = validCalibrationPoints( normalizedCalibration )
	const coefficients = solveDeltaPolynomial(
		points,
		normalizedCalibration.polynomialOrder,
		normalizedCalibration.includedOrders,
		normalizedCalibration.x
	)

	return {
		coefficients,
		points,
		polynomialOrder: Math.min( normalizedCalibration.polynomialOrder, Math.max( points.length - 1, 0 ) ),
		includedOrders: normalizeIncludedOrders( normalizedCalibration.includedOrders, normalizedCalibration.polynomialOrder ),
		x: coefficients[0] ?? normalizedCalibration.x
	}
}

function calibrationHasValidPoints( calibration = {} ){
	return validCalibrationPoints( calibration ).length >= calibrationRequiredPointCount( calibration )
}

function calibrationDeltaAt( xValue, calibration = {} ){
	const { coefficients } = resolveCalibrationPolynomial( calibration )
	return evaluatePolynomial( coefficients, xValue )
}

function calibrateValue( xValue, calibration = {} ){
	return readFiniteNumber( xValue, 0 ) + calibrationDeltaAt( xValue, calibration )
}

function applyCalibrationToValues( values = [], calibration = {} ){
	const { coefficients } = resolveCalibrationPolynomial( calibration )

	return ( Array.isArray( values ) ? values : [] ).map(( value ) => {
		const numericValue = readFiniteNumber( value, 0 )
		return numericValue + evaluatePolynomial( coefficients, numericValue )
	})
}

export {
	applyCalibrationToValues,
	calibrateValue,
	calibrationHasValidPoints,
	calibrationMaxPolynomialOrder,
	calibrationRequiredPointCount,
	cloneCalibrationModel,
	normalizeCalibrationModel,
	resolveCalibrationPolynomial,
	validCalibrationPoints
}
