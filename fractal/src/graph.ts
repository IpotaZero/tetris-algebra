import { Connector } from "./Connector"

const gap = 12

// const edges = new Map()

export function displayGraph(tree: any, parentElement: HTMLElement): number {
    if (tree.length === 0) {
        return 2 * gap
    } else if (tree.length === 1) {
        const vertex = document.createElement("span")
        vertex.classList.add("vertex")
        vertex.style.left = "0px"
        vertex.style.top = gap * 4 + "px"
        parentElement.appendChild(vertex)

        const edge = new Connector(parentElement, vertex)
        edge.line.classList.add("blue")

        // edges.set([parentElement, vertex], edge)

        return displayGraph(tree[0], vertex)
    } else if (tree.length === 2) {
        const vertex0 = document.createElement("span")
        vertex0.classList.add("vertex")
        vertex0.style.top = gap * 4 + "px"
        parentElement.appendChild(vertex0)

        const edge0 = new Connector(parentElement, vertex0)
        edge0.line.classList.add("red")
        // edges.set([parentElement, vertex0], edge0)

        const width0 = displayGraph(tree[0], vertex0)

        const vertex1 = document.createElement("span")
        vertex1.classList.add("vertex")
        vertex1.style.top = gap * 4 + "px"
        parentElement.appendChild(vertex1)

        const edge1 = new Connector(parentElement, vertex1)
        edge1.line.classList.add("red")
        // edges.set([parentElement, vertex1], edge1)

        const width1 = displayGraph(tree[1], vertex1)

        const av = width0 + width1 - gap

        vertex0.style.left = -av - gap * Math.sqrt(3) + "px"
        vertex1.style.left = av + gap * Math.sqrt(3) + "px"

        return width0 + width1
    } else {
        throw new SyntaxError("ミツマタが発生!")
    }
}

export function cut(tree: any): any {
    if (tree.length === 0) {
        return []
    } else if (tree.length === 1) {
        return [cut(tree[0]), tree[0]]
    } else if (tree.length === 2) {
        return [cut(tree[1]), tree[1]]
    } else {
        throw new SyntaxError("ミツマタが発生!")
    }
}

export function stringify(tree: any, depth = 0): string {
    const color = `oklch(70% 0.3 ${(depth % 3) * 80})`

    if (tree.length === 0) return "0"
    else if (tree.length === 1)
        return `<span style="color: ${color};">(</span>${stringify(
            tree[0],
            depth + 1,
        )}<span style="color: ${color};">)</span>`
    else if (tree.length === 2)
        return `<span style="color: ${color};">[</span>${stringify(tree[0], depth + 1)},${stringify(
            tree[1],
            depth + 1,
        )}<span style="color: ${color};">]</span>`

    throw new SyntaxError("ミツマタが発生!")
}
