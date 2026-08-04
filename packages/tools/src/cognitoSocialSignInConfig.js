const COGNITO_SOCIAL_SIGN_IN_CONFIG = Object.freeze({
	domain: "harkana.auth.eu-north-1.amazoncognito.com",
	scope: Object.freeze([ "openid", "email", "profile" ]),
	redirectSignIn: Object.freeze([
		"http://localhost:5173/",
		"https://cars.harkana.com/",
		"https://hcars.harkana.com/",
		"https://raman.harkana.com/"
	]),
	redirectSignOut: Object.freeze([
		"http://localhost:5173/",
		"https://cars.harkana.com/",
		"https://hcars.harkana.com/",
		"https://raman.harkana.com/"
	]),
	responseType: "code",
	socialProviders: Object.freeze([ "google", "microsoft-personal" ]),
	providerNames: Object.freeze({
		google: "Google",
		microsoftPersonal: "Microsoft",
		microsoftWork: "MicrosoftWork"
	})
})

export { COGNITO_SOCIAL_SIGN_IN_CONFIG }
