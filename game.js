const gameGrid = document.getElementById("game-grid")
const gameLabels = document.getElementById("game-labels")
const playerTurn = document.getElementById("player-turn")

gridSize = 9
numPlayers = 2


// bottom, top, right, left
const Players = [
    {"r": 8, "c": 4, "symbol": "X"}, 
    {"r": 0, "c": 4, "symbol": "Y"},
    {"r": 4, "c": 0, "symbol": "Z"},  // in case we want 4 player
    {"r": 4, "c": 8, "symbol": "A"}
]

function getCell(r, c) {
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
        this.players = new Array()
        this.initPlayers()

        this.walls = new Array()

        this.moveStack = new Array()  // for undoing moves if i want to later

        this.ended = false
        this.winner = 0
    }


    // update turn of the game
    nextTurn() {
        this.turn = (this.turn + 1) % numPlayers
        this.updateTurnDisplay()
    }
    prevTurn() {
        this.turn = (this.turn - 1) % numPlayers
        this.updateTurnDisplay()
    }

    updateTurnDisplay() {
        playerTurn.innerHTML = "Player turn: " + Players[this.turn]["symbol"]
    }

    getCurrentPlayer() {
        // return the position of player whose turn it is
        return this.players[this.turn]
    }

    getMoveCoords() {
        // return a list of coordinates current player can move to
        const moveCoords = []
        var player = this.getCurrentPlayer()
        var r = player["r"]
        var c = player["c"]
        
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

    toggleMoves() {
        // show/hide all possible moves from getMoveCoords()
        var moveCoords = this.getMoveCoords()
        moveCoords.forEach(moveCoord => {
            cell = getCell(...moveCoord)  // moveCoord = tuple (r, c)
            cell.classList.toggle("available-move")
            if (cell.classList.contains("available-move")) {
                var player = this.getCurrentPlayer()
                var startR = player["r"]
                var startC = player["c"]
                var endR, endC
                [endR, endC] = moveCoord
                var move = new Move("step", startR, startC, endR, endC)
                cell.addEventListener("click", () => { this.makeMove(move)})  // but function() doesn't work...
            } else {
                // clone cell and replace it, removing its event listeners
                var clonedCell = cell.cloneNode(true)
                cell.parentNode.replaceChild(clonedCell, cell)

                cell.removeEventListener("click", () => { this.makeMove(move)})
            }
        });
    }

    makeMove(move) {
        this.toggleMoves()

        if (move.type == "step") {
            var player = this.getCurrentPlayer()
            var r = move["r"]
            var c = move["c"]
            this.movePlayer(move)
        } else { // move.type == "wall"

        }
        this.moveStack.push(move)
        
        this.nextTurn()

        this.toggleMoves()
    }

    initPlayers() {
        // create and move players to their starting positions
        for (let n = 0; n < numPlayers; n++) {
            var curPlayer = Players[n];
            var r = curPlayer["r"]
            var c = curPlayer["c"]
            var symbol = curPlayer["symbol"]
            let player = new Player(r, c, symbol)

            this.players.push(player)

            var cell = getCell(r, c)
            var cellp = cell.querySelector("p")
            cellp.textContent = symbol
        }
   
        this.toggleMoves()

    }
    
    movePlayer(move) {
        // perform a state change with the player's move

        var player = Players[this.turn]

        // update the underlying player position
        player["r"] = move["endR"]
        player["c"] = move["endC"]
        
        // move the cell text
        var startCell = getCell(move["startR"], move["startC"])
        var endCell = getCell(move["endR"], move["endC"])
        var symbol = player["symbol"]
        endCell.querySelector("p").innerHTML = symbol
        console.log(endCell)
        startCell.querySelector("p").innerHTML = ""
    }
}

class Player {
    constructor(r, c, symbol) {
        this.r = r
        this.c = c
        this.symbol = symbol
    }
}

class Wall {
    constructor(row, col, isHorizontal) {
        this.row = row
        this.col = col
        this.isHorizontal = isHorizontal
    }
}

class Move {
    constructor(type, startR, startC, endR, endC) {
        this.type = type
        this.startR = startR
        this.startC = startC
        this.endR = endR
        this.endC = endC
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