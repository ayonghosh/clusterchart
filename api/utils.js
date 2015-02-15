
/*
 * Author: Ayon Ghosh
 * Date: 15 February 2015
 */


module.exports = (function () {
	return {
		// read a file line by line (async). A callback is invoked
		// after every line read, with the line number and the raw string
		"readFileLines": function (input, callback) {
	        var remaining = '';
	        var lineNum = 0;
	        
	        var NEWLINE_DELIM = '\r';
	
	        input.on('data', function (data) {
	            remaining += data;
	            var index = remaining.indexOf(NEWLINE_DELIM);
	            while (index > -1) {
	                var line = remaining.substring(0, index);
	                remaining = remaining.substring(index + 1);
	                callback(lineNum++, line);
	                index = remaining.indexOf(NEWLINE_DELIM);
	            }
	        });
	
	        input.on('end', function () {
	            if (remaining.length > 0) {
	                callback(lineNum++, remaining, true);
	            }else {
	                callback(lineNum++, null, true);
	            }
	        });
	    }
	}
})();
