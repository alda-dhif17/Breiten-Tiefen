const canvas = document.getElementById('main-canvas'),
    ctx = canvas.getContext('2d');
var drawMode = 'node',
    radius = 20,
    nodes = [],
    cu_node = null,
    node_counter = 0;

async function sleep(ms) {
    return new Promise(res => setTimeout(res, ms));
}

function findNode(x, y) {
    for (let n of nodes) {
        if (
            (x >= n.x - n.r && x <= n.x + n.r) &&
            (y >= n.y - n.r && y <= n.y + n.r)
        ) {
            return n;
        }
    }
    return null;
}

function drawArrowhead(context, from, to, radius, color) {
    var x_center = to.x;
    var y_center = to.y;

    var angle;
    var x;
    var y;

    context.beginPath();

    angle = Math.atan2(to.y - from.y, to.x - from.x)
    x = radius * Math.cos(angle) + x_center;
    y = radius * Math.sin(angle) + y_center;

    context.moveTo(x, y);

    angle += (1.0 / 3.0) * (2 * Math.PI)
    x = radius * Math.cos(angle) + x_center;
    y = radius * Math.sin(angle) + y_center;

    context.lineTo(x, y);

    angle += (1.0 / 3.0) * (2 * Math.PI)
    x = radius * Math.cos(angle) + x_center;
    y = radius * Math.sin(angle) + y_center;

    context.lineTo(x, y);

    context.fillStyle = color;
    context.fill();
}

function refreshFrame(drawBefore = () => {}, current_node = undefined) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBefore();

    for (let cu_node of nodes) {
        for (let e of cu_node.edges) {
            let n = e.to;
            ctx.beginPath();

            ctx.moveTo(cu_node.x, cu_node.y);
            ctx.lineTo(n.x, n.y);

            ctx.lineWidth = 3;

            if (e.used)
                ctx.strokeStyle = '#78FFD3';
            else
                ctx.strokeStyle = '#B278FF';

            ctx.stroke();

            // ctx.font = '15px Arial';
            // ctx.fillStyle = '#000';
            // ctx.fillText(cu_node.name + ' -> ' + n.name,
            //     Math.abs(cu_node.x - n.x) / 2 + Math.min(cu_node.x, n.x),
            //     Math.abs(cu_node.y - n.y) / 2 + Math.min(cu_node.y, n.y));

            drawArrowhead(ctx, {
                x: cu_node.x,
                y: cu_node.y,
            }, {
                x: Math.abs(cu_node.x - n.x) / 2 + Math.min(cu_node.x, n.x),
                y: Math.abs(cu_node.y - n.y) / 2 + Math.min(cu_node.y, n.y),
            }, 10, e.used ? '#78FFD3' : '#B278FF');
        }
    }

    for (let node of nodes) {
        ctx.beginPath();
        ctx.ellipse(node.x, node.y, node.r, node.r, 0, 0, 2 * Math.PI);

        if (node === current_node)
            ctx.fillStyle = '#f00';
        else if (node.visited)
            ctx.fillStyle = '#7892FF';
        else
            ctx.fillStyle = '#000';
        ctx.fill();

        ctx.font = '20px Arial';
        ctx.fillStyle = '#fff';
        ctx.fillText(node.name, node.x - 6, node.y + 5.5);
    }

    ctx.font = '15px Courier New';
    ctx.fillStyle = '#000';
    ctx.fillText('DrawMode: ' + drawMode, 5, canvas.height - 10);
}

window.onload = () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    refreshFrame();

    canvas.onmousemove = e => {
        if (cu_node) {
            refreshFrame(() => {
                ctx.beginPath();

                ctx.moveTo(cu_node.x, cu_node.y);
                ctx.lineTo(e.clientX, e.clientY);

                ctx.lineWidth = 3;
                ctx.strokeStyle = '#FFC1C1';

                ctx.stroke();
            });
        }
    };

    canvas.onclick = e => {
        if (drawMode === 'node') {
            if (!findNode(e.clientX, e.clientY))
                nodes.push(new Node(node_counter++, e.clientX, e.clientY, radius));
        } else if (drawMode === 'edge') {
            let n = findNode(e.clientX, e.clientY);

            if (!n) {
                window.alert('Can only connect to nodes ... ');
                return;
            }
            if (cu_node === n) {
                window.alert('Can\'t connect to same node ... ');
                return;
            }

            if (cu_node) {
                cu_node.addNeighbour(n);
                cu_node = null;

                refreshFrame();
                return;
            }

            cu_node = n;
        } else if (drawMode === 'terminator') {
            window.alert('I\'ll be back!');
        }

        refreshFrame();
    };

    document.onkeyup = e => {
        if (e.keyCode === 113) { // 113 ... <F2>
            e.preventDefault();

            if (drawMode === 'edge') {
                drawMode = 'terminator';
            } else if (drawMode === 'terminator') {
                drawMode = 'node';
            } else if (drawMode === 'node') {
                drawMode = 'edge';
            }
        } else if (e.keyCode === 13) { // 13 ... <Enter>
            let smode = window.prompt('Search mode: ');

            if (smode === 'tiefen') {
                nodes[0].tiefenSearch();
            } else if (smode === 'breiten') {
                Node.breitenSearchWrapper(nodes[0]);
            } else if (smode === 'reset') {
                for (let n of nodes) {
                    for (let e of n.edges)
                        e.used = false;

                    n.visited = false;
                    n.abnutzung = 0;
                }
            }
        } else if (e.keyCode === 27) { // 27 ... <Esc>
            cu_node = null;
        }

        refreshFrame();
    };
};