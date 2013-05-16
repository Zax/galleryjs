galleryjs
=========

A node.js script that create a gallery (html + jquery) from a directory of images. 
Based on jquery gallery project [supersized](http://buildinternet.com/project/supersized/) 

usage:

    node make.js directory_of_images [options]

example:

    node make.js demo

or

    node make.js demo '{ "title" : "Album Title" }'


https://github.com/buildinternet/supersized

Prerequisites:
  * [nodejs.org](http://nodejs.org/)
  * [imagemagick](http://www.imagemagick.org/script/index.php) need for read metadata from images
