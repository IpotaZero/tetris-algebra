import html2canvas from "html2canvas"
import { Tree, TreeController } from "./Tree"

document.addEventListener("DOMContentLoaded", async () => {
    const container = document.getElementById("container")!

    const info = document.getElementById("info")!

    const tree = new Tree(container, info)
    tree.display()

    const form = document.getElementById("form")!
    const input = document.getElementById("input")! as HTMLInputElement

    const divide = document.getElementById("divide")!
    divide.onclick = () => {
        tree.divide()
    }

    const cut = document.getElementById("cut")!
    cut.onclick = () => {
        tree.cut()
    }

    const copy = document.getElementById("copy")!
    copy.onclick = () => {
        input.value = JSON.stringify(tree.tree)
    }

    document.getElementById("undo")!.onclick = () => {
        tree.undo()
    }

    document.getElementById("screen-shot")!.onclick = async () => {
        await screenShot(tree)
    }

    window.addEventListener("keydown", (e) => {
        if (e.ctrlKey && e.code === "KeyZ") {
            tree.undo()
        }

        if (e.ctrlKey && e.code === "KeyY") {
            tree.redo()
        }

        if (e.ctrlKey && e.code === "KeyC") {
            navigator.clipboard.writeText(JSON.stringify(tree.tree))
        }
    })

    document.getElementById("redo")!.onclick = () => {
        tree.redo()
    }
    ;(window as any).tree = tree

    form.onsubmit = (e) => {
        e.preventDefault()

        const representation = input.value
            .replaceAll("\n", "")
            .replaceAll("0", "[]")
            .replaceAll("(", "[")
            .replaceAll(")", "]")

        tree.tree = JSON.parse(representation)
        tree.display()
    }

    return

    for (const t of generateRankNTree(0)) {
        tree.tree = t

        if (TreeController.isSemiFractal(tree.tree)) {
            tree.display()

            await new Promise((resolve) => requestAnimationFrame(resolve))
            await new Promise((resolve) => requestAnimationFrame(resolve))

            await screenShot(tree)
        }
    }
})

type tree = [] | [tree] | [tree, tree]

function* generateRankNTree(n: number): Generator<tree> {
    if (n === 0) {
        yield []
        return
    }

    for (const subTree of generateRankNTree(n - 1)) {
        yield [subTree]
    }

    for (const subTree of generateRankNTree(n - 1)) {
        for (const subTree2 of generateRankNTree(n - 1)) {
            yield [subTree, subTree2]
        }
    }
}

function downloadImage(url: string, filename: string) {
    const a = document.createElement("a")
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
}

async function screenShot(tree: Tree) {
    const container = document.querySelector<HTMLElement>("#container")!
    const rect = container.getBoundingClientRect()
    const canvas = await html2canvas(container, { backgroundColor: "#111", width: rect.width, windowWidth: rect.width })
    downloadImage(canvas.toDataURL(), JSON.stringify(tree.tree))
}
