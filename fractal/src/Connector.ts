type Anchor = "center" | "top" | "bottom" | "left" | "right"

interface ConnectorOptions {
    color: string
    width: number
    anchorA: Anchor
    anchorB: Anchor
    arrow: boolean
}

interface Point {
    x: number
    y: number
}

export class Connector {
    static #defaultOption: ConnectorOptions = {
        color: "black",
        width: 4,
        anchorA: "center",
        anchorB: "center",
        arrow: false,
    } as const

    static #layer: SVGSVGElement | null = null

    static #createLayer(): SVGSVGElement {
        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg")
        svg.id = "connector-layer"
        Object.assign(svg.style, {
            position: "fixed",
            inset: "0",
            width: "100vw",
            height: "100vh",
            pointerEvents: "none",
        })

        // Arrow marker (smaller, centered)
        const marker = this.#createMarker(svg)

        const defs = document.createElementNS(svg.namespaceURI, "defs")
        defs.appendChild(marker)

        svg.appendChild(defs)

        return svg
    }

    static #createMarker(svg: SVGSVGElement) {
        const marker = document.createElementNS(svg.namespaceURI, "marker")

        marker.id = "arrow-end"
        marker.setAttribute("orient", "auto")
        marker.setAttribute("markerWidth", "4")
        marker.setAttribute("markerHeight", "4")
        marker.setAttribute("refX", "1")
        marker.setAttribute("refY", "2")

        const path = document.createElementNS(svg.namespaceURI, "path")
        path.setAttribute(
            "d",
            `M 0 0
             Q 2 1.3, 4 2
             Q 2 2.7, 0 4
             Z`,
        )
        path.setAttribute("fill", "currentColor")
        marker.appendChild(path)

        return marker
    }

    static ensureLayer(): SVGSVGElement {
        if (!this.#layer) {
            this.#layer = this.#createLayer()
        }
        return this.#layer
    }

    readonly line: SVGPolylineElement
    readonly hitLine: SVGLineElement
    readonly options: Required<ConnectorOptions>

    readonly #A: HTMLElement
    readonly #B: HTMLElement
    #resizeObserverA!: ResizeObserver
    #resizeObserverB!: ResizeObserver
    #requestAnimationId: number | null = null

    constructor(a: HTMLElement, b: HTMLElement, options: Partial<ConnectorOptions> = {}) {
        this.#A = a
        this.#B = b

        this.options = {
            ...Connector.#defaultOption,
            ...options,
        }

        const svgLayer = Connector.ensureLayer()
        // 透明な当たり判定用line
        this.hitLine = this.#createHitLine(svgLayer)
        svgLayer.appendChild(this.hitLine)
        // 表示用line
        this.line = this.#createLine(svgLayer)
        svgLayer.appendChild(this.line)

        this.#setupObserver()

        this.update()
    }

    #createLine(svgLayer: SVGSVGElement) {
        const line = document.createElementNS(svgLayer.namespaceURI, "polyline") as SVGPolylineElement

        line.setAttribute("stroke", "currentColor")
        line.setAttribute("stroke-width", String(this.options.width))
        line.setAttribute("stroke-linecap", "round") // 丸い端点にする

        if (this.options.arrow) {
            line.setAttribute("marker-mid", "url(#arrow-end)")
        }

        // pointer-eventsはnoneにして、当たり判定はhitLineに任せる
        line.style.pointerEvents = "none"

        return line
    }

    #createHitLine(svgLayer: SVGSVGElement) {
        const hitLine = document.createElementNS(svgLayer.namespaceURI, "line") as SVGLineElement
        hitLine.setAttribute("stroke", "transparent")
        hitLine.setAttribute("stroke-width", String(this.options.width * 8))
        hitLine.setAttribute("stroke-linecap", "round")
        // pointer-events有効化
        hitLine.style.pointerEvents = "stroke"
        // z-indexはSVG内で後ろに来るように先にappendChildする
        return hitLine
    }

    #setupObserver() {
        const update = this.update.bind(this)

        window.addEventListener("scroll", update, { passive: true })
        window.addEventListener("resize", update, { passive: true })

        this.#resizeObserverA = new ResizeObserver(update)
        this.#resizeObserverB = new ResizeObserver(update)
        this.#resizeObserverA.observe(this.#A)
        this.#resizeObserverB.observe(this.#B)
    }

    #getPoint(el: HTMLElement, anchor: Anchor): Point {
        // 画面上の位置
        const r = el.getBoundingClientRect()

        switch (anchor) {
            case "center":
                return { x: r.left + r.width / 2, y: r.top + r.height / 2 }
            case "top":
                return { x: r.left + r.width / 2, y: r.top }
            case "bottom":
                return { x: r.left + r.width / 2, y: r.bottom }
            case "left":
                return { x: r.left, y: r.top + r.height / 2 }
            case "right":
                return { x: r.right, y: r.top + r.height / 2 }
        }
    }

    update() {
        if (this.#requestAnimationId !== null) return

        this.#requestAnimationId = requestAnimationFrame(() => {
            const p1 = this.#getPoint(this.#A, this.options.anchorA)
            const p2 = this.#getPoint(this.#B, this.options.anchorB)

            this.line.setAttribute(
                "points",
                `${p1.x},${p1.y} ${(p1.x + p2.x) / 2},${(p1.y + p2.y) / 2} ${p2.x},${p2.y}`,
            )

            this.hitLine.setAttribute("x1", String(p1.x))
            this.hitLine.setAttribute("y1", String(p1.y))
            this.hitLine.setAttribute("x2", String(p2.x))
            this.hitLine.setAttribute("y2", String(p2.y))
            this.#requestAnimationId = null
        })
    }

    destroy() {
        window.removeEventListener("scroll", this.update)
        window.removeEventListener("resize", this.update)
        this.#resizeObserverA.disconnect()
        this.#resizeObserverB.disconnect()
        this.line.remove()
        this.hitLine.remove()
    }
}
