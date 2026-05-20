const gameGrid = document.getElementById("game-grid")
const gameLabels = document.getElementById("game-labels")
const playerTurn = document.getElementById("player-turn")

gridSize = 9
numPlayers = 2


// bottom, top, right, left
const startingPlayers = [
    {"r": 8, "c": 4, "symbol": "X"}, 
    {"r": 0, "c": 4, "symbol": "Y"}
]

function selectCell(r, c) {
    row = document.getElementById("row-" + r)
    if (row) {
        cell = row.querySelector("#col-" + c)
        return cell
    } else {
        throw new Error("Invalid Position: " + r + ", " + c)
    }
}

// keeps track of players, walls, positions, turns
class GameState {

    constructor(numPlayers) {
        this.turn = 0
        
        // add players to board
        this.players = []
        this.initPlayers()

        this.walls = []

        this.moveStack = []  // for undoing moves if i want to later

        this.ended = false
        this.winner = 0
    }


    // update turn of the game
    nextTurn() {
        this.turn = (this.turn + 1) % numPlayers
    }
    prevTurn() {
        this.turn = (this.turn - 1) % numPlayers
    }

    getMoveCoords() {
        // return a list of coordinates current player can move to
        const moveCoords = []
        var player = player = this.players[this.turn]
        var r = player["r"]
        var c = player["c"]
        console.log("Current pos: ", r, c)
        
        if (r > 0) {
            moveCoords.push([r - 1, c])
        }
        if (r < gridSize - 1) {
            moveCoords.push([r + 1, c])
        }
        if (c > 0) {
            moveCoords.push([r, c - 1])
        }
        if (c < gridSize - 1) {
            moveCoords.push([r, c + 1])
        }

        return moveCoords
    }

    showMoves() {
        // display all possible moves from getMoveCoords()
        moves = this.getMoveCoords()


    }

    makeMove(move) {
        if (move.type == "step") {

        } else { // move.type == "wall"

        }
        nextTurn()
    }

    initPlayers() {
        // create and move players to their starting positions
        for (let n = 0; n < numPlayers; n++) {
            var curPlayer = startingPlayers[n];
            var r = curPlayer["r"]
            var c = curPlayer["c"]
            var symbol = curPlayer["symbol"]
            let player = new Player(r, c, symbol)

            this.players.push(player)

            var cell = selectCell(r, c)
            var cellp = cell.querySelector("p")
            cellp.textContent = symbol
        }
        this.getMoveCoords()
    }
    
    movePlayer(move) {
        // perform a state change with the player's move
        // directions: 0..3: up, right, down, left
        [_moveType, r, c, direction] = move
        cell = selectCell(r, c)
    }
}

class Player {
    constructor(r, c, symbol) {
        this.r = r
        this.c = c
        this.symbol = symbol
    }

    // set r(val) {
    //     this.r = val
    // }

    // set c(val) {
    //     this.c = val
    // }
}

class Wall {
    constructor(row, col, isHorizontal) {
        this.row = row
        this.col = col
        this.isHorizontal = isHorizontal
    }
}

// when page loads
document.addEventListener("DOMContentLoaded", (event) => {
    // create 9x9 grid of divs
    for (let r = 0; r < gridSize; r++) {
        let row = document.createElement("div")
        row.id = "row-" + r

        gameGrid.appendChild(row)

        for (let c = 0; c < gridSize; c++) {
            let col = document.createElement("div")
            col.id = "col-" + c
            // col.textContent = ""
            row.appendChild(col)

            col.appendChild(document.createElement("p"))
        }
    }

    gs = new GameState(numPlayers)
});