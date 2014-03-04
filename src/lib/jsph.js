var fs = require('fs');

var compile = function compile(templateString) {
	templateString = "?>" + templateString + "<?";

	var inHtml = /[\?\%]>=?[\s\S]*?<[\?\%]/mgi;
	var inJs = /<[\?\%]=?[\s\S]*?[\?\%]>/mgi;

	var functionBody = "(function(jsph) { return function(vars) {\n";
	functionBody += "  var o = \"\";\n";

	htmlMatch = inHtml.exec(templateString);
	jsMatch = inJs.exec(templateString);
	while (htmlMatch !== null || jsMatch !== null)
	{
		if (htmlMatch !== null)
		{
			htmlMatch = htmlMatch[0].substring(2, htmlMatch[0].length -2);

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
	}

	functionBody += " return o;\n";
	functionBody += "} })(module.exports)";
	return eval(functionBody);
}

var compileFile = function compileFile(file, callback) {
	fs.readFile(file, function(err, fileContent) {
		return callback(err, compile(fileContent));
	});
}

var compileFileSync = function compileFileSync(file) {
	var fileContent = fs.readFileSync(file, 'utf8');
	return compile(fileContent);
}

var render = function render(templateString, vars) {
	var renderer = compile(templateString);
	return renderer(vars);
}

var renderFile = function renderFile(file, vars, callback) {
	compileFile(file, function(err, renderer) {
		return callback(err, renderer(vars));
	});
}

var renderFileSync = function renderFileSync(file, vars) {
	var renderer = compileFileSync(file);
	return renderer(vars);
}

module.exports = {
	compile: compile
	, compileFile: compileFile
	, compileFileSync: compileFileSync
	, render: render
	, renderFile: renderFile
	, renderFileSync: renderFileSync
}
