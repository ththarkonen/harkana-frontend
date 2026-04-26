const normalizeVersionPart = ( value, fallback = "" ) => {

    const normalized = String( value ?? "" ).trim()
    return normalized.length > 0 ? normalized : fallback
}

const release = normalizeVersionPart(
    import.meta.env.VITE_APP_VERSION,
    "1.0.0"
)

const buildSha = normalizeVersionPart( import.meta.env.VITE_APP_BUILD_SHA )
const buildDate = normalizeVersionPart( import.meta.env.VITE_APP_BUILD_DATE )
const display = normalizeVersionPart(
    import.meta.env.VITE_VERSION,
    release
)

export default {
    release,
    buildSha,
    buildDate,
    display
}
