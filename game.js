const gameGrid = document.getElementById("game-grid")
const gameLabels = document.getElementById("game-labels")
const playerTurn = document.getElementById("player-turn")
const wall = document.querySelector(".wall")
console.log(wall)

gridSize = 9
numPlayers = 2

const Players = [
    {"r": 8, "c": 4, "symbol": "X"},
    {"r": 0, "c": 4, "symbol": "Y"}
]

function getCell(r, c) {
    row = document.getElementById("row-" + r)
    if (row) {
        cell = row.querySelector(".col-" + c)
        if (!cell) {
            throw new Error("Cell is null: " + r + ", " + c)
        }
        return cell
    } else {
        throw new Error("Invalid Position: " + r + ", " + c)
    }
}

function getCellText(r, c) {
    // addition to getCell, helps retrieve the paragraph tag's text in the cell
    cellp = getCell(r, c).querySelector("p")
    return cellp.innerHTML
}

function areSameObject(obj1, obj2) {
    return JSON.stringify(obj1) == JSON.stringify(obj2)
}

// keeps track of players, walls, positions, turns
class GameState {
    constructor(numPlayers) {
        this.turn = 0

        this.players = []
        this.initPlayers()

        this.walls = []
        this.bounds = [] // bounds of the square cells; identical in len/width, so used for both
        this.setCellBounds()
        this.initWallDiv()
        this.lastWallIntent = []
        
        // if viewport changes, our cell gaps will too; recalculate...
        window.addEventListener("resize", (event) => { this.setCellBounds() })
        window.addEventListener("resize", (event) => { this.initWallDiv() })
        
        

        this.moveStack = []

        this.ended = false
        this.winner = -1

        gameGrid.addEventListener("mousemove", (event) => { this.setWallPlaceholder() })
    }


    nextTurn() {
        this.turn = (this.turn + 1) % numPlayers
        this.updateTurnDisplay()
    }
    prevTurn() {
        this.turn = (this.turn - 1) % numPlayers
        this.updateTurnDisplay()
    }

    updateTurnDisplay() {
        if (this.winner != -1) {
            playerTurn.innerHTML = "WINNER! " + Players[this.winner]["symbol"]
        } else {
            playerTurn.innerHTML = "Player turn: " + Players[this.turn]["symbol"]
        }
    }

    getCurrentPlayer() {
        // return the position of player whose turn it is
        return this.players[this.turn]
    }

    getRelativePos(obj) {
        // relative to gameGrid

        var viewportX = event.clientX  // top left corner of user screen
        var viewportY = event.clientY

        var gridPos = gameGrid.getBoundingClientRect()
        var gameGridX = gridPos.x  // top left corner of gameGrid
        var gameGridY = gridPos.y

        var relativeX = viewportX - gameGridX
        var relativeY = viewportY - gameGridY

        return [relativeX, relativeY]
    }

    getWallIntent() {
        /* Between cells, the empty space is intended to allow wall placement.
         * Calculate cursor position's intended wall placement
         */

        var relativeX, relativeY
        var row, col, isHorizontal
        
        [relativeX, relativeY] = this.getRelativePos()

        var found = false
        
        var gridPos = gameGrid.getBoundingClientRect()
        if (relativeX > 0 && relativeX < gridPos.width && relativeY > 0 && relativeY < gridPos.height) {

            // horizontal intents
            for (let r = 0; r < gridSize - 1; r++) {
                if (found) break
                for (let c = 0; c < gridSize - 1; c++) {
                    if (relativeY > this.bounds[r][1] && relativeY < this.bounds[r + 1][0] && relativeX < this.bounds[c][1] - this.gapSize) {
                        found = true
                        row = r
                        col = c
                        isHorizontal = true
                        break
                    }
                }
            }

            
            // vertical
            for (let c = 0; c < gridSize; c++) {
                if (found) break
                for (let r = 0; r < gridSize; r++) {
                    if (relativeX > this.bounds[c][1] && relativeX < this.bounds[c + 1][0] && relativeY < this.bounds[r][0] - this.gapSize) {
                        found = true
                        row = r
                        col = c
                        isHorizontal = false
                        break
                    }
                }
            }
        }

        if (found) {
            return [row, col, isHorizontal]
        } else {
            return
        }
    }

