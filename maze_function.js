const sleep = (milliseconds) => {
    return new Promise((resolve) => setTimeout(resolve, milliseconds));
};

const canvas = document.getElementById("maze_canvas");

class Maze
{
    constructor (unit_height, unit_width, height, width)
    {
        this.unit_height = unit_height;
        this.unit_width = unit_width;
        this.height = height;
        this.width = width;

        this.table = [];
        this.answer_table = [];
    }
}

class Unit
{
    constructor (row = 0, col = 0)
    {
        this.row = row;
        this.col = col;
    }

    clone()
    {
        return new Unit(this.row, this.col);
    }
}


// ----------------------User-defined data----------------------


let maze_generation_mode = "";
let answer_generation_mode = "";
let show_generation_process = true;
let process_delay_ms = 5;
let random_start_position = true;

const maze_table_unit_color = ["black", "gray", "white", "red", "red", "blue"];


// ----------------------Public variable------------------------


let current_maze;


//-----------------------HTML call functions--------------------


async function generate_maze_button_down()
{
    let height = document.getElementById("height");
    let width = document.getElementById("width");
    let unit_height = document.getElementById("unit_height");
    let unit_width = document.getElementById("unit_width");
    maze_generation_mode = document.getElementById("maze_generation_mode").value;
    show_generation_process = document.getElementById("show_generation_process").checked;
    random_start_position = document.getElementById("random_start_position").checked;
    process_delay_ms = document.getElementById("process_delay_ms").value;

    height.value = get_even_num(parseInt(height.value)).toString();
    width.value = get_even_num(parseInt(width.value)).toString();
    unit_height.value = get_even_num(parseInt(unit_height.value)).toString();
    unit_width.value = get_even_num(parseInt(unit_width.value)).toString();

    current_maze = new Maze(unit_height.value, unit_width.value, height.value, width.value);

    initialize_canvas();
    initialize_maze_table();
    await generate_maze();
    draw_maze();

    const answer_button = document.getElementById("answer_button");
    answer_button.style.display = "block";
    answer_button.innerHTML = "show answer";
}

async function answer_button_down(element)
{    
    answer_generation_mode = document.getElementById("answer_generation_mode").value;
    show_generation_process = document.getElementById("show_generation_process").checked;
    process_delay_ms = document.getElementById("process_delay_ms").value;

    if (element.innerHTML == "show answer")
    {
        element.innerHTML = "hide answer";

        await generate_maze_answer();
        draw_maze(true);
    }
    else
    {
        element.innerHTML = "show answer";

        draw_maze();
    }
}


//------------------------Common functions----------------------


function shuffle(array)
{
    let randA, randB, temp;

    for (let i = 0; i < array.length; i++)
    {
        randA = get_random_num(0, array.length - 1);
        randB = get_random_num(0, array.length - 1);

        if (randA != randB)
        {
            temp = array[randA];
            array[randA] = array[randB];
            array[randB] = temp;
        }
    }
}

function get_random_unit()
{
    let randA = get_random_num(1, current_maze.height - 2);
    let randB = get_random_num(1, current_maze.height - 2);
    randA += randA % 2 == 0 ? 1 : 0;
    randB += randB % 2 == 0 ? 1 : 0;

    let unit = new Unit(randA, randB);

    return unit;
}

function get_random_num(from, to)
{
    let range = to - from + 1;
    return parseInt(Math.random() * range) + from;
}

function get_even_num(num)
{
    return num % 2 == 0 ? num + 1 : num;
}


//--------------------------------------------------------------


function initialize_canvas()
{
    canvas.height = current_maze.height * current_maze.unit_height;
    canvas.width = current_maze.width * current_maze.unit_width;
}

function initialize_maze_table()
{
    current_maze.table = [];

    for (let i = 0; i < current_maze.height; i++)
    {
        let row = [];

        for (let j = 0; j < current_maze.width; j++)
        {
            row.push(0);
        }

        current_maze.table.push(row);
    }

    current_maze.table[1][0] = 3;
    current_maze.table[current_maze.height - 2][current_maze.width - 1] = 3;
}

