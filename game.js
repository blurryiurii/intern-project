gridSize = 9

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
    constructor() {
        this.gameGrid = document.getElementById("game-grid")
        this.gameLabels = document.getElementById("game-labels")
        this.playerTurn = document.getElementById("player-turn")
        this.wall = document.querySelector(".wall")

        this.constructCellGrid()

        this.turn = 0
        this.winner = -1

        this.players = [
            //         r, c, sym, walls
            new Player(8, 4, "X", 10),
            new Player(0, 4, "Y", 10)
        ]

        this.initPlayers()

        this.walls = []
        this.bounds = [] // bounds of the square cells; identical in len/width, so used for both
        this.setCellBounds()
        this.initWallDiv()
        this.lastWallIntent = []
        
        // if viewport changes, our cell gaps will too; recalculate...
        window.addEventListener("resize", (event) => { this.setCellBounds() })
        window.addEventListener("resize", (event) => { this.initWallDiv() })
        window.addEventListener("resize", (event) => { this.redrawWalls() })


        this.moveStack = []

        this.gameGrid.addEventListener("mousemove", (event) => { this.setWallPlaceholder() })
    }

    constructCellGrid() {
        // construct grid of divs
        for (let r = 0; r < gridSize; r++) {
            let row = document.createElement("div")
            row.id = "row-" + r

            this.gameGrid.appendChild(row)

            for (let c = 0; c < gridSize; c++) {
                let col = document.createElement("div")
                col.classList.add("col-" + c)
                // col.textContent = ""
                row.appendChild(col)

                col.appendChild(document.createElement("p"))
            }
        }
    }

    getAvailableMoves() {
        const moves = []
        var player = this.getCurrentPlayer()
        var r = player["r"]
        var c = player["c"]

        if (this.winner != -1) {return []}

        // scan neighboring cells for free spots; if neighbor is a player, can hop over, even sideways
        // vertical
        if (r > 0) { // upward
            if (r > 1 && getCellText(r - 1, c)) {
                moves.push([r - 2, c])
            } else {

                moves.push([r - 1, c])
            }
        }
        if (r < gridSize - 1) {  // downward
            if (r < gridSize - 2 && getCellText(r + 1, c)) {
                moves.push([r + 2, c])
            } else {
                moves.push([r + 1, c])
            }
        }
        // horizontal
        if (c > 0) {  // leftward
            if (c > 1 && getCellText(r, c - 1)) {
                moves.push([r , c - 2])
            } else {
                moves.push([r, c - 1])
            }
        }
        if (c < gridSize - 1) {  // rightward
            if (c < gridSize - 2 && getCellText(r, c + 1)) {
                moves.push([r, c + 2])
            } else {
                moves.push([r, c + 1])
            }
        }

        return moves
    }

    getCurrentPlayer() {
        // return the position of player whose turn it is
        return this.players[this.turn]
    }

    getRelativePos(obj) {
        // ...relative to gameGrid

        var viewportX = event.clientX  // top left corner of user screen
        var viewportY = event.clientY

        var gridPos = this.gameGrid.getBoundingClientRect()
        var gameGridX = gridPos.x  // top left corner of gameGrid
        var gameGridY = gridPos.y

        var relativeX = viewportX - gameGridX
        var relativeY = viewportY - gameGridY

        return [relativeX, relativeY]
    }

    getWallId(wall) {
        var row = wall["row"]
        var col = wall["col"]
        var isHorizontal = wall["isHorizontal"]
        const horizontalText = isHorizontal ? "horiz" : "vert"
        return "wall" + row + "-" + col + "-" + horizontalText
    }

    getWallIntent() {
        /* Between cells, the empty space is intended to allow wall placement.
         * Calculate cursor position's intended wall placement
         */

        var relativeX, relativeY
        var row, col, isHorizontal
        
        [relativeX, relativeY] = this.getRelativePos()

        var found = false
        
        var gridPos = this.gameGrid.getBoundingClientRect()
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
            return new Wall(row, col, isHorizontal)
        } else {
            return
        }
    }

    getWallsLeft() {
        return this.players[this.turn]["wallsLeft"]
    }

    initPlayers() {
        // create and move players to their starting positions
        for (let n = 0; n < 2; n++) {
            var curPlayer = this.players[n];
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
        this.wall.style.height = this.gapSize + "px"
        this.wall.style.width = (this.bounds[1][0] - this.bounds[0][0]) * 2 + "px"
        this.wall.style.visibility = "hidden"
    }

    isValidWallPlacement(wallMove) {
        // check if player has walls left
        if (!this.getWallsLeft()) return false

        // check if wall is already placed in one of its two spots
        

        return true
    }

    insertWall(wallMove) {
        this.walls.push(wallMove)
        this.redrawWalls()
    }

    makeMove(move) {
        this.toggleMoves()

        if (move instanceof PlayerMove) {
            var player = this.getCurrentPlayer()
            this.movePlayer(move)
            
            var r = move["endR"]
            if (this.turn == 0 && r == 0) {
                this.winner = 0
            } else if (this.turn == 1 && r == 8) {
                this.winner = 1
            }
        } else { // instanceof WallMove
            this.insertWall(move)
            this.players[this.turn]["wallsLeft"] -= 1
        }

        this.moveStack.push(move)

        this.nextTurn()

        this.toggleMoves()
    }

    movePlayer(playerMove) {
        // perform a state change with the player's move

        var player = this.players[this.turn]

        // update the underlying player position
        player["r"] = playerMove["endR"]
        player["c"] = playerMove["endC"]

        // move the cell text
        var startCell = getCell(playerMove["startR"], playerMove["startC"])
        var endCell = getCell(playerMove["endR"], playerMove["endC"])
        var symbol = player["symbol"]
        endCell.querySelector("p").innerHTML = symbol
        startCell.querySelector("p").innerHTML = ""
    }

    nextTurn() {
        this.turn = (this.turn + 1) % 2
        this.updateTurnDisplay()
    }

    setCellBounds() {
        this.bounds = []

        const gridPos = this.gameGrid.getBoundingClientRect()
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
    }

    redrawWalls() {
        // clear existing walls, in case we resize and need to redraw
        for (let r = 0; r < gridSize; r++) {
            for (let c = 0; c < gridSize; c++) {
                var curWall = document.getElementById(this.getWallId(new Wall(r, c, true)))
                if (curWall) curWall.remove()
                curWall = document.getElementById(this.getWallId(new Wall(r, c, false)))
                if (curWall) curWall.remove()
            }
        }

        console.log(this.walls)
        this.walls.forEach((wall) => {
            console.log(wall)
            var row = wall["row"]
            var col = wall["col"]
            var isHorizontal = wall["isHorizontal"]

            const clonedWall = this.wall.cloneNode()
            const horizontalText = isHorizontal ? "horiz" : "vert"
            clonedWall.id = this.getWallId(wall)
            clonedWall.style.visibility = "visible"
            this.gameGrid.insertBefore(clonedWall, null)
            this.setWallPosition(clonedWall, wall)
        })
    }

    setWallPlaceholder() {
        // update or hide wall placement on hover if necessary

        var curWall = this.getWallIntent()
    
        // curWall undefined = not intending to place wall
        if (!curWall || !this.isValidWallPlacement) {
            this.wall.style.visibility = "hidden"
            this.lastWallIntent = -1
            return
        }
        if (areSameObject(curWall, this.lastWallIntent)) {
            return
        }
        this.wall.style.visibility = "visible"
        
        this.setWallPosition(this.wall, curWall)
        this.lastWallIntent = curWall

        // update the event listener on intended placement if clicked
        var clonedWall = this.wall.cloneNode()
        this.wall.parentNode.replaceChild(clonedWall, this.wall) // remove old event listener
        this.wall = clonedWall
        this.wall.addEventListener("click", () => {
            this.makeMove(curWall)
        })
    }

    setWallPosition(wall, wallIntent) {
        var row = wallIntent["row"]
        var col = wallIntent["col"]
        var isHorizontal = wallIntent["isHorizontal"]

        var gridPos = this.gameGrid.getBoundingClientRect()
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
    }

    toggleMoves() {
        // show/hide all possible moves from getMoveCoords()
        var moveCoords = this.getAvailableMoves()
        moveCoords.forEach(moveCoord => {
            cell = getCell(...moveCoord)  // moveCoord = tuple (r, c)
            cell.classList.toggle("available-move")
            if (cell.classList.contains("available-move")) {
                var player = this.getCurrentPlayer()
                var startR = player["r"]
                var startC = player["c"]
                var endR, endC
                [endR, endC] = moveCoord
                var move = new PlayerMove(startR, startC, endR, endC)
                cell.addEventListener("click", () => { this.makeMove(move)})
            } else {
                // clone cell and replace it, removing its event listeners
                var clonedCell = cell.cloneNode(true)
                cell.parentNode.replaceChild(clonedCell, cell)
            }
        });
    }

    updateTurnDisplay() {
        if (this.winner != -1) {
            this.playerTurn.innerHTML = "WINNER! " + this.players[this.winner]["symbol"]
        } else {
            this.playerTurn.innerHTML = "Turn: " + this.players[this.turn]["symbol"] + ", walls left: " + this.getWallsLeft()
        }
    }
}

class Player {
    constructor(r, c, symbol, wallsLeft) {
        this.r = r
        this.c = c
        this.symbol = symbol
        this.wallsLeft = wallsLeft
    }
}

class PlayerMove {
    constructor(startR, startC, endR, endC) {
        this.startR = startR
        this.startC = startC
        this.endR = endR
        this.endC = endC
    }
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
    gs = new GameState()
});