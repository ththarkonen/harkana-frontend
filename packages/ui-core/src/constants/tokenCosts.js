export const HYPERSPECTRUM_UPLOAD_ANALYSIS_TOKEN_COST = 40
export const HYPERSPECTRUM_RAMAN_ESTIMATION_TOKEN_COST = 40

export function formatTokenCost( tokenCost ){
	const numericCost = Number( tokenCost )
	if( Number.isFinite( numericCost ) === false ){
		return "0 tokens"
	}

	const formattedCost = numericCost.toLocaleString()
	return formattedCost + ( numericCost === 1 ? " token" : " tokens" )
}