    setWallPlaceholder() {
        // update or hide wall placement on hover if necessary

        var wallIntent = this.getWallIntent()
        
        if (!wallIntent) {  // undefined = not intending to place wall
            wall.style.visibility = "hidden"
            this.lastWallIntent = -1
            return
        }
        if (areSameObject(wallIntent, this.lastWallIntent)) {
            return
        }
        wall.style.visibility = "visible"

        var row, col, isHorizontal
        [row, col, isHorizontal] = wallIntent

        var gridPos = gameGrid.getBoundingClientRect()  // todo: this is repeated from getRelativePos
        var gameGridX = gridPos.x
        var gameGridY = gridPos.y

        var cellLength = this.bounds[0][1] - this.bounds[0][0]

        var cellWithGap = this.gapSize + cellLength
        
        if (isHorizontal == true) {
            wall.style.left = gameGridX + (col * cellWithGap) - (this.gapSize / 2) + "px"
            wall.style.top = gameGridY + cellLength + (row * cellWithGap) + "px"
            wall.style.transform = "none"
        } else {
            wall.style.left = gameGridX + (col * cellWithGap) - (this.gapSize / 2) + "px"
            wall.style.top = gameGridY + (row * cellWithGap) - this.gapSize + "px"
            wall.style.transform = "rotate(90deg)"
        }
        this.lastWallIntent = wallIntent

        // update the event listener on intended placement if clicked
        
    }

    setCellBounds() {
        this.bounds = []

        const gridPos = gameGrid.getBoundingClientRect()
        const gameGridX = gridPos.x  // top left corner of gameGrid
        const gameGridY = gridPos.y

        const cell1pos = document.getElementById("row-0").getBoundingClientRect()
        const cell2pos = document.getElementById("row-1").getBoundingClientRect()
        this.gapSize = cell2pos.y - cell1pos.y - cell1pos.height

        for (let r = 0; r < gridSize; r++) {
            // calc the Y gap between cur and next cell
            var curCell = document.getElementById("row-" + r).getBoundingClientRect()
            var boundStart = curCell.y - gameGridY
            this.bounds.push([boundStart, boundStart + cell1pos.height])
        }
        // console.log(this.bounds)
    }

    getMoveCoords() {
        const moveCoords = []
        var player = this.getCurrentPlayer()
        var r = player["r"]
        var c = player["c"]

        // scan neighboring cells for free spots; if neighbor is a player, can hop over
        if (r > 0) { // upward
            if (r > 1 && getCellText(r - 1, c)) {
                moveCoords.push([r - 2, c])
            } else {
                moveCoords.push([r - 1, c])
            }
        }
        if (r < gridSize - 1) {  // downward
            if (r < gridSize - 2 && getCellText(r + 1, c)) {
                moveCoords.push([r + 2, c])
            } else {
                moveCoords.push([r + 1, c])
            }
        }
        if (c > 0) {  // leftward
            if (c > 1 && getCellText(r, c - 1)) {
                moveCoords.push([r , c - 2])
            } else {
                moveCoords.push([r, c - 1])
            }
        }
        if (c < gridSize - 1) {  // rightward
            if (c < gridSize - 2 && getCellText(r, c + 1)) {
                moveCoords.push([r, c + 2])
            } else {
                moveCoords.push([r, c + 1])
            }
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
            }
        });
    }

    makeMove(move) {
        this.toggleMoves()

        if (move.type == "step") {
            var player = this.getCurrentPlayer()
            var r = move["endR"]
            this.movePlayer(move)

            if (this.turn == 0 && r == 0) {
                this.winner = 0
            } else if (this.turn == 1 && r == 8) {
                this.winner = 1
            }
        } else { // move.type == "wall"
            // todo...
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

    initWallDiv() {
        // resize wall according to cells
        wall.style.height = this.gapSize + "px"
        wall.style.width = (this.bounds[1][0] - this.bounds[0][0]) * 2 + "px"
        wall.style.visibility = "hidden"
    }

    movePlayer(move) {
        // perform a state change with the player's move

        var player = this.players[this.turn]

        // update the underlying player position
        player["r"] = move["endR"]
        player["c"] = move["endC"]

        // move the cell text
        var startCell = getCell(move["startR"], move["startC"])
        var endCell = getCell(move["endR"], move["endC"])
        var symbol = player["symbol"]
        endCell.querySelector("p").innerHTML = symbol
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
    // construct grid of divs
    for (let r = 0; r < gridSize; r++) {
        let row = document.createElement("div")
        row.id = "row-" + r

        gameGrid.appendChild(row)

        for (let c = 0; c < gridSize; c++) {
            let col = document.createElement("div")
            col.classList.add("col-" + c)
            // col.textContent = ""
            row.appendChild(col)

            col.appendChild(document.createElement("p"))
        }
    }

    gs = new GameState(numPlayers)
});