import { Tree } from "./Tree"

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

    // document.getElementById("screen-shot")!.onclick = async () => {
    //     const url = await captureScreen()

    //     console.log(url)
    // }

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

    // const tree2 = new Tree(container, info)

    // const stream = await navigator.mediaDevices.getDisplayMedia({
    //     video: true,
    // })

    // const track = stream.getVideoTracks()[0]

    // // 型定義にない場合は any にキャスト
    // const imageCapture = new (window as any).ImageCapture(track)

    // await new Promise((resolve) => setTimeout(resolve, 2000))

    // // トリミングするピクセル数
    // const trimLeft = 0
    // const trimBottom = 800

    // for (const t of generateRankNTree(5)) {
    //     tree.tree = t

    //     if (tree.isSemiFractal()) {
    //         tree2.tree = tree.getCut(t)
    //         tree2.top = 40

    //         container.innerHTML = ""

    //         tree.display()
    //         tree2.display()

    //         await new Promise((resolve) => requestAnimationFrame(resolve))
    //         await new Promise((resolve) => requestAnimationFrame(resolve))

    //         // grabFrame も any 扱いにする
    //         const bitmap: ImageBitmap = await imageCapture.grabFrame()

    //         // 切り抜きサイズを計算
    //         const cropWidth = bitmap.width - trimLeft
    //         const cropHeight = bitmap.height - trimBottom

    //         const canvas = document.createElement("canvas")
    //         canvas.width = cropWidth
    //         canvas.height = cropHeight

    //         const ctx = canvas.getContext("2d")
    //         if (!ctx) throw new Error("Canvas context not available")

    //         // 左と下をトリミング
    //         ctx.drawImage(
    //             bitmap,
    //             trimLeft, // sx: 左から何pxカットするか
    //             0, // sy: 上は切らない
    //             cropWidth, // sw: 幅
    //             cropHeight, // sh: 高さ
    //             0, // dx
    //             0, // dy
    //             cropWidth, // dw
    //             cropHeight, // dh
    //         )

    //         downloadImage(canvas.toDataURL("image/png"), JSON.stringify(t))
    //     }
    // }

    // track.stop() // キャプチャ終了
})

// type tree = [] | [tree] | [tree, tree]

// const tree = new Tree(document.body, document.body)

// const semiFractals: Record<string, string> = {}
// const fractals = []

// for (const t of generateRankNTree(5)) {
//     tree.tree = t

//     if (tree.isSemiFractal()) semiFractals[JSON.stringify(t)] = JSON.stringify(tree.getCut(t))
//     if (tree.isFractal()) fractals.push(JSON.stringify(t))
// }

// console.log(JSON.stringify(semiFractals, null, 4))
// console.log(JSON.stringify(fractals))

// function* generateRankNTree(n: number): Generator<tree> {
//     if (n === 0) {
//         yield []
//         return
//     }

//     for (const subTree of generateRankNTree(n - 1)) {
//         yield [subTree]
//     }

//     for (const subTree of generateRankNTree(n - 1)) {
//         for (const subTree2 of generateRankNTree(n - 1)) {
//             yield [subTree, subTree2]
//         }
//     }
// }

// function downloadImage(url: string, filename: string) {
//     const a = document.createElement("a")
//     a.href = url
//     a.download = filename
//     document.body.appendChild(a)
//     a.click()
//     document.body.removeChild(a)
// }
