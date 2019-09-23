var mouse={
    x: undefined,
    y: undefined
};



//Using currently string method instead of nested arrays

//var canvas = document.querySelector("canvas");
//canvas.width = window.innerWidth;
//canvas.height = window.innerHeight;



var canvas = document.getElementById("piirtoAlue");
var cellsize = 16;
var cols = 72;
var rows = 42;
var itemRatio = 16;
var itemCount = Math.floor( cols*rows*itemRatio /100);


//Trows= document.getElementById("formRows");
//Trows = document.getElementsByName("rows");
 
// if( document.getElementById("Trows") ) {
//     rows = document.getElementById("Trows").value;
// }
// if( document.getElementById("Trows") ) {
//     cols = document.getElementById("Tcols").value;
// }


//console.log(cols + "   " + rows );
//var options = document.getElementById("gameOptions");
//console.log(options);



// canvas.height = 400;
// canvas.width = 800;

// canvas.height = cellsize * rows;
// canvas.width = cellsize * cols;


var sisalto = canvas.getContext("2d");
var imgO = document.getElementById("orange");
var imgB = document.getElementById("blue");
var imgBfull = document.getElementById("fullblue");

var fullPicTilesX = 4;
var fullPicTilesY = 4;

const fieldNums = "0123456789ABCDEF";
const fieldChars = ".12345678#+*OX?P"; //+ hold down cell, O found mine that end game, X false flag ,- exploded earlier mine???


var field = []; //used for placing mines
var adjacency = []; //used for drawing canvas (current state)

//sisalto.fillRect( 100, 100, 100, 100);
// initField();
// drawCanvasField();

newGame();

sisalto.save();

//var _interval;

canvas.addEventListener("mousedown", mouseDown );
canvas.addEventListener("mouseup", mouseUp );
canvas.addEventListener("contextmenu", blockRMBMenu );

//paivitysdemo
//setInterval( refTest, 100 );

function refTest() {
    newGame();
}

function newGame() {
    if( document.getElementById("Trows") ) {
        rows = document.getElementById("Trows").value;
    }
    if( document.getElementById("Trows") ) {
        cols = document.getElementById("Tcols").value;
    }
    canvas.height = cellsize * rows;
    canvas.width = cellsize * cols;
    
    itemCount = Math.floor( cols*rows*itemRatio /100);
    
    initField();
    placeMines();
    //adjacencyFull();
    drawCanvasField();

    ///DEBUG LOG
    for( y = 0; y < rows; y++ ) {
        console.log(field[y]);
    }
}

function Cheat() {
    adjacencyFull();
    drawCanvasField();
}

function initField() {
    field = [];
    adjacency = [];
    for( y = 0; y < rows; y++ ){
        let _row = "";
        for( x = 0; x < cols; x++ ) {
            _row += "0";
            //_row += Math.floor( Math.random() * 2 ).toString();//FIXME set back to 2!
            //_row += Math.floor( Math.random() * 9 ).toString();//FIXME set back to 2!
        }
        field[y] = _row;
        //adjacency[y] = _row;
        adjacency[y] = "9".repeat( _row.length);
    }
}

function placeMines() {
    var minesLeft = itemCount;
    while( minesLeft > 0 ) {
        _xTry = Math.floor( Math.random() * cols );
        _yTry = Math.floor( Math.random() * rows );
        if( field[_yTry].charAt( _xTry ) == "0" ) {
            field[_yTry] = replaceAt( field[_yTry], _xTry, "B");
            minesLeft--;
        }
    }
}

function adjacencyFull() {
    for(let y = 0; y < rows; y++ ) {
        for(let x = 0; x < cols; x++ ) {
            //if( field[y].charAt( x ) == "0" ) {
            //}
            //console.log( adjacencyCell(y, x ));
            let _adj = adjacencyCell( y, x);
            if( _adj < 9 ) {
                adjacency[y] = replaceAt( adjacency[y], x, _adj.toString());
                //console.log( _adj );
            }
        }
    }
}

