    var riDirective = function () {
        /**********************************
            Configuration
        ***********************************/
        var LABELS = {};
        var tool = {
            conf: {
                lang: defaultLocale,
                readOnly: false,
                firstDay: 0,

                // "REMOTE" FIELD
                startField: null,
                startFieldYear: null,
                startFieldMonth: null,
                startFieldDay: null,
                ajaxURL: null,
                ajaxContentType: 'application/json; charset=utf8',
                ributtonExtraClass: '',

                // INPUT CONFIGURATION
                hasRepeatForeverButton: true,

                // RECURRENCE TEMPLATES
                rtemplate: {
                    daily: {
                        rrule: 'FREQ=DAILY',
                        fields: [
                            'ridailyinterval',
                            'rirangeoptions'
                        ]
                    },
                    mondayfriday: {
                        rrule: 'FREQ=WEEKLY;BYDAY=MO,FR',
                        fields: [
                            'rirangeoptions'
                        ]
                    },
                    weekdays: {
                        rrule: 'FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR',
                        fields: [
                            'rirangeoptions'
                        ]
                    },
                    weekly: {
                        rrule: 'FREQ=WEEKLY',
                        fields: [
                            'riweeklyinterval',
                            'riweeklyweekdays',
                            'rirangeoptions'
                        ]
                    },
                    monthly: {
                        rrule: 'FREQ=MONTHLY',
                        fields: [
                            'rimonthlyinterval',
                            'rimonthlyoptions',
                            'rirangeoptions'
                        ]
                    },
                    yearly: {
                        rrule: 'FREQ=YEARLY',
                        fields: [
                            'riyearlyinterval',
                            'riyearlyoptions',
                            'rirangeoptions'
                        ]
                    }
                }
            },

            localize: function (language, labels) {
                LABELS[language] = labels;
            },

            setTemplates: function (templates, titles) {
                var lang, template;
                tool.conf.rtemplate = templates;
                for (lang in titles) {
                    if (titles.hasOwnProperty(lang)) {
                        for (template in titles[lang]) {
                            if (titles[lang].hasOwnProperty(template)) {
                                LABELS[lang].rtemplate[template] = titles[lang][template];
                            }
                        }
                    }
                }
            }
        };

        //move all declared i18n locales to LABELS
		for (var localeName in locale) {
			tool.localize(localeName, locale[localeName]);
		}

        /**********************************
            Directive definition
        ***********************************/
		controller.$inject = ['$scope', '$modal'];
		function controller ($scope, $modal) {
			$scope.ri = {
                rtemplate: tool.conf.rtemplate.daily
            };

            $scope.initialXRRule = $scope.xrrule;

			/**********************************
				Parsing functionality
			***********************************/
			// Formatting function (mostly) from jQueryTools dateinput
			var Re = /d{1,4}|m{1,4}|hh|MM|ss|yy(?:yy)?|"[^"]*"|'[^']*'/g;

			function zeropad(val, len) {
				val = val.toString();
				len = len || 2;
				while (val.length < len) { val = "0" + val; }
				return val;
			}

			function format(date, fmt, conf) {
				var d = date.getDate(),
					D = date.getDay(),
					m = date.getMonth(),
					y = date.getFullYear(),
                    h = date.getHours(),
                    M = date.getMinutes(),
                    s = date.getSeconds(),

					flags = {
						d: d,
						dd: zeropad(d),
						ddd: conf.i18n.shortWeekdays[D],
						dddd: conf.i18n.weekdays[D],
						m: m + 1,
						mm: zeropad(m + 1),
						mmm: conf.i18n.shortMonths[m],
						mmmm: conf.i18n.months[m],
						yy: String(y).slice(2),
						yyyy: y,
                        hh: zeropad(h),
                        MM: zeropad(M),
                        ss: zeropad(s)
					};

				var result = fmt.replace(Re, function ($0) {
					return flags.hasOwnProperty($0) ? flags[$0] : $0.slice(1, $0.length - 1);
				});

				return result;
			}

			/**
			 * Parsing RFC5545 from widget
			 */
			function widgetSaveToRfc5545(tz) {
				var rtemplate = $scope.ri.rtemplate;
				var result = rtemplate.rrule;
				var rtemplateName = '';
				for (var prop in conf.rtemplate) {
					if (conf.rtemplate.hasOwnProperty(prop)) {
						if (conf.rtemplate[prop] === rtemplate) {
							rtemplateName = prop;
							break;
						}
					}
				}
				var human = conf.i18n.rtemplate[rtemplateName];
				var field, input, weekdays, i18nweekdays, i, j, index, tmp;
				var day, month, year, interval, yearlyType, occurrences, date;

				for (i = 0; i < rtemplate.fields.length; i++) {
					field = rtemplate.fields[i];
					switch (field) {

						case 'ridailyinterval':
							interval = $scope.ri.dailyinterval;
							if (interval !== '1') {
								result += ';INTERVAL=' + interval;
							}
							human = interval + ' ' + conf.i18n.dailyInterval2;
							break;

						case 'riweeklyinterval':
							interval = $scope.ri.weeklyinterval;
							if (interval !== '1') {
								result += ';INTERVAL=' + interval;
							}
							human = interval + ' ' + conf.i18n.weeklyInterval2;
							break;

						case 'riweeklyweekdays':
							weekdays = '';
							i18nweekdays = '';
							for (j = 0; j < conf.weekdays.length; j++) {
								input = $scope.ri.weeklyweekdays[j];
								if (input) {
									if (weekdays) {
										weekdays += ',';
										i18nweekdays += ', ';
									}
									weekdays += conf.weekdays[j];
									i18nweekdays += conf.i18n.weekdays[j];
								}
							}
							if (weekdays) {
								result += ';BYDAY=' + weekdays;
								human += ' ' + conf.i18n.weeklyWeekdaysHuman + ' ' + i18nweekdays;
							}
							break;

						case 'rimonthlyinterval':
							interval = $scope.ri.monthlyinterval;
							if (interval !== '1') {
								result += ';INTERVAL=' + interval;
							}
							human = interval + ' ' + conf.i18n.monthlyInterval2;
							break;

						case 'rimonthlyoptions':
							var monthlyType = $scope.ri.monthlytype;
							switch (monthlyType) {

								case 'DAYOFMONTH':
									day = $scope.ri.monthlydayofmonthday;
									result += ';BYMONTHDAY=' + day;
									human += ', ' + conf.i18n.monthlyDayOfMonth1Human + ' ' + day + ' ' + conf.i18n.monthlyDayOfMonth2;
									break;
								case 'WEEKDAYOFMONTH':
									index = $scope.ri.monthlyweekdayofmonthindex;
									day = $scope.ri.monthlyweekdayofmonth;
									if ($.inArray(day, ['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU']) > -1) {
										result += ';BYDAY=' + index + day;
										human += ', ' + conf.i18n.monthlyWeekdayOfMonth1Human + ' ';
										human += ' ' + conf.i18n.orderIndexes[$.inArray(index, conf.orderIndexes)];
										human += ' ' + conf.i18n.monthlyWeekdayOfMonth2;
										human += ' ' + conf.i18n.weekdays[$.inArray(day, conf.weekdays)];
										human += ' ' + conf.i18n.monthlyDayOfMonth2;
									}
									break;
							}
							break;

						case 'riyearlyinterval':
							interval = $scope.ri.yearlyinterval;
							if (interval !== '1') {
								result += ';INTERVAL=' + interval;
							}
							human = interval + ' ' + conf.i18n.yearlyInterval2;
							break;

						case 'riyearlyoptions':
							yearlyType = $scope.ri.yearlyType;
							switch (yearlyType) {

								case 'DAYOFMONTH':
									month = $scope.ri.yearlydayofmonthmonth;
									day = $scope.ri.yearlydayofmonthday;
									result += ';BYMONTH=' + month;
									result += ';BYMONTHDAY=' + day;
									human += ', ' + conf.i18n.yearlyDayOfMonth1Human + ' ' + conf.i18n.months[month - 1] + ' ' + day;
									break;
								case 'WEEKDAYOFMONTH':
									index = $scope.ri.yearlyweekdayofmonthindex;
									day = $scope.ri.yearlyweekdayofmonthday;
									month = $scope.ri.yearlyweekdayofmonthmonth;
									result += ';BYMONTH=' + month;
									if ($.inArray(day, ['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU']) > -1) {
										result += ';BYDAY=' + index + day;
										human += ', ' + conf.i18n.yearlyWeekdayOfMonth1Human;
										human += ' ' + conf.i18n.orderIndexes[$.inArray(index, conf.orderIndexes)];
										human += ' ' + conf.i18n.yearlyWeekdayOfMonth2;
										human += ' ' + conf.i18n.weekdays[$.inArray(day, conf.weekdays)];
										human += ' ' + conf.i18n.yearlyWeekdayOfMonth3;
										human += ' ' + conf.i18n.months[month - 1];
										human += ' ' + conf.i18n.yearlyWeekdayOfMonth4;
									}
									break;
							}
							break;

						case 'rirangeoptions':
							var rangeType = $scope.ri.rangetype;
							switch (rangeType) {

								case 'BYOCCURRENCES':
									occurrences = $scope.ri.rangebyoccurrencesvalue;
									result += ';COUNT=' + occurrences;
									human += ', ' + conf.i18n.rangeByOccurrences1Human;
									human += ' ' + occurrences;
									human += ' ' + conf.i18n.rangeByOccurrences2;
									break;
								case 'BYENDDATE':
									date = format($scope.ri.rangebyenddate, 'yyyymmdd', conf);
                                    var time = format($scope.ri.rangebyenddate, 'hhMMss', conf);
									result += ';UNTIL=' + date + 'T' + time;
									if (tz === true) {
										// Make it UTC:
										result += 'Z';
									}
									human += ', ' + conf.i18n.rangeByEndDateHuman;
									human += ' ' + format($scope.ri.rangebyenddate, conf.i18n.longDateFormat, conf);
									break;
							}
							break;
					}
				}

				if ($scope.RDATES !== undefined && $scope.RDATES.length > 0) {
					$scope.RDATES.sort();
					tmp = [];
					for (i = 0; i < $scope.RDATES.length; i++) {
						if ($scope.RDATES[i] !== '') {
							tmp.push(format($scope.RDATES[i], conf.i18n.longDateFormat, conf));
						}
					}
					if (tmp.length !== 0) {
						human = human + conf.i18n.including + ' ' + tmp.join('; ');
					}
				}

				if ($scope.EXDATE !== undefined && $scope.EXDATE.length > 0) {
					$scope.EXDATE.sort();
					tmp = [];
					for (i = 0; i < $scope.EXDATE.length; i++) {
						if ($scope.EXDATE[i] !== '') {
							tmp.push(format($scope.EXDATES[i], conf.i18n.longDateFormat, conf));
						}
					}
					if (tmp.length !== 0) {
						human = human + conf.i18n.except + ' ' + tmp.join('; ');
					}
				}
				result = result;
				//if ($scope.EXDATE !== undefined && $scope.EXDATE.join() !== "") {
				//    tmp = $.map($scope.EXDATE, function (x) {
				//        if (x.length === 8) { // DATE format. Make it DATE-TIME
				//            x += 'T000000';
				//        }
				//        if (tz === true) {
				//            // Make it UTC:
				//            x += 'Z';
				//        }
				//        return x;
				//    });
				//    result = result + '\nEXDATE:' + tmp;
				//}
				//if ($scope.RDATES !== undefined && $scope.RDATES.join() !== "") {
				//    tmp = $.map($scope.RDATES, function (x) {
				//        if (x.length === 8) { // DATE format. Make it DATE-TIME
				//            x += 'T000000';
				//        }
				//        if (tz === true) {
				//            // Make it UTC:
				//            x += 'Z';
				//        }
				//        return x;
				//    });
				//    result = result + '\nRDATE:' + tmp;
				//}
				return { result: result, description: human };
			}

			function parseLine(icalline) {
				var result = {};
				var pos = icalline.indexOf(':');
				var property = icalline.substring(0, pos);
				result.value = icalline.substring(pos + 1);

				if (property.indexOf(';') !== -1) {
					pos = property.indexOf(';');
					result.parameters = property.substring(pos + 1);
					result.property = property.substring(0, pos);
				} else {
					result.parameters = null;
					result.property = property;
				}
				return result;
			}

			function cleanDates(dates) {
				// Get rid of timezones
				// TODO: We could parse dates and range here, maybe?
				var result = [];
				var splitDates = dates.split(',');
				var date;

				for (date in splitDates) {
					if (splitDates.hasOwnProperty(date)) {
						if (splitDates[date].indexOf('Z') !== -1) {
							result.push(splitDates[date].substring(0, 15));
						} else {
							result.push(splitDates[date]);
						}
					}
				}
				return result;
			}

			function parseIcal(icaldata) {
				var lines = [];
				var result = {};
				var propAndValue = [];
				var line = null;
				var nextline;

				lines = icaldata.split('\n');
				lines.reverse();
				while (true) {
					if (lines.length > 0) {
						nextline = lines.pop();
						if (nextline.charAt(0) === ' ' || nextline.charAt(0) === '\t') {
							// Line continuation:
							line = line + nextline;
							continue;
						}
					} else {
						nextline = '';
					}

					// New line; the current one is finished, add it to the result.
					if (line !== null) {
						line = parseLine(line);
						// We ignore properties for now
						if (line.property === 'RDATE' || line.property === 'EXDATE') {
							result[line.property] = cleanDates(line.value);
						} else {
							result[line.property] = line.value;
						}
					}

					line = nextline;
					if (line === '') {
						break;
					}
				}
				return result;
			}

			function widgetLoadFromRfc5545(rrule, force) {
				var unsupportedFeatures = [];
				var i, matches, match, matchIndex, rtemplate, d, input, index;
				var selector, selectors, field, radiobutton, start, end;
				var interval, byday, bymonth, bymonthday, count, until;
				var day, month, year, hour, minute, second, weekday, ical;

				if (!rrule) {
					unsupportedFeatures.push(conf.i18n.noRule);
					if (!force) {
						return -1; // Fail!
					}
				} else {


					matches = /INTERVAL=([0-9]+);?/.exec(rrule);
					if (matches) {
						interval = matches[1];
					} else {
						interval = '1';
					}

					matches = /BYDAY=([^;]+);?/.exec(rrule);
					if (matches) {
						byday = matches[1];
					} else {
						byday = '';
					}

					matches = /BYMONTHDAY=([^;]+);?/.exec(rrule);
					if (matches) {
						bymonthday = matches[1].split(",");
					} else {
						bymonthday = null;
					}

					matches = /BYMONTH=([^;]+);?/.exec(rrule);
					if (matches) {
						bymonth = matches[1].split(",");
					} else {
						bymonth = null;
					}

					matches = /COUNT=([0-9]+);?/.exec(rrule);
					if (matches) {
						count = matches[1];
					} else {
						count = null;
					}

					matches = /UNTIL=([0-9T]+);?/.exec(rrule);
					if (matches) {
						until = matches[1];
					} else {
						until = null;
					}

					matches = /BYSETPOS=([^;]+);?/.exec(rrule);
					if (matches) {
						unsupportedFeatures.push(conf.i18n.bysetpos);
					}

					// Find the best rule:
					match = '';
					matchIndex = null;
					for (i in conf.rtemplate) {
						if (conf.rtemplate.hasOwnProperty(i)) {
							rtemplate = conf.rtemplate[i];
							if (rrule.indexOf(rtemplate.rrule) === 0) {
								if (rrule.length > match.length) {
									// This is the best match so far
									match = rrule;
									matchIndex = i;
								}
							}
						}
					}

					if (match) {
						rtemplate = conf.rtemplate[matchIndex];
						$scope.ri.rtemplate = rtemplate;
						// Set the selector:
						selector = matchIndex;
					} else {
						for (rtemplate in conf.rtemplate) {
							if (conf.rtemplate.hasOwnProperty(rtemplate)) {
								rtemplate = conf.rtemplate[rtemplate];
								break;
							}
						}
						unsupportedFeatures.push(conf.i18n.noTemplateMatch);
					}

					for (i = 0; i < rtemplate.fields.length; i++) {
						field = rtemplate.fields[i];
						switch (field) {

							case 'ridailyinterval':
								$scope.ri.dailyinterval = interval;
								break;

							case 'riweeklyinterval':
								$scope.ri.weeklyinterval = interval;
								break;

							case 'riweeklyweekdays':
								byday = byday.split(",");
								for (d = 0; d < conf.weekdays.length; d++) {
									day = conf.weekdays[d];
									input = $scope.ri.weeklyweekdays[d] = $.inArray(day, byday) !== -1;
								}
								break;

							case 'rimonthlyinterval':
								$scope.ri.monthlyinterval = interval;
								break;

							case 'rimonthlyoptions':
								var monthlyType = 'DAYOFMONTH'; // Default to using BYMONTHDAY

								if (bymonthday) {
									monthlyType = 'DAYOFMONTH';
									if (bymonthday.length > 1) {
										// No support for multiple days in one month
										unsupportedFeatures.push(conf.i18n.multipleDayOfMonth);
										// Just keep the first
										bymonthday = bymonthday[0];
									}
									$scope.ri.monthlydayofmonthday = parseInt(bymonthday, 10);
								}

								if (byday) {
									monthlyType = 'WEEKDAYOFMONTH';

									if (byday.indexOf(',') !== -1) {
										// No support for multiple days in one month
										unsupportedFeatures.push(conf.i18n.multipleDayOfMonth);
										byday = byday.split(",")[0];
									}
									index = byday.slice(0, -2);
									if (index.charAt(0) !== '+' && index.charAt(0) !== '-') {
										index = '+' + index;
									}
									weekday = byday.slice(-2);
									$scope.ri.monthlyweekdayofmonthindex = index;
									$scope.ri.monthlyweekdayofmonth = weekday;
								}

								$scope.ri.monthlytype = monthlyType;
								break;

							case 'riyearlyinterval':
								$scope.ri.yearlyinterval = interval;
								break;

							case 'riyearlyoptions':
								var yearlyType = 'DAYOFMONTH'; // Default to using BYMONTHDAY

								if (bymonthday) {
									yearlyType = 'DAYOFMONTH';
									if (bymonthday.length > 1) {
										// No support for multiple days in one month
										unsupportedFeatures.push(conf.i18n.multipleDayOfMonth);
										bymonthday = bymonthday[0];
									}
									$scope.ri.yearlydayofmonthmonth = parseInt(bymonth, 10);
									$scope.ri.yearlydayofmonthday = parseInt(bymonthday, 10);
								}

								if (byday) {
									yearlyType = 'WEEKDAYOFMONTH';

									if (byday.indexOf(',') !== -1) {
										// No support for multiple days in one month
										unsupportedFeatures.push(conf.i18n.multipleDayOfMonth);
										byday = byday.split(",")[0];
									}
									index = byday.slice(0, -2);
									if (index.charAt(0) !== '+' && index.charAt(0) !== '-') {
										index = '+' + index;
									}
									weekday = byday.slice(-2);
									$scope.ri.yearlyweekdayofmonthindex = index;
									$scope.ri.yearlyweekdayofmonthday = weekday;
									$scope.ri.yearlyweekdayofmonthmonth = parseInt(bymonth, 10);
								}

								$scope.ri.yearlyType = yearlyType;
								break;

							case 'rirangeoptions':
								var rangeType = 'NOENDDATE';

								if (count) {
									rangeType = 'BYOCCURRENCES';
									$scope.ri.rangebyoccurrencesvalue = count;
								}

								if (until) {
									rangeType = 'BYENDDATE';
									year = until.slice(0, 4);
									month = until.slice(4, 6);
									month = parseInt(month, 10) - 1;
									day = until.slice(6, 8);
									hour = until.slice(9, 11);
									minute = until.slice(11, 13);
									second = until.slice(13, 15);
									$scope.ri.rangebyenddate = new Date(year, month, day, hour, minute, second);
								}

								$scope.ri.rangetype = rangeType;
								break;
						}
					}
				}

				if (unsupportedFeatures.length !== 0) {
					$scope.ri.messageAreaText = conf.i18n.unsupportedFeatures + ' ' + unsupportedFeatures.join('; ');
					return 1;
				} else {
					$scope.ri.messageAreaText = '';
					return 0;
				}

			}

			/**********************************
				Control Setup
			***********************************/
			//move any i18n settings from riLocale to LABELS, overwriting the default ones
			if ($scope.riLocale) {
				for (var localeName in $scope.riLocale) 
					tool.localize(localeName, $scope.riLocale[localeName]);
			}
						
			var conf = angular.extend({}, tool.conf);
			angular.extend(conf, $scope.riConfig);
			angular.extend(conf, { i18n: LABELS[conf.lang], name: $scope.riName });
			$scope.conf = conf;

			/**********************************
				RecurrenceInput Definition
			***********************************/
			// Extend conf with non-configurable data used by templates.
			var orderedWeekdays = [];
			var index, i;
			for (i = 0; i < 7; i++) {
				index = i + conf.firstDay;
				if (index > 6) {
					index = index - 7;
				}
				orderedWeekdays.push(index);
			}

			$.extend(conf, {
				orderIndexes: ['+1', '+2', '+3', '+4', '-1'],
				weekdays: ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'],
				orderedWeekdays: orderedWeekdays
			});

			// The recurrence type dropdown should show certain fields depending
			// on selection:
			$scope.ri.showridailyinterval = function () {
				return $scope.ri.rtemplate && $scope.ri.rtemplate.fields.indexOf('ridailyinterval') != -1;
			};
			$scope.ri.showrirangeoptions = function () { return $scope.ri.rtemplate && $scope.ri.rtemplate.fields.indexOf('rirangeoptions') != -1; };
			$scope.ri.showriweeklyinterval = function () { return $scope.ri.rtemplate && $scope.ri.rtemplate.fields.indexOf('riweeklyinterval') != -1; };
			$scope.ri.showriweeklyweekdays = function () { return $scope.ri.rtemplate && $scope.ri.rtemplate.fields.indexOf('riweeklyweekdays') != -1; };
			$scope.ri.showrimonthlyinterval = function () { return $scope.ri.rtemplate && $scope.ri.rtemplate.fields.indexOf('rimonthlyinterval') != -1; };
			$scope.ri.showrimonthlyoptions = function () { return $scope.ri.rtemplate && $scope.ri.rtemplate.fields.indexOf('rimonthlyoptions') != -1; };
			$scope.ri.showriyearlyinterval = function () { return $scope.ri.rtemplate && $scope.ri.rtemplate.fields.indexOf('riyearlyinterval') != -1; };
			$scope.ri.showriyearlyoptions = function () { return $scope.ri.rtemplate && $scope.ri.rtemplate.fields.indexOf('riyearlyoptions') != -1; };

			/*function occurrenceExclude(event) {
				event.preventDefault();
				if ($scope.ical.EXDATE === undefined) {
					$scope.ical.EXDATE = [];
				}
				$scope.ical.EXDATE.push(this.attributes.date.value);
				var $this = $(this);
				$this.attr('class', 'exdate');
				$this.parent().parent().addClass('exdate');
				$this.unbind(event);
				$this.click(occurrenceInclude); // Jslint warns here, but that's OK.
			}

			function occurrenceInclude(event) {
				event.preventDefault();
				$scope.ical.EXDATE.splice($.inArray(this.attributes.date.value, $scope.ical.EXDATE), 1);
				var $this = $(this);
				$this.attr('class', 'rrule');
				$this.parent().parent().removeClass('exdate');
				$this.unbind(event);
				$this.click(occurrenceExclude);
			}

			function occurrenceDelete(event) {
				event.preventDefault();
				$scope.ical.RDATE.splice($.inArray(this.attributes.date.value, $scope.ical.RDATE), 1);
				$(this).parent().parent().hide('slow', function () {
					$(this).remove();
				});
			}

			function occurrenceAdd(event) {
				event.preventDefault();
				var dateinput = form
					.find('.riaddoccurrence input#adddate')
					.data('dateinput');
				var datevalue = dateinput.getValue('yyyymmddT000000');
				if ($scope.ical.RDATE === undefined) {
					$scope.ical.RDATE = [];
				}
				$scope.ri.errorsText = '';

				// Add date only if it is not already in RDATE
				if ($.inArray(datevalue, $scope.ical.RDATE) === -1) {
					$scope.ical.RDATE.push(datevalue);
					var html = ['<div class="occurrence rdate" style="display: none;">',
							'<span class="rdate">',
								dateinput.getValue(conf.i18n.longDateFormat),
								'<span class="rlabel">' + conf.i18n.additionalDate + '</span>',
							'</span>',
							'<span class="action">',
								'<a date="' + datevalue + '" href="#" class="rdate" >',
									'Include',
								'</a>',
							'</span>',
							'</div>'].join('\n');
					form.find('div.rioccurrences').prepend(html);
					$(form.find('div.rioccurrences div')[0]).slideDown();
					$(form.find('div.rioccurrences .action a.rdate')[0]).click(occurrenceDelete);
				} else {
					$scope.ri.errorsText = conf.i18n.alreadyAdded;
				}
			}

			// element is where to find the tag in question. Can be the form
			// or the display widget. Defaults to the form.
			function loadOccurrences(startdate, rfc5545, start, readonly) {
				var element, occurrenceDiv;

				if (!readonly) {
					element = form;
				} else {
					element = display;
				}

				occurrenceDiv = element.find('.rioccurrences');
				occurrenceDiv.hide();

				var year, month, day;
				year = startdate.getFullYear();
				month = startdate.getMonth() + 1;
				day = startdate.getDate();

				var data = {
					year: year,
					month: month, // Sending January as 0? I think not.
					day: day,
					rrule: rfc5545,
					format: conf.i18n.longDateFormat,
					start: start
				};

				// TODO: finish this out and make it include R/ExDates
			}*/

			// Loading (populating) display and form widget with
			// passed RFC5545 string (data)
			function loadData(rfc5545) {
				var selector, format, startdate, dayindex, day;

				if (rfc5545) {
					widgetLoadFromRfc5545(rfc5545, true);
					// check checkbox
					recurrenceOn();
				} else {
					$scope.ri.display = conf.i18n.noRule;
				}

				startdate = $scope.ri.StartDate;

				if (startdate !== null && startdate !== undefined) {
					// If the date is a real date, set the defaults in the form
					$scope.ri.monthlydayofmonthday = startdate.getDate();
					dayindex = conf.orderIndexes[Math.floor((startdate.getDate() - 1) / 7)];
					day = conf.weekdays[startdate.getDay()];
					$scope.ri.monthlyweekdayofmonthindex = dayindex;
					$scope.ri.monthlyweekdayofmonth = day;

					$scope.ri.yearlydayofmonthmonth = startdate.getMonth() + 1;
					$scope.ri.yearlydayofmonthday = startdate.getDate();
					$scope.ri.yearlyweekdayofmonthindex = dayindex;
					$scope.ri.yearlyweekdayofmonthday = day;
					$scope.ri.yearlyweekdayofmonthmonth = startdate.getMonth() + 1;

					// Now when we have a start date, we can also do an ajax call to calculate occurrences:
					//loadOccurrences(startdate, widgetSaveToRfc5545(true).result, 0, false);

					// Show the add and refresh buttons:
					$scope.ri.showrioccurrencesactions = true;

				} else {
					// No EXDATE/RDATE support
					$scope.ri.showrioccurrencesactions = false;
				}
			}

			function recurrenceOn() {
				var RFC5545 = widgetSaveToRfc5545(true);
				$scope.ri.display = conf.i18n.displayActivate + ' ' + RFC5545.description;
				$scope.xrrule = RFC5545.result;
				var startdate = $scope.ri.StartDate;
				if (startdate !== null && startdate !== undefined) {
					//loadOccurrences(startdate, widgetSaveToRfc5545(form, conf, true).result, 0, true);
				}
			}

			function recurrenceOff() {
				$scope.ri.display = conf.i18n.displayUnactivate;
				$scope.xrrule = null;
				//display.find('.rioccurrences').hide();
				$scope.ri.enabled = false;
			}

			$scope.enableChanged = function () {
				if ($scope.ri.enabled) {
					$scope.ri.showForm();
					recurrenceOn();
				} else {
					recurrenceOff();
				}
			};

			$scope.toggleRecurrence = function (e) {
				if ($scope.ri.enabled) {
					$scope.ri.showForm();
				}
			};

			function checkFields() {
				var startDate, endDate, num, messagearea;
				startDate = $scope.riStartDate;

				// Hide any error message from before
				$scope.ri.messageAreaText = "";

				// Hide add field errors
				$scope.ri.errorsText = "";

				// Repeats Daily
				if ($scope.ri.showridailyinterval()) {
					// Check repeat every field
					num = $scope.ri.dailyinterval;
					if (!num || num < 1 || num > 1000) {
						$scope.ri.messageAreaText = conf.i18n.noRepeatEvery;
						return false;
					}
				}

				// Repeats Weekly
				if ($scope.ri.showriweeklyinterval()) {
					// Check repeat every field
					num = $scope.ri.weeklyinterval;
					if (!num || num < 1 || num > 1000) {
						$scope.ri.messageAreaText = conf.i18n.noRepeatEvery;
						return false;
					}
				}

				// Repeats Monthly
				if ($scope.ri.showrimonthlyinterval()) {
					// Check repeat every field
					num = $scope.ri.monthlyinterval;
					if (!num || num < 1 || num > 1000) {
						$scope.ri.messageAreaText = conf.i18n.noRepeatEvery;
						return false;
					}

					// Check repeat on
					if (!$scope.ri.monthlytype) {
						$scope.ri.messageAreaText = conf.i18n.noRepeatOn;
						return false;
					}
				}

				// Repeats Yearly
				if ($scope.ri.showriyearlyinterval()) {
					// Check repeat every field
					num = $scope.ri.yearlyinterval;
					if (!num || num < 1 || num > 1000) {
						$scope.ri.messageAreaText = conf.i18n.noRepeatEvery;
						return false;
					}

					// Check repeat on
					if (!$scope.ri.yearlyType) {
						$scope.ri.messageAreaText = conf.i18n.noRepeatOn;
						return false;
					}
				}

				// End recurrence fields

				// If after N occurences is selected, check its value
				if ($scope.ri.rangetype == "BYOCCURRENCES") {
					num = $scope.ri.rangebyoccurrencesvalue;
					if (!num || num < 1 || num > 1000) {
						$scope.ri.messageAreaText = conf.i18n.noEndAfterNOccurrences;
						return false;
					}
				}

				// If end date is selected, check its value
				if ($scope.ri.rangetype == "BYENDDATE") {
					endDate = new Date($scope.ri.rangebyenddate);
					if (isNaN(endDate.getTime())) {
						// if endDate is null that means the field is empty
						$scope.ri.messageAreaText = conf.i18n.noEndDate;
						return false;
					} else if (endDate < startDate) {
						// the end date cannot be before start date
						$scope.ri.messageAreaText = conf.i18n.pastEndDate;
						return false;
					}
				}
				
				if (!$scope.ri.rangetype) {
					$scope.ri.messageAreaText = conf.i18n.noEndRecurrence;
					return false;
				}

				return true;
			}

			$scope.ri.save = function () {
				// if no field errors, process the request
				if (checkFields()) {
					// close overlay
					$scope.ri.hideForm();
					// check checkbox
					$scope.ri.enabled = true;
					recurrenceOn();
				}

                $scope.ri.saved = true;
			};

			$scope.ri.cancel = function () {
				// close overlay
				$scope.ri.hideForm();
                if(!$scope.ri.saved)
                    $scope.xrrule = $scope.initialXRRule;

				updateInternals();
				// focus on checkbox
				//display.find('input[name=richeckbox]').focus();
			};

			function updateOccurances() {
				var startDate;
				startDate = findStartDate();

				// if no field errors, process the request
				if (checkFields()) {
					loadOccurrences(startDate,
						widgetSaveToRfc5545(true).result,
						0,
						false);
				}
			}

			/*
				Load the templates
			*/
			var directiveScope = $scope;
			formController.$inject = ['$scope', '$modalInstance'];
			function formController ($scope, $modalInstance) {
				$scope.ri = directiveScope.ri;
				$scope.i18n = directiveScope.i18n;
				$scope.conf = directiveScope.conf;
				$scope.ri.$modalInstance = $modalInstance;
				$scope.name = directiveScope.name;
			}
			
			$scope.ri.showForm = function () {
				if ($scope.ri.enabled) {
					$scope.modal = $modal.open({
						backdrop: true,
						template: riTemplate["riform.html"],
						controller: formController
					});
				}
			};

			$scope.ri.hideForm = function () {
				if($scope.ri.$modalInstance)
					$scope.ri.$modalInstance.close();
			};

			$scope.ical = { RDATE: [], EXDATE: [] };

			// Pop up the little add form when clicking "Add"
			/*form.find('div.riaddoccurrence input#adddate').dateinput({
				selectors: true,
				lang: conf.lang,
				format: conf.i18n.shortDateFormat,
				firstDay: conf.firstDay,
				yearRange: [-5, 10]
			}).data('dateinput').setValue(new Date());
			form.find('input#addaction').click(occurrenceAdd);*/

			/**********************************
				Default Values
			***********************************/
			$scope.i18n = $scope.conf.i18n;
			angular.extend($scope.ri, {
				dailyinterval: 1,
				weeklyinterval: 1,
				weeklyweekdays: [false, false, false, false, false, false, false],
				monthlyinterval: 1,
				monthlydayofmonthday: 1,
				monthlyweekdayofmonthindex: '+1',
				monthlyweekdayofmonth: 'SU',
				yearlyinterval: 1,
				yearlydayofmonthmonth: 1,
				yearlydayofmonthday: 1,
				yearlyweekdayofmonthindex: '+1',
				yearlyweekdayofmonthday: 'SU',
				yearlyweekdayofmonthmonth: 1
			});

			/**********************************
				Scope Management
			***********************************/

			// xrrule will hold the external rrule.

			function updateInternals() {
				$scope.ri.enabled = ($scope.xrrule && true) || false;
				loadData($scope.xrrule);
			}

			$scope.$watch('xrrule', updateInternals);
		}
			
        return {
            restrict: 'E',
            template: riTemplate["ridisplay.html"],
            scope: {
                xrrule: '=ngModel',
                riConfig: '=',
                riName: '=',
                EXDATES: '=riExdates',
                RDATES: '=riRdates',
                riLocale: '=',
                riStartDate: '='
            },
            link: function (scope, elem, attr, ctrl) {
                /* elem.bind('click', function(e) {
                     e.stopPropagation();
                 });
                 $document.bind('click', function() {
                     scope.$apply(attr.kdAntiClick);
                 });*/
            },
            controller: controller
        };
    };
	
	if(typeof define === "function" && define.amd) {
        define("riDirective", function (require, exports, module) {
            return riDirective;
        });
	} else {
		window.riDirective = riDirective;
	}