async function generate_maze()
{
    let rand;
    let start = new Unit(1, 1), now = new Unit();
    let canUp, canDown, canLeft, canRight, isStuck;

    if (random_start_position)
        start = get_random_unit();

    const dfs_generate = async() => {
        now = start.clone();

        current_maze.table[start.row][start.col] = 1;

        while (current_maze.table[start.row][start.col] != 2)
        {
            if (show_generation_process)
            {
                draw_maze();
                await sleep(process_delay_ms);
            }

            canUp = now.row != 1 && current_maze.table[now.row - 2][now.col] == 0;
            canDown = now.row != current_maze.height - 2 && current_maze.table[now.row + 2][now.col] == 0;
            canLeft = now.col != 1 && current_maze.table[now.row][now.col - 2] == 0;
            canRight = now.col != current_maze.width - 2 && current_maze.table[now.row][now.col + 2] == 0;

            isStuck = !(canUp || canDown || canLeft || canRight); 

            if (isStuck) // backtrace
            {
                current_maze.table[now.row][now.col] = 2;

                canUp = current_maze.table[now.row - 1][now.col] == 1;
                canDown = current_maze.table[now.row + 1][now.col] == 1;
                canLeft = current_maze.table[now.row][now.col - 1] == 1;
                canRight = current_maze.table[now.row][now.col + 1] == 1;

                if (canUp)
                {
                    current_maze.table[now.row - 1][now.col] = 2;
                    now.row -= 2;
                }
                else if (canDown)
                {
                    current_maze.table[now.row + 1][now.col] = 2;
                    now.row += 2;
                }
                else if (canLeft)
                {
                    current_maze.table[now.row][now.col - 1] = 2;
                    now.col -= 2;
                }
                else if (canRight)
                {
                    current_maze.table[now.row][now.col + 1] = 2;
                    now.col += 2;
                }

                continue;
            }

            while (true)
            {
                rand = get_random_num(0, 3);
                if (rand == 0 && canUp)
                {
                    current_maze.table[now.row - 1][now.col] = 1;
                    current_maze.table[now.row - 2][now.col] = 1;
                    now.row -= 2;
                    break;
                }
                else if (rand == 1 && canDown)
                {
                    current_maze.table[now.row + 1][now.col] = 1;
                    current_maze.table[now.row + 2][now.col] = 1;
                    now.row += 2;
                    break;
                }
                else if (rand == 2 && canLeft)
                {
                    current_maze.table[now.row][now.col - 1] = 1;
                    current_maze.table[now.row][now.col - 2] = 1;
                    now.col -= 2;
                    break;
                }
                else if (rand == 3 && canRight)
                {
                    current_maze.table[now.row][now.col + 1] = 1;
                    current_maze.table[now.row][now.col + 2] = 1;
                    now.col += 2;
                    break;
                }
            }
        }
    }

    const bfs_generate = async () => {
        let available_units = [];
        available_units.push(start);

        current_maze.table[start.row][start.col] = 2;

        while (available_units.length > 0)
        {
            shuffle(available_units);
            now = available_units[0];

            canUp = now.row != 1 && current_maze.table[now.row - 2][now.col] == 0;
            canDown = now.row != current_maze.height - 2 && current_maze.table[now.row + 2][now.col] == 0;
            canLeft = now.col != 1 && current_maze.table[now.row][now.col - 2] == 0;
            canRight = now.col != current_maze.width - 2 && current_maze.table[now.row][now.col + 2] == 0;
            isStuck = !(canUp || canDown || canLeft || canRight); 

            if (isStuck) // backtrace
            {
                available_units.shift();
                continue;
            }

            while (true)
            {
                rand = get_random_num(0, 3);
                if (rand == 0 && canUp)
                {
                    current_maze.table[now.row - 1][now.col] = 2;
                    current_maze.table[now.row - 2][now.col] = 2;

                    available_units.push(new Unit(now.row - 2, now.col));
                    break;
                }
                else if (rand == 1 && canDown)
                {
                    current_maze.table[now.row + 1][now.col] = 2;
                    current_maze.table[now.row + 2][now.col] = 2;
                    
                    available_units.push(new Unit(now.row + 2, now.col));
                    break;
                }
                else if (rand == 2 && canLeft)
                {
                    current_maze.table[now.row][now.col - 1] = 2;
                    current_maze.table[now.row][now.col - 2] = 2;
                    
                    available_units.push(new Unit(now.row, now.col - 2));
                    break;
                }
                else if (rand == 3 && canRight)
                {
                    current_maze.table[now.row][now.col + 1] = 2;
                    current_maze.table[now.row][now.col + 2] = 2;
                    
                    available_units.push(new Unit(now.row, now.col + 2));
                    break;
                }
            }

            available_units.push(new Unit(now.row, now.col));
            available_units.shift();

            if (show_generation_process)
            {
                draw_maze();
                await sleep(process_delay_ms);
            }
        }
    }

    const randomly_generate = async () => {
        let id_table = [];

        for (let i = 0; i < current_maze.height; i ++)
        {
            let row = [];

            for (let j = 0; j < current_maze.width; j++)
            {
                row.push(i * current_maze.width + j);
            }

            id_table.push(row);
        }

        let update_id_table = (a, b) => {
            if (id_table[b.row][b.col] == id_table[a.row][a.col])
                return;
            
            if (id_table[b.row][b.col] < id_table[a.row][a.col])
            {
                let c = a;
                a = b;
                b = c;
            }

            for (let i = 1; i < current_maze.height; i += 2)
            {
                for (let j = 1; j < current_maze.width; j += 2)
                {
                    if (id_table[i][j] == id_table[a.row][a.col])
                    {
                        id_table[i][j] = id_table[b.row][b.col];
                    }
                }
            }
        }

        let process_counter = 0;

        while (process_counter++ < current_maze.height * current_maze.width)
        {
            now = get_random_unit();
            current_maze.table[now.row][now.col] = 2;

            canUp = now.row != 1 
                    && id_table[now.row][now.col] != id_table[now.row - 2][now.col];

            canDown = now.row != current_maze.height - 2 
                      && id_table[now.row][now.col] != id_table[now.row + 2][now.col];

            canLeft = now.col != 1 
                      && id_table[now.row][now.col] != id_table[now.row][now.col - 2];

            canRight = now.col != current_maze.width - 2 
                       && id_table[now.row][now.col] != id_table[now.row][now.col + 2];

            isStuck = !(canUp || canDown || canLeft || canRight); 

            if (isStuck)
            {
                continue;
            }

            while (true)
            {
                rand = get_random_num(0, 3);
                if (rand == 0 && canUp)
                {
                    current_maze.table[now.row - 1][now.col] = 2;
                    current_maze.table[now.row - 2][now.col] = 2;

                    update_id_table(now, new Unit(now.row - 2, now.col));
                    break;
                }
                else if (rand == 1 && canDown)
                {
                    current_maze.table[now.row + 1][now.col] = 2;
                    current_maze.table[now.row + 2][now.col] = 2;
                    
                    update_id_table(now, new Unit(now.row + 2, now.col));
                    break;
                }
                else if (rand == 2 && canLeft)
                {
                    current_maze.table[now.row][now.col - 1] = 2;
                    current_maze.table[now.row][now.col - 2] = 2;
                    
                    update_id_table(now, new Unit(now.row, now.col - 2));
                    break;
                }
                else if (rand == 3 && canRight)
                {
                    current_maze.table[now.row][now.col + 1] = 2;
                    current_maze.table[now.row][now.col + 2] = 2;
                    
                    update_id_table(now, new Unit(now.row, now.col + 2));
                    break;
                }
            }

            if (show_generation_process)
            {
                draw_maze();
                await sleep(process_delay_ms);
            }
        }
    }

    switch (maze_generation_mode)
    {
        case "dfs":
            await dfs_generate();
            break;
        case "bfs":
            await bfs_generate();
            break;
        case "randomly_generate":
            await randomly_generate();
            break;
        default:
            await dfs_generate();
    }
}

