class Edge {
    constructor (from, to) {
        this.from = from;
        this.to = to;
        this.used = false;
    }

    use() {
        this.used = true;
    }
}