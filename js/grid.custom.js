/*jshint eqeqeq:false */
/*jslint browser: true, devel: true, eqeq: true, evil: true, nomen: true, plusplus: true, regexp: true, unparam: true, todo: true, vars: true, white: true, maxerr: 999 */
/*global jQuery */
(function($){
/**
 * jqGrid extension for custom methods
 * Tony Tomov tony@trirand.com
 * http://trirand.com/blog/
 *
 * Wildraid wildraid@mail.ru
 * Oleg Kiriljuk oleg.kiriljuk@ok-soft-gmbh.com
 * Dual licensed under the MIT and GPL licenses:
 * http://www.opensource.org/licenses/mit-license.php
 * http://www.gnu.org/licenses/gpl-2.0.html
**/
"use strict";
$.jgrid.extend({
	getColProp : function(colname){
		var ret ={}, $t = this[0];
		if ( !$t.grid ) { return false; }
		var cM = $t.p.colModel, i;
		for ( i=0;i<cM.length;i++ ) {
			if ( cM[i].name === colname ) {
				ret = cM[i];
				break;
			}
		}
		return ret;
	},
	setColProp : function(colname, obj){
		//do not set width will not work
		return this.each(function(){
			if ( this.grid ) {
				if ( obj ) {
					var cM = this.p.colModel, i;
					for ( i=0;i<cM.length;i++ ) {
						if ( cM[i].name === colname ) {
							$.extend(true, this.p.colModel[i],obj);
							break;
						}
					}
				}
			}
		});
	},
	sortGrid : function(colname, reload, sor){
		return this.each(function(){
			var self = this, grid = self.grid, p = self.p, colModel = p.colModel, l = colModel.length, cm, i, sobj = false, sort;
			if (!grid) { return; }
			if (!colname) { colname = p.sortname; }
			if (typeof reload !=='boolean') { reload = false; }
			for (i = 0; i < l; i++) {
				cm = colModel[i];
				if (cm.index === colname || cm.name === colname) {
					if (p.frozenColumns === true && cm.frozen === true) {
						sobj = grid.fhDiv.find("#" + p.id + "_" + colname);
					}
					if (!sobj || sobj.length === 0) {
						sobj = grid.headers[i].el;
					}
					sort = cm.sortable;
					if (typeof sort !== 'boolean' || sort) {
						self.sortData("jqgh_"+p.id+"_" + colname, i, reload, sor, sobj);
					}
					break;
				}
			}
		});
	},
	clearBeforeUnload : function () {
		return this.each(function(){
			var self = this, p = self.p, grid = self.grid, propOrMethod, clearArray = $.jgrid.clearArray;
			if ($.isFunction(grid.emptyRows)) {
				grid.emptyRows.call(self, true, true); // this work quick enough and reduce the size of memory leaks if we have someone
			}

			$(document).unbind("mouseup.jqGrid" + p.id ); 
			$(grid.hDiv).unbind("mousemove"); // TODO add namespace
			$(self).unbind();

			/*grid.dragEnd = null;
			grid.dragMove = null;
			grid.dragStart = null;
			grid.emptyRows = null;
			grid.populate = null;
			grid.populateVisible = null;
			grid.scrollGrid = null;
			grid.selectionPreserver = null;

			grid.bDiv = null;
			grid.cDiv = null;
			grid.hDiv = null;
			grid.cols = null;*/
			var i, l = grid.headers.length;
			for (i = 0; i < l; i++) {
				grid.headers[i].el = null;
			}
			for (propOrMethod in grid) {
				if (grid.hasOwnProperty(propOrMethod)) {
					grid.propOrMethod = null;
				}
			}

			/*self.formatCol = null;
			self.sortData = null;
			self.updatepager = null;
			self.refreshIndex = null;
			self.setHeadCheckBox = null;
			self.constructTr = null;
			self.formatter = null;
			self.addXmlData = null;
			self.addJSONData = null;
			self.grid = null;*/

			var propOrMethods = ['formatCol','sortData','updatepager','refreshIndex','setHeadCheckBox','constructTr','formatter','addXmlData','addJSONData','nav','grid','p'];
			l = propOrMethods.length;
			for(i = 0; i < l; i++) {
				if(self.hasOwnProperty(propOrMethods[i])) {
					self[propOrMethods[i]] = null;
				}
			}
			self._index = {};
			clearArray(p.data);
			clearArray(p.lastSelectedData);
			clearArray(p.selarrrow);
			clearArray(p.savedRow);
		});
	},
	GridDestroy : function () {
		return this.each(function(){
			if ( this.grid ) {
				if ( this.p.pager ) { // if not part of grid
					$(this.p.pager).remove();
				}
				try {
					$(this).jqGrid('clearBeforeUnload');
					$("#gbox_"+$.jgrid.jqID(this.id)).remove();
					$("#alertmod_"+$.jgrid.jqID(this.id)).remove();
				} catch (ignore) {}
			}
		});
	},
	GridUnload : function(){
		return this.each(function(){
			if ( !this.grid ) {return;}
			var defgrid = {id: $(this).attr('id'),cl: $(this).attr('class')};
			if (this.p.pager) {
				$(this.p.pager).empty().removeClass("ui-state-default ui-jqgrid-pager ui-corner-bottom");
			}
			var newtable = document.createElement('table');
			$(newtable).attr({id:defgrid.id});
			newtable.className = defgrid.cl;
			var gid = $.jgrid.jqID(this.id);
			$(newtable).removeClass("ui-jqgrid-btable");
			if( $(this.p.pager).parents("#gbox_"+gid).length === 1 ) {
				$(newtable).insertBefore("#gbox_"+gid).show();
				$(this.p.pager).insertBefore("#gbox_"+gid);
			} else {
				$(newtable).insertBefore("#gbox_"+gid).show();
			}
			$(this).jqGrid('clearBeforeUnload');
			$("#gbox_"+gid).remove();
		});
	},
	setGridState : function(state) {
		return this.each(function(){
			if ( !this.grid ) {return;}
			var $t = this;
			if(state === 'hidden'){
				$(".ui-jqgrid-bdiv, .ui-jqgrid-hdiv","#gview_"+$.jgrid.jqID($t.p.id)).slideUp("fast");
				if($t.p.pager) {$($t.p.pager).slideUp("fast");}
				if($t.p.toppager) {$($t.p.toppager).slideUp("fast");}
				if($t.p.toolbar[0]===true) {
					if( $t.p.toolbar[1] === 'both') {
						$($t.grid.ubDiv).slideUp("fast");
					}
					$($t.grid.uDiv).slideUp("fast");
				}
				if($t.p.footerrow) { $(".ui-jqgrid-sdiv","#gbox_"+$.jgrid.jqID($t.p.id)).slideUp("fast"); }
				$(".ui-jqgrid-titlebar-close span",$t.grid.cDiv).removeClass("ui-icon-circle-triangle-n").addClass("ui-icon-circle-triangle-s");
				$t.p.gridstate = 'hidden';
			} else if(state === 'visible') {
				$(".ui-jqgrid-hdiv, .ui-jqgrid-bdiv","#gview_"+$.jgrid.jqID($t.p.id)).slideDown("fast");
				if($t.p.pager) {$($t.p.pager).slideDown("fast");}
				if($t.p.toppager) {$($t.p.toppager).slideDown("fast");}
				if($t.p.toolbar[0]===true) {
					if( $t.p.toolbar[1] === 'both') {
						$($t.grid.ubDiv).slideDown("fast");
					}
					$($t.grid.uDiv).slideDown("fast");
				}
				if($t.p.footerrow) { $(".ui-jqgrid-sdiv","#gbox_"+$.jgrid.jqID($t.p.id)).slideDown("fast"); }
				$(".ui-jqgrid-titlebar-close span",$t.grid.cDiv).removeClass("ui-icon-circle-triangle-s").addClass("ui-icon-circle-triangle-n");
				$t.p.gridstate = 'visible';
			}

		});
	},
	filterToolbar : function(p){
            var body = $('body');
		p = $.extend({
			autosearch: true,
			autosearchDelay: 500,
			searchOnEnter : true,
			beforeSearch: null,
			afterSearch: null,
			beforeClear: null,
			afterClear: null,
			searchurl : '',
			stringResult: false,
			groupOp: 'AND',
			defaultSearch : "bw",
			searchOperators : false,
			resetIcon : "x",
			operands : { "eq" :"==", "ne":"!","lt":"<","le":"<=","gt":">","ge":">=","bw":"^","bn":"!^","in":"=","ni":"!=","ew":"|","en":"!@","cn":"~","nc":"!~","nu":"#","nn":"!#"}
		}, $.jgrid.search , p  || {});
		return this.each(function(){
			var $t = this;
			if(this.ftoolbar) { return; }
			var triggerToolbar = function() {
				var sdata={}, j=0, v, nm, sopt={},so;
				$.each($t.p.colModel,function(){
					var $elem = $("#gs_"+$.jgrid.jqID(this.name), (this.frozen===true && $t.p.frozenColumns === true) ?  $t.grid.fhDiv : $t.grid.hDiv);
					nm = this.index || this.name;
					if(p.searchOperators ) {
						so = $elem.parent().prev("a").attr("soper") || p.defaultSearch;
					} else {
						so  = (this.searchoptions && this.searchoptions.sopt) ? this.searchoptions.sopt[0] : this.stype==='select'?  'eq' : p.defaultSearch;
					}
					v = this.stype === "custom" && $.isFunction(this.searchoptions.custom_value) && $elem.length > 0 && $elem[0].nodeName.toUpperCase() === "SPAN" ?
						this.searchoptions.custom_value.call($t, $elem.children(".customelement:first"), "get") :
						$elem.val();
					if(v || so==="nu" || so==="nn") {
						sdata[nm] = v;
						sopt[nm] = so;
						j++;
					} else {
						try {
							delete $t.p.postData[nm];
						} catch (ignore) {}
					}
				});
				var sd =  j>0 ? true : false;
				if(p.stringResult === true || $t.p.datatype === "local" || p.searchOperators === true) {
					var ruleGroup = "{\"groupOp\":\"" + p.groupOp + "\",\"rules\":[";
					var gi=0;
					$.each(sdata,function(i,n){
						if (gi > 0) {ruleGroup += ",";}
						ruleGroup += "{\"field\":\"" + i + "\",";
						ruleGroup += "\"op\":\"" + sopt[i] + "\",";
						n+="";
						ruleGroup += "\"data\":\"" + n.replace(/\\/g,'\\\\').replace(/\"/g,'\\"') + "\"}";
						gi++;
					});
					ruleGroup += "]}";
					$.extend($t.p.postData,{filters:ruleGroup});
					$.each(['searchField', 'searchString', 'searchOper'], function(i, n){
						if($t.p.postData.hasOwnProperty(n)) { delete $t.p.postData[n];}
					});
				} else {
					$.extend($t.p.postData,sdata);
				}
				var saveurl;
				if($t.p.searchurl) {
					saveurl = $t.p.url;
					$($t).jqGrid("setGridParam",{url:$t.p.searchurl});
				}
				var bsr = $($t).triggerHandler("jqGridToolbarBeforeSearch") === 'stop' ? true : false;
				if(!bsr && $.isFunction(p.beforeSearch)){bsr = p.beforeSearch.call($t);}
				if(!bsr) { $($t).jqGrid("setGridParam",{search:sd}).trigger("reloadGrid",[{page:1}]); }
				if(saveurl) {$($t).jqGrid("setGridParam",{url:saveurl});}
				$($t).triggerHandler("jqGridToolbarAfterSearch");
				if($.isFunction(p.afterSearch)){p.afterSearch.call($t);}
			},
			clearToolbar = function(trigger){
				var sdata={}, j=0, nm;
				trigger = (typeof trigger !== 'boolean') ? true : trigger;
				$.each($t.p.colModel,function(){
					var v, $elem = $("#gs_"+$.jgrid.jqID(this.name),(this.frozen===true && $t.p.frozenColumns === true) ?  $t.grid.fhDiv : $t.grid.hDiv);
					if(this.searchoptions && this.searchoptions.defaultValue !== undefined) { v = this.searchoptions.defaultValue; }
					nm = this.index || this.name;
					switch (this.stype) {
						case 'select' :
							$elem.find("option").each(function (i){
								if(i===0) { this.selected = true; }
								if ($(this).val() === v) {
									this.selected = true;
									return false;
								}
							});
							if ( v !== undefined ) {
								// post the key and not the text
								sdata[nm] = v;
								j++;
							} else {
								try {
									delete $t.p.postData[nm];
								} catch(ignore) {}
							}
							break;
						case 'text':
							$elem.val(v || "");
							if(v !== undefined) {
								sdata[nm] = v;
								j++;
							} else {
								try {
									delete $t.p.postData[nm];
								} catch (ignore){}
							}
							break;
						case 'custom':
							if ($.isFunction(this.searchoptions.custom_value) && $elem.length > 0 && $elem[0].nodeName.toUpperCase() === "SPAN") {
								this.searchoptions.custom_value.call($t, $elem.children(".customelement:first"), "set", v || "");
							}
							break;
					}
				});
				var sd =  j>0 ? true : false;
				$t.p.resetsearch =  true;
				if(p.stringResult === true || $t.p.datatype === "local") {
					var ruleGroup = "{\"groupOp\":\"" + p.groupOp + "\",\"rules\":[";
					var gi=0;
					$.each(sdata,function(i,n){
						if (gi > 0) {ruleGroup += ",";}
						ruleGroup += "{\"field\":\"" + i + "\",";
						ruleGroup += "\"op\":\"" + "eq" + "\",";
						n+="";
						ruleGroup += "\"data\":\"" + n.replace(/\\/g,'\\\\').replace(/\"/g,'\\"') + "\"}";
						gi++;
					});
					ruleGroup += "]}";
					$.extend($t.p.postData,{filters:ruleGroup});
					$.each(['searchField', 'searchString', 'searchOper'], function(i, n){
						if($t.p.postData.hasOwnProperty(n)) { delete $t.p.postData[n];}
					});
				} else {
					$.extend($t.p.postData,sdata);
				}
				var saveurl;
				if($t.p.searchurl) {
					saveurl = $t.p.url;
					$($t).jqGrid("setGridParam",{url:$t.p.searchurl});
				}
				var bcv = $($t).triggerHandler("jqGridToolbarBeforeClear") === 'stop' ? true : false;
				if(!bcv && $.isFunction(p.beforeClear)){bcv = p.beforeClear.call($t);}
				if(!bcv) {
					if(trigger) {
						$($t).jqGrid("setGridParam",{search:sd}).trigger("reloadGrid",[{page:1}]);
					}
				}
				if(saveurl) {$($t).jqGrid("setGridParam",{url:saveurl});}
				$($t).triggerHandler("jqGridToolbarAfterClear");
				if($.isFunction(p.afterClear)){p.afterClear();}
			},
			toggleToolbar = function(){
				var trow = $("tr.ui-search-toolbar",$t.grid.hDiv),
				trow2 = $t.p.frozenColumns === true ?  $("tr.ui-search-toolbar",$t.grid.fhDiv) : false;
				if(trow.css("display") === 'none') {
					trow.show();
					if(trow2) {
						trow2.show();
					}
				} else {
					trow.hide();
					if(trow2) {
						trow2.hide();
					}
				}
			},
			buildRuleMenu = function( elem, left, top ){
				left=parseInt(left,10);
				top=parseInt(top,10) + 18;
				var str = '<div id="sopt_menu" class="ui-search-menu" role="menu" style="left:'+left+'px;top:'+top+'px;">',
                                    selected = $(elem).attr("soper"), sopt_menu = $("#sopt_menu"),
                                    aoprs = [], ina, i=0, nm =$(elem).attr("colname"),len = $t.p.colModel.length;
                            
                                sopt_menu.remove();
				while(i<len) {
					if($t.p.colModel[i].name === nm) {break;}
					i++;
				}
                                
				var cm = $t.p.colModel[i], options = $.extend({}, cm.searchoptions);
				if(!options.sopt) {
					options.sopt = [];
					options.sopt[0]= cm.stype==='select' ?  'eq' : p.defaultSearch;
				}
                                
				$.each(p.odata, function() { aoprs.push(this.oper); });
				for ( i = 0 ; i < options.sopt.length; i++) {
					ina = $.inArray(options.sopt[i],aoprs);
					if(ina !== -1) {
                                            str += '<a class="ui-corner-all g-menu-item" role="menuitem" value="'+p.odata[ina].oper+'" oper="'+p.operands[p.odata[ina].oper]+'"><span class="sopt-menu-operand">'+p.operands[p.odata[ina].oper]+'</span> <span>'+ p.odata[ina].text+'</span></a>';
					}
				}
                                
				str += "</div>";
				body.append(str);
				var sopt_menu = $("#sopt_menu");
                                sopt_menu.addClass("ui-menu ui-widget");
				$("a", sopt_menu).hover(
					function(){ $(this).addClass("ui-state-hover").css('font-weight', 'normal'); },
					function(){ $(this).removeClass("ui-state-hover"); }
				).click(function(){
					var v = $(this).attr("value"),
					oper = $(this).attr("oper");
					$($t).triggerHandler("jqGridToolbarSelectOper", [v, oper, elem]);
					sopt_menu.hide();
					$(elem).text(oper).attr("soper",v);
					if(p.autosearch===true){
						var inpelm = $(elem).parent().next().children()[0];
						if( $(inpelm).val() || v==="nu" || v ==="nn") {
							triggerToolbar();
						}
					}
				});
			};
			// create the row
			var tr = $("<tr class='ui-search-toolbar' role='row'></tr>");
			var timeoutHnd;
			$.each($t.p.colModel,function(ci){
				var cm=this, soptions, surl, self, select = "", sot="=", so, i,
				th = $("<th role='columnheader' class='ui-state-default ui-th-column ui-th-"+$t.p.direction+"'><span class='ui-search-input'></span></th>");
				if(this.hidden===true) { $(th).css("display","none");}
				this.search = this.search === false ? false : true;
				soptions = $.extend({},this.searchoptions || {});
				if(this.search){
					if(this.stype === undefined) {this.stype='text';}
					if(p.searchOperators && cm.edittype !== 'checkbox') {
						so  = (soptions.sopt) ? soptions.sopt[0] : cm.stype==='select' ?  'eq' : p.defaultSearch;
						for(i = 0;i<p.odata.length;i++) {
							if(p.odata[i].oper === so) {
								sot = p.operands[so] || "";
								break;
							}
						}
						var st = soptions.searchtitle != null ? soptions.searchtitle : p.operandTitle;
						select = "<a title='"+st+"' soper='"+so+"' class='soptclass' colname='"+this.name+"'>"+sot+"</a>";
					$(th).prepend(select);
					}

					if (soptions.sopt == null || soptions.sopt.length === 1) {
						$("td.ui-search-oper",th).hide();
					}
					if(soptions.clearSearch === undefined) {
						soptions.clearSearch = this.stype === "text" ? true : false;
					}
					if(soptions.clearSearch && cm.stype !== 'select') {
						var csv = p.resetTitle || 'Clear Search Value';
						$(th).append("<a title='Clear Search Value' class='clearsearchclass'>x</a>");
					}
					switch (this.stype)
					{
					case "select":
						surl = this.surl || soptions.dataUrl;
						if(surl) {
							// data returned should have already constructed html select
							// primitive jQuery load
							self = th;
							$.ajax($.extend({
								url: surl,
								dataType: "html",
								success: function(res) {
									if(soptions.buildSelect !== undefined) {
										var d = soptions.buildSelect(res);
										if (d) {
											$("span.ui-search-input",th).append(d);
										}
									} else {
										$("span.ui-search-input",th).append(res);
									}
									$(self).append(stbl);
                                                                        var select = $("select",self);
									if(soptions.defaultValue !== undefined) { select.val(soptions.defaultValue); }
									select.attr({name:cm.index || cm.name, id: "gs_"+cm.name});
									if(soptions.attr) {select.attr(soptions.attr);}
									// preserve autosearch
									$.jgrid.bindEv.call($t, select[0], soptions);
									if(p.autosearch===true){
										select.change(function(){
											triggerToolbar();
											return false;
										});
									}
									res=null;
								}
							}, $.jgrid.ajaxOptions, $t.p.ajaxSelectOptions || {} ));
						} else {
							var oSv, sep, delim;
							if(cm.searchoptions) {
								oSv = cm.searchoptions.value === undefined ? false : cm.searchoptions.value;
								sep = cm.searchoptions.separator === undefined ? ":" : cm.searchoptions.separator;
								delim = cm.searchoptions.delimiter === undefined ? ";" : cm.searchoptions.delimiter;
							} else if(cm.editoptions) {
								oSv = cm.editoptions.value === undefined ? false : cm.editoptions.value;
								sep = cm.editoptions.separator === undefined ? ":" : cm.editoptions.separator;
								delim = cm.editoptions.delimiter === undefined ? ";" : cm.editoptions.delimiter;
							}
							if (oSv !== false) {
								var elem = document.createElement("select");
								$(elem).attr({name:cm.index || cm.name, id: "gs_"+cm.name});
								var sv, ov, key, k;
								if(typeof oSv === "string") {
									so = oSv.split(delim);
									for(k=0; k<so.length;k++){
										sv = so[k].split(sep);
										ov = document.createElement("option");
										ov.value = sv[0]; ov.innerHTML = sv[1];
										elem.appendChild(ov);
									}
								} else if(typeof oSv === "object" ) {
									for (key in oSv) {
										if(oSv.hasOwnProperty(key)) {
											ov = document.createElement("option");
											ov.value = key; ov.innerHTML = oSv[key];
											elem.appendChild(ov);
										}
									}
								}
								if(soptions.defaultValue !== undefined) { $(elem).val(soptions.defaultValue); }
								if(soptions.attr) {$(elem).attr(soptions.attr);}
								$("span.ui-search-input",th).append( elem );
								$(th).append(th);
								$.jgrid.bindEv.call($t, elem , soptions);
								if(p.autosearch===true){
									$(elem).change(function(){
										triggerToolbar();
										return false;
									});
								}
							}
						}
						break;
					case "text":
						var df = soptions.defaultValue !== undefined ? soptions.defaultValue: "";

						$("span.ui-search-input",th).append("<input type='text' name='"+(cm.index || cm.name)+"' id='gs_"+cm.name+"' value='"+df+"'/>");
                                                var input = $("input",th);

						if(soptions.attr) {input.attr(soptions.attr);}
						$.jgrid.bindEv.call($t, input[0], soptions);
						if(p.autosearch===true){
							if(p.searchOnEnter) {
								input.keypress(function(e){
									var key1 = e.charCode || e.keyCode || 0;
									if(key1 === 13){
										triggerToolbar();
										return false;
									}
									return this;
								});
							} else {
								input.keydown(function(e){
									var key1 = e.which;
									switch (key1) {
										case 13:
											return false;
										case 9 :
										case 16:
										case 37:
										case 38:
										case 39:
										case 40:
										case 27:
											break;
										default :
											if(timeoutHnd) { clearTimeout(timeoutHnd); }
											timeoutHnd = setTimeout(function(){triggerToolbar();}, p.autosearchDelay);
									}
								});
							}
						}
						break;
					case "custom":
						$("span.ui-search-input",th).append("<span style='width:95%;padding:0;' name='"+(cm.index || cm.name)+"' id='gs_"+cm.name+"'/>");
						try {
							if($.isFunction(soptions.custom_element)) {
								var celm = soptions.custom_element.call($t,soptions.defaultValue !== undefined ? soptions.defaultValue: "",soptions);
								if(celm) {
									celm = $(celm).addClass("customelement");
									$(th).find("span[name='" + (cm.index || cm.name) + "']").append(celm);
								} else {
									throw "e2";
								}
							} else {
								throw "e1";
							}
						} catch (e) {
							if (e === "e1") { $.jgrid.info_dialog($.jgrid.errors.errcap,"function 'custom_element' "+$.jgrid.edit.msg.nodefined,$.jgrid.edit.bClose);}
							if (e === "e2") { $.jgrid.info_dialog($.jgrid.errors.errcap,"function 'custom_element' "+$.jgrid.edit.msg.novalue,$.jgrid.edit.bClose);}
							else { $.jgrid.info_dialog($.jgrid.errors.errcap,typeof e==="string"?e:e.message,$.jgrid.edit.bClose); }
						}
						break;
					}
				}

				$(tr).append(th);
				if(!p.searchOperators) {
					$("a:first-child)",th).hide();
				}
			});
			$("table thead",$t.grid.hDiv).append(tr);
			if(p.searchOperators) {
				$(".soptclass",tr).click(function(e){
					var offset = $(this).offset(),
					left = ( offset.left ),
					top = ( offset.top);
					buildRuleMenu(this, left, top );
					e.stopPropagation();
				});
				body.on('click', function(e){
					if(e.target.className !== "soptclass") {
						$("#sopt_menu").hide();
					}
				});
			}
			$(".clearsearchclass",tr).click(function(){
				var ptr = $(this).parents("tr:first"),
				col = $('th',ptr).index($(this).parents('th:first')),
				sval  = $.extend({},$t.p.colModel[col].searchoptions || {}),
				dval = sval.defaultValue || "";
				if($t.p.colModel[col].stype === "select") {
					if(dval) {
						$(".ui-search-input select", ptr).val( dval );
					} else {
						$(".ui-search-input select", ptr)[0].selectedIndex = 0;
					}
				} else {
					$(".ui-search-input input", ptr).val( dval );
				}
				// ToDo custom search type
				if(p.autosearch===true){
					triggerToolbar();
				}

			});
			this.ftoolbar = true;
			this.triggerToolbar = triggerToolbar;
			this.clearToolbar = clearToolbar;
			this.toggleToolbar = toggleToolbar;
                        
                        var self = this;
                        $("span.ui-search-input input",tr).each(function(){
                            $(self).resizeFilterToolbarInput($(this));
                        });
		});
	},
        resizeFilterToolbarInput: function(input){
            input.css('width', input.parents('th').width() - 20);
        },
	destroyFilterToolbar: function () {
		return this.each(function () {
			if (!this.ftoolbar) {
				return;
			}
			this.triggerToolbar = null;
			this.clearToolbar = null;
			this.toggleToolbar = null;
			this.ftoolbar = false;
			$(this.grid.hDiv).find("table thead tr.ui-search-toolbar").remove();
		});
	},
	destroyGroupHeader : function(nullHeader)
	{
		if(nullHeader === undefined) {
			nullHeader = true;
		}
		return this.each(function()
		{
			var $t = this, $tr, i, l, headers, $th, $resizing, grid = $t.grid,
			thead = $("table.ui-jqgrid-htable thead", grid.hDiv), cm = $t.p.colModel, hc;
			if(!grid) { return; }

			$(this).unbind('.setGroupHeaders');
			$tr = $("<tr>", {role: "row"}).addClass("ui-jqgrid-labels");
			headers = grid.headers;
			for (i = 0, l = headers.length; i < l; i++) {
				hc = cm[i].hidden ? "none" : "";
				$th = $(headers[i].el)
					.width(headers[i].width)
					.css('display',hc);
				try {
					$th.removeAttr("rowSpan");
				} catch (rs) {
					//IE 6/7
					$th.attr("rowSpan",1);
				}
				$tr.append($th);
				$resizing = $th.children("span.ui-jqgrid-resize");
				if ($resizing.length>0) {// resizable column
					$resizing[0].style.height = "";
				}
				$th.children("div")[0].style.top = "";
			}
			$(thead).children('tr.ui-jqgrid-labels').remove();
			$(thead).prepend($tr);

			if(nullHeader === true) {
				$($t).jqGrid('setGridParam',{ 'groupHeader': null});
			}
		});
	},
	setGroupHeaders : function ( o ) {
		o = $.extend({
			useColSpanStyle :  false,
			groupHeaders: []
		},o  || {});
		return this.each(function(){
			this.p.groupHeader = o;
			var ts = this,
			i, cmi, skip = 0, $tr, $colHeader, th, $th, thStyle,
			iCol,
			cghi,
			//startColumnName,
			numberOfColumns,
			titleText,
			cVisibleColumns,
			colModel = ts.p.colModel,
			cml = colModel.length,
			ths = ts.grid.headers,
			$htable = $("table.ui-jqgrid-htable", ts.grid.hDiv),
			$trLabels = $htable.children("thead").children("tr.ui-jqgrid-labels:last").addClass("jqg-second-row-header"),
			$thead = $htable.children("thead"),
			$theadInTable,
			$firstHeaderRow = $htable.find(".jqg-first-row-header");
			if($firstHeaderRow[0] === undefined) {
				$firstHeaderRow = $('<tr>', {role: "row", "aria-hidden": "true"}).addClass("jqg-first-row-header").css("height", "auto");
			} else {
				$firstHeaderRow.empty();
			}
			var $firstRow,
			inColumnHeader = function (text, columnHeaders) {
				var length = columnHeaders.length, j;
				for (j = 0; j < length; j++) {
					if (columnHeaders[j].startColumnName === text) {
						return j;
					}
				}
				return -1;
			};

			$(ts).prepend($thead);
			$tr = $('<tr>', {role: "row"}).addClass("ui-jqgrid-labels jqg-third-row-header");
			for (i = 0; i < cml; i++) {
				th = ths[i].el;
				$th = $(th);
				cmi = colModel[i];
				// build the next cell for the first header row
				thStyle = { height: '0', width: ths[i].width + 'px', display: (cmi.hidden ? 'none' : '')};
				$("<th>", {role: 'gridcell'}).css(thStyle).addClass("ui-first-th-"+ts.p.direction).appendTo($firstHeaderRow);

				th.style.width = ""; // remove unneeded style
				iCol = inColumnHeader(cmi.name, o.groupHeaders);
				if (iCol >= 0) {
					cghi = o.groupHeaders[iCol];
					numberOfColumns = cghi.numberOfColumns;
					titleText = cghi.titleText;

					// caclulate the number of visible columns from the next numberOfColumns columns
					for (cVisibleColumns = 0, iCol = 0; iCol < numberOfColumns && (i + iCol < cml); iCol++) {
						if (!colModel[i + iCol].hidden) {
							cVisibleColumns++;
						}
					}

					// The next numberOfColumns headers will be moved in the next row
					// in the current row will be placed the new column header with the titleText.
					// The text will be over the cVisibleColumns columns
					$colHeader = $('<th>').attr({role: "columnheader"})
						.addClass("ui-state-default ui-th-column-header ui-th-"+ts.p.direction)
						.css({'height':'22px', 'border-top': '0 none'})
						.html(titleText);
					if(cVisibleColumns > 0) {
						$colHeader.attr("colspan", String(cVisibleColumns));
					}
					if (ts.p.headertitles) {
						$colHeader.attr("title", $colHeader.text());
					}
					// hide if not a visible cols
					if( cVisibleColumns === 0) {
						$colHeader.hide();
					}

					$th.before($colHeader); // insert new column header before the current
					$tr.append(th);         // move the current header in the next row

					// set the coumter of headers which will be moved in the next row
					skip = numberOfColumns - 1;
				} else {
					if (skip === 0) {
						if (o.useColSpanStyle) {
							// expand the header height to two rows
							$th.attr("rowspan", "2");
						} else {
							$('<th>', {role: "columnheader"})
								.addClass("ui-state-default ui-th-column-header ui-th-"+ts.p.direction)
								.css({"display": cmi.hidden ? 'none' : '', 'border-top': '0 none'})
								.insertBefore($th);
							$tr.append(th);
						}
					} else {
						// move the header to the next row
						$tr.append(th);
						skip--;
					}
				}
			}
			$theadInTable = $(ts).children("thead");
			$theadInTable.prepend($firstHeaderRow);
			$tr.insertAfter($trLabels);
			$htable.append($theadInTable);

			if (o.useColSpanStyle) {
				// Increase the height of resizing span of visible headers
				$htable.find("span.ui-jqgrid-resize").each(function () {
					var $parent = $(this).parent();
					if ($parent.is(":visible")) {
						this.style.cssText = 'height: ' + $parent.height() + 'px !important; cursor: col-resize;';
					}
				});

				// Set position of the sortable div (the main lable)
				// with the column header text to the middle of the cell.
				// One should not do this for hidden headers.
				$htable.find("div.ui-jqgrid-sortable").each(function () {
					var $ts = $(this), $parent = $ts.parent();
					if ($parent.is(":visible") && $parent.is(":has(span.ui-jqgrid-resize)")) {
						$ts.css('top', ($parent.height() - $ts.outerHeight()) / 2 + 'px');
					}
				});
			}

			$firstRow = $theadInTable.find("tr.jqg-first-row-header");
			$(ts).bind('jqGridResizeStop.setGroupHeaders', function (e, nw, idx) {
				$firstRow.find('th').eq(idx).width(nw);
			});
		});
	},
	setFrozenColumns : function () {
		return this.each(function() {
			if ( !this.grid ) {return;}
			var $t = this, p = $t.p, cm = p.colModel,i=0, len = cm.length, maxfrozen = -1, frozen= false;
			// TODO treeGrid and grouping  Support
			if(p.subGrid === true || p.treeGrid === true || p.cellEdit === true || p.sortable || p.scroll )
			{
				return;
			}
			if(p.rownumbers) { i++; }
			if(p.multiselect) { i++; }
			
			// get the max index of frozen col
			while(i<len)
			{
				// from left, no breaking frozen
				if(cm[i].frozen === true)
				{
					frozen = true;
					maxfrozen = i;
				} else {
					break;
				}
				i++;
			}
			if( maxfrozen>=0 && frozen) {
				var top = p.caption ? $($t.grid.cDiv).outerHeight() : 0,
				hth = $(".ui-jqgrid-htable","#gview_"+$.jgrid.jqID(p.id)).height();
				//headers
				if(p.toppager) {
					top = top + $($t.grid.topDiv).outerHeight();
				}
				if(p.toolbar[0] === true) {
					if(p.toolbar[1] !== "bottom") {
						top = top + $($t.grid.uDiv).outerHeight();
					}
				}
				$t.grid.fhDiv = $('<div style="position:absolute;left:0;top:'+top+'px;height:'+hth+'px;" class="frozen-div ui-state-default ui-jqgrid-hdiv"></div>');
				$t.grid.fbDiv = $('<div style="position:absolute;left:0;top:'+(parseInt(top,10)+parseInt(hth,10) + 1)+'px;overflow-y:hidden" class="frozen-bdiv ui-jqgrid-bdiv"></div>');
				$("#gview_"+$.jgrid.jqID(p.id)).append($t.grid.fhDiv);
				var htbl = $(".ui-jqgrid-htable","#gview_"+$.jgrid.jqID(p.id)).clone(true);
				// groupheader support - only if useColSpanstyle is false
				if(p.groupHeader) {
					$("tr.jqg-first-row-header, tr.jqg-third-row-header", htbl).each(function(){
						$("th:gt("+maxfrozen+")",this).remove();
					});
					var swapfroz = -1, fdel = -1, cs, rs;
					$("tr.jqg-second-row-header th", htbl).each(function(){
						cs= parseInt($(this).attr("colspan"),10);
						rs= parseInt($(this).attr("rowspan"),10);
						if(rs) {
							swapfroz++;
							fdel++;
						}
						if(cs) {
							swapfroz = swapfroz+cs;
							fdel++;
						}
						if(swapfroz === maxfrozen) {
							return false;
						}
					});
					if(swapfroz !== maxfrozen) {
						fdel = maxfrozen;
					}
					$("tr.jqg-second-row-header", htbl).each(function(){
						$("th:gt("+fdel+")",this).remove();
					});
				} else {
					$("tr",htbl).each(function(){
						$("th:gt("+maxfrozen+")",this).remove();
					});
				}
				$(htbl).width(1);
				// resizing stuff
				$($t.grid.fhDiv).append(htbl)
				.mousemove(function (e) {
					if($t.grid.resizing){ $t.grid.dragMove(e);return false; }
				});
				if(p.footerrow) {
					var hbd = $(".ui-jqgrid-bdiv","#gview_"+$.jgrid.jqID(p.id)).height();

					$t.grid.fsDiv = $('<div style="position:absolute;left:0;top:'+(parseInt(top,10)+parseInt(hth,10) + parseInt(hbd,10)+1)+'px;" class="frozen-sdiv ui-jqgrid-sdiv"></div>');
					$("#gview_"+$.jgrid.jqID(p.id)).append($t.grid.fsDiv);
					var ftbl = $(".ui-jqgrid-ftable","#gview_"+$.jgrid.jqID(p.id)).clone(true);
					$("tr",ftbl).each(function(){
						$("td:gt("+maxfrozen+")",this).remove();
					});
					$(ftbl).width(1);
					$($t.grid.fsDiv).append(ftbl);
				}
				$($t).bind('jqGridResizeStop.setFrozenColumns', function (e, w, index) {
					var rhth = $(".ui-jqgrid-htable",$t.grid.fhDiv);
					$("th:eq("+index+")",rhth).width( w );
					var btd = $(".ui-jqgrid-btable",$t.grid.fbDiv);
					$("tr:first td:eq("+index+")",btd).width( w );
					if(p.footerrow) {
						var ftd = $(".ui-jqgrid-ftable",$t.grid.fsDiv);
						$("tr:first td:eq("+index+")",ftd).width( w );
					}
				});
				// sorting stuff
				$($t).bind('jqGridSortCol.setFrozenColumns', function (e, index, idxcol) {

					var previousSelectedTh = $("tr.ui-jqgrid-labels:last th:eq("+p.lastsort+")",$t.grid.fhDiv), newSelectedTh = $("tr.ui-jqgrid-labels:last th:eq("+idxcol+")",$t.grid.fhDiv);

					$("span.ui-grid-ico-sort",previousSelectedTh).addClass('ui-state-disabled');
					$(previousSelectedTh).attr("aria-selected","false");
					$("span.ui-icon-"+p.sortorder,newSelectedTh).removeClass('ui-state-disabled');
					$(newSelectedTh).attr("aria-selected","true");
					if(!p.viewsortcols[0]) {
						if(p.lastsort !== idxcol) {
							$("span.s-ico",previousSelectedTh).hide();
							$("span.s-ico",newSelectedTh).show();
						}
					}
				});

				// data stuff
				//TODO support for setRowData
				$("#gview_"+$.jgrid.jqID(p.id)).append($t.grid.fbDiv);
				$($t.grid.bDiv).scroll(function () {
					$($t.grid.fbDiv).scrollTop($(this).scrollTop());
				});
				if(p.hoverrows === true) {
					$("#"+$.jgrid.jqID(p.id)).unbind('mouseover').unbind('mouseout');
				}
				$($t).bind('jqGridAfterGridComplete.setFrozenColumns', function () {
					$("#"+$.jgrid.jqID(p.id)+"_frozen").remove();
					$($t.grid.fbDiv).height($($t.grid.bDiv).height()-16);
					var btbl = $("#"+$.jgrid.jqID(p.id)).clone(true);
					$("tr[role=row]",btbl).each(function(){
						$("td[role=gridcell]:gt("+maxfrozen+")",this).remove();
					});

					$(btbl).width(1).attr("id",p.id+"_frozen");
					$($t.grid.fbDiv).append(btbl);
					if(p.hoverrows === true) {
						$("tr.jqgrow", btbl).hover(
							function(){ $(this).addClass("ui-state-hover"); $("#"+$.jgrid.jqID(this.id), "#"+$.jgrid.jqID(p.id)).addClass("ui-state-hover"); },
							function(){ $(this).removeClass("ui-state-hover"); $("#"+$.jgrid.jqID(this.id), "#"+$.jgrid.jqID(p.id)).removeClass("ui-state-hover"); }
						);
						$("tr.jqgrow", "#"+$.jgrid.jqID(p.id)).hover(
							function(){ $(this).addClass("ui-state-hover"); $("#"+$.jgrid.jqID(this.id), "#"+$.jgrid.jqID(p.id)+"_frozen").addClass("ui-state-hover");},
							function(){ $(this).removeClass("ui-state-hover"); $("#"+$.jgrid.jqID(this.id), "#"+$.jgrid.jqID(p.id)+"_frozen").removeClass("ui-state-hover"); }
						);
					}
					btbl=null;
				});
				if(!$t.grid.hDiv.loading) {
					$($t).triggerHandler("jqGridAfterGridComplete");
				}
				p.frozenColumns = true;
			}
		});
	},
	destroyFrozenColumns :  function() {
		return this.each(function() {
			if ( !this.grid ) {return;}
			if(this.p.frozenColumns === true) {
				var $t = this;
				$($t.grid.fhDiv).remove();
				$($t.grid.fbDiv).remove();
				$t.grid.fhDiv = null; $t.grid.fbDiv=null;
				if($t.p.footerrow) {
					$($t.grid.fsDiv).remove();
					$t.grid.fsDiv = null;
				}
				$(this).unbind('.setFrozenColumns');
				if($t.p.hoverrows === true) {
					var ptr;
					$("#"+$.jgrid.jqID($t.p.id)).bind('mouseover',function(e) {
						ptr = $(e.target).closest("tr.jqgrow");
						if($(ptr).attr("class") !== "ui-subgrid") {
						$(ptr).addClass("ui-state-hover");
					}
					}).bind('mouseout',function(e) {
						ptr = $(e.target).closest("tr.jqgrow");
						$(ptr).removeClass("ui-state-hover");
					});
				}
				this.p.frozenColumns = false;
			}
		});
	}
});
}(jQuery));
