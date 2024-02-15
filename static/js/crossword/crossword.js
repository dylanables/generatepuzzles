class Crossword {
    constructor(cols, rows, empty = '-', maxloops = 2000, available_words = []) {
        this.cols = cols;
        this.rows = rows;
        this.empty = empty;
        this.maxloops = maxloops;
        this.available_words = available_words;
        this.randomize_word_list();
        this.current_word_list = [];
        this.debug = 0;
        this.clear_grid();
    }
    clear_grid() {
        this.grid = [];
        for (let i = 0; i < this.rows; i++) {
            const ea_row = [];
            for (let j = 0; j < this.cols; j++) {
                ea_row.push(this.empty);
            }
            this.grid.push(ea_row);
        }
    }
    shuffleArray(arr) {
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
    randomize_word_list() {
        console.log(this.available_words)
        let temp_list = [];
        for (const word of this.available_words) {
            if (word instanceof Word) {
                temp_list.push(new Word(word.word, word.clue));
            } else {
                temp_list.push(new Word(word[0], word[1]));
            }
        }
        temp_list = this.shuffleArray(temp_list);
        temp_list.sort((a,b) => b.word.length - a.word.length);
        this.available_words = temp_list;
    }
    compute_crossword(time_permitted = 1.00, spins = 2) {
        time_permitted = parseFloat(time_permitted);
        let count = 0;
        const copy = new Crossword(this.cols, this.rows, this.empty, this.maxloops, this.available_words);
        const start_full = parseFloat(Date.now());
        while ((parseFloat(Date.now()) - start_full) < time_permitted || count === 0) {
            this.debug += 1;
            copy.current_word_list = [];
            copy.clear_grid();
            copy.randomize_word_list();
            let x = 0;
            while (x < spins) {
                for (const word of copy.available_words) {
                    if (!copy.current_word_list.includes(word)) {
                        copy.fit_and_add(word);
                    }
                }
                x += 1;
            }
            if (copy.current_word_list.length > this.current_word_list.length) {
                this.current_word_list = copy.current_word_list;
                this.grid = copy.grid;
            }
            count += 1;
        }
        return;
    }
    suggest_coord(word) {
        let count = 0;
        var coordlist = [];
        let glc = -1;
        for (const given_letter of word.word) {
            glc += 1;
            let rowc = 0;
            for (const row of this.grid) {
                rowc += 1;
                let colc = 0;
                for (const cell of row) {
                    colc += 1;
                    if (given_letter === cell) {
                        try {
                            if (rowc - glc > 0) {
                                if ((rowc - glc) + word.length <= this.rows) {
                                    coordlist.push([colc, rowc - glc, 1, colc + (rowc - glc), 0]);
                                }
                            }
                        }
                        catch { }
                        try {
                            if (colc - glc > 0) {
                                if ((colc - glc) + word.length <= this.cols) {
                                    coordlist.push([colc - glc, rowc, 0, rowc + (colc - glc), 0]);
                                }
                            }
                        }
                        catch { }
                    }
                }
            }
        }
        var new_coordlist = this.sort_coordlist(coordlist, word);
        return new_coordlist;
    }
    sort_coordlist(coordlist, word) {
        var new_coordlist = [];
        for (const coord of coordlist) {
            const col = coord[0], row = coord[1], vertical = coord[2];
            coord[4] = this.check_fit_score(col, row, vertical, word);
            if (coord[4]) {
                new_coordlist.push(coord);
            }
        }
        new_coordlist = this.shuffleArray(new_coordlist);
        new_coordlist.sort((i) => i[4], true);
        return new_coordlist;
    }
    fit_and_add(word) {
        let fit = false;
        let count = 0;
        const coordlist = this.suggest_coord(word);
        while (!fit && count < this.maxloops) {
            if (this.current_word_list.length === 0) {
                const vertical = Math.round(Math.random()), col = 1, row = 1;
                if (this.check_fit_score(col, row, vertical, word)) {
                    fit = true;
                    this.set_word(col, row, vertical, word, true);
                }
            } else {
                try {
                    var col = coordlist[count][0], row = coordlist[count][1], vertical = coordlist[count][2];
                } catch (IndexError) {
                    return;
                }
                if (coordlist[count][4]) {
                    fit = true;
                    this.set_word(col, row, vertical, word, true);
                }
            }
            count += 1;
        }
        return;
    }
    check_fit_score(col, row, vertical, word) {
        if (col < 1 || row < 1) {
            return 0;
        }
        let count = 1, score = 1;
        for (const letter of word.word) {
            try {
                var active_cell = this.get_cell(col, row);
            } catch (IndexError) {
                return 0;
            }
            if (active_cell === this.empty || active_cell === letter) {
                // pass
            } else {
                return 0;
            }
            if (active_cell === letter) {
                score += 1;
            }
            if (vertical) {
                if (active_cell !== letter) {
                    if (!this.check_if_cell_clear(col + 1, row)) {
                        return 0;
                    }
                    if (!this.check_if_cell_clear(col - 1, row)) {
                        return 0;
                    }
                }
                if (count === 1) {
                    if (!this.check_if_row_edge(row) && !this.check_if_cell_clear(col, row - 1)) {
                        return 0;
                    }
                }
                if (count === word.word.length) {
                    if (!this.check_if_row_edge(row) && !this.check_if_cell_clear(col, row + 1)) {
                        return 0;
                    }
                }
            } else {
                if (active_cell !== letter) {
                    if (!this.check_if_cell_clear(col, row - 1)) {
                        return 0;
                    }
                    if (!this.check_if_cell_clear(col, row + 1)) {
                        return 0;
                    }
                }
                if (count === 1) {
                    if (!this.check_if_col_edge(col) && !this.check_if_cell_clear(col - 1, row)) {
                        return 0;
                    }
                }
                if (count === word.word.length) {
                    if (!this.check_if_col_edge(col) && !this.check_if_cell_clear(col + 1, row)) {
                        return 0;
                    }
                }
            }
            if (vertical) {
                row += 1;
            }
            else {
                col += 1;
            }
            count += 1;
        }

        return score;
    }
    set_word(col, row, vertical, word, force = false) {
        if (force) {
            word.col = col;
            word.row = row;
            word.vertical = vertical;
            this.current_word_list.push(word);
            for (const letter of word.word) {
                this.set_cell(col, row, letter);
                if (vertical) {
                    row += 1;
                }
                else {
                    col += 1;
                }
            }
        }
        return;
    }
    set_cell(col, row, value) {
        this.grid[row - 1][col - 1] = value;
    }
    get_cell(col, row) {
        return this.grid[row - 1][col - 1];
    }
    check_if_cell_clear(col, row) {
        try {
            const cell = this.get_cell(col, row);
            if (cell === this.empty) {
                return true;
            }
        } catch (IndexError) {
            return true;
        }
        return false;
    }
    check_if_col_edge(col) {
        if (col - 1 === 0 || col === this.cols)
            return true;
        return false;
    }
    check_if_row_edge(row) {
        if (row - 1 === 0 || row === this.rows)
            return true;
        return false;
    }
    solution() {
        this.order_number_words();
        const copy = [];
        for (let r = 0; r < this.rows; r++) {
            const row_copy = [];
            for (let c = 0; c < this.cols; c++) {
                row_copy.push({ 'num': 0, 'letter': this.grid[r][c], 'input':  this.grid[r][c] !== '-' ? '*' : '-'});
            }
            copy.push(row_copy);
        }
        for (const word of this.current_word_list) {
            copy[word.row - 1][word.col - 1]['num'] = word.number;
        }
        return copy;
    }
    order_number_words() {
        this.current_word_list.sort((a,b) => (a.col + a.row) - (b.col + b.row));
        let count = 1, icount = 1;
        for (const word of this.current_word_list) {
            word.number = count;
            if (icount < this.current_word_list.length) {
                if (word.col === this.current_word_list[icount].col && word.row === this.current_word_list[icount].row) {
                    // pass
                }
                else {
                    count += 1;
                }
            }
            icount += 1;
        }
    }
    display(order = true) {
        if (order) {
            this.order_number_words();
        }
        const copy = this;
        for (const word of this.current_word_list) {
            copy.set_cell(word.col, word.row, word.number);
        }
        for (let r = 1; r <= copy.rows; r++) {
            for (let c = 1; c <= copy.cols; c++) {
                if (/^[a-zA-Z]+$/.test(String(copy.get_cell(c, r)))) {
                    copy.set_cell(c, r, '*');
                }
            }
        }
        return copy;
    }
    clues() {
        let clues = {
                across: [],
                down: [], 
        }
        let clues_coords = [];
        let acrossStr = 'Across: \n';
        let downStr = 'Down: \n';
        for (const word of this.current_word_list) {
            console.log(word)
            const orientation = word.orientation();
            if (orientation === 'across') {
                acrossStr += `${word.number}. ${word.clue}\n`;
                clues.across.push(word);
            }
            if (orientation === 'down') {
                downStr += `${word.number}. ${word.clue}\n`;
                clues.down.push(word);
            }
            let coord = []
            for (let i = 0; i < word.length; i++) {
                if (word.vertical){
                    coord.push([word.row + i, word.col]);
                } else {
                    coord.push([word.row, word.col + i]);
                }
            }
            let coords = {...word, coords: coord};
            clues_coords.push(coords);
        }
        //return acrossStr + downStr;
        //return clues;
        //return this.current_word_list;
        return clues_coords;
    }
}
class Word {
    constructor(word = null, clue = null) {
        this.word = word.replace(/\s/g, '').toLowerCase();
        this.clue = clue;
        this.length = this.word.length;
        this.row = null;
        this.col = null;
        this.vertical = null;
        this.number = null;
    }
    orientation() {
        if (this.vertical) {
            return 'down';
        }
        else {
            return 'across';
        }
    }
    __repr__() {
        return this.word;
    }
}

function crosswordGen(words, grid_size, level) {
    console.log("crosswordGen words", words);
    const a = new Crossword(grid_size, grid_size, '-', 2000, words);
    a.compute_crossword(2);
    const solution = a.solution();
    const grid = a.display().grid;
    //const clues = a.clues().split('\n');
    const clues = a.clues();
    console.log("SOLUTION", solution)
    console.log(grid)
    console.log(clues)

    return {
        original: solution,
        question: grid,
        words: clues,
    }
}