document.querySelector('#dark-mode-toggle').addEventListener('click', () => {
    document.body.classList.toggle('dark');
    const isDarkMode = document.body.classList.contains('dark');
    localStorage.setItem('darkmode', isDarkMode);
    // change mobile status bar color
    document.querySelector('meta[name="theme-color"]').setAttribute('content', isDarkMode ? '#1a1a2e' : '#fff');
});

// initial value

// screens
const start_screen = document.querySelector('#start-screen');
const settings_screen = document.querySelector('#settings-screen');
const game_screen = document.querySelector('#game-screen');
const pause_screen = document.querySelector('#pause-screen');
const result_screen = document.querySelector('#result-screen');
// ----------
const wordsearch_grid = document.querySelector('.main-crossword-grid');
var cells = document.querySelectorAll('.main-grid-cell');

const number_inputs = document.querySelectorAll('.number');

const game_level = document.querySelector('#game-level');
const game_time = document.querySelector('#game-time');

const result_time = document.querySelector('#result-time');

const words_list = document.querySelector('.words');
const words_list_across = document.querySelector('.words-across');
const words_list_down = document.querySelector('.words-down');
var words_cell = document.querySelectorAll('.word');
// TODO: remove any duplicates from input/OpenAI output
//const words = ['BARKING', 'FETCH', 'TAILWAG', 'PAWPRINT', 'PUPPY', 'WOOFING', 'LEASH', 'HOUND', 'BONE', 'LOYAL'];
const words = ['BARKING', 'FETCH', 'TAILWAG'];

let level_index = 0;
let level = CONSTANT.LEVEL[level_index];
let numwords = CONSTANT.NUMWORDS[level_index];

let timer = null;
let pause = false;
let seconds = 0;

let su = undefined;
let su_answer = undefined;

let selected_cell = -1;
let selected_word = null;

var found = [];

var prevCell = null;
var currCell = null;
var currSelection = null;
var isToggled = false;

// --------

const getGameInfo = () => JSON.parse(localStorage.getItem('crossword'));

// ----------------

const showTime = (seconds) => new Date(seconds * 1000).toISOString().substr(11, 8);

function removeAllChildNodes(parent) {
    while (parent.firstChild) {
        parent.removeChild(parent.firstChild);
    }
}

function resetCrossword() {
    removeAllChildNodes(wordsearch_grid);
    wordsearch_grid.style.gridTemplateColumns = "repeat("+CONSTANT.GRID_SIZE+", auto)";
    for (let i = 0; i < Math.pow(CONSTANT.GRID_SIZE, 2); i++) {
        //cells[i].innerHTML = '';
        //cells[i].classList.remove('filled');
        //cells[i].classList.remove('selected');
        var child = document.createElement("div");
        child.setAttribute('class','main-grid-cell');
        child.setAttribute('tabindex','0');
        wordsearch_grid.append(child);
        cells = document.querySelectorAll('.main-grid-cell');
    }
}

const get_words_and_clues = async (prompt_req) => {
    const apiKey = "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";
    console.log(prompt_req)

    try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            response_format: { type: "json_object" },
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                model: 'gpt-3.5-turbo-1106',
                messages: [
                    { role: "system", content: "You are a helpful assistant designed to output words and corresponding clues for a crossword puzzle in JSON. Create a valid json array of arrays containing the word and clue as strings, use 'words' as the key name" },
                    { role: "user", content: prompt_req },
                ],
                max_tokens: 500,
            }),
        });

        const responseText = await response.text();

        const responseData = JSON.parse(responseText).choices[0].message.content;

        const data = responseData.substring(responseData.indexOf('{'), responseData.lastIndexOf('}') + 1);

        const json_response = JSON.parse(data);
        const words_res = json_response['words'];
        console.log(words_res);

        return words_res;

    } catch (error) {
        console.error('Error:', error);
        alert('An error occurred while generating the puzzle. Please try again.');
    }

    return null;
}

