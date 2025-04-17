console.log('opening-hours.js executed');

import $ from 'jquery';

$(function() {

    console.log('jQuery version:', $.fn.jquery);
	//utility functions
	String.prototype.convertToUkDate = function() {
		var parts = this.split('/');
		return new Date(parts[2], parts[1] - 1, parts[0]);
	};
	String.prototype.formatLineBreaks = function() {
		if(this && this.indexOf(";") >= 0) {
			var lineBreakRegex = new RegExp(";", "g");
			return this.replace(lineBreakRegex, "<br />");
		}

		return this;
	};
	Date.prototype.toUkFormatString = function() {
		return this.getDate() + '/' + (this.getMonth() + 1) + '/' + this.getFullYear();
	};
	Date.prototype.getPreviousMonday = function getPreviousMonday() {
		var day = this.getDay(),
		diff = this.getDate() - day + (day == 0 ? -6:1); // adjust when day is sunday
		return new Date(this.setDate(diff));
	}
	Date.prototype.getNextSunday = function() {
		var day = this.getDay(),
		diff = this.getDate() + (7 - (day == 0 ? 7 : day)); // adjust when day is sunday
		return new Date(this.setDate(diff));
	}
	Date.prototype.addDays = function(days) {
		this.setDate(this.getDate()+days);
	}
	function getDayOfWeekText(index, shorten) {
		var days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
		return (shorten) ? days[index].substring(0, 3) : days[index];
	}
	function compareSemestersByStartDate(sem1, sem2) {
		return sem1.startDate - sem2.startDate;
	}
	//gets all unique attribute values in a set of the elements of the same structure
	//e.g. <OpeningHour Name="Whatever"...
	function getUniqueAttributeValues(xmlEntities, attributeName) {
		var uniqueValues = new Array();
		var found = false;
		var temp = null;

		for(var i=0; i<xmlEntities.length; i++) {
			var tempValue = xmlEntities[i].getAttribute(attributeName);

			found = false;
			for(var j=0; j<uniqueValues.length; j++) {
				if(uniqueValues[j] === tempValue) {
					found = true;
					break;
				}
			}

			if(!found) {
				uniqueValues.push(tempValue);
			}
		}

		return uniqueValues;
	}

	//define classes for use in the program
	function LibrariesXml(xml, todayDate, todayText) {
		this.xml = xml;
		this.todayDate = todayDate;
		this.todayText = todayText;
	}
	function OpeningHour(library, service, semester, day, hours, onHomepage, note) {
		this.library = library;
		this.service = service;
		this.semester = semester;
		this.day = day;
		this.hours = hours;
		this.onHomepage = onHomepage;
		this.note = note;

		this.loadFromXml = function(xmlEntity) {
			this.library = xmlEntity.getAttribute("Library");
			this.service = xmlEntity.getAttribute("Service");
			this.semester = xmlEntity.getAttribute("Semester");
			this.day = xmlEntity.getAttribute("Day");
			this.hours = xmlEntity.getAttribute("Hours");
			this.onHomepage = xmlEntity.getAttribute("OnHomepage");
			this.note = xmlEntity.getAttribute("Note");
		};
	}
	function ExceptionHour(library, service, name, startDate, endDate, hours, onHomepage, note) {
		this.library = library;
		this.service = service;
		this.name = name;
		this.startDate = (startDate && startDate.convertToUkDate());
		this.endDate = (endDate && endDate.convertToUkDate());
		this.hours = hours;
		this.onHomepage = onHomepage;
		this.note = note;

		this.loadFromXml = function(xmlEntity) {
			this.library = xmlEntity.getAttribute("Library");
			this.service = xmlEntity.getAttribute("Service");
			this.name = xmlEntity.getAttribute("Name");
			this.startDate = xmlEntity.getAttribute("StartDate").convertToUkDate();
			this.endDate = xmlEntity.getAttribute("EndDate").convertToUkDate();
			this.hours = xmlEntity.getAttribute("Hours");
			this.onHomepage = xmlEntity.getAttribute("OnHomepage");
			this.note = xmlEntity.getAttribute("Note");
		};
	}
	function Semester(name, startDate, endDate) {
		this.name = name;
		this.startDate = startDate.convertToUkDate();
		this.endDate = endDate.convertToUkDate();
	}
	function Link(library, url) {
		this.library = library;
		this.url = url;

		this.loadFromXml = function(xmlEntity) {
			this.library = xmlEntity.getAttribute("Library");
			this.url = xmlEntity.getAttribute("Url");
		}
	}

	//returns all semesters defined in the Excel document
	function getSemesters(xml) {
		if(!xml) {
			return null;
		}

		//fetch and parse the semester data into an array of Semester objects
		var semesters = new Array();
		var xmlEntities = xml.find("Semester");
		for(var i=0; i<xmlEntities.length; i++) {
			var semester = new Semester(
				xmlEntities[i].getAttribute("Name"),
				xmlEntities[i].getAttribute("StartDate"),
				xmlEntities[i].getAttribute("EndDate")
			);

			semesters.push(semester);
		}

		return semesters;
	}

	function getSemesterExceptionHours(xml, libraryName, semester) {
		if (!xml || !libraryName || !semester) {
			return null;
		}

		//fetch all exceptions for this specified library in this semester
		var exceptionHour;
		var exceptionHours = new Array();
		var uniqueExceptions = new Array();
		var selector = "Exception[Library='" + libraryName + "']";
		var xmlEntities = xml.find(selector);

		for(var i=0; i<xmlEntities.length; i++) {
			exceptionHour = new ExceptionHour();
			exceptionHour.loadFromXml(xmlEntities[i]);
			var alreadyAdded = false;

			if(exceptionHour.startDate >= semester.startDate && exceptionHour.startDate <= semester.endDate) {
				/*for(var j=0;j<uniqueExceptions.length;j++) {
					if(uniqueExceptions[j] === exceptionHour.name) {
						alreadyAdded = true;
						break;
					}
				}*/

				if(!alreadyAdded) {
					exceptionHours.push(exceptionHour);
					uniqueExceptions.push(exceptionHour.name);
				}
			}
		}

		exceptionHours.sort(function(ex1, ex2) {
			return (ex1.startDate - ex2.startDate);
		});

		return exceptionHours;
	}

	function getUniqueServiceNames(xml, libraryName, semesterName) {
		var selector = "OpeningHour[Library='" + libraryName + "']";
		selector += "[Semester='" + semesterName + "']";
		var xmlEntities = xml.find(selector);

		return getUniqueAttributeValues(xmlEntities, 'Service');
	}

	//function to get the current semester from the XML data
	function getCurrentSemester(xml, todayDate) {
		if(!xml || !todayDate) {
			return null;
		}

		//fetch and sort by start date
		var semesters = getSemesters(xml);
		semesters.sort(compareSemestersByStartDate);

		for(var i=0; i<semesters.length; i++) {
			//try and find the current semester
			if(semesters[i].startDate <= todayDate && semesters[i].endDate >= todayDate) {
				return semesters[i];
			}
		}

		//if the current date is after the last semester, return the last object
		if (todayDate > semesters[semesters.length -1].startDate) {
			return semesters[semesters.length - 1];
		} else {
			//default to first semester
			return semesters[0];
		}
	};

	//returns all matched ExceptionHour elements for the current day
	function getTodaysExceptionHours(xml, todayDate, libraryName) {
		if(!xml || !todayDate) {
			return null;
		}

		//fetch all exceptions for this specified library
		var exceptionHour;
		var exceptionHours = new Array();
		var selector = "Exception[Library='" + libraryName + "']";
		var xmlEntities = xml.find(selector);

		for(var i=0; i<xmlEntities.length; i++) {
			exceptionHour = new ExceptionHour();
			exceptionHour.loadFromXml(xmlEntities[i]);

			//if today is within the range of dates of the exception, add to array
			if(todayDate >= exceptionHour.startDate && todayDate < exceptionHour.endDate) {
				exceptionHours.push(exceptionHour);
			}
		}

		return exceptionHours;
	}

	function getLibraryOpeningHours(xml, libraryName, semester) {
		var selector = "OpeningHour";
		selector += "[Semester='" + semester.name + "']";
		selector += "[Library='" + libraryName + "']";
		var xmlEntities = xml.find(selector);

		var openingHour;
		var openingHours = new Array();

		for(var i=0; i<xmlEntities.length; i++) {
			openingHour = new OpeningHour();
			openingHour.loadFromXml(xmlEntities[i]);
			openingHours.push(openingHour);
		}

		return openingHours;
	}

	//returns all matched OpeningHour elements for the current day
	function getTodaysOpeningHours(xml, todayText, library, semester, onHomepage) {
		//fetch opening hours for this library & semester
		var selector = "OpeningHour[Day='" + todayText + "']";
		selector += "[Semester='" + semester.name + "']";
		selector += "[Library='" + library + "']";

		if(onHomepage) {
			selector += "[OnHomepage='true']"
		}

		var xmlEntities = xml.find(selector);

		var openingHour;
		var openingHours = new Array();

		for(var i=0; i<xmlEntities.length; i++) {
			openingHour = new OpeningHour();
			openingHour.loadFromXml(xmlEntities[i]);
			openingHours.push(openingHour);
		}

		return openingHours;
	}

	function getServiceOpeningHours(xml, libraryName, semesterName, serviceName) {
		var selector = "OpeningHour[Library='" + libraryName + "']";
		selector += "[Semester='" + semesterName + "']";
		selector += "[Service='" + serviceName + "']";
		var xmlEntities = xml.find(selector);

		var openingHour;
		var openingHours = new Array();

		for(var i=0; i<xmlEntities.length; i++) {
			openingHour = new OpeningHour();
			openingHour.loadFromXml(xmlEntities[i]);
			openingHours.push(openingHour);
		}

		return openingHours;
	}

	//jQuery "plugin" to render the opening hours for the current day
	$.fn.renderOpeningHoursForToday = function(options) {
		var settings = {
			debug: false,
			debugDate: null,
			xmlUrl: '',
			onRenderSuccess: function(){}
		};

		if(options) {
			$.extend(settings, options);
		}

		var that = this;
        var libXml = null; // Declare libXml here

		//function to output the HTML using the XML data
		var generateHtmlOutput = function(libXml, semester) {
			var output = "";
			var selector = "";
			var xmlEntities = null;

			//get a list of all libraries from the XML doc
			var librarySelector = "OpeningHour[Semester='" + semester.name + "']";
			var allLibraryXml = libXml.xml.find(librarySelector);
			var libraryNames = getUniqueAttributeValues(allLibraryXml, "Library");

			// Clear the existing html of the table
			$(that).html("");

			//loop through libraries
			for(var j=0; j<libraryNames.length; j++) {
				//fetch exceptions, if any
				var exceptionHours = getTodaysExceptionHours(libXml.xml, libXml.todayDate, libraryNames[j]);

				//get URL for library
				var libraryUrl = "#";
				var libraryName = libraryNames[j];
				var linkSelector = "Link[Library='" + libraryNames[j] + "']";
				var allLinksXml = libXml.xml.find(linkSelector);
				if(allLinksXml && allLinksXml.length) {
					var link = new Link();
					link.loadFromXml(allLinksXml[0]);
					libraryUrl = link.url;
					libraryName = link.library;
				}

				////title link for library
				//output += '<p>';

				var servicesWithException = new Array();
				if(exceptionHours && exceptionHours.length > 0) {
					for(var i=0; i<exceptionHours.length; i++) {
						servicesWithException.push(exceptionHours[i].service);
						//output += '<span>' + exceptionHours[i].service + '</span> ' + exceptionHours[i].hours.formatLineBreaks() + "<br />";
						var oTR = $("<tr/>");
						$(oTR).append( $("<td/>").html(exceptionHours[i].service) );
						$(oTR).append( $("<td/>").html(exceptionHours[i].hours.formatLineBreaks()) );
						$(that).append( $(oTR) );
					}
				}

				//fetch opening hours for library
				var openingHours = getTodaysOpeningHours(libXml.xml, libXml.todayText, libraryNames[j], semester, true);

				for(var m=0; m<openingHours.length; m++) {
					var includeService = true;
					for(var k=0; k<servicesWithException.length; k++) {
						if(servicesWithException[k] === openingHours[m].service) {
							//don't render opening hours if there is an exception for this service
							includeService = false;
							break;
						}
					}

					if(includeService) {
						//output += '<span>' + openingHours[m].service + '</span> ' + openingHours[m].hours.formatLineBreaks() + "<br />";
						var oTR = $("<tr/>");
						var oTDName = $("<td />").html(openingHours[m].service);
						var oTDStatus = $("<td />").append($("<span/>").html(openingHours[m].hours.formatLineBreaks()));

						$(oTDStatus).find("span").each(function(){
							if ($(this).text().toLowerCase().indexOf("closed") != -1) {
								$(this).addClass("closed");
							} else {
								$(this).addClass("open");
							}
						});

						$(oTR).append($(oTDName));
						$(oTR).append($(oTDStatus));
						$(that).append( $(oTR) );
					}
				}

				////chop off trailing "<br />"
				//output = output.substring(0, output.length - 6);

				////close library times paragraph
				//output += "</p>";
			}

			//that.html(output);
		};

		//callback function to process the loaded XML file and extract the relevant data
		var loadSuccess = function(data, textStatus, jqXHR) {
			try {
				//jQuery-ify the root node of the XML
				var xml = $(data.documentElement);

				//get the server date from the XML HTTP headers (fall back to local time)
				var todayDate = (jqXHR.getResponseHeader("Date")) ? new Date(jqXHR.getResponseHeader("Date")) : new Date();
				if(settings.debug) { todayDate = settings.debugDate; }

				var todayText = getDayOfWeekText(todayDate.getDay());

				libXml = new LibrariesXml(xml, todayDate, todayText);

				//get the current semester
				var semester = getCurrentSemester(libXml.xml, libXml.todayDate);

				generateHtmlOutput(libXml, semester);

				// Call the onRenderSuccess function
				settings.onRenderSuccess();
			} catch(err) {
				loadError();

				if(settings.debug) {
					throw err;
				}
			}
		};

		//callback function to handle errors loading the XML file
		var loadError = function(jqXHR, textStatus, errorThrown) {
			var oTR = $("<tr />");
			$(oTR).append( $("<td />").text( "The opening hours are currently unavailable. Please try again later." ) );
			$(that).append( $(oTR) );
		};

		////show loader
		//$("#today-hours-loader").show();

		//fetch the xml for the opening hours
		$.ajax({
			url: settings.xmlUrl,
			method: 'get',
			cache: false,
            beforeSend: function() {
                console.log('About to make AJAX request to:', settings.xmlUrl);
            },
			success: loadSuccess,
			error: loadError
		});
	};

	$.fn.renderOpeningHoursFullTabs = function(options) {
		var settings = {
			debug: false,
			debugDate: null,
			xmlUrl: '',
			onRenderSuccess: function(){}
		};

		if(options) {
			$.extend(settings, options);
		}

		//store reference to element that calls "plugin"
		//to give scope for use in internal functions
		var that = this;

		//function to output the HTML using the XML data
		var generateHtmlOutput = function(libXml, libraryNames, semesters) {
			var tabContainer = {};
			var tabsHeaderOutput = "";
			var tabsOutput = "";
			var selector = "";
			var xmlEntities = null;

			//append opening tags for tab headers, and tab container
			tabsHeaderOutput += '<ul class="nav nav-tabs">';
			tabsOutput += '<div class="tab-content">';

			for(var i=0;i<libraryNames.length;i++) {
				var tabId = "tab-" + (i+1);

				//append tab header
				tabsHeaderOutput += '<li class="' + (i==0 ? ' active' : '' ) + '"><a href="#' + tabId + '" data-toggle="tab">' + libraryNames[i] + '</a></li>';

				//append tab content
				tabsOutput += '<div class="tab-pane' + (i==0 ? ' active' : '' ) + '" id="' + tabId + '">';

				for(var j=0;j<semesters.length;j++) {
					tabsOutput += '<div class="opening-hours-table">';

					tabsOutput += '<h2>' + semesters[j].name + ' - ' + semesters[j].startDate.toUkFormatString() + ' to ' + semesters[j].endDate.toUkFormatString() + '</h2>';

					//create times table for semester & library
					tabsOutput += '<div class="js-responsive-table">\n'
					tabsOutput += '<table>\n';
					tabsOutput += '<tr>\n' +
                                '<th>Service</th>\n' +
                                '<th>Monday</th>\n' +
                                '<th>Tuesday</th>\n' +
                                '<th>Wednesday</th>\n' +
                                '<th>Thursday</th>\n' +
                                '<th>Friday</th>\n' +
                                '<th>Saturday</th>\n' +
                                '<th>Sunday</th>\n' +
                              '</tr>';


					var serviceNames = getUniqueServiceNames(libXml, libraryNames[i], semesters[j].name);
					var days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

					//loop through services and create table rows
					for(var k=0;k<serviceNames.length;k++) {
						var openingHours = getServiceOpeningHours(libXml, libraryNames[i], semesters[j].name, serviceNames[k]);

						tabsOutput += '<tr>\n' +
                                '<td><strong>' + serviceNames[k] + '</strong></td>\n';

						//loop through days
						for(var l=0;l<days.length;l++) {
							var openingHour = null;

							for(m=0;m<openingHours.length;m++) {
								if(openingHours[m].day === days[l]) {
									openingHour = openingHours[m];
									break;
								}
							}
							tabsOutput += '<td>'
							if(openingHour && openingHour.hours) {
								tabsOutput += openingHour.hours.formatLineBreaks();
							}

							if (openingHour.note) {
								tabsOutput += '<span class="note">';
								tabsOutput += openingHour.note.formatLineBreaks();
								tabsOutput += '</span>';
							}

							tabsOutput += '</td>\n'
						}

						tabsOutput += '</tr>\n';
					}
					tabsOutput += '</table>\n';
					tabsOutput += '</div>\n';

					//create exceptions display for this semester & library
					var exceptions = getSemesterExceptionHours(libXml, libraryNames[i], semesters[j]);

					if(exceptions && exceptions.length > 0) {
						tabsOutput += '<div class="opening-hours-exceptions">\n';
						tabsOutput += '<h3>Dates to note:</h3>\n';
						tabsOutput += '<div class="exceptions">\n';

						for(var n=0;n<exceptions.length;n++) {
							tabsOutput += '<p><strong>';
							tabsOutput += exceptions[n].name + ', ' + exceptions[n].service + ':</strong> ';
							tabsOutput += (exceptions[n].hours) ? exceptions[n].hours.formatLineBreaks() + " " : "";
							tabsOutput += (exceptions[n].note) ? exceptions[n].note : "";
							tabsOutput += '</p>\n';
						}

						tabsOutput += '</div>\n';
						tabsOutput += '</div>\n';
					}

					tabsOutput += '</div>';
				}

				tabsOutput += '</div>'
			}

			//append closing tags for tab headers, and tab content
			tabsHeaderOutput += '</ul>';
			tabsOutput += '</div>';

			// create the tab container
			tabContainer = jQuery('<div />').addClass('tab_container');

			// add the new elements to the DOM
			tabContainer.append(tabsHeaderOutput);
			tabContainer.append(tabsOutput);
			that.html(tabContainer);

			/*var divOutput = $("#opening-hours-full");
			divOutput.append(tabsHeaderOutput);
			divOutput.append(tabsOutput);*/
		};

		//callback function to process the loaded XML file and extract the relevant data
		var loadSuccess = function(data, textStatus, jqXHR) {
			try {
				//jQuery-ify the root node of the XML
				var xml = $(data.documentElement);

				//get the server date from the XML HTTP headers (fall back to local time)
				var todayDate = (jqXHR.getResponseHeader("Date")) ? new Date(jqXHR.getResponseHeader("Date")) : new Date();
				if(settings.debug) { todayDate = settings.debugDate; }
				var todayText = getDayOfWeekText(todayDate.getDay());

				libXml = new LibrariesXml(xml, todayDate, todayText);

				var libraryNames = getUniqueAttributeValues(xml.find('OpeningHour'), 'Library');

				var semesters = getSemesters(xml);
				semesters.sort(compareSemestersByStartDate);

				generateHtmlOutput(xml, libraryNames, semesters);

				// Call the onRenderSuccess function
				settings.onRenderSuccess();
			} catch(err) {
				loadError();

				if(settings.debug) {
					throw err;
				}
			}

		};

		//callback function to handle errors loading the XML file
		var loadError = function(jqXHR, textStatus, errorThrown) {
			that.html("<p>The opening hours are currently unavailable. Please try again later.</p>");
		};

		//fetch the xml for the opening hours
		$.ajax({
			url: settings.xmlUrl,
			method: 'get',
			cache: false,
			success: loadSuccess,
			error: loadError
		});
	};

	$.fn.renderOpeningHoursForLibrary = function(options) {
		var settings = {
			debug: false,
			debugDate: null,
			xmlUrl: '',
			ucdLibraryName: '',
			onRenderSuccess: function(){}
		};

		if(options) {
			$.extend(settings, options);
		}
		var that = this;

		//function to output the HTML using the XML data
		var generateHtmlOutput = function(libXml, libraryName, semester) {
			var output = "";
			var days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
			var todaysDate = new Date();

			var hours = getLibraryOpeningHours(libXml.xml, libraryName, semester);

			var serviceHoursMap = new Array();
			for(var i=0;i<hours.length; i++) {
				var selectedService = hours[i].service;

				if(!serviceHoursMap[selectedService]) {
					var serviceHours = new Array();
					for(var j=0;j<days.length;j++) {
						for (var k=0;k<hours.length;k++) {
							if(hours[k].service === selectedService && days[j] === hours[k].day) {
								serviceHours[days[j]] = hours[k].hours;
							}
						}
					}
					serviceHoursMap[selectedService] = serviceHours;
				}
			}

			//get exceptions for this week
			//and replace standard values in the mapped array
			var startWeekDate = libXml.todayDate.getPreviousMonday();
			var endWeekDate = libXml.todayDate.getNextSunday();

			var currentDate = startWeekDate;
			for(var i=0; i<7; i++) {
				var exceptionHours = getTodaysExceptionHours(libXml.xml, currentDate, libraryName);

				if(exceptionHours && exceptionHours.length) {
					for(var service in serviceHoursMap) {
						for(var j=0;j<exceptionHours.length;j++) {
							if(service === exceptionHours[j].service) {
								var currentDayOfWeek = getDayOfWeekText(exceptionHours[j].startDate.getDay());
								serviceHoursMap[service][currentDayOfWeek] = exceptionHours[j].hours;
							}
						}
					}
				}

				currentDate.addDays(1);
			}

			//create the markup for the times
			for(var key in serviceHoursMap) {
				output += '<h5>' + key + '</h5>\n';
				output += '<div class="opening-hours-times">\n';

				output += '<div class="opening-hours-week">\n';
				output += '<table>\n';
				output += '<tbody>\n';
				var serviceHours = serviceHoursMap[key];

				var endRangingAtIndex = 4;
				var daysInRange = [];

				for(var i=0;i<days.length;i++) {
					if(i < endRangingAtIndex) {
						var currentVal = serviceHours[days[i]];
						var nextVal = (days.length > i+1) ? serviceHours[days[i+1]] : "finished";

						if(currentVal !== nextVal || i+1 == endRangingAtIndex) {
							daysInRange.push(days[i]);

							//output range of dates
							output += '\n<tr>';
							output += '\n<td>';
							output += daysInRange[0].substring(0,3);
							if(daysInRange.length > 1) {
								output += ' - ' + daysInRange[daysInRange.length - 1].substring(0,3);
							}
							output += '\n</td>';
							output += '\n<td>';
							output += currentVal.formatLineBreaks();
							output += '\n</td>';
							output += '\n</tr>';

							daysInRange = [];
						} else {
							daysInRange.push(days[i]);
						}
					} else {
						//output just the date
						output += '\n<tr>';
						output += '\n<td>';
						output += days[i].substring(0,3);
						output += '\n</td>';
						output += '\n<td>';
						output += serviceHours[days[i]].formatLineBreaks();
						output += '\n</td>';
						output += '\n</tr>';
					}

					if(i + 1 === 5) {
						output += '</tbody>\n';
						output += '</table>\n';
						output += '</div>\n';

						//weekend (Sat, Sun)
						output += '<div class="opening-hours-weekend">\n';
						output += '<table>\n';
						output += '<tbody>\n';
					}

					if(i + 1 === 7) {
						output += '</tbody>\n';
						output += '</table>\n';
						output += '</div>\n';
					}
				}

				output += '</div>\n';
			}

			that.html(output);
		};

		//callback function to process the loaded XML file and extract the relevant data
		var loadSuccess = function(data, textStatus, jqXHR) {
			try {
				//jQuery-ify the root node of the XML
				var xml = $(data.documentElement);

				//get the server date from the XML HTTP headers (fall back to local time)
				var todayDate = (jqXHR.getResponseHeader("Date")) ? new Date(jqXHR.getResponseHeader("Date")) : new Date();
				if(settings.debug) { todayDate = settings.debugDate; }

				var todayText = getDayOfWeekText(todayDate.getDay());

				libXml = new LibrariesXml(xml, todayDate, todayText);

				//get the current semester
				var semester = getCurrentSemester(libXml.xml, libXml.todayDate);

				generateHtmlOutput(libXml, settings.ucdLibraryName, semester);

				// Call the onRenderSuccess function
				settings.onRenderSuccess();
			} catch(err) {
				loadError();

				if(settings.debug) {
					throw err;
				}
			}
		};

		//callback function to handle errors loading the XML file
		var loadError = function(jqXHR, textStatus, errorThrown) {
			that.html("<p>The opening hours are currently unavailable. Please try again later.</p>");
		};

		//show loader
		this.css("height", "auto");
		$("#today-hours-loader").show();

		//fetch the xml for the opening hours
		$.ajax({
			url: settings.xmlUrl,
			method: 'get',
			cache: false,
			success: loadSuccess,
			error: loadError
		});
	};

});
