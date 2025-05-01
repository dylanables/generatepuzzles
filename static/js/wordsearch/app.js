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
const wordsearch_grid = document.querySelector('.main-wordsearch-grid');
var cells = document.querySelectorAll('.main-grid-cell');

const number_inputs = document.querySelectorAll('.number');

const game_level = document.querySelector('#game-level');
const game_time = document.querySelector('#game-time');

const result_time = document.querySelector('#result-time');

const words_list = document.querySelector('#words');
const words_cell = document.querySelectorAll('.word');

let size_index = 1;
let size = CONSTANT.SIZE[size_index];

let level_index = 0;
let level = CONSTANT.LEVEL[level_index];

let timer = null;
let pause = false;
let seconds = 0;

let su = undefined;
let su_answer = undefined;

let selected_cell = -1;

var found = [];

var prevCell = null;
var currCell = null;
var currSelection = null;
var isToggled = false;

// --------

const getGameInfo = () => JSON.parse(localStorage.getItem('wordsearch'));

// ----------------

const showTime = (seconds) => new Date(seconds * 1000).toISOString().substr(11, 8);

function removeAllChildNodes(parent) {
    while (parent.firstChild) {
        parent.removeChild(parent.firstChild);
    }
}

function resetWordsearch() {
    removeAllChildNodes(wordsearch_grid);
    wordsearch_grid.style.gridTemplateColumns = "repeat("+size+", auto)";
    console.log(size);
    for (let i = 0; i < Math.pow(size, 2); i++) {
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

const get_words = async (prompt_req) => {
    console.log("Requesting words for:", prompt_req)

    try {
        const response = await fetch("https://generate-puzzles.onrender.com/wordsearch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: prompt_req }),
        })

        console.log("Response status:", response.status)

        if (!response.ok) {
            const errorText = await response.text();
            console.error("Server error", errorText);
            throw new Error(`Server responded with status: ${response.status}`)
        }

        const responseText = await response.text();
        console.log(responseText)

        const responseData = JSON.parse(responseText).choices[0].message.content;
        console.log(responseData)

        const data = responseData.substring(responseData.indexOf('['), responseData.lastIndexOf(']') + 1);
        console.log(data)

        const words_res = JSON.parse(data);
        console.log(words_res)

        return words_res;
    } catch (error) {
        console.error("Error:", error)
        alert("An error occurred while generating the puzzle. Please try again.")
        return null
    }
}

const initWordsearch = async (prompt) => {
    // clear old grid and create new
    resetWordsearch();
    resetBg();

    // get words and clues
    const prompt_req = `Provide 5 unique words (no spaces or hyphens) that are less than or equal to ${size} characters in length and are related to ${prompt}.`;
    const words = await get_words(prompt_req);
    if (words) {
        // TODO: remove any duplicates from input/OpenAI output
        console.log("words", words);
        var uppercaseWords = [];

        words.forEach((word) => uppercaseWords.push(word.toUpperCase()));
        
        // generate wordsearch puzzle here
        su = wordsearchGen(uppercaseWords, size, level);
        su_answer = [...su.question];

        seconds = 0;

        saveGameInfo();

        console.log("Cells", cells)

        // show grid to div
        for (let i = 0; i < Math.pow(size, 2); i++) {
            let row = Math.floor(i / size);
            let col = i % size;
            
            cells[i].setAttribute('data-value', su.question[row][col]);

            if (su.question[row][col] !== CONSTANT.UNASSIGNED) {
                cells[i].classList.add('filled');
                cells[i].innerHTML = su.question[row][col];
            }
        }

        // show words to div
        for (let w = 0; w < su.words.length; w++) {
            words_list.innerHTML += "<div class='word' id='"+su.words[w]+"'>"+su.words[w]+"</div>";
        }
    } else {
        // handle case where response is null or there was an error
        alert('An error occurred while generating the puzzle. Please try again.');
    }
}

const loadWordsearch = () => {
    let game = getGameInfo();
    size_index = game.size;
    size = CONSTANT.SIZE[size_index];

    resetWordsearch();
    resetBg();

    game_level.innerHTML = CONSTANT.LEVEL_NAME[game.level];

    su = game.su;

    su_answer = su.answer;

    found = su.found;

    seconds = game.seconds;
    game_time.innerHTML = showTime(seconds);

    level_index = game.level;

    console.log(cells);

    // show grid to div
    for (let i = 0; i < Math.pow(size, 2); i++) {
        let row = Math.floor(i / size);
        let col = i % size;
        console.log({row, col})
        cells[i].setAttribute('data-value', su.question[row][col]);

        if (su.question[row][col] !== CONSTANT.UNASSIGNED) {
            cells[i].classList.add('filled');
            cells[i].innerHTML = su.question[row][col];
        }
    }

    // show words to div
    for (let w = 0; w < su.words.length; w++) {
        words_list.innerHTML += "<div class='word' id='"+su.words[w]+"'>"+su.words[w]+"</div>";
    }

    // select found words
    found.forEach((e) => {
        e.coords.forEach((coord) => {
            var i = findIndex(coord.row, coord.col);
            cells[i].classList.add('found');
        });

        // strikethrough found words
        document.getElementById(e.word).classList.add('cross-out');
    });

}

const resetBg = () => {
    cells.forEach(e => e.classList.remove('hover'));
}

const removeErr = () => cells.forEach(e => e.classList.remove('err'));

const saveGameInfo = () => {
    let game = {
        size: size_index,
        level: level_index,
        seconds: seconds,
        su: {
            original: su.original,
            question: su.question,
            answer: su_answer,
            found: found,
            words: su.words,
        }
    }
    localStorage.setItem('wordsearch', JSON.stringify(game));
}

const removeGameInfo = () => {
    localStorage.removeItem('wordsearch');
    document.querySelector('#btn-continue').style.display = 'none';
}

const isGameWin = () => wordsearchCheck(su_answer);

const showResult = () => {
    clearInterval(timer);
    result_screen.classList.add('active');
    result_time.innerHTML = showTime(seconds);
}

function findCell(index)
{
    var row = Math.floor( index / size );
    var col = index % size;
    
    if (col < 0 || col >= size || row < 0 || row >= size)
        return null;

    return { row : row, col : col };
}

function findIndex(row, col)
{
    return size * row + col;
}

const findSelection = () => {
    if (!prevCell || !currCell)
        return null;

    console.log("prev", prevCell)
    console.log("curr", currCell)

    console.log("hSelection", hSelection())
    console.log("vSelection", vSelection())
    console.log("dSelection", dSelection())

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
    console.log("checkSelection called")

    var word = selectedWord();

    console.log(word)
    if (!word) return;

    if (su.words.indexOf(word) > -1 && !found.find(e => e.word === word)) {
        // word found
        let coords = hSelection() || vSelection() || dSelection();
        found.push({'word': word, 'coords': coords});
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
        } else {
            saveGameInfo();
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

const initCellsEvent = () => {
    cells.forEach((e, index) => {
        e.addEventListener('mousedown', () => {
            console.log("mouse down")
            isToggled = true;

            if (!prevCell)
                prevCell = findCell(index);

            currCell = findCell(index);

            console.log(currCell)

            currSelection = findSelection();

            if (!currSelection) {
                prevCell = null;
                currCell = null;
                currSelection = null;
                isToggled = false;
                cells.forEach(e => e.classList.remove('selected'));
            }

            selected_cell = index;
            e.classList.remove('err');
            e.classList.add('selected');
            resetBg();
        });

        e.addEventListener('touchstart', () => {
            console.log("mouse down")
            isToggled = true;

            if (!prevCell)
                prevCell = findCell(index);

            currCell = findCell(index);

            console.log(currCell)

            currSelection = findSelection();

            if (!currSelection) {
                prevCell = null;
                currCell = null;
                currSelection = null;
                isToggled = false;
                cells.forEach(e => e.classList.remove('selected'));
            }

            selected_cell = index;
            e.classList.remove('err');
            e.classList.add('selected');
            resetBg();
        });

        e.addEventListener('mouseover', () => {
            if (isToggled) {
                console.log("mouse over")
                console.log(findCell(index))
                console.log(currSelection)

                currCell = findCell(index);
                console.log(currCell)

                currSelection = findSelection();

                if (!currSelection) {
                    prevCell = null;
                    currCell = null;
                    currSelection = null;
                    isToggled = false;
                    cells.forEach(e => e.classList.remove('selected'));
                }

                selected_cell = index;
                e.classList.remove('err');
                e.classList.add('selected');
                resetBg();
            }
        });
        
        document.addEventListener('touchmove', () => {
            if (isToggled) {
                console.log("mouse over")
                console.log(findCell(index))
                console.log(currSelection)

                currCell = findCell(index);
                console.log(currCell)

                currSelection = findSelection();

                if (!currSelection) {
                    prevCell = null;
                    currCell = null;
                    currSelection = null;
                    isToggled = false;
                    cells.forEach(e => e.classList.remove('selected'));
                }

                selected_cell = index;
                e.classList.remove('err');
                e.classList.add('selected');
                resetBg();
            }
        });

        e.addEventListener('mouseup', () => {
            console.log("mouse up")

            isToggled = false;
            
            try { checkSelection() }
            catch (err) {
                console.log(err);
                prevCell = null;
                currCell = null;
                currSelection = null;
            }

            console.log(currSelection)

            prevCell = null;
            currCell = null;
            currSelection = null;


            selected_cell = index;
            //e.classList.remove('err');
            //e.classList.remove('selected');
            resetBg();
        });

        e.addEventListener('touchend', () => {
            console.log("mouse up")

            isToggled = false;
            
            try { checkSelection() }
            catch (err) {
                console.log(err);
                prevCell = null;
                currCell = null;
                currSelection = null;
            }

            console.log(currSelection)

            prevCell = null;
            currCell = null;
            currSelection = null;


            selected_cell = index;
            //e.classList.remove('err');
            //e.classList.remove('selected');
            resetBg();
        });
    })
}

const startGame = () => {
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
}

const returnStartScreen = () => {
    clearInterval(timer);
    pause = false;
    seconds = 0;
    start_screen.classList.add('active');
    game_screen.classList.remove('active');
    pause_screen.classList.remove('active');
    result_screen.classList.remove('active');
}

// add button event
document.querySelector('#btn-size').addEventListener('click', (e) => {
    size_index = size_index + 1 > CONSTANT.SIZE.length - 1 ? 0 : size_index + 1;
    size = CONSTANT.SIZE[size_index];
    e.target.innerHTML = CONSTANT.SIZE_NAME[size_index];
});

document.querySelector('#btn-level').addEventListener('click', (e) => {
    level_index = level_index + 1 > CONSTANT.LEVEL.length - 1 ? 0 : level_index + 1;
    level = CONSTANT.LEVEL[level_index];
    e.target.innerHTML = CONSTANT.LEVEL_NAME[level_index];
});

document.querySelector('#btn-play').addEventListener('click', () => {
    start_screen.classList.remove('active');
    settings_screen.classList.add('active');
});

document.querySelector('#btn-start').addEventListener('click', () => {
    settings_screen.classList.remove('active');
    const prompt = document.querySelector('#prompt').value;
    initWordsearch(prompt).then(() => startGame());
});

document.querySelector('#btn-continue').addEventListener('click', () => {
    loadWordsearch();
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
    console.log('object')
    returnStartScreen();
});

// -------------

const init = () => {
    const darkmode = JSON.parse(localStorage.getItem('darkmode'));
    document.body.classList.add(darkmode ? 'dark' : 'light');
    document.querySelector('meta[name="theme-color"').setAttribute('content', darkmode ? '#1a1a2e' : '#fff');

    const game = getGameInfo();

    document.querySelector('#btn-continue').style.display = game ? 'grid' : 'none';
}

init();