
/*
 * Author: Ayon Ghosh
 * Date: 15 February 2015
 */

var app = app || {};

app.utils = {
	
	//Cross browser Ajax wrapper
	doAjax: function (config) {
		var xhr;
         
        if (typeof XMLHttpRequest !== 'undefined') {
        	xhr = new XMLHttpRequest();
        }else {
            var versions = [
            	"MSXML2.XmlHttp.5.0", 
                "MSXML2.XmlHttp.4.0",
                "MSXML2.XmlHttp.3.0", 
                "MSXML2.XmlHttp.2.0",
                "Microsoft.XmlHttp"
            ];
 
            for(var i = 0; i < versions.length; i++) {
                try {
                    xhr = new ActiveXObject(versions[i]);
                    break;
                }
                catch (e){
                	console.log("FATAL: Ajax might not be supported on your browser");
                }
             }
        }
         
        xhr.onreadystatechange = function () {
            if(xhr.readyState < 4) {
                return;
            }
            if(xhr.status !== 200) {
                return;
            }
            // all is well  
            if(xhr.readyState === 4) {
                config.success(xhr);
            }           
        }
         
        xhr.open(config.method.toUpperCase(), config.url, true);
        xhr.send(config.data || '');
        
        return xhr;
    }, 
    
    // Simple function to shallow copy/overwrite properties of b into a
    extend: function (a, b) {
    	// shallow copy properties of b into a
    	if (!a) {
    		a = {};
    	}
    	for (var prop in b) {
    		a[prop] = b[prop];
    	}
    	
    	return a;
    }, 
    
    // Cross browser function to attach an event handler to a DOM element
    attachEventListener: function (el, event, handler) {
    	if (el.addEventListener) {
    		el.addEventListener(event, handler);
    	}else if (el.attachEvent) {
    		el.attachEvent('on' + event, handler);
    	}
    }
};

// controller for events that change the app's state
app.controller = {
	notify: function (data) {
		app.main.updatePlot(data);
	}
}

app.main = (function () {
	var self = this;
	
	// default config for API calls to fetch chart data
	self.apiConfig = {
		method: 'GET',
		url: '/api/getData', 
		success: plot
	};
	
	// callback to plot chart data from API
	function plot(xhr) {
		var data = xhr.responseText;
		if (data) {
			var jsonData = JSON.parse(data);
			self.chart.parsePlotData(jsonData.data);
			self.chart.plot();
		}
	};
	
	// template compiler for select option
	function getOptionMarkup(value, text) {
		return '<option value="' + value + '">' + text + '</option>';
	};
	
	// initializes the drop down component to select region
	function initRegionSelector(selectEl) {
		self.selectEl = selectEl;
		
		app.utils.doAjax({
			method: 'GET', 
			url: '/api/getRegions', 
			success: initRegions
		});
	};
	
	// callback to initialize region drop down and attach event handlers
	function initRegions(xhr) {
		var data = xhr.responseText;
		var html = getOptionMarkup("all", "All");
		if (data) {
			var jsonData = JSON.parse(data);
			for (var i = 0; i < jsonData.length; i++) {
				html += getOptionMarkup(jsonData[i], jsonData[i]);
			}
			self.selectEl.innerHTML = html;
		}
		
		app.utils.attachEventListener(selectEl, 'change', function (event) {
			var value = selectEl.options[selectEl.selectedIndex].value;
			
			app.controller.notify({'region': value});
		});
	};
	
	// entry point of the app
	function init(chartEl, selectEl) {
		self.chart = new app.Chart(chartEl, {title:'Cluster Disk Utilization Data (MB)'});
		
		updatePlot();
		
		initRegionSelector(selectEl);
	};
	
	// function to plot/update the chart
	function updatePlot(data) {
		if (self.xhr) {
			self.xhr.abort();
		}
		var config = app.utils.extend({}, self.apiConfig);
		var params = [];
		for (var param in data) {
			params.push(param + '=' + data[param]);
		}
		var queryParams = params.join('&');
		if (queryParams) { 
			config.url += '?' + queryParams;
		} 
		
		self.xhr = app.utils.doAjax(config);
	};
	
	// exposed functions
	return {
		'init': init, 
		'updatePlot': updatePlot
	};	
})();

