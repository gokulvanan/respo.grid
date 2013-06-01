
define(function () {
/*
* Simple API used to persit data to and from local/session storage in HTML5 capable browsers
* Takes care of caching objects and non string types by parsing and unparsing it to/from string during storage
* Implements parent,key concept to enable flushing of a group pf related caches in one shot.
* Code does not break incase the browser does not suppport this storage.
* Hence can be used in all browsers
* @author Gokulvanan V Velan
*/

	var store = null;	
	var unsupported = (typeof(Storage) ==="undefined" || typeof(JSON) === "undefined");

  	function getData(key,parent,storageType){
  		store = (storageType) ? localStorage : sessionStorage;
  		var val = store[parent] || null;
  		if(val === null) return null;
  		val = val[key] || null;
  		if(val === null) return null;
  		try{
  			 val = JSON.parse(val);
		}catch(err){
			console.log(err);
			//expected exception when val is a string
  		}
  		return val;
  	}

  	function storeData(key,parent,obj,storageType){
  		store = (storageType) ? localStorage : sessionStorage;
  		var stringVal = (typeof(obj) === "string")? obj : JSON.stringify(obj);
  		var par = store[parent] || {};
  		par[key]=stringVal;
  	}

  	function flushCache(parent,storageType){
  		store = (storageType) ? localStorage : sessionStorage;
  		var map = store[parent] || {};
  		if(map[parent]) map[parent]=undefined; // remove attribute
  	}

  	return{
  		
		get : function(key,parent,storageType){
			if(unsupported)	return null;
			return getData(key,parent,storageType);
		},
		set : function(key,parent,obj,storageType){
			if(unsupported)	return;
			storeData(key,parent,obj);
		},
		contains: function(key,parent,storageType){
			if(unsupported)	return false;
			return (getData(key,parent,storageType) === null);
		},
		flush: function(parent,storageType){
			if(unsupported)	return;
			flushCache(parent,storageType);
		}
	};
});