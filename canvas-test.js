var mouse={
    x: undefined,
    y: undefined
};





//var canvas = document.querySelector("canvas");
//canvas.width = window.innerWidth;
//canvas.height = window.innerHeight;

var canvas = document.getElementById("piirtoAlue");
var cellsize = 16;
var cols = 72;
var rows = 42;

// canvas.height = 400;
// canvas.width = 800;

canvas.height = cellsize * rows;
canvas.width = cellsize * cols;


var sisalto = canvas.getContext("2d");
var imgO = document.getElementById("orange");
var imgB = document.getElementById("blue");


var field = [];

//sisalto.fillRect( 100, 100, 100, 100);

for( y = 0; y < rows; y++ ){
    let _row = "";
    for( x = 0; x < cols; x++ ) {
        _row += Math.floor( Math.random() * 2 ).toString();
    }
    field[y] = _row;
}


//console.log( Math.floor( Math.random() * 2 ) );
//init draw
for( y = 0; y < rows; y++ ){
    let _row = field[y];
    //console.log( _row );
    for( x = 0; x < cols; x++ ) {
        //let _char = _row.slice( x,x+1 );
        let _char = _row.charAt( x );
        if( _char == "0") sisalto.drawImage( imgO, x*cellsize, y*cellsize);
        if( _char == "1") sisalto.drawImage( imgB, x*cellsize, y*cellsize);
    }
}
sisalto.save();

//var _interval;

canvas.addEventListener("mousedown", mouseDown );
canvas.addEventListener("mouseup", mouseUp );
canvas.addEventListener("contextmenu", mouseDown );

nakki = "nakki";
nakki = replaceAt( nakki, 0, "A");
console.log(nakki);


function replaceAt( _string, location, character ) {
    let len = _string.length;
    location++; //using this that index 0 is first and start wont flip whole string
   
    _string = _string.slice( 0, location-1  ) + character + _string.slice( location);
    return _string;
}

function mouseDown(event) {
    if( event.button == 2) {    //BUG WITH THIS!!
        event.preventDefault();
        event.stopPropagation();    //https://developer.mozilla.org/en-US/docs/Web/API/Event/stopPropagation
    }
    var pos = getMousePos(canvas, event)
    mouse.x = pos.x,
    mouse.y = pos.y;

    var pos = getMousePos(canvas, event)
    celly = Math.floor( mouse.y / cellsize);
    cellx = Math.floor( mouse.x / cellsize);
    console.log(mouse);
    console.log("y:" + celly + " x:" + cellx);

    //mouseTimer = window.setTimeout(execMouseDown(celly, cellx),10);
    //interval_ = setInterval( DrawCell(celly, cellx), 500);
    DrawCell(celly, cellx);
}

function mouseUp(event) {
    //clearInterval( _interval );
}

function DrawCell(celly, cellx) {
    let _char = field[celly].charAt( cellx );
    
    if( _char == "0") {
        console.log("0->1");
        sisalto.drawImage( imgB, cellx*cellsize, celly*cellsize);
        field[celly] = replaceAt( field[celly], cellx, "1");
    } else if( _char == "1") {
        console.log("1->0");
        sisalto.drawImage( imgO, cellx*cellsize, celly*cellsize);
        field[celly] = replaceAt( field[celly], cellx, "0");
    }
    //sisalto.drawImage( imgB, cellx*cellsize, celly*cellsize);
    console.log("Draw try to " + cellx*cellsize +" " + celly*cellsize);
}

function getMousePos(canvas, evt) {
    var rect = canvas.getBoundingClientRect();
    return {
      x: evt.clientX - rect.left,
      y: evt.clientY - rect.top
    };
}

