import { Connector } from "./Connector"

type tree = [] | [tree] | [tree, tree]

export class Tree {
    tree: tree = []

    history: string[] = []
    #historyIndex = 0

    #drawer: TreeDrawer

    constructor(container: HTMLElement, info: HTMLElement) {
        this.#drawer = new TreeDrawer(container, info)
    }

    undo() {
        if (this.#historyIndex === 0) return
        this.#historyIndex--
        this.tree = JSON.parse(this.history[this.#historyIndex])
        this.display(false)
    }

    redo() {
        if (this.#historyIndex === this.history.length - 1) return
        this.#historyIndex++
        this.tree = JSON.parse(this.history[this.#historyIndex])
        this.display(false)
    }

    divide() {
        TreeController.divide(this.tree)
        this.display()
    }

    cut() {
        this.tree = JSON.parse(JSON.stringify(TreeController.cut(this.tree)))
        this.display()
    }

    display(save = true) {
        if (save) {
            this.#saveHistory()
        }

        this.#drawer.display(this.tree)

        this.#drawer.setupLeft(this.tree, this.history)

        this.#setupVertexEvent()
    }

    #setupVertexEvent() {
        this.#drawer.vertices.forEach((v) => {
            v.onclick = (e) => {
                if (e.target === v) {
                    this.#add(v.id)
                }
            }

            v.oncontextmenu = (e) => {
                if (e.target !== v) return

                e.preventDefault()

                this.#drawer.contextMenu.style.display = "flex"
                this.#drawer.contextMenu.style.left = e.clientX + "px"
                this.#drawer.contextMenu.style.top = e.clientY + "px"

                const c = this.#drawer.contextMenu

                c.querySelector<HTMLElement>(":nth-child(1)")!.onclick = () => {
                    this.#add(v.id)
                }

                c.querySelector<HTMLElement>(":nth-child(2)")!.onclick = () => {
                    this.#remove(v.id)
                }

                c.querySelector<HTMLElement>(":nth-child(3)")!.onclick = () => {
                    this.#take(v.id)
                }

                c.querySelector<HTMLElement>(":nth-child(4)")!.onclick = () => {
                    this.#drawer.toggleColor(v.id)

                    this.display(false)
                }
            }
        })
    }

    #saveHistory() {
        this.history = this.history.slice(0, this.#historyIndex + 1)
        this.history.push(JSON.stringify(this.tree))
        this.#historyIndex = this.history.length - 1
    }

    #add(id: string) {
        let t = this.tree

        for (const b of id) {
            t = t[Number(b)]
        }

        if (t.length == 2) {
            t.splice(0, 2)
            this.display()
            return
        }

        t.push([] as never)

        this.display()
    }

    #remove(id: string) {
        let t = this.tree

        for (const b of id.slice(0, -1)) {
            t = t[Number(b)]
        }

        t.splice(+id.charAt(-1), 1)

        this.display()
    }

    #take(id: string) {
        let t = this.tree

        for (const b of id) {
            t = t[Number(b)]
        }

        this.tree = t

        this.display()
    }

    isFractal() {
        return TreeController.isSemiFractal(this.tree) && this.invariantToCut()
    }

    invariantToCut() {
        return JSON.stringify(this.tree) === JSON.stringify(TreeController.cut(this.tree))
    }
}

class TreeDrawer {
    top = 100
    vertices: Map<string, HTMLElement> = new Map()
    contextMenu!: HTMLElement

    #width = 6
    #height = (this.#width * 4 * 2) / Math.sqrt(3)

    #container: HTMLElement
    #info: HTMLElement
    #edges: Map<[HTMLElement, HTMLElement], Connector> = new Map()

    #selectedVertexColorMap = new Map<string, string>()
    #selectedCount = 0

    constructor(container: HTMLElement, info: HTMLElement) {
        this.#container = container
        this.#info = info

        this.#setupContextMenu()
    }

    toggleColor(id: string) {
        if (this.#selectedVertexColorMap.get(id)) {
            this.#selectedVertexColorMap.delete(id)
        } else {
            this.#selectedVertexColorMap.set(id, `oklch(70% 0.2 ${this.#selectedCount++ * 67})`)
        }
    }

