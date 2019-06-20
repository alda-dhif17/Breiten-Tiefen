var default_timeout = 250;

class Node {
    static async breitenSearchWrapper(start) {
        let neighbours = true;
        for (let ttl = 1; neighbours; ttl++) {
            neighbours = await start.breitenSearch(ttl);
        }
    }

    constructor(name, x, y, r, abnutzung, edges, visited) {
        this.name = name;
        this.x = x;
        this.y = y;
        this.r = r;

        this.abnutzung = abnutzung || 0;
        this.visited = visited || false;
        this.edges = edges || [];
    }

    addNeighbour(n) {
        this.edges.push(new Edge(this, n));
    }

    getEdge(n) {
        for (let e of this.edges) {
            if (e.to === n)
                return e;
        }
        return null;
    }

    visit() {
        this.visited = true;
    }

    removeEdgesTo(n) {
        for (let i = this.edges.length-1; i >= 0; i--) {
            let e = this.edges[i];
            if (e.to === n)
                this.edges.splice(i, 1);
        }
    }

    async tiefenSearch(edge = undefined, timeout = default_timeout) {
        if (this.visited)
            return;
        if (edge)
            edge.use();

        this.visit();
        refreshFrame(()=>{},this);

        await sleep(timeout);
        for (let e of this.edges) {
            await e.to.tiefenSearch(e);
        }
    }

    async breitenSearch(ttl = 0, edge = undefined, timeout = default_timeout) {
        if (edge)
            edge.use();

        this.visit();
        refreshFrame(()=>{},this);

        ttl--;
        this.abnutzung++;

        await sleep(timeout);

        let neighbours = false;
        if (ttl > 0) {
            for (let e of this.edges) {
                if (e.to.abnutzung < this.abnutzung-1) {
                    neighbours = await e.to.breitenSearch(ttl, e) || neighbours;
                }
            }
        } else {
            for (let e of this.edges) {
                if (e.to.abnutzung < this.abnutzung)
                    neighbours = true;
            }
        }
        
        return neighbours;
    }
}