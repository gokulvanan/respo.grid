
require(['respo.grid'],function(gridObj) {

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
		  	source:"loadOnSearch", // loads from ajax on source.. if local data given.. it initializes with local data loaded but would require total to be configured
		  	localData:[{"id":1,"firstname":"test","lastname":"sd","job":"sdweed","dob":"24-Jul-1986", "status":"Active"},
		  	{"id":2,"firstname":"sdsssssssssssssssssssssssssssssssssssssssssssssssssssssssssssss","lastname":"sd","job":"sdweed","dob":"24-Jul-1986", "status":"Active"},
		  	{"id":3,"firstname":"test","lastname":"sd","job":"sdweed","dob":"25-Jul-1986", "status":"Inactive"},
		  	{"id":4,"firstname":"gokul","lastname":"velan","job":"software","dob":"23-Jul-1986", "status":"Deleted"},
		  	{"id":5,"firstname":"test","lastname":"sd","job":"sdweed","dob":"24-Jul-1986", "status":"Active"},
		  	{"id":6,"firstname":"test","lastname":"sd","job":"sdweed","dob":"24-Jul-1986", "status":"Active"},
		  	{"id":7,"firstname":"test","lastname":"sd","job":"sd","dob":"24-Jul-1986", "status":"Active"},
		  	{"id":8,"firstname":"test","lastname":"smekd","job":"sdweed","dob":"24-Jul-1986", "status":"Active"},
		  	{"id":9,"firstname":"test","lastname":"sd","job":"sdweed","dob":"24-Jul-1986", "status":"Active"},
		  	{"id":10,"firstname":"lop","lastname":"jo","job":"sdweed","dob":"24-Jul-1986", "status":"Active"},
		  	{"id":11,"firstname":"test","lastname":"sd","job":"sdweed","dob":"24-Jul-1986", "status":"Active"},
		  	{"id":12,"firstname":"test","lastname":"sd","job":"sdweed","dob":"24-Jul-1986", "status":"Active"},
		  	{"id":13,"firstname":"test","lastname":"sd","job":"sdweed","dob":"24-Jul-1986", "status":"Active"},
		  	{"id":14,"firstname":"test","lastname":"sd","job":"sdweed","dob":"24-Jul-1986", "status":"Active"},
		  	{"id":15,"firstname":"test","lastname":"sd","job":"sdweed","dob":"24-Jul-1986", "status":"Active"},
		  	{"id":16,"firstname":"test","lastname":"sd","job":"sdweed","dob":"24-Jul-1986", "status":"Active"},
		  	{"id":18,"firstname":"test","lastname":"sd","job":"sdweed","dob":"24-Jul-1986", "status":"Active"},
		  	{"id":19,"firstname":"test","lastname":"sd","job":"sdweed","dob":"24-Jul-1986", "status":"Active"},
		  	{"id":20,"firstname":"test","lastname":"sd","job":"sdweed","dob":"24-Jul-1986", "status":"Active"},
		  	{"id":21,"firstname":"test","lastname":"sd","job":"sdweed","dob":"24-Jul-1986", "status":"Active"},
		  	{"id":22,"firstname":"test","lastname":"sd","job":"sdweed","dob":"24-Jul-1986", "status":"Active"},
		  	{"id":23,"firstname":"test","lastname":"sd","job":"sdweed","dob":"24-Jul-1986", "status":"Active"},
		  	{"id":24,"firstname":"test","lastname":"sd","job":"sdweed","dob":"24-Jul-1986", "status":"Active"},
		  	{"id":25,"firstname":"test","lastname":"sd","job":"sdweed","dob":"24-Jul-1986", "status":"Active"}],
		  	page:1,
		  	rowsPerPage:10,
		  	getList:fetch,
		  	getListHandler:responseHandler,
		  	sortCol:"firstname",
		  	sortDir:"asc",
		  	pageOpts:[10,20,30],
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

		
