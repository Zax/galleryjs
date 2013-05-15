// endWith function for string
String.prototype.endsWith = function(suffix) {
    return this.indexOf(suffix, this.length - suffix.length) !== -1;
};


function printSize(filename) {
	var result = fs.lstatSync(filename);
	return Math.round(result.size / 1000) + 'kb';
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
    console.log('Path of original photo not exist (' + path + ')!');
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
	    	// read metadata
	    	im.readMetadata(original_file, flow.add());
	    	var metadata = flow.wait();
	    	var title = files[i].replace('.jpg','');
	    	var meta = '';
			// description
	    	if (metadata.exif.imageDescription){
			    console.log('Description: '.grey + metadata.exif.imageDescription.white);
			    title = metadata.exif.imageDescription;
			}
			if (metadata.exif.dateTimeOriginal){
			    console.log('Date: '.grey + colors.white(metadata.exif.dateTimeOriginal));
			    meta += ' <li class="date">' + metadata.exif.dateTimeOriginal + '</li>';
			}
			if (metadata.exif.make){
			    console.log('Camera: '.grey + colors.white(metadata.exif.make + ' ' + metadata.exif.model));
			    meta += ' <li class="camera">' + metadata.exif.make + ' ' + metadata.exif.model + '</li>';
			}
			if (metadata.exif.isoSpeedRatings){
			    console.log('ISO: '.grey + colors.white(metadata.exif.isoSpeedRatings));
			    meta += ' <li class="iso">ISO' + metadata.exif.isoSpeedRatings + '</li>';
			}
			if (metadata.exif.focalLengthIn35mmFilm){
			    console.log('Focal: '.grey + colors.white(metadata.exif.focalLengthIn35mmFilm));
			    meta += ' <li class="focal">' + metadata.exif.focalLengthIn35mmFilm + 'mm</li>';
			}
	  	  console.timeEnd('time elapsed');
	  	  console.log();
	  	  if (meta) meta = '<ul class="metadata">' + meta + '</ul>';
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