const initCrossword = async (prompt) => {
    // clear old grid and create new
    resetCrossword();
    resetBg();
    const grid_size = 15;
    // get words and clues
    const prompt_req = `Provide ${numwords} unique words (no spaces or hyphens) that are less than or equal to ${grid_size} characters in length and are related to ${prompt}. Additionally, provide corresponding clues for each word of ${level} difficulty.`;
    console.log(prompt_req);
    const words_and_clues = await get_words_and_clues(prompt_req);
    if (words_and_clues) {
        console.log("words&clues", words_and_clues);
        
        // generate crossword puzzle here
        console.log("calling crosswordGen", words_and_clues);
        su = crosswordGen(words_and_clues, grid_size, level);
        su_answer = [...su.original];
    
        seconds = 0;
    
        saveGameInfo();

        console.log("su.original",su.original)
    
        // show grid to div
        for (let i = 0; i < Math.pow(CONSTANT.GRID_SIZE, 2); i++) {
            let row = Math.floor(i / CONSTANT.GRID_SIZE);
            let col = i % CONSTANT.GRID_SIZE;
            const input = su.original[row][col].input
            console.log({row,col,input})
            //cells[i].setAttribute('data-value', su.question[r][c]);
            if (su.original[row][col].input !== CONSTANT.UNASSIGNED) {
                console.log("*letter", su.original[row][col].num);

                if (parseInt(su.original[row][col].num) !== 0) {
                    const num_span = document.createElement("span");
                    num_span.classList.add("number");
                    num_span.innerHTML = su.original[row][col].num;
                    cells[i].appendChild(num_span);
                }
                cells[i].classList.add('filled');
            }
        }
    
        // show words to div
        for (let w = 0; w < su.words.length; w++) {
            var child = document.createElement("div");
            child.setAttribute('class','word');
            child.setAttribute('data-word',su.words[w].word);
            child.setAttribute('data-row',su.words[w].row);
            child.setAttribute('data-col',su.words[w].col);
            child.setAttribute('data-length',su.words[w].length);
            child.setAttribute('data-vertical',su.words[w].vertical);
            child.setAttribute('tabindex','0');
            child.innerHTML = su.words[w].number + ". " + su.words[w].clue;
            if (parseInt(su.words[w].vertical)) {
                words_list_down.append(child);
            } else {
                words_list_across.append(child);
            }
            words_cell = document.querySelectorAll('.word');
        }
    
        console.log("words", words_cell)
    } else {
        // handle case where response is null or there was an error
    }
    
}

const loadCrossword = () => {
    resetCrossword();
    resetBg();

    let game = getGameInfo();

    game_level.innerHTML = CONSTANT.LEVEL_NAME[game.level];

    su = game.su;

    su_answer = [...su.original];
    //su_answer = su.answer;

    seconds = game.seconds;
    game_time.innerHTML = showTime(seconds);

    level_index = game.level;

    // show grid to div
    for (let i = 0; i < Math.pow(CONSTANT.GRID_SIZE, 2); i++) {
        let row = Math.floor(i / CONSTANT.GRID_SIZE);
        let col = i % CONSTANT.GRID_SIZE;

        //cells[i].setAttribute('data-value', su.question[r][c]);
        if (su_answer[row][col].input !== CONSTANT.UNASSIGNED) {
            if (parseInt(su_answer[row][col].num) !== 0) {
                const num_span = document.createElement("span");
                num_span.classList.add("number");
                num_span.innerHTML = su_answer[row][col].num;
                cells[i].appendChild(num_span);
            }
            cells[i].classList.add('filled');
            if (su_answer[row][col].input && su_answer[row][col].input !== '*' && su_answer[row][col].input !== '') {
                cells[i].innerHTML = su_answer[row][col].input;
            }
        }
    }

    // show words to div
    for (let w = 0; w < su.words.length; w++) {
        var child = document.createElement("div");
        child.setAttribute('class','word');
        child.setAttribute('data-word',su.words[w].word);
        child.setAttribute('data-row',su.words[w].row);
        child.setAttribute('data-col',su.words[w].col);
        child.setAttribute('data-length',su.words[w].length);
        child.setAttribute('data-vertical',su.words[w].vertical);
        child.setAttribute('tabindex','0');
        child.innerHTML = su.words[w].number + ". " + su.words[w].clue;
        if (parseInt(su.words[w].vertical)) {
            words_list_down.append(child);
        } else {
            words_list_across.append(child);
        }
        words_cell = document.querySelectorAll('.word');
    }

    console.log("words", words_cell)
}

const resetBg = () => {
    cells.forEach(e => e.classList.remove('hover'));
}

const removeErr = () => cells.forEach(e => e.classList.remove('err'));

