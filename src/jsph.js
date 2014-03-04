(function () {
	var fs = require('fs');
	var helpers = {};
	var nullTemplate = function() { return ''; };
	var jsph = {
		helpers: {},

		compile: function compile(templateString) {
			if (!templateString) {
				return nullTemplate;
			}

			templateString = "?>" + templateString + "<?";

			var inHtml = /[\?\%]>=?[\s\S]*?<[\?\%]/mgi;
			var inJs = /<[\?\%]=?[\s\S]*?<?[\?\%]>/mgi;

			var functionBody = "(function(jshp) { return function(vars) {\n";
			functionBody += "  var o = \"\";\n";

			htmlMatch = inHtml.exec(templateString);
			jsMatch = inJs.exec(templateString);

			while (htmlMatch !== null || jsMatch !== null)
			{
				var matchStartsAt, matchLen;

				if (htmlMatch !== null)
				{
					matchStartsAt = htmlMatch['index'];
					matchLen = htmlMatch[0].length;
					htmlMatch = htmlMatch[0].substring(2, matchLen - 2);

					if (htmlMatch !== "") {
						functionBody += "o += " + JSON.stringify(htmlMatch) + ";\n";
					}

					htmlMatch = inHtml.exec(templateString);
				}

				if (jsMatch !== null)
				{
					jsMatch = jsMatch[0].substring(2, jsMatch[0].length -2);

					if (/^=/.test(jsMatch)) {
						functionBody += "o += (" + jsMatch.substring(1).trim() + ");\n";
					}
					else {
						functionBody += jsMatch + "\n";
					}

					jsMatch = inJs.exec(templateString);
				}
				else if (matchStartsAt && matchLen && (matchStartsAt + matchLen < templateString.length)) {
					// they left off the closing tag, treat the rest like a js script
					jsMatch = templateString.substring(matchStartsAt + matchLen, templateString.length - 2);
					functionBody += jsMatch + "\n";
					jsMatch = null;
				}
			}

			functionBody += " return o;\n";
			functionBody += "} })(jsph)";
			//try {
				var fn = eval(functionBody);
				return fn;
			//} catch(err) {
			//	console.log(err)
			//	console.log("\n" + functionBody);
			//}
		},

		compileFile: function compileFile(file, callback) {
			fs.readFile(file, function(err, fileContent) {
				if (err) {
					return callback(err, nullTemplate);
				}
				else {
					return callback(err, jsph.compile(fileContent));
				}
			});
		},

		compileFileSync: function compileFileSync(file) {
			var fileContent = fs.readFileSync(file, 'utf8');
			return jsph.compile(fileContent);
		},

		render: function render(templateString, vars) {
			var renderer = jsph.compile(templateString);
			return renderer(vars);
		},

		renderFile: function renderFile(file, vars, callback) {
			if (typeof vars === "function"
				&& typeof callback === "undefined")
			{
				callback = vars;
			}

			jsph.compileFile(file, function(err, renderer) {
				return callback(err, renderer(vars));
			});
		},

		renderFileSync: function renderFileSync(file, vars) {
			var renderer = jsph.compileFileSync(file);
			return renderer(vars);
		},
	}

	// Node.js
	if (typeof module !== 'undefined' && module.exports) {
		module.exports = jsph;
	}
	// included directly via <script> tag
	else {
		root.jsph = jsph;
	}
}());