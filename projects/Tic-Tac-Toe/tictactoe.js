
// Set up variables

let inputButton = document.getElementsByClassName("buttonSquare");
let winnerDisplay = document.getElementById("winner");
let gridDisplay = document.getElementById("grid");
let scoreXDisplay = document.getElementById("scoreX");
let scoreODisplay = document.getElementById("scoreO");
let inputSquare;
let count = 0;
let winningX = [];
let winningO = [];
let gameOver = false;
let readyToReset = false;
let scoreX = 0;
let scoreO = 0;

// Winning sets:

const leftVerticalWinner = ["TL", "ML", "BL"];
const midVerticalWinner = ["TM", "MM", "BM"];
const rightVerticalWinner = ["TR", "MR", "BR"];

const topHorizontalWinner = ["TL", "TM", "TR"];
const midHorizontalWinner = ["ML", "MM", "MR"];
const botHorizontalWinner = ["BL", "BM", "BR"];

const leftDiagonalWinner = ["TL", "MM", "BR"];
const rightDiagonalWinner = ["TR", "MM", "BL"];

// Add click events to each playable button

for (let i = 0; i < inputButton.length; i++) {
    inputButton[i].addEventListener("click", () => {
        if (gameOver) {
            return;
        }
        inputSquare = inputButton[i].value;
        markSquare(inputSquare);
        checkWinner();
    });
}

document.addEventListener("click", () => {
    if (gameOver && readyToReset) {
        resetGame();
    }
});

// Mark square with either X or O and update variables for next turn

function markSquare(inputSquare) {
    let input = inputSquare.slice(2);

    if (document.getElementById(inputSquare).innerHTML === "") {
        if (count % 2 === 0) {
            document.getElementById(inputSquare).innerHTML = `<div class="X X-${input}"><div class="X-left"><div class="X-right"></div></div></div>`;
            gridDisplay.style.setProperty('--grid-frame-color', '#CFFFB3');
            winningX.push(input);
        } else {
            document.getElementById(inputSquare).innerHTML = `<div class="O O-${input}"><div class="O-outer"><div class="O-inner"></div></div></div>`;
            gridDisplay.style.setProperty('--grid-frame-color', '#A63D40');
            winningO.push(input); 
        };
        count++;
    };  
};

// Check to see if someone has won

function checkWinner() {
    if (
        leftVerticalWinner.every(element => winningX.includes(element)) ||
        midVerticalWinner.every(element => winningX.includes(element)) ||
        rightVerticalWinner.every(element => winningX.includes(element)) ||
        topHorizontalWinner.every(element => winningX.includes(element)) ||
        midHorizontalWinner.every(element => winningX.includes(element)) ||
        botHorizontalWinner.every(element => winningX.includes(element)) ||
        leftDiagonalWinner.every(element => winningX.includes(element)) ||
        rightDiagonalWinner.every(element => winningX.includes(element))
    ) {
        winnerDisplay.innerHTML = "X WINS!";
        winnerDisplay.style.color = '#A63D40';
        gridDisplay.style.setProperty('--grid-frame-color', '#A63D40');
        gridDisplay.classList.add('is-finished');
        scoreX += 1;
        scoreXDisplay.textContent = scoreX;
        gameOver = true;
        readyToReset = false;
        setTimeout(() => {
            readyToReset = true;
        }, 0);
    } else if (
        leftVerticalWinner.every(element => winningO.includes(element)) ||
        midVerticalWinner.every(element => winningO.includes(element)) ||
        rightVerticalWinner.every(element => winningO.includes(element)) ||
        topHorizontalWinner.every(element => winningO.includes(element)) ||
        midHorizontalWinner.every(element => winningO.includes(element)) ||
        botHorizontalWinner.every(element => winningO.includes(element)) ||
        leftDiagonalWinner.every(element => winningO.includes(element)) ||
        rightDiagonalWinner.every(element => winningO.includes(element))
    ) {
        winnerDisplay.innerHTML = "O WINS!";
        winnerDisplay.style.color = '#CFFFB3';
        gridDisplay.style.setProperty('--grid-frame-color', '#CFFFB3');
        gridDisplay.classList.add('is-finished');
        scoreO += 1;
        scoreODisplay.textContent = scoreO;
        gameOver = true;
        readyToReset = false;
        setTimeout(() => {
            readyToReset = true;
        }, 0);
    } else if (count === 9) {
        winnerDisplay.innerHTML = 'Draw!';
        winnerDisplay.style.color = '#C8963E';
        gridDisplay.style.setProperty('--grid-frame-color', '#C8963E');
        gridDisplay.classList.add('is-finished');
        gameOver = true;
        readyToReset = false;
        setTimeout(() => {
            readyToReset = true;
        }, 0);
    };
}

// Reset game to initial state

function resetGame() {
    count = 0;
    winningX = [];
    winningO = [];
    gameOver = false;
    readyToReset = false;

    gridDisplay.style.setProperty('--grid-frame-color', '#15616D');
    gridDisplay.classList.remove('is-finished');
    winnerDisplay.innerHTML = '';

    for (const square of inputButton) {
        square.innerHTML = '';
    }
}