const saveGameInfo = () => {
    let game = {
        level: level_index,
        seconds: seconds,
        su: {
            original: su_answer,
            question: su.question,
            answer: su_answer,
            words: su.words,
        }
    }
    localStorage.setItem('crossword', JSON.stringify(game));
}

const removeGameInfo = () => {
    localStorage.removeItem('crossword');
    document.querySelector('#btn-continue').style.display = 'none';
}

const isGameWin = () => {
    console.log("Checking if won")
    var correct = true;

    cells.forEach((e, index) => {
        var row = Math.floor( index / CONSTANT.GRID_SIZE );
        var col = index % CONSTANT.GRID_SIZE;

        if (cells[index].classList.contains('filled')){
            if (cells[index].innerHTML !== su.original[row][col].letter) {
                correct = false;
                let a = cells[index].innerHTML;
                let b = su.original[row][col];
                console.log("INCORRECT", {a,b})
            }
        }
    });

    if (correct)
        console.log("WON GAME!!!");

    return correct;
};

const showResult = () => {
    clearInterval(timer);
    result_screen.classList.add('active');
    result_time.innerHTML = showTime(seconds);
}

function findCell(index)
{
    var row = Math.floor( index / CONSTANT.GRID_SIZE );
    var col = index % CONSTANT.GRID_SIZE;
    
    if (col < 0 || col >= CONSTANT.GRID_SIZE || row < 0 || row >= CONSTANT.GRID_SIZE )
        return null;

    return { row : row, col : col };
}

function findIndex(row, col)
{
    return CONSTANT.GRID_SIZE * row + col;
}

const findSelection = () => {
    if (!prevCell || !currCell)
        return null;

    // Execute hSelection() ... and if null execute vSelection(), etc.
    return hSelection() || vSelection() || dSelection();
}

function hSelection()
{
    if (!prevCell || !currCell)
        return null;
        
    if (prevCell.row != currCell.row)
        return null;

    var ar = [];
    
    var delta = prevCell.col <= currCell.col ? 1 : -1;

    for(var col = prevCell.col; col != currCell.col + delta; col += delta)
    {
        var row = prevCell.row;
        var chr = su.question[row][col];
        
        ar.push( { row : row, col : col, chr : chr } );
    }

    return ar;        
}

function vSelection()
{
    if (!prevCell || !currCell)
        return null;
        
    if (prevCell.col != currCell.col)
        return null;

    var ar = [];
    
    var delta = prevCell.row <= currCell.row ? 1 : -1;

    for(var row = prevCell.row; row != currCell.row + delta; row += delta)
    {
        var col = prevCell.col;
        var chr = su.question[row][col];
        
        ar.push( { row : row, col : col, chr : chr } );
    }

    return ar;        
}

function dSelection()
{
    if (!prevCell || !currCell)
        return null;
        
    if (Math.abs(currCell.row - prevCell.row) != Math.abs(currCell.col - prevCell.col))
        return null;
    
    var ar = [];
    
    var dh = prevCell.col <= currCell.col ? 1 : -1;
    var dv = prevCell.row <= currCell.row ? 1 : -1;

    var row = prevCell.row;
    var col = prevCell.col;

    while(row != currCell.row + dv && col != currCell.col + dh)
    {
        var chr = su.question[row][col];
        ar.push( { row : row, col : col, chr : chr } );

        row += dv;
        col += dh;
    }

    return ar;
}

const checkSelection = () => {
    var word = selectedWord();

    if (!word) return;

    if (su.words.indexOf(word) > -1 && !found.includes(word)) {
        // word found
        found.push(word);
        // fill in grid
        currSelection.forEach((e) => {
            var i = findIndex(e.row, e.col);
            cells[i].classList.add('found');
        });
        // add strikethrough
        document.getElementById(word).classList.add('cross-out');

        if (found.length === su.words.length) {
            removeGameInfo();
            showResult();
        }
    }

    cells.forEach(e => e.classList.remove('selected'));
}

function selectedWord()
{
    if (!currSelection)    
        return "";
        
    var txt = "";    
    
    for(var o of currSelection)
    {
        txt += o.chr;
    }
    
    return txt;
}

