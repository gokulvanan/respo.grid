
require(['respo.grid'],function(gridObj) {

	function editLastName(val,row,handler){
		console.log(row);
		console.log(val);
		handler("handler args");
	}

	function editHandler(json){
		console.log(json);
		return true;
	}

	var config={  	
			divId:"tableDiv",
		  	colDefs:[
		  	{ name:"id", 		label:"<input type='checkbox' id='selectAll' />", format:checkbox, align:"center", minWidth:50},
		  	{ name:"firstname", label:"First Name", search:true, 
		  	searchOpts:{
		  		searchType:"dropdown",  
		  		opts:{select:"select", gokul:"gokul"} ,
		  		placeHolder:"FirstName ..."
		  		},
		  		 minWidth:120, sort:true , main:true},
		  	{ name:"lastname", search:true, searchOpts:{placeHolder:"LastName..."},  label:"Last Name",  minWidth:500, hideable:true,priority:1, sort:true},
		  	{ name:"job", 	    label:"Job Title", editable:true, editOpts:{type:"text", action:editLastName, handler:editHandler},	minWidth:300, hideable:true, sort:true },
		  	{ name:"dob", 		label:"DOB",		minWidth:100, hideable:true,priority:2,  sort:true },
		  	{ name:"status", 	label:"Status",		minWidth:100, sort:true }
		  	],
		  	searchDiv:"searchDiv",
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
		  	sortCol:"firstname",
		  	sortDir:"asc",
		  	pageOpts:[10,20,30],
		  	page:1,
		  	rowsPerPage:10,
		  	debug:true, // enables logging
		  	actions:[{name:"add", label:"Add", loading:"Adding...", icon:"icon-plus", action:function(){ console.log("Add action called");}},
			{name:"delete", label:"Delete", loading:"Deleting...", icon:"icon-minus", action:function(){ console.log("Delete action called");}},
		  	]
	  };

	function checkbox(val){
		return "<input type='checkbox' id='select' name='select' value='"+val+"'/>";
	}

	$(document).ready(function(){
		gridObj.getInstance(config);
	});

});	

		
