
require(['respo.grid','ajax-util'],function(gridObj,ajax) {

	var config={  	
			divId:"tableDiv",
		  	colDefs:[
		  	{ name:"id", 		label:"<input type='checkbox' id='selectAll' />", format:checkbox, align:"center", minWidth:50},
		  	{ name:"firstname", label:"First Name", search:true, searchOpts:{placeHolder:"FirstName ..."}, minWidth:120, sort:true , main:true},
		  	{ name:"lastname",  label:"Last Name",  minWidth:500, hideable:true, sort:true},
		  	{ name:"job", 	    label:"Job Title", 	minWidth:300, hideable:true, sort:true },
		  	{ name:"dob", 		label:"DOB",		minWidth:100, hideable:true,  sort:true },
		  	{ name:"status", 	label:"Status",		minWidth:100, sort:true }
		  	],
		  	searchDiv:"searchDiv",
		  	source:"ajax",
		  	sortDir:"asc",
		  	pageOpts:[10,20,30],
		  	page:1,
		  	rowsPerPage:10,
		  	getList:fetch,
		  	getListHandler:responseHandler,
		  	actions:[{name:"add", label:"Add", loading:"Adding...", icon:"icon-plus", action:function(){ console.log("Add action called");}},
			{name:"delete", label:"Delete", loading:"Deleting...", icon:"icon-minus", action:function(){ console.log("Delete action called");}},
		  	]
	  };

	function checkbox(val){
		return "<input type='checkbox' id='select' name='select' value='"+val+"'/>";
	}

	function fetch(params, handler){
		ajax.fetch("json/data.json",params,handler);
	}

	function responseHandler(response){
		return response;
	}
	$(document).ready(function(){
		gridObj.getInstance(config);
	});

});	

		
