
import { Amplify } from 'aws-amplify';
import awsconfig from '@/aws-exports.js';

Amplify.configure( awsconfig );
const Auth = Amplify.Auth;

var owner = project => {

	const userId = Auth.Credentials._identityId;

    if( userId == project.owner.id ) return "You";
    return project.owner.familyName + " " + project.owner.firstName
}

var lastModified = project => {

    const msLastModified = project.lastModified;
    const currentTime = Date.now();

    const elapsedMilliseconds = currentTime - msLastModified;
    const elapsedSeconds = elapsedMilliseconds / 1000;
    const elapsedMinutes = Math.floor( elapsedSeconds / 60 );
    const elapsedHours = Math.floor( elapsedMinutes / 60 );
    const elapsedDays = Math.floor( elapsedHours / 24 );
    const elapsedWeeks = Math.floor( elapsedDays / 7 );
    const elapsedMonths = Math.floor( elapsedWeeks / 4 );
    const elapsedYears = Math.floor( elapsedMonths / 12 );

    if( elapsedYears == 1 ) return elapsedYears + " year ago"
    if( elapsedYears >= 2 ) return elapsedYears + " years ago"

    if( elapsedMonths == 1 ) return elapsedMonths + " month ago"
    if( elapsedMonths >= 2 ) return elapsedMonths + " months ago"

    if( elapsedWeeks == 1 ) return elapsedWeeks + " week ago"
    if( elapsedWeeks >= 2 ) return elapsedWeeks + " weeks ago"

    if( elapsedWeeks == 1 ) return elapsedWeeks + " week ago"
    if( elapsedWeeks >= 2 ) return elapsedWeeks + " weeks ago"

    if( elapsedDays == 1 ) return elapsedDays + " day ago"
    if( elapsedDays >= 2 ) return elapsedDays + " days ago"

    if( elapsedHours == 1 ) return elapsedHours + " hour ago"
    if( elapsedHours >= 2 ) return elapsedHours + " hours ago"

    if( elapsedMinutes == 1 ) return elapsedMinutes + " minute ago"
    if( elapsedMinutes >= 2 ) return elapsedMinutes + " minutes ago"

    return "A few seconds ago"
}

export default {
    owner,
    lastModified
}