function getWordFromCell(index, count) {
    let row = Math.floor(index / CONSTANT.GRID_SIZE) + 1;
    let col = index % CONSTANT.GRID_SIZE + 1;
    let words_arr = []
    
    for (const word of su.words) {
        if (JSON.stringify(word.coords).includes(JSON.stringify([row, col]))) {
            words_arr.push(word);
        }
    };

    if (words_arr.length > 1) {
        if (count % 2 === 0) {
            return words_arr[1];
        } else {
            return words_arr[0];
        }
    } else if (words_arr.length === 1) {
        return words_arr[0];
    }
    
    return null;
}

const hoverWord = (wordClicked) => {
    console.log(su.words)
    su.words.forEach((word) => {
        if (word.word === wordClicked) {
            word.coords.forEach((coord) => {
                const index = (parseInt(coord[0])-1) * parseInt(CONSTANT.GRID_SIZE) + (parseInt(coord[1])-1);
                cells[index].classList.add('hover');
            });
        }
    })
}

const hoverWordOnCellClick = (clickCount) => {
    console.log(clickCount)
    let wordAtCoord = getWordFromCell(selected_cell, clickCount);
    console.log("wordAtCoord", wordAtCoord)

    wordAtCoord.coords.forEach((coord) => {
        const index = (parseInt(coord[0])-1) * parseInt(CONSTANT.GRID_SIZE) + (parseInt(coord[1])-1);
        cells[index].classList.add('hover');
    });

}

const initClueClickEvent = () => {
    console.log("words_cell", words_cell)
    words_cell.forEach((e) => {
        e.addEventListener("click", (event, i) => {
            console.log("word clicked")
            words_cell.forEach(e => e.classList.remove('selected'));
            cells.forEach(e => e.classList.remove('selected'));
            cells.forEach(e => e.classList.remove('hover'));
            
            const word = e.getAttribute('data-word');
            const row = parseInt(e.getAttribute('data-row'));
            const col = parseInt(e.getAttribute('data-col'));

            const index = parseInt(row-1) * parseInt(CONSTANT.GRID_SIZE) + parseInt(col-1);

            console.log(row, col);
            console.log(CONSTANT.GRID_SIZE);
            console.log(index);

            hoverWord(word);

            selected_cell = index;
            selected_word = getWordFromCell(index, 1);

            cells[selected_cell].classList.remove('err');
            cells[selected_cell].classList.add('selected');

            e.classList.add('selected');

            // -----
            removeErr();
            cells[selected_cell].classList.add('zoom-in');
            setTimeout(() => {
                cells[selected_cell].classList.remove('zoom-in');
            }, 500);
        });
    });
}

