const gameGrid = document.getElementById("game-grid")

var gridSize = 9
class GameState {
    /* color, id, position, etc. */
}

// when page loads
document.addEventListener("DOMContentLoaded", (event) => {
    // create 9x9 grid of divs
    for (let i = 0; i < gridSize; i++) {
        let row = document.createElement("div")
        row.id = "row-" + i.toString()

        gameGrid.appendChild(row)

        for (let j = 0; j < gridSize; j++) {
            let col = document.createElement("div")
            col.id = "col-" + j.toString()
            col.textContent="";
            row.appendChild(col)
        }
    }
});