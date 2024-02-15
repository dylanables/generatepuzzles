const newGrid = (size) => {
    let arr = new Array(size);

    for (let i = 0; i < size; i++) {
        arr[i] = new Array(size);  
    }

    for (let i = 0; i < Math.pow(size, 2); i++) {
        arr[Math.floor(i/size)][i%size] = CONSTANT.UNASSIGNED;
    }

    return arr;
}

// check duplicate number in col
const isColSafe = (grid, col, value) => {
    for (let row = 0; row < CONSTANT.GRID_SIZE; row++) {
        if (grid[row][col] === value) return false;
    }
    return true;
}

// check duplicate number in row
const isRowSafe = (grid, row, value) => {
    for (let col = 0; col < CONSTANT.GRID_SIZE; col++) {
        if (grid[row][col] === value) return false;
    }
    return true;
}

// check duplicate number in 3x3 box
const isBoxSafe = (grid, box_row, box_col, value) => {
    for (let row = 0; row < CONSTANT.BOX_SIZE; row++) {
        for (let col = 0; col < CONSTANT.BOX_SIZE; col++) {
            if (grid[row + box_row][col + box_col] === value) return false;
        }
    }
    return true;
}

// check in row, col and 3x3 box
const isSafe = (grid, row, col, value) => {
    return isColSafe(grid, col, value) && isRowSafe(grid, row, value) && isBoxSafe(grid, row - row%3, col - col%3, value) && value !== CONSTANT.UNASSIGNED;
}

// find unassigned cell
const findUnassignedPos = (grid, pos) => {
    for (let row = 0; row < CONSTANT.GRID_SIZE; row++) {
        for (let col = 0; col < CONSTANT.GRID_SIZE; col++) {
            if (grid[row][col] === CONSTANT.UNASSIGNED) {
                pos.row = row;
                pos.col = col;
                return true;
            }
        }
    }
    return false;
}

// shuffle arr
const shuffleArray = (arr) => {
    let curr_index = arr.length;

    while (curr_index !== 0) {
        let rand_index = Math.floor(Math.random() * curr_index);
        curr_index -= 1;

        let temp = arr[curr_index];
        arr[curr_index] = arr[rand_index];
        arr[rand_index] = temp;
    }

    return arr;
}

function randomChoice(arr) {
    return arr[Math.floor(arr.length * Math.random())];
}

const wordsearchCreate = (grid, words) => {

    console.log("wordsearchCreate", words);

    let unassigned_pos = {
        row: -1,
        col: -1
    }

    if (!findUnassignedPos(grid, unassigned_pos)) return true;

    let word_list = shuffleArray(words);
    //const orientations = ['leftright', 'rightleft', 'up', 'down', 'rightup', 'rightdown', 'leftup', 'leftdown']
    const orientations = ['up', 'down']

    let row = unassigned_pos.row;
    let col = unassigned_pos.col;

    word_list.forEach((word, i) => {
        word_length = word.length;

        let step_x = 0;
        let step_y = 0;
        let x_pos = 0;
        let y_pos = 0;

        let placed = false;
        while(!placed) {
            let orientation = randomChoice(orientations);

            if (orientation === 'leftright'){
                step_x = 1;
                step_y = 0;
            }
            if (orientation === 'rightleft'){
                step_x = -1;
                step_y = 0;
            }
            if (orientation === 'up'){
                step_x = 0;
                step_y = -1;
            }
            if (orientation === 'down'){
                step_x = 0;
                step_y = 1;
            }
            if (orientation === 'rightup'){
                step_x = 1;
                step_y = -1;
            }
            if (orientation === 'rightdown'){
                step_x = 1;
                step_y = 1;
            }
            if (orientation === 'leftup'){
                step_x = -1;
                step_y = -1;
            }
            if (orientation === 'leftdown'){
                step_x = -1;
                step_y = 1;
            }

            // choosing random starting position for word
            x_pos = Math.floor(Math.random() * (CONSTANT.GRID_SIZE-1))
            y_pos = Math.floor(Math.random() * (CONSTANT.GRID_SIZE-1))

            // determine if word can fit in grid with it's starting position
            let ending_x = x_pos + word_length*step_x;
            let ending_y = y_pos + word_length*step_y;

            if (ending_x < 0 || ending_x >= CONSTANT.GRID_SIZE) continue;
            if (ending_y < 0 || ending_y >= CONSTANT.GRID_SIZE) continue;

            let failed = false;

            for (let i = 0; i < word_length; i++) {
                let character = word[i]

                let curr_x = x_pos + i*step_x
                let curr_y = y_pos + i*step_y

                let character_curr_pos = grid[curr_x][curr_y]
                if (character_curr_pos != '_')
                    if (character_curr_pos == character) {
                        continue
                    } else {
                        failed = true;
                        break;
                    }
            }
            if (failed){
                continue;
            } else {
                // place word
                for (let i = 0; i < word_length; i++) {
                    character = word[i]

                    curr_x = x_pos + i*step_x
                    curr_y = y_pos + i*step_y

                    grid[curr_x][curr_y] = character
                }
                placed = true;
            }
        }

        //if (isSafe(grid, row, col, num)) {
        //    grid[row][col] = num;

        //    if (isFullGrid(grid)) {
        //        return true;
        //    } else {
        //        if (wordsearchCreate(grid)) {
        //            return true;
        //        }
        //    }

        //    grid[row][col] = CONSTANT.UNASSIGNED;
        //}
    });

    //return grid;

    console.log(grid)

    // all words have been placed
    return true;
}

const sudokuCheck = (grid) => {
    let unassigned_pos = {
        row: -1,
        col: -1
    }

    if (!findUnassignedPos(grid, unassigned_pos)) return true;

    grid.forEach((row, i) => {
        row.forEach((num, j) => {
            if (isSafe(grid, i, j, num)) {
                if (isFullGrid(grid)) {
                    return true;
                } else {
                    if (wordsearchCreate(grid)) {
                        return true;
                    }
                }
            }
        })
    })

    return isFullGrid(grid);
}

const rand = () => Math.floor(Math.random() * CONSTANT.GRID_SIZE);

const fillGrid = (grid) => {
    let res = [...grid];
    // fill rest of grid with random letters
    for (let x = 0; x < CONSTANT.GRID_SIZE; x++) {
        for (let y = 0; y < CONSTANT.GRID_SIZE; y++) {
            if (res[x][y] == CONSTANT.UNASSIGNED) {
                const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'; 
                const randomLetter = alphabet[Math.floor(Math. random() * alphabet.length)];
                res[x][y] = randomLetter;
            }
        }
    }
    return res;
}

// generate sudoku based on level
const wordsearchGen = (words, level) => {
    console.log("wordsearchGen called")
    let grid = newGrid(CONSTANT.GRID_SIZE);
    let check = wordsearchCreate(grid, words);
    if (check) {
        let question = fillGrid(grid);
        console.log(grid)
        console.log(question)
        console.log(words)
        return {
            original: grid,
            question: question,
            words: words,
        }
    }
    console.log("undefined returned")
    return undefined;
}