import { Connector } from "./Connector"

type tree = [] | [tree] | [tree, tree]

export class Tree {
    tree: tree = []

    #gap = 7
    #container: HTMLElement
    #edges: Map<[HTMLElement, HTMLElement], Connector> = new Map()

    #vertices: HTMLElement[] = []

    #contextMenu: HTMLElement

    #info

    #selectedLeafIdMap = new Map<string, string>()
    #selectedCount = 0

    history: string[] = []
    #historyIndex = 0

    top = 10

    constructor(container: HTMLElement, info: HTMLElement) {
        this.#container = container
        this.#info = info

        container.innerHTML = `
            <div id="context-menu">
                <button>追加</button>
                <button>消す</button>
                <button>これ以下を木にする</button>
                <button>この頂点をマークする/外す</button>
            </div>
        `

        this.#contextMenu = container.querySelector("#context-menu")!
        this.#contextMenu.style.display = "none"

        document.body.append(this.#contextMenu)

        this.#container.addEventListener("pointerdown", () => {
            this.#contextMenu.style.display = "none"
        })
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
        this.#divide(this.tree)
        this.display()
    }

    #divide(tree: tree) {
        if (tree.length === 1) {
            if (tree[0].length === 0) tree.splice(0, 1)
            else this.#divide(tree[0])
        } else if (tree.length === 2) {
            if (tree[1].length === 0) tree.splice(0, 1)
            else this.#divide(tree[1])

            if (tree[0].length === 0) tree.splice(0, 1)
            else this.#divide(tree[0])
        }
    }

    cut() {
        this.tree = JSON.parse(JSON.stringify(this.getCut(this.tree)))
        this.display()
    }

    getCut(tree: tree): tree {
        if (tree.length === 0) {
            return []
        } else if (tree.length === 1) {
            return [this.getCut(tree[0]), tree[0]]
        } else if (tree.length === 2) {
            return [this.getCut(tree[1]), tree[1]]
        } else {
            throw new SyntaxError("ミツマタが発生!")
        }
    }

    display(save = true) {
        if (save) {
            this.history = this.history.slice(0, this.#historyIndex + 1)

            this.history.push(JSON.stringify(this.tree))
            this.#historyIndex = this.history.length - 1
        }

        this.#contextMenu.style.display = "none"

        this.#edges.forEach((c) => c.destroy())
        this.#edges.clear()

        this.#container.innerHTML = ""
        this.#info.innerHTML = ""

        this.#info.innerHTML = this.stringify() + "<br>"
        this.#info.innerHTML += JSON.stringify(this.tree) + "<br>"
        this.#info.innerHTML += `階層: ${this.#countRank(this.tree) ?? "一意でない"}` + "<br>"
        this.#info.innerHTML += `準フラクタル？ ${this.isSemiFractal()}` + "<br>"
        this.#info.innerHTML +=
            `C(W)=W？ ${JSON.stringify(this.getCut(this.tree)) === JSON.stringify(this.tree)}` + "<br>"

        this.#info.innerHTML += `<textarea rows="5">${this.history
            .map((tree) => JSON.stringify(tree).slice(1, -1))
            .join("\n")}</textarea> <br>`

        this.#container.appendChild(Connector.ensureLayer())

        this.folder()

        const root = document.createElement("span")
        root.classList.add("vertex")
        root.id = ""
        root.style.top = this.top + "%"

        this.#vertices.push(root)

        this.#container.appendChild(root)

        const w = this.#displayGraph(this.tree, root)
        root.style.left = `calc(40% + ${w}px)`

        this.#vertices.forEach((v) => {
            v.onclick = (e) => {
                if (e.target === v) {
                    this.#add(v.id)
                }
            }

            v.oncontextmenu = (e) => {
                if (e.target === v) {
                    e.preventDefault()

                    this.#contextMenu.style.display = "flex"
                    this.#contextMenu.style.left = e.clientX + "px"
                    this.#contextMenu.style.top = e.clientY + "px"

                    this.#contextMenu.querySelector<HTMLElement>(":nth-child(1)")!.onclick = () => {
                        this.#add(v.id)
                    }

                    this.#contextMenu.querySelector<HTMLElement>(":nth-child(2)")!.onclick = () => {
                        this.#remove(v.id)
                    }

                    this.#contextMenu.querySelector<HTMLElement>(":nth-child(3)")!.onclick = () => {
                        this.#take(v.id)
                    }

                    this.#contextMenu.querySelector<HTMLElement>(":nth-child(4)")!.onclick = () => {
                        if (this.#selectedLeafIdMap.get(v.id)) {
                            this.#selectedLeafIdMap.delete(v.id)
                        } else {
                            this.#selectedLeafIdMap.set(v.id, `oklch(70% 0.2 ${this.#selectedCount++ * 67})`)
                        }

                        this.display(false)
                    }
                }
            }
        })
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

    #displayGraph(tree: any, parentElement: HTMLElement, id = ""): number {
        if (tree.length === 0) {
            return 2 * this.#gap
        } else if (tree.length === 1) {
            const vertex = document.createElement("span")
            vertex.classList.add("vertex")
            vertex.style.left = "0px"
            vertex.style.top = this.#gap * 4 + "px"
            vertex.id = id + "0"

            const color = this.#selectedLeafIdMap.get(vertex.id)
            if (color) vertex.style.backgroundColor = color

            this.#vertices.push(vertex)
            parentElement.appendChild(vertex)

            const edge = new Connector(parentElement, vertex)
            edge.line.classList.add("blue")

            this.#edges.set([parentElement, vertex], edge)

            return this.#displayGraph(tree[0], vertex, id + "0")
        } else if (tree.length === 2) {
            const vertex0 = document.createElement("span")
            vertex0.classList.add("vertex")
            vertex0.style.top = this.#gap * 4 + "px"
            vertex0.id = id + "0"

            const color = this.#selectedLeafIdMap.get(vertex0.id)
            if (color) vertex0.style.backgroundColor = color

            this.#vertices.push(vertex0)
            parentElement.appendChild(vertex0)

            const edge0 = new Connector(parentElement, vertex0)
            edge0.line.classList.add("orange")
            this.#edges.set([parentElement, vertex0], edge0)

            const width0 = this.#displayGraph(tree[0], vertex0, id + "0")

            const vertex1 = document.createElement("span")
            vertex1.classList.add("vertex")
            vertex1.style.top = this.#gap * 4 + "px"
            vertex1.id = id + "1"

            const color1 = this.#selectedLeafIdMap.get(vertex1.id)
            if (color1) vertex1.style.backgroundColor = color1

            this.#vertices.push(vertex1)
            parentElement.appendChild(vertex1)

            const edge1 = new Connector(parentElement, vertex1)
            edge1.line.classList.add("red")
            this.#edges.set([parentElement, vertex1], edge1)

            const width1 = this.#displayGraph(tree[1], vertex1, id + "1")

            const av = width0 + width1 - this.#gap

            vertex0.style.left = -av * (Math.sqrt(3) / 2) - this.#gap + "px"
            vertex1.style.left = av * (Math.sqrt(3) / 2) + this.#gap + "px"

            return width0 + width1
        } else {
            throw new SyntaxError("ミツマタが発生!")
        }
    }

    stringify() {
        return this.#stringify(this.tree, "")
    }

    #stringify(tree: tree, branch: string): string {
        const color = ["#D6D848", "#CC76D1", "#4A9DF8"][branch.length % 3]

        const c = (t: string) => `<span style="color: ${color}">${t}</span>`

        if (tree.length === 0) {
            const color = this.#selectedLeafIdMap.get(branch)
            if (color) return `<span style="color: ${color};">0</span>`

            return "0"
        } else if (tree.length === 1) return `${c("(")}${this.#stringify(tree[0], branch + 0)}${c(")")}`
        else if (tree.length === 2)
            return `${c("[")}${this.#stringify(tree[0], branch + 0)},${this.#stringify(tree[1], branch + 1)}${c("]")}`

        throw new SyntaxError("ミツマタが発生!")
    }

    isFractal() {
        return this.isSemiFractal() && JSON.stringify(this.tree) === JSON.stringify(this.getCut(this.tree))
    }

    isSemiFractal() {
        // 同じ階層で、青か赤から来ている木を取得

        let i = 1
        while (1) {
            const trees = this.#getRankNTrees(this.tree, i)
            if (trees.length === 0) break

            if (!trees.every((tree) => tree.length === 0) && trees.some((tree) => tree.length === 0)) return false

            const first = trees[0].join()

            const 全ての木が等しい = trees.slice(1).every((tree) => tree.join() === first)

            if (!全ての木が等しい) return false

            i++
        }

        return true
    }

    #countRank(tree: tree): number | null {
        if (tree.length === 0) return 0
        else if (tree.length === 1) {
            const rank = this.#countRank(tree[0])

            if (rank === null) return null

            return rank + 1
        } else if (tree.length === 2) {
            const leftRank = this.#countRank(tree[0])
            const rightRank = this.#countRank(tree[1])

            if (leftRank !== rightRank) return null

            if (leftRank === null) return null

            return leftRank + 1
        }

        throw new Error("ミツマタが発生!")
    }

    #getRankNTrees(tree: tree, n: number): tree[] {
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
            return this.#getRankNTrees(tree[0], n - 1)
        } else if (tree.length === 2) {
            return [...this.#getRankNTrees(tree[0], n - 1), ...this.#getRankNTrees(tree[1], n - 1)]
        }

        throw new Error("なんかおかしい!")
    }

    folder() {
        this.#folder(this.tree, this.#info)
    }

    #folder(tree: tree, parent: HTMLElement, depth = 0, branch = "") {
        const button = document.createElement("button")
        button.innerHTML = `${this.#stringify(tree, branch)}`

        const layer = document.createElement("div")
        layer.classList.add("hidden", "layer")
        layer.dataset["depth"] = "2em"

        let created = false

        const create = () => {
            created = true

            if (tree.length === 1) {
                const p = document.createElement("span")
                p.textContent = "..."
                p.classList.add("dot")
                layer.appendChild(p)

                this.#folder(tree[0], layer, depth + 1, branch + 0)
                this.#folder(tree[0], layer, depth + 1, branch + 0)
                this.#folder(tree[0], layer, depth + 1, branch + 0)

                const p2 = document.createElement("span")
                p2.textContent = "..."
                p2.classList.add("dot")
                layer.appendChild(p2)
            } else if (tree.length === 2) {
                this.#folder(tree[0], layer, depth + 1, branch + 0)
                this.#folder(tree[1], layer, depth + 1, branch + 1)
                this.#folder(tree[1], layer, depth + 1, branch + 1)
                this.#folder(tree[1], layer, depth + 1, branch + 1)

                const p = document.createElement("span")
                p.textContent = "..."
                p.classList.add("dot")
                layer.appendChild(p)
            }
        }

        button.onclick = () => {
            if (!created) create()
            layer.classList.toggle("hidden")
        }

        parent.appendChild(button)
        parent.appendChild(layer)
    }
}
