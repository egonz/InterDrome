'use strict';

angular.module('interDromeApp')
  .factory('BootstrapGrowl', function Auth($rootScope) {
    
  	function _growl(msg, type, options) {
  		if (typeof options === 'undefined')
  			options = {};

  		options.type = type;

  		$(document).ready(function() {
			$.bootstrapGrowl(msg, options);
		});
  	}

    return {
    	info: function(msg, options) {
    		_growl(msg, 'info', options);
    	},
    	error: function(msg, options) {
    		_growl(msg, 'danger', options);
    	},
    	success: function(msg, options) {
    		_growl(msg, 'success', options);
    	}
    }

 });