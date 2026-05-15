export function normalizeSelectionBoundingBox( boundingBox ){

	if( boundingBox === null || typeof boundingBox !== "object" ){
		return null
	}

	const minX = Number.parseInt( boundingBox.minX, 10 )
	const maxX = Number.parseInt( boundingBox.maxX, 10 )
	const minY = Number.parseInt( boundingBox.minY, 10 )
	const maxY = Number.parseInt( boundingBox.maxY, 10 )

	if(
		Number.isInteger( minX ) === false ||
		Number.isInteger( maxX ) === false ||
		Number.isInteger( minY ) === false ||
		Number.isInteger( maxY ) === false
	){
		return null
	}

	if( maxX < minX || maxY < minY ){
		return null
	}

	return {
		minX,
		maxX,
		minY,
		maxY,
		width: maxX - minX + 1,
		height: maxY - minY + 1
	}
}

export function selectionBoundingBoxPixelCount( boundingBox ){

	const normalizedBoundingBox = normalizeSelectionBoundingBox( boundingBox )
	if( normalizedBoundingBox === null ){
		return 0
	}

	return normalizedBoundingBox.width * normalizedBoundingBox.height
}
