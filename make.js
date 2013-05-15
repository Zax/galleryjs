// endWith function for string
if (typeof String.prototype.endsWith !== 'function') {
	String.prototype.endsWith = function(suffix) {
		return this.indexOf(suffix, this.length - suffix.length) !== -1;
	};
}

if (!process.argv[2]){
	console.log('usage: node make.js album_directory [album_description]');
	process.exit(1);
}

var path = process.argv[2];
var fs = require('fs');
var asyncblock = require('asyncblock');
var sys = require('sys');
var exec = require('child_process').exec;
var im = require('imagemagick');
var colors = require('colors');
var bind = require("bind");
var parameters = null;

// check directories structure
if (!fs.existsSync(path)){
    console.log('Path "' +  path + '" of photos not exist!');
	process.exit(1);
}
// load parameters
console.log('load parameters...');
try{
	data = fs.readFileSync(path + '/index.json', 'utf8');
	parameters = JSON.parse(data);
}
catch (err){
	parameters = { 
		title: process.argv[3] ? process.argv[3] : path,
		load_images: true,
		load_metadata: true,
		slideshow: 1, 
		slide_interval: 1000, 
		transition: 1,
		transition_speed: 700,
		slides: []
	}
}

asyncblock(function (flow) {
	// load images			
	if (parameters.load_images){
		var files = fs.readdirSync(path);
		var foto = 0;
		for(var i in files) {
			var original_file = path + '/' + files[i];
	    	// check if jpeg file
	    	if (!original_file.endsWith('.jpg') || original_file.endsWith('_web.jpg') || original_file.endsWith('_thumb.jpg')) continue;
	    	console.time('time elapsed');
	    	console.log('Process file: ' + files[i].yellow + ' (' + printSize(original_file) + ')');
	    	// make web version (max 2000 px)
			var web_file = original_file.replace('.jpg','_web.jpg');
			exec('sips -Z 2000 ' + original_file + ' --out ' + web_file, flow.add());
			result = flow.wait();
			console.log('created web version (' + printSize(web_file) + ')');
	    	// make thumb version (max 200 px)
			var thumb_file = original_file.replace('.jpg','_thumb.jpg');
			exec('sips -Z 200 ' + original_file + ' --out ' + thumb_file, flow.add());
			result = flow.wait();
			console.log('created thumb version (' + printSize(thumb_file) + ')');

	    	var title = files[i].replace('.jpg','');
			// metadata
			if (parameters.load_metadata){
				// read metadata
				try{
					im.readMetadata(original_file, flow.add());
					var metadata = flow.wait();
					// description (used for title)
					if (metadata.exif.imageDescription){
						console.log('Description: '.grey + metadata.exif.imageDescription.white);
						title = metadata.exif.imageDescription;
					}
					if (metadata.exif.dateTimeOriginal){
						console.log('Date: '.grey + colors.white(metadata.exif.dateTimeOriginal));
					}
					if (metadata.exif.make){
						console.log('Camera: '.grey + colors.white(metadata.exif.make + ' ' + metadata.exif.model));
					}
					if (metadata.exif.isoSpeedRatings){
						console.log('ISO: '.grey + colors.white(metadata.exif.isoSpeedRatings));
					}
					if (metadata.exif.focalLengthIn35mmFilm){
						console.log('Focal: '.grey + colors.white(metadata.exif.focalLengthIn35mmFilm));
					}
				}
				catch (err){
					parameters.load_metadata = false;
				}
			}
			console.timeEnd('time elapsed');
			console.log();
	    	parameters.slides[foto] = { image : files[i].replace('.jpg', '_web.jpg'), thumb : files[i].replace('.jpg', '_thumb.jpg'), title: title, url : files[i] };
		    foto++;
		}
	}	
	// make html page from template
	console.log('Create index.html page...');
	bind.toFile('template.html', parameters, function(data) {
		fs.writeFile(path + '/index.html', data, 'utf8');
	});
	// save parameters
	console.log('Save parameters');
	fs.writeFile(path + '/index.json', JSON.stringify(parameters, null, 4), 'utf8');
});

// print size of file (format kb)
function printSize(filename) {
	var result = fs.lstatSync(filename);
	return Math.round(result.size / 1000) + 'kb';
}

// endWith function for string
if (typeof String.prototype.endsWith !== 'function') {
	String.prototype.endsWith = function(suffix) {
		return this.indexOf(suffix, this.length - suffix.length) !== -1;
	};
}
// resize image, try with sips, then
function resizeImage(original, resized, max_dimension, callback) {
	exec('sips -Z ' + max_dimension + ' ' + original + ' --out ' + resized, function (error, stdout, stderr){
		if (error != null){
		}
		callback();
	});
}
