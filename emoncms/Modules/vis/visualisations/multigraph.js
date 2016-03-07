  var plotdata = [];
  var timeWindowChanged = 0;
  var multigraph_editmode = false;

  function convert_to_plotlist(multigraph_feedlist){
   var plotlist = [];
   for (z in multigraph_feedlist){
    if (multigraph_feedlist[z]['datatype']==1){
      plotlist[z] = {
        id: multigraph_feedlist[z]['id'],
        selected: 1,
        plot:
        {
          data: null,
          label: multigraph_feedlist[z]['name'],
          lines:
          {
            show: true,
            fill: multigraph_feedlist[z]['fill']
          }
        }
      };
    }

    else if (multigraph_feedlist[z]['datatype']==2) {
      plotlist[z] = {
        id: multigraph_feedlist[z]['id'],
        selected: 1,
        plot:
        {
          data: null,
          label: multigraph_feedlist[z]['name'],
          bars:
          {
            show: true,
            align: "left", barWidth: 3600*24*1000, fill: multigraph_feedlist[z]['fill']
          }
        }
      };
    } else {
      console.log("ERROR: Unknown plot datatype! Datatype: ", multigraph_feedlist[z]['datatype']);
    }

    if (multigraph_feedlist[z]['left']==true){
      plotlist[z].plot.yaxis = 1;
    } else if (multigraph_feedlist[z]['right']==true){
      plotlist[z].plot.yaxis = 2;
    } else {
      console.log("ERROR: Unknown plot alignment! Alignment setting: ", multigraph_feedlist[z]['right']);
    }

    // Only set the plotcolour variable if we have a value to set it with
    if (multigraph_feedlist[z]["lineColour"]) {
      // Some browsers really want the leading "#". It works without in chrome, not in IE and opera.
      // What the hell, people?
      if (multigraph_feedlist[z]["lineColour"].indexOf("#") == -1)
      {
        plotlist[z].plot.color = "#" + multigraph_feedlist[z]["lineColour"];
      } else {
        plotlist[z].plot.color = multigraph_feedlist[z]["lineColour"];
      }
    }

    if (multigraph_feedlist[z]['left']==false && multigraph_feedlist[z]['right']==false){
      plotlist[z].selected = 0;
    }

   }
   return plotlist;
  }

  /*
  Handle_feeds

  For all feeds in the plotlist:
  - remove all plot data if the time window has changed
  - if the feed is selected load new data
  - add the feed to the multigraph plot
  - plot the multigraph
  */
  function vis_feed_data(){
    var plotlist = convert_to_plotlist(multigraph_feedlist);
    plotdata = [];
    for(var i in plotlist) {
      if (timeWindowChanged) {
        plotlist[i].plot.data = null;
      }
      if (plotlist[i].selected) {
        if (!plotlist[i].plot.data)
        {
          var npoints = 800;
          interval = Math.round(((view.end - view.start)/npoints)/1000);
          
          var skipmissing = 0;
          
          if (multigraph_feedlist[i]['skipmissing']==undefined) {
              skipmissing = 1;
          } else {
              if (multigraph_feedlist[i]['skipmissing']) skipmissing = 1;
          }
          
          plotlist[i].plot.data = get_feed_data(plotlist[i].id,view.start,view.end,interval,skipmissing,1);
        }

        if ( plotlist[i].plot.data)
        {
          plotdata.push(plotlist[i].plot);
        }
      }
    }

    plot();

    timeWindowChanged=0;

    if (multigraph_editmode==true)
    {
      //update_multigraph_feedlist();
    }
  }

  function plot(){
    $.plot($("#graph"), plotdata, {
      grid: { show: true, hoverable: true, clickable: true },
      xaxis: { mode: "time", timezone: "browser", min: view.start, max: view.end },
      selection: { mode: "x" },
      legend: { position: "nw"},
      touch: { pan: "x", scale: "x"}
    });
  }