function adjacencyCell( y, x) {
    let _adjCount = 0;

    for( let cy = -1; cy < 2; cy++) {
        for( let cx = -1; cx < 2; cx++) {
            if( field[y].charAt( x ) == "B") {
                _adjCount = 0xB;
            } else if( y+cy >=0 && y+cy < rows) { //toimiva mutta, ehkä vähän vaikea lukuinen
                if( x+cx >=0 && x+cx < cols ) {
                    //if( grid[ y+cy, x+cx] ) _adjCount++;
                    if( field[ y+cy].charAt( x+cx) == "B") _adjCount++;
                }
            } 
        }
    }
    return _adjCount;
}


function clickCell( y, x ) {
    if( adjacency[y].charAt(x)=="9") {
        console.log("HIDDEN STUFF!");
        var _adj = adjacencyCell( y, x);
        adjacency[y] = replaceAt( adjacency[y], x, _adj.toString());
        drawCanvasCell( y, x);
    }
}

function drawCanvasCell( y, x ) {
    let _row = adjacency[y]; 
    let _char = _row.charAt( x );
    let _num = Number(_char);

    if( _num <= 9) { 
        //empty, numbered and unrevealed tile find from file and draw
        let _tx = _num % fullPicTilesX;
        let _ty = Math.floor(_num/fullPicTilesX);
        sisalto.drawImage( imgBfull, _tx*cellsize, _ty*cellsize, cellsize, cellsize, x*cellsize, y*cellsize, cellsize , cellsize);
    } else {
        switch( _char ) {
            //other tiles (bomb, flag...)
            //TODO Structure this properly
            case "A":
            case "B":
            default:
                sisalto.drawImage( imgBfull, 3*cellsize, 2*cellsize, cellsize, cellsize, x*cellsize, y*cellsize, cellsize , cellsize); //FIXME hardcoded
            break;
        }
    }
}

function drawCanvasField() {
    for( y = 0; y < rows; y++ ){
        //let _row = field[y];
        //let _row = adjacency[y];  //OFF NOW

        for( x = 0; x < cols; x++ ) {

            drawCanvasCell( y, x);

        }
    }
}

function blockRMBMenu() {
    if( event.button == 2) {
        event.preventDefault();
        event.stopPropagation();    //https://developer.mozilla.org/en-US/docs/Web/API/Event/stopPropagation
    }
}
function replaceAt( _string, location, character ) {
    let len = _string.length;
    location++; //using this that index 0 is first and start wont flip whole string
   
    _string = _string.slice( 0, location-1  ) + character + _string.slice( location);
    return _string;
}

function mouseDown(event) {

    var pos = getMousePos(canvas, event)
    mouse.x = pos.x,
    mouse.y = pos.y;

    var pos = getMousePos(canvas, event)
    celly = Math.floor( mouse.y / cellsize);
    cellx = Math.floor( mouse.x / cellsize);
    //console.log(mouse);
    //console.log("y:" + celly + " x:" + cellx);

    //mouseTimer = window.setTimeout(execMouseDown(celly, cellx),10);
    //interval_ = setInterval( DrawCell(celly, cellx), 500);

}

function mouseUp(event) {
    //clearInterval( _interval );
    var pos = getMousePos(canvas, event)
    mouse.x = pos.x,
    mouse.y = pos.y;

    var pos = getMousePos(canvas, event)
    celly = Math.floor( mouse.y / cellsize);
    cellx = Math.floor( mouse.x / cellsize);
    //console.log(mouse);
    //console.log("y:" + celly + " x:" + cellx);
    //DrawCell(celly, cellx);
    clickCell( celly, cellx);
}

function DrawCell(celly, cellx) {   //NOT IN USE!
    let _char = field[celly].charAt( cellx );


    //OLD CODE HERE
    if( _char == "0") {
        console.log("0->1");
        sisalto.drawImage( imgBfull, 32, 0, 16, 16, cellx*cellsize, celly*cellsize, 16, 16);
        //sisalto.drawImage( imgBfull, cellx*cellsize, celly*cellsize);
        field[celly] = replaceAt( field[celly], cellx, "1");
    } else if( _char == "1") {
        console.log("1->0");
        sisalto.drawImage( imgO, cellx*cellsize, celly*cellsize);
        field[celly] = replaceAt( field[celly], cellx, "0");
    }

    //sisalto.drawImage( imgB, cellx*cellsize, celly*cellsize);
    console.log("Draw try to " + cellx*cellsize +" " + celly*cellsize);
}

function getMousePos(canvas, event) {
    var rect = canvas.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    };
}