async function generate_maze_answer()
{
    let start = new Unit(1, 1), now = new Unit(), goal = new Unit(current_maze.height - 2, current_maze.width - 2);
    let canUp, canDown, canLeft, canRight, isStuck;

    current_maze.answer_table = [];

    for (let i = 0; i < current_maze.table.length; i++)
    {
        current_maze.answer_table.push([]);
        current_maze.answer_table[i] = Array.from(current_maze.table[i]);
    }
    

    const dfs = async() => {
        now = start.clone();

        while (current_maze.answer_table[goal.row][goal.col] != 4)
        {
            if (show_generation_process)
            {
                draw_maze(true);
                await sleep(process_delay_ms);
            }

            if (current_maze.answer_table[now.row][now.col] == 2)
                current_maze.answer_table[now.row][now.col] = 4;

            canUp = now.row != 1 && current_maze.answer_table[now.row - 1][now.col] == 2 && current_maze.answer_table[now.row - 2][now.col] == 2;
            canDown = now.row != current_maze.height - 2 && current_maze.answer_table[now.row + 1][now.col] == 2 && current_maze.answer_table[now.row + 2][now.col] == 2;
            canLeft = now.col != 1 && current_maze.answer_table[now.row][now.col - 1] == 2 && current_maze.answer_table[now.row][now.col - 2] == 2;
            canRight = now.col != current_maze.width - 2 && current_maze.answer_table[now.row][now.col + 1] == 2 && current_maze.answer_table[now.row][now.col + 2] == 2;

            isStuck = !(canUp || canDown || canLeft || canRight);

            if (isStuck) // backtrace
            {
                current_maze.answer_table[now.row][now.col] = 5;

                canUp = current_maze.answer_table[now.row - 1][now.col] == 4;
                canDown = current_maze.answer_table[now.row + 1][now.col] == 4;
                canLeft = current_maze.answer_table[now.row][now.col - 1] == 4;
                canRight = current_maze.answer_table[now.row][now.col + 1] == 4;

                if (canUp)
                {
                    current_maze.answer_table[now.row - 1][now.col] = 5;
                    now.row -= 2;
                }
                else if (canDown)
                {
                    current_maze.answer_table[now.row + 1][now.col] = 5;
                    now.row += 2;
                }
                else if (canLeft)
                {
                    current_maze.answer_table[now.row][now.col - 1] = 5;
                    now.col -= 2;
                }
                else if (canRight)
                {
                    current_maze.answer_table[now.row][now.col + 1] = 5;
                    now.col += 2;
                }

                continue;
            }

            if (canUp)
            {
                current_maze.answer_table[now.row - 1][now.col] = 4;
                current_maze.answer_table[now.row - 2][now.col] = 4;
                now.row -= 2;
            }
            else if (canDown)
            {
                current_maze.answer_table[now.row + 1][now.col] = 4;
                current_maze.answer_table[now.row + 2][now.col] = 4;
                now.row += 2;
            }
            else if (canLeft)
            {
                current_maze.answer_table[now.row][now.col - 1] = 4;
                current_maze.answer_table[now.row][now.col - 2] = 4;
                now.col -= 2;
            }
            else if (canRight)
            {
                current_maze.answer_table[now.row][now.col + 1] = 4;
                current_maze.answer_table[now.row][now.col + 2] = 4;
                now.col += 2;
            }
        }
    }

    const bfs = async() => {
        let available_units = [], step_num_units = [];
        let step = 0;

        for (let i = 0; i < current_maze.height; i++)
        {
            let row = [];
            for (let j = 0; j < current_maze.width; j++)
                row.push(0);

            step_num_units.push(row);
        }

        available_units.push(start);
        step_num_units[start.row][start.col] = ++step;

        current_maze.answer_table[start.row][start.col] = 5;

        while (available_units.length > 0)
        {
            if (current_maze.answer_table[goal.row][goal.col] == 5)
                break;

            now = available_units[0];

            canUp = current_maze.answer_table[now.row - 1][now.col] == 2;
            canDown = current_maze.answer_table[now.row + 1][now.col] == 2;
            canLeft = current_maze.answer_table[now.row][now.col - 1] == 2;
            canRight = current_maze.answer_table[now.row][now.col + 1] == 2;
            isStuck = !(canUp || canDown || canLeft || canRight); 

            if (isStuck) // backtrace
            {
                available_units.shift();
                continue;
            }

            if (canUp)
            {
                current_maze.answer_table[now.row - 1][now.col] = 5;
                current_maze.answer_table[now.row - 2][now.col] = 5;
                step_num_units[now.row - 1][now.col] = step + 1;
                step_num_units[now.row - 2][now.col] = step + 2;

                available_units.push(new Unit(now.row - 2, now.col));
            }

            if (canDown)
            {
                current_maze.answer_table[now.row + 1][now.col] = 5;
                current_maze.answer_table[now.row + 2][now.col] = 5;
                step_num_units[now.row + 1][now.col] = step + 1;
                step_num_units[now.row + 2][now.col] = step + 2;
                
                available_units.push(new Unit(now.row + 2, now.col));
            }

            if (canLeft)
            {
                current_maze.answer_table[now.row][now.col - 1] = 5;
                current_maze.answer_table[now.row][now.col - 2] = 5;
                step_num_units[now.row][now.col - 1] = step + 1;
                step_num_units[now.row][now.col - 2] = step + 2;
                
                available_units.push(new Unit(now.row, now.col - 2));
            }

            if (canRight)
            {
                current_maze.answer_table[now.row][now.col + 1] = 5;
                current_maze.answer_table[now.row][now.col + 2] = 5;
                step_num_units[now.row][now.col + 1] = step + 1;
                step_num_units[now.row][now.col + 2] = step + 2;
                
                available_units.push(new Unit(now.row, now.col + 2));
            }
            
            step += 2;
            available_units.shift();

            if (show_generation_process)
            {
                draw_maze(true);
                await sleep(process_delay_ms);
            }
        }

        available_units = [];

        now = goal.clone();
        current_maze.answer_table[goal.row][goal.col] = 4;

        while (step > 1)
        {
            step--;

            canUp = step_num_units[now.row - 1][now.col] == step;
            canDown = step_num_units[now.row + 1][now.col] == step;
            canLeft = step_num_units[now.row][now.col - 1] == step;
            canRight = step_num_units[now.row][now.col + 1] == step;
            
            if (canUp)
            {
                current_maze.answer_table[now.row - 1][now.col] = 4;
                current_maze.answer_table[now.row - 2][now.col] = 4;
                now.row += -2;
            }
            else if (canDown)
            {
                current_maze.answer_table[now.row + 1][now.col] = 4;
                current_maze.answer_table[now.row + 2][now.col] = 4;
                now.row += 2;
            }
            else if (canLeft)
            {
                current_maze.answer_table[now.row][now.col - 1] = 4;
                current_maze.answer_table[now.row][now.col - 2] = 4;
                now.col += -2;
            }
            else if (canRight)
            {
                current_maze.answer_table[now.row][now.col + 1] = 4;
                current_maze.answer_table[now.row][now.col + 2] = 4;
                now.col += 2;
            }

            if (show_generation_process)
            {
                draw_maze(true);
                await sleep(process_delay_ms);
            }

            step--;
        }
    }

    switch (answer_generation_mode)
    {
        case "dfs":
            await dfs();
            break;
        case "bfs":
            await bfs();
            break;
        default:
            await dfs();
    }
}

function draw_maze(show_answer = false)
{
    const ctx = canvas.getContext("2d");

    ctx.beginPath();

    if (!show_answer)
        for (let i = 0; i < current_maze.height; i++)
        {
            for (let j = 0; j < current_maze.width; j++)
            {
                ctx.fillStyle = maze_table_unit_color[current_maze.table[i][j]];

                ctx.fillRect(j * current_maze.unit_width, i * current_maze.unit_height, current_maze.unit_width, current_maze.unit_height);
            }
        }
    else
        for (let i = 0; i < current_maze.height; i++)
        {
            for (let j = 0; j < current_maze.width; j++)
            {
                ctx.fillStyle = maze_table_unit_color[current_maze.answer_table[i][j]];

                ctx.fillRect(j * current_maze.unit_width, i * current_maze.unit_height, current_maze.unit_width, current_maze.unit_height);
            }
        }

    ctx.stroke();
}