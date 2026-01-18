var sort = function( projectList, type, direction){

    if( type == "name-header" ){
        return sortObjectOfObjects( projectList, "name", direction);
    } else if( type == "modified-header" ){
        return sortObjectOfObjects( projectList, "lastModified", direction);
    } else if( type == "owner-header" ){
        return sortByOwner( projectList, "lastModified", direction);
    };

    return projectList;
}

var sortAlphabetical = function( array ){

    array.sort( (a, b) => {
        return a.toLowerCase().localeCompare(b.toLowerCase());
    });

    return array;
}

var removeItem = function( array, value){

    array = array.filter( item => {
        return item !== value;
    });

    return array;
}

var sortObjectOfObjects = function( projectList, attr, direction) {
    
    var tempArray = [];

    console.log(attr)

    for( var prop in projectList ){
        if( projectList.hasOwnProperty(prop) ){
            var obj = {};
            obj[prop] = projectList[prop];

            if( attr == "lastModified" ){
                obj.tempSortName = -projectList[prop][attr];
                tempArray.push(obj);
            } else {
                obj.tempSortName = projectList[prop][attr].toLowerCase();
                tempArray.push(obj);
            };
        }
    }

    tempArray.sort(function(a, b) {
        var at = a.tempSortName,
            bt = b.tempSortName;
            
            return at > bt ? 1 : ( at < bt ? -1 : 0 )
    });

    var result = [];
    for (var i=0, l=tempArray.length; i<l; i++) {
        var obj = tempArray[i];
        delete obj.tempSortName;
        for (var prop in obj) {
            if (obj.hasOwnProperty(prop)) {
                var id = prop;
            }
        }
        var item = obj[id];
        result.push(item);
    }

    if( direction ){
        return result;
    } else {
        return result.reverse();
    };
}

var sortByOwner = function( projectList, attr, direction) {
    
    var tempArray = [];
    var tempName = [];

    for( var prop in projectList ){
        if( projectList.hasOwnProperty(prop) ){
            var obj = {};
            obj[prop] = projectList[prop];

                tempName = projectList[prop].owner.familyName + " ";
                tempName = tempName + " " + projectList[prop].owner.firstNName;

                obj.tempSortName = tempName.toLowerCase();
                tempArray.push(obj);
        }
    }

    tempArray.sort(function(a, b) {
        var at = a.tempSortName,
            bt = b.tempSortName;
            
            return at > bt ? 1 : ( at < bt ? -1 : 0 )
    });

    var result = [];
    for (var i=0, l=tempArray.length; i<l; i++) {
        var obj = tempArray[i];
        delete obj.tempSortName;
        for (var prop in obj) {
            if (obj.hasOwnProperty(prop)) {
                var id = prop;
            }
        }
        var item = obj[id];
        result.push(item);
    }

    if( direction ){
        return result;
    } else {
        return result.reverse();
    };
}

export default {
    sort,
    sortAlphabetical,
    removeItem
}