const initKeyPressEvent = () => {
    cells.forEach((e, index) => {
        e.addEventListener('keydown', (event) => {
            let keyCodePressed = event.keyCode;
            let keyPressed = event.key;
            console.log("key pressed", keyPressed)
            if ((keyCodePressed >= 65 && keyCodePressed <= 90)) {
                if (cells[selected_cell].classList.contains('filled') && !cells[selected_cell].classList.contains('locked')) {
                    cells[selected_cell].innerHTML = keyPressed;
                    cells[selected_cell].setAttribute('data-value', keyPressed);
                    // add to answer
                    let row = Math.floor(selected_cell / CONSTANT.GRID_SIZE);
                    let col = selected_cell % CONSTANT.GRID_SIZE;
                    su_answer[row][col].input = keyPressed;
                    // save game
                    saveGameInfo()
                    // -----
                    removeErr();
                    //checkErr(keyPressed);
                    cells[selected_cell].classList.add('zoom-in');
                    setTimeout(() => {
                        cells[selected_cell].classList.remove('zoom-in');
                    }, 500);

                    // check game win (move to enter keypress?)
                    //if (isGameWin()) {
                    //    removeGameInfo();
                    //    showResult();
                    //}
                    // ----
                    //check if there is space for next letter
                    if (selected_word) {
                        if (selected_word.vertical) {
                            if (cells[selected_cell+CONSTANT.GRID_SIZE].classList.contains('filled')) {
                                cells[selected_cell].classList.remove('selected');
                                selected_cell += CONSTANT.GRID_SIZE;
                                cells[selected_cell].classList.add('selected');
                            }
                        } else {
                            if (cells[selected_cell+1].classList.contains('filled')) {
                                cells[selected_cell].classList.remove('selected');
                                selected_cell++;
                                cells[selected_cell].classList.add('selected');
                            }
                        }
                    }
                }
            } else if (keyCodePressed === 8) {
                // go back/delete on backspace
                if (cells[selected_cell].classList.contains('filled')) {
                    if (cells[selected_cell].innerHTML === '') {
                        if (selected_word.vertical) {
                            // go back = up
                            if ((selected_cell-CONSTANT.GRID_SIZE >= 0) && cells[selected_cell-CONSTANT.GRID_SIZE].classList.contains('filled')) {
                                cells[selected_cell].classList.remove('selected');
                                selected_cell -= CONSTANT.GRID_SIZE;
                                cells[selected_cell].classList.add('selected');
                            }
                        } else {
                            // go back = left
                            if ((selected_cell-1 >= 0) && cells[selected_cell-1].classList.contains('filled')) {
                                cells[selected_cell].classList.remove('selected');
                                selected_cell--;
                                cells[selected_cell].classList.add('selected');
                            }
                        }
                    } else {
                        cells[selected_cell].innerHTML = '';
                        cells[selected_cell].setAttribute('data-value', 0);
    
                        let row = Math.floor(selected_cell / CONSTANT.GRID_SIZE);
                        let col = selected_cell % CONSTANT.GRID_SIZE;
    
                        su_answer[row][col].input = '*';
                        saveGameInfo();
    
                        removeErr();
                    }
                }
                
            } else if (keyCodePressed === 13) {
                // check input on enter
                if (cells[selected_cell].classList.contains('filled')) {
                    // check if word or letters are correct

                    // check if game is won
                    if (isGameWin()) {
                        removeGameInfo();
                        showResult();
                    }
                }
            }  else if (keyCodePressed === 9) {
                // move to next week on tab
                event.preventDefault();
                console.log("tab pressed")
                if (selected_word) {
                    currWordIndex = su.words.indexOf(selected_word)
                    if (currWordIndex > -1) {
                        let nextWordIndex = currWordIndex+1;
                        if (nextWordIndex >= su.words.length) {
                            // last word, go back to start
                            nextWordIndex = 0;
                        }

                        cells.forEach(e => e.classList.remove('selected'));
                        cells.forEach(e => e.classList.remove('hover'));
                        words_cell.forEach(e => e.classList.remove('selected'));

                        selected_word = su.words[nextWordIndex];
                        const index = (selected_word.row - 1) * CONSTANT.GRID_SIZE + (selected_word.col - 1);
                        selected_cell = index;
                        cells[selected_cell].classList.add('selected');

                        const selector_word = document.querySelector('[data-word="'+selected_word.word+'"]');
                        hoverWord(selected_word.word);
                        selector_word.classList.add('selected');
                        
                    }
                }

            } else if (keyCodePressed === 37 || keyCodePressed === 38 || keyCodePressed === 39 || keyCodePressed === 40) {
                // handle arrow keys -> move selected_cell
                if (keyCodePressed === 37 && !selected_word.vertical) {
                    if ((selected_cell-1 >= 0) && cells[selected_cell-1].classList.contains('filled')) {
                        cells[selected_cell].classList.remove('selected');
                        selected_cell--;
                        cells[selected_cell].classList.add('selected');
                    }
                }
                if (keyCodePressed === 39 && !selected_word.vertical) {
                    if ((selected_cell+1 < cells.length) && cells[selected_cell+1].classList.contains('filled')) {
                        cells[selected_cell].classList.remove('selected');
                        selected_cell++;
                        cells[selected_cell].classList.add('selected');
                    }
                }
                if (keyCodePressed === 38 && selected_word.vertical) {
                    if ((selected_cell-CONSTANT.GRID_SIZE >= 0) && cells[selected_cell-CONSTANT.GRID_SIZE].classList.contains('filled')) {
                        cells[selected_cell].classList.remove('selected');
                        selected_cell -= CONSTANT.GRID_SIZE;
                        cells[selected_cell].classList.add('selected');
                    }
                }
                if (keyCodePressed === 40 && selected_word.vertical) {
                    if ((selected_cell+CONSTANT.GRID_SIZE < cells.length) && cells[selected_cell+CONSTANT.GRID_SIZE].classList.contains('filled')) {
                        cells[selected_cell].classList.remove('selected');
                        selected_cell += CONSTANT.GRID_SIZE;
                        cells[selected_cell].classList.add('selected');
                    }
                }
            }
        })
    })
}

