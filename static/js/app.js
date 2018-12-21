/*
 * Copyright 2017 Nest Labs Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
(function($, window, document) {
    'use strict';

    const DEFAULT_ALERTMSG_TIMEOUT = 5000; // show message for 5 seconds
    const DEFAULT_POLL_INTERVAL = 30000; // poll sample WWN app server every 30 seconds

    var xhrErrCount = 0;
    var pollIntervalId = 0;

    // find results containers for showing html content
    var resultsCard = $('.card#results');
    var contentCtl = resultsCard.find('p#content');
    var scheduleCtl = resultsCard.find('p#schedule');
    var statusCtl = resultsCard.find('p#status');
    var alertModalCtl = $('#alertModal');
    var confirmModalCtl = $('#confirmModal');

    // Either poll or listen for updates - disable either pollRESTClient or listenRESTClient 
    pollRESTClient();       // call sample WWN app server to fetch Nest data
    //listenRESTStreamClient();  // listen for sample WWN app server receiving Nest data

    /*
      Product updates within seconds after temperatures, setpoints, ambient temperatures, alarm states, motion/sound
      events have  changed - listen to updates from device and how to update their app real-time or near-real time.
      For example, with REST calls, poll every 30 or 60 seconds; with REST streaming, listen for updates on device level.
    */
    function listenRESTStreamClient() {
        // data refresh  - show status msg then show API results
        showMsg('info', '<i class="fa fa-refresh fa-spin fa-2x fa-fw" aria-hidden="true"></i>Nest product refresh');

        var source = new EventSource('/apicontent_stream');
        source.onmessage = function (event) {
            console.log("event: " +  event);
            let data = JSON.parse(event.data);
            handleData(data);
        };
    }

    /*
      Product updates within seconds after temperatures, setpoints, ambient temperatures, alarm states, motion/sound
      events have  changed - listen to updates from device and how to update their app real-time or near-real time.
      For example, with REST calls, poll every 30 or 60 seconds; with REST streaming, listen for updates on device level.
    */
    function pollRESTClient() {
        // find collapsible elements that have been expanded, to expand again after polling new data and replacing HTML
        let expandedIds = contentCtl.find('.collapse.show').map(function(){ return this.id }).get(); // need to convert to array
        createCookie("expandedIds", expandedIds);

        if ($('.modal').hasClass('show')) {
            alert("API polling is suspended until modal windows are closed.");
            return false;
        }

        // data refresh  - show status msg then show API results
        showMsg('info', '<i class="fa fa-refresh fa-spin fa-2x fa-fw" aria-hidden="true"></i>Nest product refresh');

        // fetch the data and update results
        let contentURL = resultsCard.data('api-url');

        let url = pollIntervalId ? (contentURL + "?poller_id=" + pollIntervalId) : contentURL;
        console.log("request content url = ", url);

        sendRequest({ url: url});

        if (!pollIntervalId) { // if polling not set up yet
            pollIntervalId = window.setInterval(pollRESTClient, DEFAULT_POLL_INTERVAL); // fetch data in specified intervals
        }
    }

    function handleData(data) {
        /*
           Product has clear error messaging when actions fail - handle common errors that occur when
           writing back to Nest devices, for example, locked thermostat, rate limit.
         */
        clearMsg(); // clear current message
        if (data.error) {
           /*  If the error message indicates the WWN connection is unauthorized, show a modal message
            * and then call logout(), which will redirect the user to the login page so they have the option
            * to re-authorize it.
            */
            if (/401/.test(data.error)) {
                showModalDialog(createAlertContent('error', data.error), '401 - Unauthorized', logout); 
            } else {
                showMsg('error', data.error);
            }
        } 
        if (data.info) {
            showMsg('info', data.info);
        } 
        if (data.content) {
            console.log('data has new api browse content');
            showContent(data);
        }
        if (data.schedule) {
            console.log('data has new schedule select content');
            showSchedule(data); 
        }
        return data;
    }

    function showContent(data) {
        if (!data || !data.content) return;
        contentCtl.html(data.content);

        // toggle expand/collapse icons for structure on show and hide events
        let toggleAccordionIcon = function (e) {
            $("a[href='#" + $(e.target).attr("id") + "']") // get link to section that was shown or hidden
            .find("i.chevron").toggleClass('fa-chevron-down fa-chevron-right'); // find and change chevron icon class 
        }
        $('.accordion').on('hide.bs.collapse', toggleAccordionIcon);
        $('.accordion').on('show.bs.collapse', toggleAccordionIcon);

        // update API data (for fields with radio buttons)
        $('input[type="radio"]').bind('click', function(ev) {
            let field = this.name;
            let newval = this.value;
            let msg = 'Set ' + field + ' to ' + newval + '?';
            switch(field) {
                case 'is_streaming':
                    msg = 'Turn ' + (newval === 'true'? 'ON' : 'OFF') + ' your Nest Cam?';
                    break;
                case 'away':
                    msg = 'Set your structure to ' + newval + '?';
                    break;
            }
            if (!window.confirm(msg)) {
                return false;
            } else {
                $(this).closest('form').submit(); // submit changes to API data
            }
        });

        $('form').on('submit', function(event) {
            sendRequest({ type: 'POST', 
                           url: $(this).attr('action'),
                          data: $(this).serialize()
                        }); 
            return false;
        });

        $(".modal.camera-imgs, .modal.thermostat-hist").on('show.bs.modal', function(e) {
            let deviceId = $(this).data('api-id');
            let url = $(this).data('api-url') + '/' + deviceId;
            let targetHref = this;
            sendRequest({ url: url }).done(function(data) {
                if (data.device_content) {
                    let content = $.trim(data.device_content); 
                    $(targetHref).find('.modal-body').html( content || ''); 
                }
            });
        }); 
    }

    function showSchedule(data) {
        if (!data || !data.schedule) return;
        scheduleCtl.html(data.schedule);

        let delScheduleRow = function(timerId) {
            var table = document.getElementById('scheduleTable');
            var tableBd = table.tBodies[0];
            if (!tableBd || !timerId) return false;
            let row = document.getElementById("rowTimer"+timerId);
            row && row.parentNode.removeChild(row);
            if (tableBd.rows.length === 0) {
                table.style.display = 'none';
            }
        };
        let addScheduleRow = function(schedule) {
            var table = document.getElementById('scheduleTable');
            //var tableBd = document.getElementById('scheduleTableBody');
            var tableBd = table.tBodies[0];
            if (!tableBd || !schedule) return false;
            var fragment = document.createDocumentFragment();
            var tr = document.createElement("tr");
            tr.setAttribute("id", "rowTimer"+schedule.timer);
            for (let key in schedule) {
                var td = document.createElement("td");
                if (key === 'timer') {
                    var button = document.createElement("button");
                    button.setAttribute("class", "btn transparent");
                    button.innerHTML = "X";
                    let delFn = function(){
                        let timerId = schedule[key];
                        clearTimeout(timerId);
                        delScheduleRow(timerId);
                        return false;
                    };
                    td.append(button);
                    button.addEventListener("click", delFn);
                } else {
                    td.innerHTML = schedule[key];
                }
                tr.appendChild(td);
            }
            tr.appendChild(td);
            fragment.appendChild(tr);
            tableBd.appendChild(fragment);
            table.style.display = 'table';
        };

        $('#schedAwayForm').on('submit', function(ev) {
            ev.stopImmediatePropagation();
            let $form = $(this); 
            let minutes = $form.find("*[name=schedule]").val();
            let structure = $form.find("*[name=structure]").val();
            let structureName = $form.find("*[name=structure] option:selected").text();
            let away = $form.find("*[name=away]").val();
            let url = $form.attr('path') + structure;
            /*
             Product asks using confirmation for an automated action, such as when switching Home/Away states and turning Camera on/off.
             */
            let confirmSchedule = function() {
                let confirmQMsg = "Set structure " + structureName + " home/away setting to '" + away + "'?";
                let cancelMsg = "Scheduled request to set home/away to '" + away + "' has been cancelled.";
                showConfirmModalDialog(createAlertContent('info', confirmQMsg), 'Structure Schedule',
                    function(){ sendRequest({ type: 'POST', url: url, data: "away="+away }); },
                    function(){ showMsg('info', cancelMsg); }
                );
                delScheduleRow(timerId);
            }; 
            let millseconds = (minutes || 5) * 60 * 1000; // default 5 minutes 
            var timerId = window.setTimeout(confirmSchedule, millseconds);
            showMsg('info', "Request to set home/away to '" + away + "' has been scheduled.");
            let schedule = {"name": structureName, "property": "away", "value": away, "time": minutes, "timer": timerId};
            addScheduleRow(schedule);
            return false;
        });

        $('#schedCamForm').on('submit', function(ev) {
            ev.stopImmediatePropagation();
            let $form = $(this); 
            let minutes = $form.find("*[name=schedule]").val();
            let camera = $form.find("*[name=camera]").val();
            let cameraName = $form.find("*[name=camera] option:selected").text();
            let isStreaming = $form.find("*[name=is_streaming]").val();
            let onOffLabel = isStreaming === 'true' ? 'ON' : 'OFF';
            let url = $form.attr('path') + camera;
            /*
             Product asks using confirmation for an automated action, such as when switching Home/Away states and turning Camera on/off.
             */
            let confirmSchedule = function() {
                let confirmQMsg = "Turn " + onOffLabel + " your " + cameraName + " Nest Cam?";
                let cancelMsg = "Scheduled request to set camera streaming on/off to '" + onOffLabel + "' has been cancelled.";
                showConfirmModalDialog(createAlertContent('info', confirmQMsg), 'Camera Schedule',
                    function(){ sendRequest({ type: 'POST', url: url, data: "is_streaming="+isStreaming }); },
                    function(){ showMsg('info', cancelMsg); }
                );
                delScheduleRow(timerId);
            };
            let millseconds = (minutes || 5) * 60 * 1000; // default 5 minutes
            var timerId = window.setTimeout(confirmSchedule, millseconds);
            showMsg('info', "Request to set camera streaming on/off to '" + onOffLabel + "' has been scheduled.");
            let schedule = {"name": cameraName, "property": "is_streaming", "value": isStreaming, "time": minutes, "timer": timerId};
            addScheduleRow(schedule);
            return false;
        });
    }

    function clearMsg() {
        statusCtl.empty();
        statusCtl.removeClass('message');
    }

    function showMsg(category, msg, timeout) {
        let content = createAlertContent(category, msg);
        statusCtl.addClass('message');
        statusCtl.html(content);
        if (-1 !== timeout) window.setTimeout(clearMsg, timeout || DEFAULT_ALERTMSG_TIMEOUT);
    }

    function showModalDialog(content, title, closeDialogHandler) {
        if (!alertModalCtl) return false;
        alertModalCtl.find('.modal-body>p').html(content);
        alertModalCtl.find('.modal-title').text(title||'');
        alertModalCtl.modal().on('hidden.bs.modal', function(event) {
            if (closeDialogHandler && typeof closeDialogHandler === 'function') {
                closeDialogHandler();
            } 
        });
    }

    function showConfirmModalDialog(content, title, okHndlr, cancelHndlr) {
        if (!confirmModalCtl) return false;
        confirmModalCtl.find('.modal-body>p').html(content);
        confirmModalCtl.find('.modal-title').text(title||''); // chaining is not working 
        confirmModalCtl.find("#okBtn").unbind("click").click(function(event) {
            if (okHndlr && typeof okHndlr === 'function') {
                okHndlr();
                confirmModalCtl.modal('hide');
            } 
        });
        confirmModalCtl.find("#cancelBtn").unbind("click").click(function(event) {
            if (cancelHndlr && typeof cancelHndlr === 'function') {
                cancelHndlr();
                confirmModalCtl.modal('hide');
            } 
        });
        confirmModalCtl.modal('show');
    }

    function createAlertContent(category, msg) {
        let cssClasses = 'alert alert-' + (category === 'error' ? 'danger' : category || 'info');
        return $('<div/>', { class: cssClasses, role: 'alert', html: msg });
    }

    function logout() { 
         window.location = $('#logout').attr('href'); 
    }

    function sendRequest(options) {
        if (!options) return;
        return $.ajax({
             type: options.type || 'GET',
             url: options.url,
             dataType: options.dataType || 'json',
             data: options.data || '',
             xhrFields: { withCredentials: true },
             crossDomain: true
        })
        .done(options.successHandler || handleData)
        .fail(options.failHandler || function(jqXHR, textStatus, errorThrown) {
             let url = window.location.href + (options.url ? (options.url.startsWith("/") ? options.url.slice(1) : options.url).split('?')[0] : '');
             showMsg('error', ['Error connecting to ', url, textStatus, (errorThrown||'Connection refused')].join(' : '));
             xhrErrCount += 1;
             if (xhrErrCount >= 3) {
                 console.log('discontinue polling after 3 connection errors');
                 window.clearInterval(pollIntervalId);
             }
        });
    }

    function createCookie(name,value,days) {
        if (days) {
            var date = new Date();
            date.setTime(date.getTime()+(days*24*60*60*1000));
            var expires = "; expires="+date.toGMTString();
        }
        else var expires = "";
        document.cookie = name+"="+value+expires+"; path=/";
    }

})( window.jQuery, window, document );
