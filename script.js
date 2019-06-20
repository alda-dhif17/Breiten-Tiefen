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

function parseInfoFile(content) {
    nodes = JSON.parse(content);
    for (let i = 0; i < nodes.length; i++) {
        let n = nodes[i];
        nodes[i] = new Node(n.name, n.x, n.y, n.r, n.abnutzung, n.edges, n.visited);
    }
    for (let n of nodes) {
        for (let i = 0; i < n.edges.length; i++) {
            let e = n.edges[i];
            n.edges[i] = new Edge(nodes[e.from], nodes[e.to]);
        }
    }
    document.getElementById('file-modal-back').style.display = 'none';
    node_counter = nodes.length;
    refreshFrame();
}

function toInfoFile() {
    let g_cache = [];
    return JSON.stringify(nodes, (k, v) => {
        if (k === 'from' || k === 'to')
            return nodes.indexOf(v);
        return v;
    });
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
            let n = findNode(e.clientX, e.clientY);

            if (!n) {
                window.alert('Can only delete nodes ... ');
                return;
            }

            for (let i = 0; i < nodes.length; i++) {
                if (nodes[i]===n) {
                    nodes.splice(i,1);
                    continue;
                }
                nodes[i].removeEdgesTo(n);
            }
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
        } else if (e.keyCode === 13 && !e.ctrlKey) { // 13 ... <Enter>
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
            document.getElementById('file-modal-back').style.display = 'none';
        } else if (e.keyCode === 13 && e.ctrlKey || 
                e.keyCode === 79 && e.ctrlKey && e.shiftKey) { // 13 ... <ENTER> + <CTRL> || 79 ... <O> + <CTRL> + <SHIFT>
            e.preventDefault();
            document.getElementById('file-modal-back').style.display = 'block';
        } else if (e.keyCode === 83 && e.shiftKey && e.ctrlKey) { // 83 ... <S> + <SHIFT> + <CTRL>
            e.preventDefault();
            let a = document.createElement('a');
            a.href = 'data:text/plain;charset=utf-8,' + encodeURIComponent(toInfoFile());
            a.download = 'asdf.but';
            document.body.appendChild(a);

            a.click();
            document.body.removeChild(a);
        }

        refreshFrame();
    };

    document.getElementById('file-in-but').onclick = () => {
        document.getElementById('file-in').click();
    };

    document.getElementById('file-modal-close').onclick = () => {
        document.getElementById('file-modal-back').style.display = 'none';
    };

    document.getElementById('file-in').onchange = () => {
        if (document.getElementById('file-in').files.length) {
            let file = document.getElementById('file-in').files[0];
            let reader = new FileReader();

            reader.onloadend = () => {
                let content = reader.result;
                parseInfoFile(content);
            }
            reader.readAsText(file);
        }
    };
};