const initCellsEvent = () => {
    cells.forEach((e, index) => {
        var clickCount = 1;
        e.addEventListener('click', () => {
            console.log("cell clicked")
            if (e.classList.contains('filled') && !e.classList.contains('locked')) {
                cells.forEach(e => e.classList.remove('selected'));
                cells.forEach(e => e.classList.remove('hover'));
                words_cell.forEach(e => e.classList.remove('selected'));

                selected_cell = index;
                selected_word = getWordFromCell(index, clickCount);
                e.classList.remove('err');
                e.classList.add('selected');

                const selector_word = document.querySelector('[data-word="'+selected_word.word+'"]');
                hoverWordOnCellClick(clickCount);
                selector_word.classList.add('selected');
                clickCount++;
                //resetBg();
                //hoverBg(index);
            }
        })
    })
}

const startGame = () => {
    console.log("startGame called");
    start_screen.classList.remove('active');
    settings_screen.classList.remove('active');
    game_screen.classList.add('active');

    game_level.innerHTML = CONSTANT.LEVEL_NAME[level_index];

    showTime(seconds);

    timer = setInterval(() => {
        if (!pause) {
            seconds = seconds + 1;
            game_time.innerHTML = showTime(seconds);
        }
    }, 1000);

    initCellsEvent();
    initKeyPressEvent();
    initClueClickEvent();
}

const returnStartScreen = () => {
    clearInterval(timer);
    pause = false;
    seconds = 0;
    start_screen.classList.add('active');
    settings_screen.classList.remove('active');
    game_screen.classList.remove('active');
    pause_screen.classList.remove('active');
    result_screen.classList.remove('active');
}

const toggleSolution = () => {
    var unsolved = document.getElementById('unsolved');
    var solved = document.getElementById('solved');
    var toggleSolution = document.getElementById('toggleSolution');

    if (solved.style.display == 'block') {
        unsolved.style.display = 'block';
        solved.style.display = 'none';
        toggleSolution.innerHTML = 'Reveal Solution';
    } else {
        unsolved.style.display = 'none';
        solved.style.display = 'block';
        toggleSolution.innerHTML = 'Hide Solution';
    }
}

// add button event
document.querySelector('#btn-level').addEventListener('click', (e) => {
    level_index = level_index + 1 > CONSTANT.LEVEL.length - 1 ? 0 : level_index + 1;
    level = CONSTANT.LEVEL[level_index];
    numwords = CONSTANT.NUMWORDS[level_index];
    e.target.innerHTML = CONSTANT.LEVEL_NAME[level_index];
});

document.querySelector('#btn-play').addEventListener('click', () => {
    start_screen.classList.remove('active');
    settings_screen.classList.add('active');
});

document.querySelector('#btn-start').addEventListener('click', () => {
    settings_screen.classList.remove('active');
    const prompt = document.querySelector('#prompt').value;
    initCrossword(prompt).then(() => startGame());
});

document.querySelector('#btn-continue').addEventListener('click', () => {
    loadCrossword();
    startGame();
});

document.querySelector('#btn-pause').addEventListener('click', () => {
    pause_screen.classList.add('active');
    pause = true;
});

document.querySelector('#btn-resume').addEventListener('click', () => {
    pause_screen.classList.remove('active');
    pause = false;
});

document.querySelector('#btn-new-game').addEventListener('click', () => {
    returnStartScreen();
});

document.querySelector('#btn-new-game-2').addEventListener('click', () => {
    returnStartScreen();
});

//document.querySelector('#toggleSolution').addEventListener('click', () => {
//    toggleSolution();
//});

words_cell = document.querySelectorAll('.word');
console.log("test",words_cell)
words_cell.forEach((e,index) => e.addEventListener('click', () => {
    console.log("clue clicked!")
}));

// -------------

const init = () => {
    const darkmode = JSON.parse(localStorage.getItem('darkmode'));
    document.body.classList.add(darkmode ? 'dark' : 'light');
    document.querySelector('meta[name="theme-color"').setAttribute('content', darkmode ? '#1a1a2e' : '#fff');

    const game = getGameInfo();

    document.querySelector('#btn-continue').style.display = game ? 'grid' : 'none';
}

init();