const gameGrid = document.getElementById("game-grid")

class Player {
    /* color, id, position, etc. */
}

document.addEventListener("DOMContentLoaded", (event) => {
    // create 9x9 grid of divs
    for (let i = 0; i < 9; i++) {
        let row = document.createElement("div")
        row.id = "row-" + i.toString()

        gameGrid.appendChild(row)

        for (let j = 0; j < 9; j++) {
            let col = document.createElement("div")
            col.id = "col-" + j.toString()
            col.textContent="";
            row.appendChild(col)
        }
    }
});