    display(tree: tree) {
        this.#deleteElements()

        this.#container.appendChild(Connector.ensureLayer())

        const root = this.#setRootElement()

        const w = this.#displayGraph(tree, root, "", 0)

        const depth = TreeController.getMaxDepth(tree)

        const top = (this.#height / Math.sqrt(3)) * (depth - 1)

        this.#container.style.height = `calc(${this.#width * 2 * depth + top}px + 1.5em)`

        // const name = JSON.stringify(tree)

        const graphWidth = w.left + w.right + this.#width * 2
        // const width = Math.max(graphWidth, name.length * 8)
        const width = graphWidth

        if (w.left <= w.right) {
            root.style.left = `${w.left}px`
        } else {
            root.style.left = ""
            root.style.right = `${w.right}px`
        }

        // if (graphWidth <= name.length * 8) {
        //     root.style.left = `${(width + w.left - w.right) / 2 - this.#width}px`
        // }

        this.#container.style.width = width + "px"

        // const p = document.createElement("span")
        // p.textContent = name
        // p.style.width = "100%"
        // p.style.textAlign = "center"
        // this.#container.appendChild(p)
    }

    #setupContextMenu() {
        this.#container.innerHTML = `
            <div id="context-menu">
                <button>追加</button>
                <button>消す</button>
                <button>これ以下を木にする</button>
                <button>この頂点をマークする/外す</button>
            </div>
        `

        this.contextMenu = this.#container.querySelector("#context-menu")!
        this.contextMenu.style.display = "none"

        document.body.append(this.contextMenu)

        this.#container.addEventListener("pointerdown", () => {
            this.contextMenu.style.display = "none"
        })
    }

    #displayGraph(
        tree: tree,
        parentElement: HTMLElement,
        id: string,
        direction: 0 | 1 | 2,
    ): { right: number; left: number } {
        if (tree.length === 0) {
            return { right: this.#width * 2, left: this.#width * 2 }
        } else if (tree.length === 1) {
            const vertex = this.#setVertexElement(parentElement, id + "0", "blue")
            return this.#displayGraph(tree[0], vertex, id + "0", 0)
        } else if (tree.length === 2) {
            const vertex0 = this.#setVertexElement(parentElement, id + "0", "orange")
            const width0 = this.#displayGraph(tree[0], vertex0, id + "0", 1)

            const vertex1 = this.#setVertexElement(parentElement, id + "1", "red")
            const width1 = this.#displayGraph(tree[1], vertex1, id + "1", 2)

            const left = width0.right + this.#width
            const right = width1.left + this.#width

            vertex0.style.left = -left + "px"
            vertex1.style.left = right + "px"

            return { left: left + width0.left, right: right + width1.right }
        }

        throw new SyntaxError("ミツマタが発生!")
    }

    #setRootElement() {
        const root = this.#createVertexElement(0, 0, "")
        this.#container.appendChild(root)

        return root
    }

    #deleteElements() {
        this.contextMenu.style.display = "none"

        this.#edges.forEach((c) => c.destroy())
        this.#edges.clear()
        this.vertices.clear()

        this.#container.innerHTML = ""
        this.#info.innerHTML = ""
    }

    #setVertexElement(parentElement: HTMLElement, id: string, color: string) {
        const vertex = this.#createVertexElement(this.#height, 0, id)

        parentElement.appendChild(vertex)

        const edge = new Connector(parentElement, vertex)
        edge.line.classList.add(color)

        this.#edges.set([parentElement, vertex], edge)

        return vertex
    }

    #createVertexElement(top: number, left: number, id: string) {
        const vertex = document.createElement("span")
        vertex.classList.add("vertex")
        vertex.style.top = `${top}px`
        vertex.style.left = `${left}px`
        vertex.id = id

        const color = this.#selectedVertexColorMap.get(vertex.id)
        if (color) vertex.style.backgroundColor = color

        this.vertices.set(vertex.id, vertex)

        return vertex
    }

    folder(tree: tree) {
        this.#folder(tree, this.#info)
    }

    #folder(tree: tree, parent: HTMLElement, depth = 0, branch = "") {
        const button = document.createElement("button")
        button.innerHTML = `${this.stringify(tree, branch)}`

        const layer = document.createElement("div")
        layer.classList.add("hidden", "layer")
        layer.dataset["depth"] = "2em"

        let created = false

        const dot = () => {
            const p2 = document.createElement("span")
            p2.textContent = "..."
            p2.classList.add("dot")
            return p2
        }

        const create = () => {
            created = true

            if (tree.length === 1) {
                layer.appendChild(dot())

                this.#folder(tree[0], layer, depth + 1, branch + 0)
                this.#folder(tree[0], layer, depth + 1, branch + 0)
                this.#folder(tree[0], layer, depth + 1, branch + 0)

                layer.appendChild(dot())
            } else if (tree.length === 2) {
                this.#folder(tree[0], layer, depth + 1, branch + 0)
                this.#folder(tree[1], layer, depth + 1, branch + 1)
                this.#folder(tree[1], layer, depth + 1, branch + 1)
                this.#folder(tree[1], layer, depth + 1, branch + 1)

                layer.appendChild(dot())
            }
        }

        button.onclick = () => {
            if (!created) create()
            layer.classList.toggle("hidden")
        }

        parent.appendChild(button)
        parent.appendChild(layer)
    }

    stringify(tree: tree, branch: string = ""): string {
        const color = ["#D6D848", "#CC76D1", "#4A9DF8"][branch.length % 3]

        const c = (t: string) => `<span style="color: ${color}">${t}</span>`

        if (tree.length === 0) {
            const color = this.#selectedVertexColorMap.get(branch)
            if (color) return `<span style="color: ${color};">0</span>`

            return "0"
        } else if (tree.length === 1) {
            return `${c("(")}${this.stringify(tree[0], branch + 0)}${c(")")}`
        } else if (tree.length === 2) {
            return `${c("[")}${this.stringify(tree[0], branch + 0)},${this.stringify(tree[1], branch + 1)}${c("]")}`
        }

        throw new SyntaxError("ミツマタが発生!")
    }

    setupLeft(tree: tree, history: string[]) {
        this.#info.innerHTML = ""

        this.#info.innerHTML += this.stringify(tree) + "<br>"
        this.#info.innerHTML += JSON.stringify(tree) + "<br>"
        this.#info.innerHTML += `階層: ${TreeController.countRank(tree) ?? "一意でない"}` + "<br>"
        this.#info.innerHTML += `準フラクタル？ ${TreeController.isSemiFractal(tree)}` + "<br>"
        this.#info.innerHTML += `C(W)=W？ ${JSON.stringify(TreeController.cut(tree)) === JSON.stringify(tree)}` + "<br>"
        this.#info.innerHTML += `<textarea rows="5">${history
            .map((tree) => JSON.stringify(tree).slice(1, -1))
            .join("\n")}</textarea> <br>`

        this.folder(tree)
    }
}

export class TreeController {
    static countRank(tree: tree): number | null {
        if (tree.length === 0) return 0
        else if (tree.length === 1) {
            const rank = this.countRank(tree[0])

            if (rank === null) return null

            return rank + 1
        } else if (tree.length === 2) {
            const leftRank = this.countRank(tree[0])
            const rightRank = this.countRank(tree[1])

            if (leftRank !== rightRank) return null

            if (leftRank === null) return null

            return leftRank + 1
        }

        throw new Error("ミツマタが発生!")
    }

    static getMaxDepth(tree: tree): number {
        if (tree.length === 0) return 1
        if (tree.length === 1) return this.getMaxDepth(tree[0]) + 1
        if (tree.length === 2) {
            const leftDepth = this.getMaxDepth(tree[0]) + 1
            const rightDepth = this.getMaxDepth(tree[1]) + 1

            return Math.max(leftDepth, rightDepth)
        }

        throw new Error("ミツマタが発生!")
    }

    static getRankNTrees(tree: tree, n: number): tree[] {
        if (n === 1) {
            if (tree.length === 1) {
                return [tree[0]]
            } else if (tree.length === 2) {
                return [tree[1]]
            }
        }

        if (tree.length === 0) {
            return []
        } else if (tree.length === 1) {
            return this.getRankNTrees(tree[0], n - 1)
        } else if (tree.length === 2) {
            return [...this.getRankNTrees(tree[0], n - 1), ...this.getRankNTrees(tree[1], n - 1)]
        }

        throw new Error("なんかおかしい!")
    }

    static cut(tree: tree): tree {
        if (tree.length === 0) {
            return []
        } else if (tree.length === 1) {
            return [this.cut(tree[0]), tree[0]]
        } else if (tree.length === 2) {
            return [this.cut(tree[1]), tree[1]]
        } else {
            throw new SyntaxError("ミツマタが発生!")
        }
    }

    static divide(tree: tree) {
        if (tree.length === 1) {
            if (tree[0].length === 0) tree.splice(0, 1)
            else this.divide(tree[0])
        } else if (tree.length === 2) {
            if (tree[1].length === 0) tree.splice(0, 1)
            else this.divide(tree[1])

            if (tree[0].length === 0) tree.splice(0, 1)
            else this.divide(tree[0])
        }
    }

    static isSemiFractal(tree: tree) {
        // 同じ階層で、青か赤から来ている木を取得

        let i = 1
        while (1) {
            const trees = TreeController.getRankNTrees(tree, i)
            if (trees.length === 0) break

            if (!trees.every((tree) => tree.length === 0) && trees.some((tree) => tree.length === 0)) return false

            const first = trees[0].join()

            const 全ての木が等しい = trees.slice(1).every((tree) => tree.join() === first)

            if (!全ての木が等しい) return false

            i++
        }

        return true
    }
}
