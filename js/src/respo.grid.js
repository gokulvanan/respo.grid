    

/* 
    RespGrid is a Lightweight Responsive Grid builder, built as a modular component to work well with require.
    Requries jquery1.7 or above, require.js and boostrap css 
    @author gokulvannan@gmail.com
*/

define(function () {

    var defaults = { //TODO add defaults
        "divId":null,
        "colDefs":[],
        "width":0.985,
        "height":0.65,
        "localData":[],
        "params":{},
        "source":"local",// ajax / loadOnSearch
        "searchDiv": null,
        "searchOnEnter":true,
        "afterGridLoad":null,
        "caption":null,
        "roleAccessFilter": null, //added for roleAccess
        "hasAcessPermission": null, //added for roleAccess 
        "paramNames":{"page":"page","rowsPerPage": "rowsPerPage","sortCol":"orderBy","sortDir":"asc","total":"total","data":"data"},
        "getList":null, // function called during AJAX load input args contains params of gird , output json with total and data fields
        "getListHandler":null, // handler function handle json response
        "foot":null// add footer to the table
    }
    //Global variables
    var COLOR_MAP={ // BOOTSTRAP COLOR Refrences
    		"green":"btn-success",
    		"red": "btn-danger",
    		"yellow":"btn-warning",
    		"black":"btn-inverse",
    		"blue" : "btn-primary",
    		"lightBlue":"btn-info"	
    };
    var SEARCH_CLASS="search";
    var debug=true; // added to switch on and off logging
    
    
    function getInstance (options) {
    	
        options = options || {};
        var opts = $.extend(true, {}, defaults, options); //merge user and default options
        
        
        //////////////////////HELPER FUNCTIONS START////////////////////////////////////////////
        
        var widthMap={};// map that holds width of each cols as they change -- used in rebuilding body during pagination and sorting
        var totalWidth=0;
        var hideableCols = new Array(), hiddenCols = new Array();
        var colSpanSize=0; // used to add NO Data Found, Loading message
        var scrollBarPadding=20; // added to provide padding to last header column for scrollbar
        var columnPadding=17; // individual header column padding value is defined currently by bootstrap css
        var actionHandlerMap={};// map used to map action names to handler functions for the action specfied 
        var editableColsMap={}; // map used to map column names to editable actions and validaiton actions
        var autoCompleteElms = {}; // map used to map columnName used in search field to autoComplete Hidden val field  
        var localSearchMap= {}; // map used to map column Name with localSearchFunction if present .. used to provide  other kinds of filter
        var loadingGIF="/public/images/loading.gif";
    	
        
        function buildLoadingDiv(divId,ht){
            var loading = new Array();
            loading.push('<div id="respoGridLoading_'+divId+'" style="top:0px;overflow-y:scroll;height:'+ht+'px;border:1px solid #dddddd;">');
            loading.push('<table cellspacing="0" cellpadding="0" width="100%" height="100%">');
            loading.push('<tr>');
            loading.push('<td style="vertical-align:middle;text-align:center;"><i class="icon-spinner icon-4x icon-spin" ></i></td>');
            loading.push('</tr></table></div>');
            loading.push(' </div>');
            return loading.join(" ");
        }

        function buildSearchDiv(opts){
            var $div = $("div#"+opts.searchDiv);
            $div.attr("class","input-append");
            var search = new Array();
            for(var i=0,len=opts.colDefs.length; i<len; i++){ 
                var def = opts.colDefs[i];
                if(def.search){
                    var searchOpts = def.searchOpts || {};
                    var type = searchOpts.searchType || "text";
                    var size = searchOpts.size || "large";
                    var placeHolder= searchOpts.placeHolder || "";
                    if(type === "text"){
                    	var val = opts.params[def.name] || "";
                    	if(searchOpts.autocomplete){
                    		var autocompleteOpts = searchOpts.autocompleteOpts || {};
                    		autoCompleteElms[def.name]=autocompleteOpts; 
                    		if(autocompleteOpts.keyval){ // create hidden element to store key
                    			autoCompleteElms[def.name]=autocompleteOpts;
                    			var hidVal = opts.params[autocompleteOpts.keyval] || "";
                    			search.push('<input class="search" id="'+autocompleteOpts.keyval+'" type="hidden" value="'+hidVal+'"/>');
                    		}
                    	}
                        // search.push('<input class="search  respo_date_picker input-'+size+'"  placeholder="'+placeHolder+'" id="'+def.name+'" type="text" value="'+val+'"/>')
                        if(searchOpts.date)
                        {
                            search.push('<input class="search  respo_date_picker input-'+size+'"  placeholder="'+placeHolder+'" id="'+def.name+'" type="text" value="'+val+'" autocomplete="off" readonly="readonly"/>');
                            search.push('<span class="add-on respo_date_picker"><i class="icon-calendar"></i></span>');
                        } 
                        else
                        {
                            search.push('<input class="search  respo_date_picker input-'+size+'"  placeholder="'+placeHolder+'" id="'+def.name+'" type="text" autocomplete="off" value="'+val+'"/>');
                        }
                    }else if (type === 'dropdown'){
                        var dropDownOpts =  searchOpts.opts || {};
                        search.push("<select class='search input-"+size+"' id='"+def.name+"' >");
                        if($.trim(placeHolder).length !== 0) {
                              search.push("<option value='' > Select "+placeHolder+"</option>");
                          }
                        for(var key in dropDownOpts){
                        	var selected= (opts.params[def.name] === key) ? "selected='selected'" : "";
                            search.push("<option value='"+key+"' "+selected+" >"+dropDownOpts[key]+"</option>");
                        }
                        search.push("</select>");
                    }
                }
            }
            search.push('<button id="go" class="btn respo_search " type="button">Go!</button>');
            $div.html(search.join(" "));
            console.log(autoCompleteElms);
            for(var elName in autoCompleteElms){ // initialize autocomplete opts if any
            	var autoOpts=autoCompleteElms[elName];
            	$("input#"+elName).typeahead({
            		"source":autoOpts.source
            	});
            }
            initSearchHandlers(opts);
        }

        function initSearchHandlers(opts){
            $("button#respo_search").click(function(e){
                search(opts);
            });
            if(opts.searchOnEnter){
                $(document).keyup(function(e) {
                    if(e.which == 13) { // 13 = enter key code
                      search(opts); // do search on enter
                    }
                    if(e.which == 27) { // 27 = esc key code
                       $(".search").val("");  //clear search opts
                    }
                });
            }
        }

        function processData(opts, handler){
            beforeBuildingGrid(opts);
            if(opts.source === 'local'){
                opts.data = getLocalData(opts);
                handler(opts);
                afterBuildingGrid(opts);
            }else if (opts.source ==='ajax'){ // source === ajax
                 opts.params[opts.paramNames["page"]]=opts.page;
                 opts.params[opts.paramNames["rowsPerPage"]]=opts.rowsPerPage;
                 opts.params[opts.paramNames["sortCol"]]=opts.sortCol;
                 opts.params[opts.paramNames["sortDir"]]=opts.sortDir;
                 ajaxCallHelper(opts,handler)
            }else if (opts.source === 'loadOnSearch'){
                if(opts.searchFlag){ // make ajax call for search
                    opts.page=1; // reset to first page
                    opts.params[opts.paramNames["page"]]=undefined; // remove pagination params as pagination is now clientSide
                    opts.params[opts.paramNames["rowsPerPage"]]=undefined; // remove pagination params as pagination is now clientSide
                    opts.params[opts.paramNames["sortCol"]]=opts.sortCol;
                    opts.params[opts.paramNames["sortDir"]]=opts.sortDir;
                    ajaxCallHelper(opts,handler)

                }else{ // work with local data for other cases
//                  if(opts.localData && opts.localData.length > 0){
                        opts.data = getLocalData(opts);
                        handler(opts);
                        afterBuildingGrid(opts);
//                    }  
                }
                
            }
        }
        
        function ajaxCallHelper(opts,handler){
            beforeAjaxCall(opts);// helper method to show loading div etc
                opts.getList(opts.params,function (response){
                    var obj= opts.getListHandler(response);
                    // console.log(obj);
                    if(!obj){
                    	afterAjaxCall(opts); // helper method to remove loading div, cleaup.. no data msg + error reporting
                    	opts.$loading.hide();
                        $("div#respoGridBody_"+opts.divId).show();
                    	return; // do nothing incase of no response
                    }
                    opts.data =  obj[opts.paramNames.data];
                    opts.total = obj[opts.paramNames.total];
                    afterAjaxCall(opts); // helper method to remove loading div, cleaup.. no data msg + error reporting
                    handler(opts);
                   afterBuildingGrid(opts);
                });
        }
       
        function beforeAjaxCall(opts){
            //opts.wait=true; // flag prevent click actions on other buttons when loading is in progress
            opts.data=[]; // clear old Data
            // code to work with yui set of pagination options set in my BE.. to remove this from here
            var paramNames = opts.paramNames;
            var page = opts.params[paramNames.page];
            var rowsPerPage = opts.params[paramNames.rowsPerPage];
            var dir = opts.params[paramNames.sortDir];
            dir = (dir === "asc" )? true : false;
            if(page && rowsPerPage){ // they are undefined for other cases
            	page = (page-1)*rowsPerPage;
            }
            opts.params[paramNames.sortDir]=dir;
            opts.params[paramNames.page]= page;
        }
        
        function afterAjaxCall(opts){
            if(opts.source === "loadOnSearch"){
                opts.searchFlag=false;// search flag reset.. to keep pagination and sorting as local calls its set during every serach call
                opts.localData=[]; // as localData needs to be populate
                opts.localData=opts.data;
                opts.localData.sort(function(a,b){return sort(a,b,opts.sortCol,opts.sortDir)});// sort data
                opts.data=getLocalData(opts);
            }
          //  opts.wait=false;// flag reset to enable click actions on other buttons after loading is done
        }

        function afterBuildingGrid(opts){
            //hide Loading Div
            opts.$loading.hide();
            $("div#respoGridBody_"+opts.divId).show();
            if(opts.afterGridLoad)	opts.afterGridLoad(); // after gridLoad function can be called via client
            console.log("HERE IN AFTER BUILDING GRID");
        }

        function beforeBuildingGrid(opts){
            //show loading div
            
            opts.$loading.show();
            $("div#respoGridBody_"+opts.divId).hide();
            console.log("HERE IN BEFORE BUILDING GRID");
       }

        function buildTableFromData(opts,divId,$bodyDiv,$div,$head,$foot){
            var table = new Array();
            table.push('<table id="body_'+divId+'" class="table table table-bordered table-striped " style="table-layout:fixed;">');
            buildBody(table,opts);
            table.push('</table>');
            var $table = $(table.join(""));

            var $caption = buildCaption(opts);

            $(window).bind("resize", function(){ setTimeout(function(){resize($table,opts);},100)});//delay to prevent overload for frequent resizes
            $bodyDiv.append($table);
            $div.append($bodyDiv);
            $div.prepend($caption);// add caption before table
            if($foot) $div.append($foot);
            if(opts.actions) initializeButtonActions($caption,opts.actions);

            $("a.respo_expand",$table).bind("click",function(event){ event.preventDefault(); showDetails(this,opts);});
            $("a.respo_minimize",$table).bind("click",function(event){ event.preventDefault();  hideDetails(this);});
            $("th.respo_sort",$head).bind("click",function(event){ sortCol(this,opts,divId,$caption);});
//            $("a.respo_sort_up",$head).bind("click",function(event){ event.preventDefault(); sortCol(this,opts,divId,"desc");});
//            $("a.respo_sort_down",$head).bind("click",function(event){ event.preventDefault();  sortCol(this,opts,divId,"asc");});

            $("a.respo_rows_per_page_change",$caption).bind("click",function(event){ event.preventDefault(); changeRowsPerPage(this,opts,$caption,divId);});
            $("select.respo_curr_page",$caption).bind("change",function(event){ pagnButtonClick(this,opts,$caption,divId);});
            $("a.respo_pagn",$caption).bind("click",function(event){ event.preventDefault();  pagnButtonClick(this,opts,$caption,divId);});
            // initCaptionHandlers($caption);
            // initSort($head);
            initEditableCols(opts);
            resize($table,opts);
            initTooltips(opts);
        }
        
        function initEditableCols(opts){
            console.log(editableColsMap);
            // for(var key in editableColsMap){
                // console.log("a.respo_inline_edit_"+key);
            $("a.respo_inline_edit").click(function(event){
                    event.preventDefault();
                    var edit   = $(this);
                    var input  = edit.parent().prev();
                    var save   = edit.next();
                    var cancel = save.next();
                    var obj = getEditableRowCol(input);
                    var func = editableColsMap[obj.col];
                    console.log(func);
                    var buff = func.buff || {};
                    buff[obj.row]=input.val(); // buffer the val
                    editableColsMap[obj.col].buff=buff;
                    console.log(editableColsMap);
                    showEditFieldDetails(input,save,cancel,edit);
                    if(func.onStart) func.onStart(input);
             }); 
            
            $("a.respo_inline_edit_cancel").click(function(event){
                    event.preventDefault();
                    var cancel = $(this);
                    var save = cancel.prev();
                    var edit = save.prev();
                    var input = edit.parent().prev();
                    var obj = getEditableRowCol(input);
                    var func = editableColsMap[obj.col];
                    console.log(func);
                    var buff = func.buff || {};
                    if(!buff || !buff[obj.row]) throw "Error in initEditableCols";
                    input.val(buff[obj.row]);
                    hideEditFieldDetails(input,save,cancel,edit);
                    if(func.onFinish) func.onFinish(input);
            });
            // TODO customize trigger click/change based on type of element text/dropdown
            $("a.respo_inline_edit_save").click(function(event){
                    event.preventDefault();
                    var save = $(this);
                    var cancel = save.next();
                    var edit = save.prev();
                    var input = edit.parent().prev();
                    var obj = getEditableRowCol(input);
                    var func = editableColsMap[obj.col];
                    var newVal = input.val();
                 
                    var error = func.action(newVal,opts.data[obj.row],function(json){
                    	// Disable al action buttons
                        // show loading
                    	$("<img class='respo_inline_edit_loading' src='"+loadingGIF+"' ></img>").insertAfter(cancel);
                        if(func.handler(json)) opts.data[obj.row][obj.col]=newVal;
                        else{
                            var buff = editableColsMap[obj.col].buff;
                            if(!buff || !buff[obj.row]) throw "Error in initEditableCols";
                            input.val(buff[obj.row]);
                        }
                        $("img.respo_inline_edit_loading").remove();
                        //enable all actions buttons
                        hideEditFieldDetails(input,save,cancel,edit);
                        if(func.onFinish) func.onFinish(input);
                    });
                    
                    
            });

        }

        function showEditFieldDetails(input,save,cancel,edit){
            input.removeAttr("readonly");
            edit.hide();
            save.show();
            cancel.show();
        }

        function hideEditFieldDetails(input,save,cancel,edit){
            input.attr("readonly","readonly");
            edit.show();
            save.hide();
            cancel.hide();
        }

        function getEditableRowCol(elm,opts){
            var vals = elm.attr("id").split("~");
            var row = vals.pop();
            var col = vals.pop();
            console.log(row+"_"+col);
               
            return{
                "row":row,
                "col":col
            }
        }

        // ajaxSearchFlag if true will treat ajax search call as true for search call only in loadOnSearch Mode
        function search(opts,params,ajaxSearchFlag){
        	var divId=opts.divId;
            //search from ajax data 
                opts.page=1;// default to first page
                loadingWait(opts); // avoid processing new search req when previous is loading
                opts.searchFlag=(opts.source === 'loadOnSearch' && ajaxSearchFlag);
                params = (params) ? params : getSearchParams(SEARCH_CLASS); // add search params 
                opts.params=params;
                processData(opts,function(args){
                    reBuildBody(args,divId); // rebuild body
                    
                    // rebuild and reinitialize pagn buttons
                    $("ul#"+opts.divId+"_respo_pagn_links").html(buildPagnButtons(args.page,args.getTotalPages()));
                    // re init tigger to pagnButton click handlers
                    var $caption = $("div#"+opts.divId+"_resp_caption");
                    $("select.respo_curr_page",$caption).bind("change",function(event){ pagnButtonClick(this,args,$caption,divId);});
                    $("a.respo_pagn",$caption).bind("click",function(event){ event.preventDefault();  pagnButtonClick(this,args,$caption,divId);});
          

                });
            
        }
        
    
        
        function initializeButtonActions($caption, opts){
            $(".respo_btns",$caption).bind("click",function(){
                loadingWait(opts); // avoid processing new action req when previous is loading
                var id = $(this).attr("id");
                var loading = $(this).attr("data-loading-text");
                // disable button
                disableButtons(id,loading,".respo_btns");
                // carry out custom action
                var action = actionHandlerMap[id] || function(){};
                action();
                //enable button
                enableButtons(id,".respo_btns");

            });
        }
     
        function pagnButtonClick(elm,opts,$caption,divId){
            // // console.log($(elm).is("select"));
            loadingWait(opts); // avoid processing new pagn req when previous is loading
            var $elm = $(elm);
            var elmType = $elm[0].nodeName.toLowerCase();
            if(elmType === "select"){
                opts.page=parseInt($elm.val());
            }else{
                 if($elm.parent().attr("class") === 'disabled') return; // do nothing for a disabled button
                 if($elm.html() === "Next"){
                        opts.page++; // console.log("next");
                 }   
                 else {
                    opts.page--;// console.log("previous");
                 }
                 $("select.respo_curr_page",$caption).val(opts.page);                        
            }
            // console.log("PagnButtonClick");
            // console.log(opts.page);
            // console.log(opts.rowsPerPage);
            processData(opts,function(args){
                /*var tableBody = $("table#body_"+divId);
                updateGrid(args,tableBody);*/
                // console.log(opts.data);
                reBuildBody(args,divId);
                enableDisablePagnButtons(args,$caption);   
            });
        }

        function enableDisablePagnButtons(opts,$caption){
             // enable both buttons
             var next = null, previous = null;
             $("a.respo_pagn",$caption).each(function(){
                var $e = $(this);
                if($e.html() === "Next") next = $e.parent();
                else previous = $e.parent();
                $e.parent().attr("class","");
             });
             
             if(opts.page === opts.getTotalPages()){
                // console.log("Disable Next");
                next.attr("class","disabled"); // disable next
             }  
             else if(opts.page === 1){
                // console.log("Disable Previous");
                previous.attr("class","disabled"); // disable previous
             }                
        }

        function getLocalData(opts){
        	//aplies filter durign source = local and in localSearchCall in loadOnSearchMode
        	var data = (opts.source==='loadOnSearch') ?((opts.localSearchCall)? localDataFilter(opts) : opts.localData ) : localDataFilter(opts); // called if local search params are sent to filter results (NOTE: applicable only for local source)
        	data=(data)? data : []; // data is empty array incase its undefined
        	opts.buff=data;
            var i = (opts.page -1) * opts.rowsPerPage;
            var j = ((i+opts.rowsPerPage) < opts.buff.length) ? i+opts.rowsPerPage : opts.buff.length;
            return Array.prototype.slice.call(data,i,j);
        }
        
       
       /**
       *    Filters local data based on search Params
       */
        function localDataFilter(opts){
            var validRows = new Array();
            if(opts.localData.length === 0) return validRows; //return empty result if no data is present 
            var searchParams=getValidSearchParams(opts.params,opts.localData[0]);
            if(!searchParams) return opts.localData;
            for(var i=0, len=opts.localData.length; i<len; i++){
                var row = opts.localData[i];
                  if(searchSatisfied(row,searchParams)){
                    Array.prototype.push.call(validRows,row);
                }
            }
            return validRows;
        } 

        function searchSatisfied(row,searchParams){
            var satisfied=true;
            for(var p in searchParams){
            	if (localSearchMap[p]){
            		var filter = localSearchMap[p];
            		if(typeof filter === "function"){
            			if(!filter(row[p],searchParams[p])){
            			  satisfied = false;
                          break;	
            			}
            		}
            	}else{
            		if(searchParams[p] !== row[p]){
                        satisfied = false;
                        break;
                    }
            	}
            }
            return satisfied;                
        }

        function getValidSearchParams(params,row){
            var searchParam = null;
            for(var p in params){
                if(row[p] !== undefined){
                    try{
                        searchParam[p]=params[p];  
                    }catch(err){
                        searchParam={};
                        searchParam[p]=params[p];  
                    }
                } 
            }
            return searchParam;
        }

        function buildCaption(opts){
            var caption = new Array();
            caption.push('<div  id="'+opts.divId+'_resp_caption" >')
            if(opts.actions)     caption.push(buildActions(opts,caption)); // TODO: change this dirty trick to keep div on same row and improve css 
            if(opts.pageOpts)    caption.push(buildPagination(opts,caption));
            caption.push('</div>');
            return $(caption.join(" "));
        }

        function buildPagination(opts){
            var pagn = new Array();
            var pageOpts = opts.pageOpts , rowsPerPage=opts.rowsPerPage;
            // build rowsPerPage Div and init page = 1
            if(opts.caption){
                pagn.push('<div id="caption_div" class="btn-group pull-left">');
            	pagn.push('<button id="'+opts.divId+'_'+'table_caption" class="btn btn-danger btn-medium "')
            	pagn.push('style="cursor: default; background-image: none; -webkit-box-shadow: none; -moz-box-shadow: none; box-shadow: none;">'+opts.caption);// TODO remove inline styling
            	pagn.push('</button>')
            	pagn.push('</div>')
            }
            if(opts.caption_search) pagn.push("<div class='pull-left ' >"+opts.caption_search+"</div>");
            pagn.push('<div id="rowsPerPage_div" class="btn-group pull-left">');
            pagn.push('<button class="btn  btn-small disabled"><b>Display Records : ');// TODO remove inline styling
            pagn.push('<span id="'+opts.divId+'_respo_rows_per_page_val">'+opts.pageOpts[0]+'</span>');
            pagn.push('</b></button>');
            pagn.push('<button class="btn  btn-small dropdown-toggle " style="height: 26px;" data-toggle="dropdown">');
            pagn.push('<span class="caret"></span>');
            pagn.push('</button>');
            pagn.push('<ul class="dropdown-menu" style="left:90px;min-width:15px;">');// TODO remove the hardcode left and min-widht value
            for(var i=0; i<pageOpts.length; i++){
                    pagn.push('<li><a href="#" class="respo_rows_per_page_change" >'+pageOpts[i]+'</a></li>');
                }
            pagn.push('</ul>');
            pagn.push('</div>');
          
            // Build pagination pages link'
            pagn.push('<div class=" pagination pagination-small pagination-centered row">')
            pagn.push('<ul id="'+opts.divId+'_respo_pagn_links">');
            pagn.push(buildPagnButtons(opts.page,opts.getTotalPages()));       
            pagn.push('</ul>');
            pagn.push('</div>');
            return pagn.join(" ");
        }

        function buildActions(opts){
            actionHandlerMap = {}; // reset
            console.log("respo. grid bUild actions call");
            var acts = (opts.roleAccessFilter) ? opts.roleAccessFilter(opts.actions) : opts.actions; // role access Filter added
            var actions = new Array();
            actions.push('<div id="respo_actions" class="pull-right" style="margin-right:10px;">');
            
            for(var i=0,len=acts.length; i<len; i++){
            	var color = acts[i].color || "red";
            	color = "";//COLOR_MAP[color] ;
            	console.log(color);
            	if(acts[i].modal){
            		
            		actions.push('<a href="#'+acts[i].modal+'" role="button" class="respo_btns btn '+color+' btn-small" data-toggle="modal" data-loading-text="'+acts[i].loading+'">')
            		actions.push("<i class='icon "+acts[i].icon+"'> </i>&nbsp;")
            		actions.push(acts[i].label);
            		actions.push('</a>');
            	}else{
                    actionHandlerMap[acts[i].name]= acts[i].action; // used in click Handler to prevent array looping to lookup the action for button clicked
                    actions.push('<button id="'+acts[i].name+'" class="respo_btns btn '+color+' btn-small" data-loading-text="'+acts[i].loading+'">');
                    actions.push("<i class='icon "+acts[i].icon+"'> </i>&nbsp;")
                    actions.push(acts[i].label);
                    actions.push('</button>');
            	}
        
            }
            actions.push('  </div> ');
            return actions.join(" ");
        }
        
        function enableButtons(id,grpClass){
            $("button#"+id+"_loading").hide();
            $("button#"+id).show();
            $(grpClass).attr("disabled",false);
        }
        
        function disableButtons(id,label,grpClass){
            $(grpClass).attr("disabled",true);
            var loadingElm = $("button#"+id+"_loading");
            if (loadingElm.length === 0){ //TODO change loading image to be in css sprite.. 
                loadingElm = $("<button id='"+id+"_loading' class='btn btn-warning btn-small' >  <img src='"+loadingGIF+"' ></img> "+label+" </button>");
                loadingElm.insertAfter("button#"+id);
            }else{
                loadingElm.show();
            }
            $("button#"+id).hide();
            
        }
        
        function buildPagnButtons(page,totalPages){
            var pagn = new Array();
            if(page === 1)       pagn.push('<li class="disabled">');
            else                 pagn.push('<li >');
            pagn.push('<a class="respo_pagn respo_pagn_disabled" href="#">Prev</a></li>');
            pagn.push("<li > <span style='color:#999999;'> <select class='respo respo_curr_page'>");
            for(var i=1; i<=totalPages ; i++){
                var active = (i === page) ? "selected:true;" : "";
                pagn.push('<option value="'+i+'">'+i+'</option>');
            }
            pagn.push("</select></span> </li>");
            console.log("Inside Pagn .. "+ totalPages)
            if(totalPages === 0 || page === totalPages) pagn.push('<li class="disabled">');
            else                 pagn.push('<li >');
            pagn.push('<a class="respo_pagn" href="#">Next</a></li>');   
            return pagn.join(" ");      
        }

        function changeRowsPerPage(elm,opts,$caption,divId){
            // update table data and update pagn params
            loadingWait(opts); // avoid processing new rowsPerPage req when previous is loading
            var val = parseInt($(elm).html());
            $("span#"+opts.divId+"_respo_rows_per_page_val").html(val);
            opts.rowsPerPage=val;
            opts.page=1;
            
            processData(opts, function(args){
                 reBuildBody(args,divId);
                 $("ul#"+opts.divId+"_respo_pagn_links").html(buildPagnButtons(args.page,args.getTotalPages()));
                 // re init tigger to pagnButton click handlers
                 $("select.respo_curr_page",$caption).bind("change",function(event){ pagnButtonClick(this,args,$caption,divId);});
                 $("a.respo_pagn",$caption).bind("click",function(event){ event.preventDefault();  pagnButtonClick(this,args,$caption,divId);});
            });
        }

        function loadingWait(opts){
            if(opts.wait) throw "Your Request is processing Please Wait";
        }
      
      
        function sortCol(elm,opts,divId,$caption){
        	var dir="asc";
        	loadingWait(opts); // avoid processing new sort req when previous is loadingv
        	var prevHeader =$("th.respo_header_active");
            if(prevHeader.length !== 0){ // headerElmExist
        	   prevHeader.attr("class",prevHeader.attr("class").replace("respo_header_active",""));
            }
        	$(elm).attr("class",$(elm).attr("class")+" respo_header_active");
        	var sortElm = $("a.respo_sort_active",$(elm));
        	if(sortElm.length === 0){ // sortElm does not exist
        		$("a.respo_sort_icon").hide();
                sortElm = $("a.respo_sort_active");
                if(sortElm.length !== 0){ // sortElm exist
        		  sortElm.attr("class", sortElm.attr("class").replace("respo_sort_active",""));
                }
        		elm = $("a.respo_sort_up",$(elm));
        		elm.attr("class",elm.attr("class")+" respo_sort_active ");
        		elm.show();
        	}else{
        		sortElm.attr("class", sortElm.attr("class").replace("respo_sort_active",""));
        		sortElm.hide();
        		if(sortElm.attr("class").match("respo_sort_up")){
        			dir="desc";
        			elm=sortElm.next();
        		}else{
        			dir="asc";
        			elm=sortElm.prev();
        		}
        		elm.attr("class",elm.attr("class")+" respo_sort_active ");
        		elm.show();
        	}
        	var tableBody = $("table#body_"+divId);
        	var col = $(elm).attr("id");
        	col = col.substring(0,col.length-3);
        	removeDetailsWindow();
        	if(opts.source === "local" || opts.source === "loadOnSearch"){
        		opts.localData.sort(function(a,b){return sort(a,b,col,dir)});  
        	}else{ // ajax call
        		opts.sortCol=col; // update params used in making getListReq
        		opts.sortDir=dir; // update params used in making getListreq
        	}
            opts.page=1;
            //opts.data=getLocalData(opts);
        	processData(opts, function(args){
                //reset pagn option
                var pgs = opts.getTotalPages();
                $("select.respo_curr_page").val(1);
                var pagnParams = $("a.respo_pagn",$caption);
                pagnParams.attr("class","respo_pagn respo_pagn_disabled");
                pagnParams.parent().attr("class","disabled");
                if(pgs > 1) {
                    $("a.respo_pagn",$caption).each(function(){
                       if($(this).html() === "Next"){
                          $(this).attr("class","respo_pagn");
                          console.log($(this));
                          console.log($(this).parent());
                          $(this).parent().attr("class","");
                       }
                    }); //enable next button
                }
        		updateGrid(args,tableBody);
        	});
        }

        function toggleSortCols(elm,divId,dir){
        	$(elm).hide();
        	console.log($(elm).next());
        	if(dir === 'asc'){
        		$(elm).next().show();
        	}else{
        		$(elm).prev().show();
        	}
        	
        }
        
        function removeDetailsWindow(){
          $("a.respo_minimize").hide();
          $("tr.respo_details_row").remove();
          if(hiddenCols.length === 0) $("a.respo_expand").hide();
          else                        $("a.respo_expand").show();
        }

        function showDetails(elm,opts){
            var $elm = $(elm);
            $elm.hide();
            $elm.next().show(); 
            var tr = $elm.parent().parent();
            var desc = buildDesc($(tr).attr("id"));
            desc.insertAfter($(tr));
            initEditableCols(opts);
            // log(elm);
        }

        function hideDetails(elm){
            var $elm = $(elm);
            // elm.preventDefault();
            $elm.hide();
            $elm.prev().show(); 
            var tr = $elm.parent().parent();
            $(tr).next().remove();
            // log(elm); 
        }

        function buildDesc(id){
            var str = new Array();
            // var ht = hiddenCols.length;
            str.push("<tr id='"+id+"_details' class='respo_details_row'>");
            str.push("<td class='respo_details_backdrop' colspan='"+(colSpanSize - hiddenCols.length)+"'>");
            str.push(detailScreen(id));
            str.push("</td>");
            str.push("</tr>");
            return $(str.join(""));
        }
        
        function detailScreen(id){
            var str = new Array();
            str.push("<div id='"+id+"_div'>");
            str.push("<ul>");
            for(var i=0; i<hiddenCols.length; i++){
                var def=hiddenCols[i];
                str.push("<li>");
                str.push("<b>");
                str.push(def.label);
                str.push("</b> :&nbsp;&nbsp;");
                str.push(getRowVal(id,def.name));      
                str.push("</li>"); 
            }
            str.push("</ul>");
            str.push("</div>");
            return str.join("");
        }

        function getRowVal(id,name){
            var td = $("td."+name,$("tr#"+id));
            return $(td).html();
        }


        function resize($table,opts){
            var colDefs = opts.colDefs;
            var windowWidth=$(window).innerWidth();
//             console.log(windowWidth);
//             console.log("tableWidth"+totalWidth)
            if(totalWidth<= windowWidth){
                //show hidden columns in hidden Columns list
                while(hiddenCols.length >0){
                    var col = hiddenCols.pop(0);
                    if(totalWidth+col.minWidth > windowWidth){
                        hiddenCols.push(col);
                        break;
                    }
                    totalWidth += col.minWidth
                    $("."+col.name).show();
                    hideableCols.push(col);
                }
            } else{
                // hide columns in hideable columns list
                while(hideableCols.length >0){
                    var col = hideableCols.pop(0);
                    $("."+col.name).hide();
                    hiddenCols.push(col);
                    totalWidth -= col.minWidth;
                    if(totalWidth <= windowWidth) break;
                }  
            }
            // widthMap to be update here
            refreshWidthMap(colDefs);
            $("a.respo_minimize",$table).hide();
            $("tr.respo_details_row",$table).remove();
            if(hiddenCols.length === 0) $("a.respo_expand",$table).hide();
            else                        $("a.respo_expand",$table).show();
        }

        function refreshWidthMap(colDefs){
            // log(colDefs);
            for(var i=0; i<colDefs.length; i++){
                var def = colDefs[i];
                //TEMP fix below to remove padding from last element.. need a more reliable solution
                if(i === colDefs.length-1)  widthMap[def.name]= $("th."+def.name).width();// - scrollBarPadding;
                else                        widthMap[def.name]= $("th."+def.name).width();
            }
            // log(widthMap);
        }
        
                
        function updateGrid(opts, $elm){
            var data= opts.data;
            // // console.log($elm);
            var $tbody = $elm.find("tbody");
            // log($tbody.html());
            var $tr = $tbody.find("tr:first");
             // console.log($tr);
            for(var i=0; i<opts.data.length; i++){
                var row= data[i];
                // if(row.id) $tr.attr("id",row.id);
                var $td = $tr.find("td:first");
                // log($td);
                for(var j=0; j<opts.colDefs.length; j++){
                    var def = opts.colDefs[j];
                    var content = (def.format)? def.format(row[def.name],row) : row[def.name];
                    var $span = $td.find("span.respo_content_"+def.name);
                    if(def.editable){
                    	var $input = $span.find("input");
                        if($input.length === 0) $span.html(content);
                        else 					$input.val(content);
                    }else{
                    	 $span.html(content);
                    }
                   
                    $td = $td.next();
                }
                $tr = $tr.next();
                
            }
        }

        function reBuildBody(opts,divId){    	
        	if($('input#selectAll').is(":checked")){
        		$('input:checkbox[id=selectAll]').attr('checked',false);
        	}    	
             // console.log(divId);
            var $table = $("table#body_"+divId);
            // $table.html("Loading... ");
            var table = new Array();
            buildBody(table,opts,true);
            $table.html(table.join(""));

            $("a.respo_expand",$table).bind("click",function(event){ event.preventDefault(); showDetails(this,opts);});
            $("a.respo_minimize",$table).bind("click",function(event){ event.preventDefault();  hideDetails(this);});
            initEditableCols(opts);
            resize($table,opts);
            initTooltips(opts);
        }
        
        function initTooltips(){
        	$(document).ready(function(){
        		$(".respo_tooltip").tooltip({placement: 'top'});
        	});
        }
        function isHidden(name){
            for(var i=0; i<hiddenCols.length; i++){
                var col = hiddenCols[i];
                if (col.name === name) return true;
            }
            return false;
        }
        function buildBody(table,opts,rebuildFlag){
        	
            table.push('<tbody>');
//              console.log("Build Body "+opts.data.length);
            if(opts.data.length === 0){
                var colSpan = opts.colDefs.length-hiddenCols.length;
                table.push("<tr id='"+id+"' class='mainRow'>");
                table.push("<td style='text-align:center;' colspan='"+colSpan+"'>");
                table.push("<span  >No Data Found<span>");
                table.push("</td >");
                table.push("</tr>");
            }
            for(var i=0; i<opts.data.length; i++){
                var row = opts.data[i];
                var id = i;
                table.push("<tr id='respo_row_"+id+"' class='mainRow'>");
                for(var j=0; j<opts.colDefs.length; j++){
                    var def = opts.colDefs[j];
                    var align = (def.align) ? def.align : "left";
                    var width = (rebuildFlag)? /*widthMap[def.name] */def.minWidth :def.minWidth; //TODO need to rethink this
                    var hide = (isHidden(def.name)) ? "display:none;" : "";
                    // var hide ="";
                    table.push("<td class='"+def.name+"' style='word-wrap:break-word;width:"+width+"px;text-align:"+align+";"+hide+"'>");
                    if(def.main){
                      table.push("<a href='#' class='respo_expand icon-expand-alt icon-large' style='display:none;' >&nbsp;</a>");
                      table.push("<a href='#' class='respo_minimize icon-collapse-alt icon-large' style='display:none;' >&nbsp;</a>&nbsp;")  
                    } 
                    table.push("<span id='respo_content_"+def.name+"_"+i+"' class='respo_content_"+def.name+"'>");
                    var editFlag=false;
                    var content = (def.format)? def.format(row[def.name],row) : row[def.name];
                    if(def.editable){
                    	editFlag=true;
                    	if(opts.hasAcessPermission){ //added for role access integrations
                    		editFlag=opts.hasAcessPermission(def.name);
                    	}
                    	if(editFlag){
                    		 var editOpts=def.editOpts;
                             var size = editOpts.size || "small";
                             editableColsMap[def.name]=editOpts;
                             table.push('<div class="input-append ">');
                             table.push("<input id='respo_inline_edit_content~"+def.name+"~"+i+"' type='text' readonly='readonly' class='input-"+size+" respo_inline_edit_content_"+def.name+"' value='");
                             table.push(content);
                             table.push("'/>");
                             table.push('<span class="add-on">');
                             table.push("&nbsp;<a href='#' class='respo_inline_edit icon-edit ' title='Edit'   >&nbsp;</a>");    
                             table.push("&nbsp;<a href='#' class='respo_inline_edit_save icon-save' title='Save' style='display:none;'  >&nbsp;</a>");    
                             table.push("&nbsp;<a href='#' class='respo_inline_edit_cancel icon-ban-circle' title='Cancel' style='display:none;'  >&nbsp;</a>");
                             table.push('</span>');
                             table.push('</div>');
                    	}else{
                    		table.push(content);
                    	}
                    }else{
                         if(def.tooltip){
                        	 if(def.tooltip.truncate) {
                        		 content = "<span class='respo_tooltip' title='"+content+"' >" + content.substring(0,def.tooltip.truncate) + "</span>";
                        	 }else if(def.tooltip.def){
                        		 content=def.tooltip.def(row,content,def.name);
                        	 }else{
                        		//do nothing
                        	 }
                         }
                         table.push(content);
                    }
                    table.push("</span>");
                    table.push("</td>");
                }
                table.push("</tr>");
            }
            table.push('</tbody>');                 
//          // console.log(table.join());
        }

        function buildHeader(table,opts){
            table.push("<thead>");
            table.push("<tr class='mainHeaderRow'>");
            for(var i=0; i<opts.colDefs.length; i++){
                var def = opts.colDefs[i];
                if(def.localSearchOp){ //added to init searching opts
                	localSearchMap[def.name]=def.localSearchOp;
                }
                var wt =  def.minWidth;
                var padding="", pad = 0;
                if(i == opts.colDefs.length-1){
                    pad = scrollBarPadding;
                    padding="padding-right:"+scrollBarPadding+"px";
                }
                totalWidth += (wt + columnPadding + pad);  // 17px default header cellp adding by bootstrap
                if(def.hideable)hideableCols.push(def);
                var cursor = "", sortClazz="",activeClazz="";
                if(def.sort){
                	cursor= "cursor:pointer;";
                	sortClazz= "respo_sort";
                	if(opts.sortCol === def.name) 	activeClazz="respo_header_active";
                }
                table.push('<th class=" bluebackdrop '+def.name+' '+sortClazz+'  '+activeClazz+'" style="'+cursor+'word-wrap:break-word;width:'+wt+'px;'+padding+'" >');
                
                table.push(def.label);
                
                if(def.sort){
                	
                    var hideAsc="style='display:none;'",hideDesc="style='display:none;'", sortActiveAsc="",sortActiveDesc="";
                    if(opts.sortCol === def.name){
                 
                    	if(opts.sortDir === 'asc')	{ 	hideAsc="";  sortActiveAsc=" respo_sort_active " }
                    	else 						{   hideDesc=""; sortActiveDesc=" respo_sort_active "}
                    }
                    table.push("&nbsp;&nbsp;<span><a href='#' id='"+def.name+"Asc' class=' "+sortActiveAsc+" respo_sort_icon respo_sort_up icon-long-arrow-up icon-white'  "+hideAsc+">&nbsp;</a>" );
                    table.push("<a href='#' id='"+def.name+"Dsc' class=' "+sortActiveDesc+" respo_sort_icon respo_sort_down icon-long-arrow-down icon-white ' "+hideDesc+">&nbsp;</a>" );
                } 
                table.push('</th>');
            }
            table.push("</tr>");
            table.push("</thead>");

            hideableCols.sort(function(a,b){ return sort(a,b,"minWidth","asc");}); // sort by minWidth desc
        }

        

        function sort(a,b,field,dir){
            var val = ((a[field] < b[field]) ? -1 : ((a[field] > b[field]) ? 1 : 0));
            return (dir === "asc") ? val : -val;
        }

        function _validate(opts){

        	if(opts.params){
            	var p = {};
            	for(var param in opts.params){
            		var val = opts.params[param];
            		if($.trim(val).length !== 0) // remove empty val
            			p[param] = val;  
            	}
            	opts.params =p;
            }
        	
            if(opts.source === 'local'){
                if(!opts.page) opts.page=1;
                if(!opts.rowsPerPage) opts.rowsPerPage=opts.localData.length;
                if(opts.scrollBarPadding) scrollBarPadding=opts.scrollBarPadding;
            }else if(opts.source ==='ajax'){
                if(!opts.getList || !opts.getListHandler){
                    return "For source == 'ajax' , getList and getListHandler has to specified";
                }
                  
            }else  if(opts.source === 'loadOnSearch'){
                if(!opts.page) opts.page=1;
                if(!opts.getList || !opts.getListHandler){
                    return "For source == 'loadOnSearch' , getList and getListHandler has to specified";
                }
            }else{
                return "Invalid source type";
            }
                
            // check for mandatory colDef Params .. minWidth and name
            //check if rowsPerPage opt is put if opts are given
            return null;
        }
    //
//        function log(obj){
//            if(!debug) return;
//            // // console.log("Being called from"+arguments.callee.caller.toString())
//            if(console && log)  // console.log(obj);
//            else    alert(obj.toString());
//        }

        
        ///////////////////////////////HELPER FUNCTIONS END/////////////////////////////////////////
        
        
        var msg = _validate(opts);
        if(msg) throw msg;
        var $window = $(window);
        colSpanSize=opts.colDefs.length;
        //setDiv height and width
        var divId= opts.divId;
        var $div = $("#"+divId);
        // log($div);
        $div.css("overflow-y:auto;");
 
        // helper utility function used in pagination
        opts.getTotalPages = function(){
            var total = (this.source==="local") ? this.buff.length : ((this.total)? this.total : this.data.length);
            var rowsPerPage = this.rowsPerPage
            return (total % opts.rowsPerPage == 0) ? (total/opts.rowsPerPage) : parseInt((total/opts.rowsPerPage)) + 1;
        }

        //build gridHeader
        var table = new Array();
        table.push('<table id="head_'+divId+'" class="table table table-bordered table-striped" style="margin-bottom:0px;table-layout:fixed;">');
        buildHeader(table,opts);
        table.push('</table>');
        var $head = $(table.join(""));
        // log($head);
        $div.append($head);
        
        var ht = $window.innerHeight()*opts.height;
        var $loadingDiv = $(buildLoadingDiv(divId,ht));
        $div.append($loadingDiv);
        opts.$loading=$loadingDiv;
        var $bodyDiv = $('<div id="respoGridBody_'+divId+'" style="top:0px;overflow-y:scroll;height:'+ht+'px;border-bottom:1px solid #dddddd;"></div>');

        // build footer div
        
        var $foot = (opts.foot) ? $('<div id="respoGridFoot_'+divId+'" style="font-size:12px;line-height:20px;border-bottom:1px solid #dddddd;top:10px;">'+opts.foot+'</div>') : null;
        
        // Build Search div if given
        if(opts.searchDiv) buildSearchDiv(opts);
        
        
        // onload default sort
        if (opts.source === "local" ) {
            if(opts.sortCol){
                var dir = (opts.sortDir === 'desc') ? 'desc' : 'asc'; 
            opts.localData.sort(function(a,b){ return sort(a,b,opts.sortCol,dir)});    
            }
        }

        opts.divId = divId;
        opts.$bodyDiv = $bodyDiv;
        
        if(opts.source === "loadOnSearch"){
          opts.searchFlag=true;
        }
        //set data based on rowsPerPage
        processData(opts,function(args){
            buildTableFromData(args,divId,$bodyDiv,$div,$head,$foot);
        });
        
        return{
            search: function(params){
                search(opts,params,true);
                return this;
            },
            localSearch: function(params){ // used for loadOnce applicable only for loadonsearch Mode
            	console.log("local search call");
            	opts.localSearchCall=true; //used in getLocalData filter to apply filter based on search params
            	if(opts.source !== "loadOnSearch"){
            		alert("error.. call to this is only applicable for loadOnSearch mode");
            		return this;
            	}
                search(opts,params,false);
                opts.localSearchCall=false; // unset once done
                return this;
            }
        }
    };
    
    
    return{
        getInstance: getInstance // initialize respoTable

    }


});