function multigraph_init(element){
  // Get start and end time of multigraph view
  // end time and timewindow is stored in the first multigraph_feedlist item.
  // start time is calculated from end - timewindow
  
  var timeWindow = (3600000*24.0*7);
  view.start = +new Date - timeWindow;
  view.end = +new Date;
  
  if (multigraph_feedlist[0]!=undefined){
    view.end = multigraph_feedlist[0].end;
    if (view.end==0) view.end = (new Date()).getTime();
    if (multigraph_feedlist[0].timeWindow) {
        view.start = view.end - multigraph_feedlist[0].timeWindow;
    }
  }

  var out =
    "<div id='graph_bound' style='height:400px; width:100%; position:relative; '>"+
      "<div id='graph'></div>"+
      "<div id='graph-buttons' style='position:absolute; top:20px; right:30px; opacity:0.5; display: none;'>"+


        "<div class='input-prepend input-append' id='graph-tooltip' style='margin:0'>"+
        "<span class='add-on'>Tooltip:</span>"+
        "<span class='add-on'><input id='enableTooltip' type='checkbox' checked ></span>"+
        "</div> "+

        "<div class='btn-group'>"+
        "<button class='btn graph-time' type='button' time='1'>D</button>"+
        "<button class='btn graph-time' type='button' time='7'>W</button>"+
        "<button class='btn graph-time' type='button' time='30'>M</button>"+
        "<button class='btn graph-time' type='button' time='365'>Y</button></div>"+

        "<div class='btn-group' id='graph-navbar' style='display: none;'>"+
        "<button class='btn graph-nav' id='zoomin'>+</button>"+
        "<button class='btn graph-nav' id='zoomout'>-</button>"+
        "<button class='btn graph-nav' id='left'><</button>"+
        "<button class='btn graph-nav' id='right'>></button></div>"+

      "</div>"+
    "</div>"
  ;
  $(element).html(out);

  $('#graph').width($('#graph_bound').width());
  $('#graph').height($('#graph_bound').height());
  if (embed) $('#graph').height($(window).height());

  $(window).resize(function(){
    $('#graph').width($('#graph_bound').width());
    if (embed) $('#graph').height($(window).height());
    plot();
  });


  //--------------------------------------------------------------------------------------
  // Graph zooming
  //--------------------------------------------------------------------------------------
  $("#graph").bind("plotselected", function (event, ranges){
     view.start = ranges.xaxis.from; 
     view.end = ranges.xaxis.to;
     timeWindowChanged = 1; vis_feed_data();
  });

  //----------------------------------------------------------------------------------------------
  // Operate buttons
  //----------------------------------------------------------------------------------------------
  $("#zoomout").click(function () {view.zoomout(); vis_feed_data();});
  $("#zoomin").click(function () {view.zoomin(); vis_feed_data();});
  $('#right').click(function () {view.panright(); vis_feed_data();});
  $('#left').click(function () {view.panleft(); vis_feed_data();});
  $('.graph-time').click(function () {view.timewindow($(this).attr("time")); vis_feed_data();});
  //-----------------------------------------------------------------------------------------------
  
    // Graph buttons and navigation efects for mouse and touch
    $("#graph").mouseenter(function(){
        $("#graph-navbar").show();
        $("#graph-tooltip").show();
        $("#graph-buttons").stop().fadeIn();
        $("#stats").stop().fadeIn();
    });
    $("#graph_bound").mouseleave(function(){
        $("#graph-buttons").stop().fadeOut();
        $("#stats").stop().fadeOut();
    });
    $("#graph").bind("touchstarted", function (event, pos){
        $("#graph-navbar").hide();
        $("#graph-tooltip").hide();
        $("#graph-buttons").stop().fadeOut();
        $("#stats").stop().fadeOut();
    });

    $("#graph").bind("touchended", function (event, ranges){
        $("#graph-buttons").stop().fadeIn();
        $("#stats").stop().fadeIn();
        view.start = ranges.xaxis.from; 
        view.end = ranges.xaxis.to;
        timeWindowChanged = 1; vis_feed_data();
    });
}