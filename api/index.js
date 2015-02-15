
/*
 * Author: Ayon Ghosh
 * Date: 15 February 2015
 */

var utils = require('./utils.js');
var fs = require('fs');

module.exports = (function () {
	var self = this;
	
	var CLUSTER_LOCATION_FILEPATH = './api/cluster-locations.csv';
	var CLUSTER_DISKUTIL_FILEPATH = './api/cluster-disk-util.csv';
	
	var locationIndex = {};	// map of cluster ID against country code
	var countryCodes = [];	// list of all country codes
	
	function init() {
		buildLocationIndex();
	};
	
	// preprocesses data and builds the map of cluster vs country code and
	// list of all country codes
	function buildLocationIndex() {
		var input = fs.createReadStream(CLUSTER_LOCATION_FILEPATH);
		var countryCodeMarkers = {};
		
        utils.readFileLines(input, function (lineNum, rawLine) {
			if (!rawLine || lineNum === 0) {	// ignore first line (headers)
				return;
			}
			
			var data = parseLocationCode(rawLine);
			var clusterCode = data.clusterCode;
			var countryCode = data.countryCode;
			 
			locationIndex[clusterCode] = countryCode;
			
			if (!countryCodeMarkers[countryCode]) {
				countryCodes.push(countryCode);
			}
			countryCodeMarkers[countryCode] = true;
		});
	};
	
	// string to JSON object (tuple of cluster ID and country code)
	function parseLocationCode(rawLine) {
		var fields = rawLine.split(',');
		
		return {
			"countryCode": fields[1],
			"clusterCode": fields[0]
		};
	};
	
	function getCountryCodeFromClusterId(clusterId) {
		return locationIndex[clusterId];
	};
	
	// string to JSON object (tuple of cluster ID, disk usage in MB and timestamp)
	function parseDiskUtilData(rawLine) {
		var fields = rawLine.split(',');
		
		return {
			"clusterId": fields[0], 
			"diskUsage": parseInt(fields[1]), 
			"timestamp": ('' + Date.parse(fields[2]))	// convert to UNIX style timestamp (string)
		}; 
	};
	
	// read from file and get time series data of total disk usage for 
	// a particular country code - or "all"
	function getTotalDiskUtilData(countryCode, callback) {
		var chartData = [];
		var map = {};
		
		var input = fs.createReadStream(CLUSTER_DISKUTIL_FILEPATH);
        utils.readFileLines(input, function (lineNum, rawLine, eof) {
        	if (!rawLine || lineNum === 0) {	// ignore first line
        		return;
        	}
        	var data = parseDiskUtilData(rawLine);
        	
        	if (countryCode && countryCode.toLowerCase() !== "all") {
				var dataCountryCode = getCountryCodeFromClusterId(data.clusterId);
				if (countryCode !== dataCountryCode) {
					if (eof) {
		        		sendChartData(map, chartData, callback);
		        	}
					return;
				}
			}
			
			if (map[data.timestamp]) {
				map[data.timestamp] += data.diskUsage;
			}else {
				map[data.timestamp] = data.diskUsage;
			}
        	
        	if (eof) {
        		sendChartData(map, chartData, callback);
        	}
        });
        
        // output a list of tuples of total disk usage in MB 
        // and timestamp to a callback
        function sendChartData(map, chartData, callback) {
        	for (var timestamp in map) {
				chartData.push({
					"usage": map[timestamp],
					"timestamp": parseInt(timestamp)
				});
			}
    		callback({'data': chartData});
        };
	};
	
	function getCountryCodes() {
		return countryCodes;
	}
	
	// functions exposed by API
	return {
		'init': init, 
		'getTotalDiskUtilData': getTotalDiskUtilData, 
		'getCountryCodes': getCountryCodes
	};
})();
