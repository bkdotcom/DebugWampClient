import $ from 'jquery';				// external global
import * as methods from "./methods.js";

var connections = {
	/*
	requestId : [ $node, ... ]
	*/
};

methods.init(connections);

function addChannel(channel, info) {
	var $container = info.$container,
		channels = $container.data("channels") || [],
		channelRoot = $container.data("channelRoot") || "general",
		$ul;
	channel = channel || channelRoot;
	if (channel == "phpError" || channels.indexOf(channel) > -1) {
		return;
	}
	channels.push(channel);
	$container.data("channels", channels);
	$ul = $().debugEnhance("buildChannelList", channels, channelRoot);
	$container.find(".channels > ul").replaceWith($ul);
	if (channels.length > 1) {
		$container.find(".channels").show();
	}
}

function getNode(requestId) {
	var $nodeWrapper,
		$node;
	if (typeof connections[requestId] !== "undefined") {
		$node = connections[requestId].slice(-1)[0];
	} else if ($("#"+requestId).length) {
		// "session alrleady closed?"  do our best to continue where we left off
		$node = $("#"+requestId).data("lastNode");
	} else {
		// create
		$nodeWrapper = $(''
			+'<div class="panel panel-default working">'
				+'<div class="panel-heading" data-toggle="collapse" data-target="#'+requestId+' > .panel-body.collapse">'
					+'<i class="glyphicon glyphicon-chevron-down"></i>'
					+'<i class="glyphicon glyphicon-remove pull-right btn-remove-session"></i>'
					+'<div class="panel-heading-body">'
						+'<h3 class="panel-title">Building Request...</h3>'
						+'<i class="fa fa-spinner fa-pulse fa-lg"></i>'
					+'</div>'
				+'</div>'
				+'<div class="panel-body collapse debug">'
					+'<div class="debug-body">'
						+'<fieldset class="channels" style="display:none;">'
							+'<legend>Channels</legend>'
							+'<ul class="list-unstyled">'
							+'</ul>'
						+'</fieldset>'
						+'<ul class="debug-log-summary group-body"></ul>'
						+'<ul class="debug-log group-body"></ul>'
					+'</div>'
					+'<i class="fa fa-spinner fa-pulse"></i>'
				+'</div>'
			+'</div>'
		);
		$node = $nodeWrapper.find(".debug-log");
		connections[requestId] = [ $node ];
		$nodeWrapper.attr("id", requestId);
		$("#body").append($nodeWrapper);
	}
	return $node;
};

export function processEntry(method, args, meta) {
	var info = {
			$currentNode: getNode(meta.requestId),
			$container: $("#"+meta.requestId)
		},
		channels = info.$container.data('channels') || [],
		channel = meta.channel || info.$container.data("channelRoot"),
		i,
		$channelCheckbox,
		$node;
	try {
		/*
		console.log({
			method: method,
			args: args,
			meta: meta
		});
		*/
		if (meta.format == "html") {
			if (typeof args == "object") {
				$node = $('<li />', {class:"m_"+method});
				for (i = 0; i < args.length; i++) {
					$node.append(args[i]);
				}
			} else {
				$node = $(args);
				if ($node.find("> .m_"+method).length == 0) {
					$node = $('<li />', {class:"m_"+method}).html(args);	// $node.wrap('<div />').addClass("m_"+method);
				}
			}
		} else if (methods.methods[method]) {
			$node = methods.methods[method](method, args, meta, info);
		} else {
			$node = methods.methods.default(method, args, meta, info);
		}
		addChannel(channel, info);
		if ($node) {
			info.$currentNode.append($node);
			$node.attr("data-channel", meta.channel);	// using attr so can use [data-channel="xxx"] selector
			if (channels.length > 1 && channel !== "phpError" && !info.$container.find('.channels input[value="'+channel+'"]').prop("checked")) {
				$node.addClass("filter-hidden");
			}
			if ($node.is(':visible')) {
				$node.debugEnhance();
			}
			$node.closest(".m_group").removeClass("empty");
		}
	} catch (err) {
		console.warn(err);
		/*
		processEntry('error', [
			"%cDebugWampClient: %cerror processing %c"+method+"()",
			"font-weight:bold;",
			"",
			"font-family:monospace;"
		], meta);
		*/
	}
};
