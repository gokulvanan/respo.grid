
/*
 * Required JS libs
 * jquery.js 
 */

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


define(function() {

	//******************************PROTOTYPE Functions added to String and Array to provide use full methods as in JAVA.************************
	String.prototype.trim= function ()
	{
		return this.replace(/^\s*|\s*$/g,"");
	};


	/**
	 * Note: the method below works like contains of ArrayList in java.
	 * @param key (String/ number)
	 * @return Boolean
	 */
	Array.prototype.contains= function (key)
	{
		try{
			if(!this)//condition is true for this= null or undefined
				return false;
			else
			{
				for(var i=0 in this)	
				{

					if (this[i])
					{

						if(typeof this[i]=="string" && typeof key=="string" && this[i].trim()==key.trim())
							return true;

						else if(typeof this[i]=="number"  && typeof key=="number" &&this[i]==key)
							return true;
						else 
							continue;
					}
				}
				return false;
			}

		}catch(err)
		{
			alert("Error in prototype Array.prototype.contains method err Msg-"+err.message);
			return false;
		}
	};

	/**
	 * Note: the method below works like remove of ArrayList in java.
	 * @param key (String/ number)
	 * @return Boolean
	 */
	Array.prototype.remove= function (key)
	{
		try{
			if(!this)//condition is true for this= null or undefined
				return false;
			else
			{
				for(var i=0 in this)	
				{
					if (this[i])
					{
						if(typeof this[i]=="string" && typeof key=="string" && this[i].trim()==key.trim())
						{
							this.splice(i,1);
							return true;
						}	
						else if(typeof this[i]=="number"  && typeof key=="number" &&this[i]==key)
						{
							this.splice(i,1);
							return true;
						}
						else 
							continue;
					}

				}
				return false;
			}

		}catch(err)
		{
			alert("Error in prototype Array.remove.contains method err Msg-"+err.message);
			return false;
		}

	};

	////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	/*
	 * Frame work class for performing AJAX.
	 * The class methods are built over jquery, hence would require jquery.js to work.
	 */
	//added to send this param for all ajax calls
	var AJAX_CALL_PARAM='ajaxCallFlag=true&'; // this also used in jqgrid calls under formatPostData method

	/**
	 * Added to avoid AJAX Race conditions.
	 * This stack holds all the ajax ID that are in process, so as to prevent same AJAX Id being fired when its response has 
	 * not come from the server and hence prevent AJAX Race conditions.
	 */
	var ajaxCallSatck=new Array();

	/*
	 * method used to encode data fiels that are sent as input data in AJAX call. 
	 * @paramName- name of param attribute - part of from or the name used to get using request.getParameter("name")
	 * @paravValue- value of parameter.
	 * @returns  String representation of &paramName=encodeURIComponenet(paramvalue); 
	 * 
	 */

	function encodeDataFields(paramName,paramValue)
	{
		try
		{
			paramvalue=($.trim(paramValue).length!=0) ? encodeURIComponent(paramValue) : "";//validation check
			paramName+="="+paramvalue;
//			paramName="&"+paramName;
			return paramName;
		}catch(err)
		{
			alert("Error in ajaxUtil encodeDataFields method err msg : "+err.message);
		}
	};


	/*
	 * Mehtod used to get JSON object from server during AJAX call. 
	 * Method can be called with different set of arguments
	 * 3 arguments 
	 * 	- ajaxId- unique ID given to each AJAX call made - added to prevent AJAX Race condition.
	 * 	- URL - address to server action
	 * 	- responseHandler - return local function that would handle the response.
	 */
	function persist (url,input,responseHandler,dataType)
	{
		console.log("POST CALL");
		console.log(url);
		console.log(input);
		if(!url && !responseHandler && !input)//mandatory arguments
		{
			alert("Mandatory parameters to AJAX call are null");
		}

		dataType = (!dataType) ? "application/json" : dataType;

		try
		{
			if(ajaxCallSatck.contains(url)){
				//ignore	
			}
			else
			{
				ajaxCallSatck.push(url);
				var stack = ajaxCallSatck;
				$.ajax({ url:url,
					   type:"post",
					   dataType:"json",
					   contentType:dataType,
					   cache:false,
					   error:function(requestObj, errorMsg){
															if(!ajaxCallSatck.remove(url))
																alert("Error Ajax call not removed from stack");
															alert("Error in AJAX persist Serveice err msg: "+errorMsg);
															},
					   data: input,
					   success: function(data, textStatus, jqXHR){
						   try
						   {
							   if(!ajaxCallSatck.remove(url))
								   alert("Error Ajax call not removed from stack");
							   console.log("POST CALL RESPONSE");
							   console.log(data);
							   responseHandler(data);

						   }catch(err)
						   {
							   ajaxCallSatck.remove(url);
							   alert("Error in ajaxUtil persist jsonResponseValidator method  err msg: "+err.message);
						   }
					   }
				});

			}

		}catch (err)
		{
			alert("Error in ajaxUtil persist method err msg: "+err.message);
		}

	};

	// Added for get requests
	function fetch (url,input,responseHandler)
	{
		console.log("GET CALL");
		console.log(url);
		console.log(input);
		if(!url && !responseHandler && !input)//mandatory arguments
		{
			alert("Mandatory parameters to AJAX call are null");
		}

		try
		{
			if(ajaxCallSatck.contains(url)){
				//ignore	
			}
			else
			{
				ajaxCallSatck.push(url);
				var stack = ajaxCallSatck;
				$.ajax({ url:url,
					   type:"get",
					   dataType:"json",
					   cache:false,
					   error:function(requestObj, errorMsg){
															if(!ajaxCallSatck.remove(url))
																alert("Error Ajax call not removed from stack");
															alert("Error in AJAX  fetch Serveice err msg: "+errorMsg);
															},
					   data: input,
					   success: function(data, textStatus, jqXHR){
						   try
						   {
							   if(!ajaxCallSatck.remove(url))
								   alert("Error Ajax call not removed from stack");
							   console.log("GET CALL RESPONSE");
							   console.log(data);
							   responseHandler(data);

						   }catch(err)
						   {
							   ajaxCallSatck.remove(url);
							   alert("Error in ajaxUtil fetch jsonResponseValidator method  err msg: "+err.message);
						   }
					   }
				});

			}

		}catch (err)
		{
			alert("Error in ajaxUtil fetch method err msg: "+err.message);
		}

	};

	function loading(responseDiv,height,width){

		if(responseDiv !=null && $('#'+responseDiv)!=null )
		{
			if(width!=null && height!= null)
			{
				$('#'+responseDiv).html('<div style="position:absolute;left:'+Math.round((width-25)/2)+'px;top:'+Math.round((height-25)/2)+'px;"><img src="/csa/images/loading.gif" width="25px" height="25px" alt="LOADING.." title="LOADING.."></img></div>');
			}
			else
				$('#'+responseDiv).html('<span><center>LOADING...</center></span>');
		}
	};


	function constructData(elm){

		var data="";
		try
		{
			if(elm!=null)
			{
				if(!elm.length)//elm.length==undefined when we get single elements using document.getElementById
					elm = [elm];
				for(var i=0;i<elm.length;i++)
				{
					data+=this.encodeDataFields($(elm[i]).attr("name"),$(elm[i]).val());
				}
				return data;	
			}
		}catch(err)
		{
			alert("Error in ajaxUtil constructData method  err msg: "+err.message);
		}
	};

	return{
		persist:persist,
		fetch: fetch
	}
});
