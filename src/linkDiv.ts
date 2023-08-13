import { GAP, SIDE, TURNPOINT_R } from './const'
import type { Expander, Parent, Topic, Wrapper } from './types/dom'
import type { LinkDiv, TraverseChildrenFunc } from './types/function'
import type { MainLineParams, SubLineParams } from './types/linkDiv'
import { findEle } from './utils/dom'
import { createLinkSvg, createMainPath, createPath } from './utils/svg'
let genPath: typeof generateSubLine1 = generateSubLine1
/**
 * Link nodes with svg,
 * only link specific node if `mainNode` is present
 *
 * procedure:
 * 1. calculate position of main nodes
 * 2. layout main node, generate main link
 * 3. generate links inside main node
 * 4. generate custom link
 * @param mainNode process the specific main node only
 */
// TODO: use flexbox
const linkDiv: LinkDiv = function (mainNode) {
  const mainNodeHorizontalGap = this.mainNodeHorizontalGap
  const mainNodeVerticalGap = this.mainNodeVerticalGap
  console.time('linkDiv')
  const root = this.root
  root.style.cssText = `top:${10000 - root.offsetHeight / 2}px;left:${10000 - root.offsetWidth / 2}px;`
  const mainNodeList = this.mainNodes.children
  this.lines.innerHTML = ''
  genPath = this.subLinkStyle === 2 ? generateSubLine2 : generateSubLine1

  // 1. calculate position of main nodes
  let totalHeight = 0
  let shortSide = '' // l or r
  let shortSideGap = 0 // balance heigt of two side
  let currentOffsetL = 0 // left side total offset
  let currentOffsetR = 0 // right side total offset
  let totalHeightL = 0
  let totalHeightR = 0
  let base: number // start offset

  if (this.direction === SIDE) {
    let countL = 0
    let countR = 0
    let totalHeightLWithoutGap = 0
    let totalHeightRWithoutGap = 0
    for (let i = 0; i < mainNodeList.length; i++) {
      const el = mainNodeList[i] as HTMLElement
      if (el.className === 'lhs') {
        totalHeightL += el.offsetHeight + mainNodeVerticalGap
        totalHeightLWithoutGap += el.offsetHeight
        countL += 1
      } else {
        totalHeightR += el.offsetHeight + mainNodeVerticalGap
        totalHeightRWithoutGap += el.offsetHeight
        countR += 1
      }
    }
    if (totalHeightL > totalHeightR) {
      this.mapHeight = totalHeightL
      base = 10000 - totalHeightL / 2
      shortSide = 'r'
      shortSideGap = (totalHeightL - totalHeightRWithoutGap) / (countR - 1)
    } else {
      this.mapHeight = totalHeightR
      base = 10000 - totalHeightR / 2
      shortSide = 'l'
      shortSideGap = (totalHeightR - totalHeightLWithoutGap) / (countL - 1)
    }
  } else {
    for (let i = 0; i < mainNodeList.length; i++) {
      const el = mainNodeList[i] as HTMLElement
      totalHeight += el.offsetHeight + mainNodeVerticalGap
    }
    this.mapHeight = totalHeight
    base = 10000 - totalHeight / 2
  }

  // 2. layout main node, generate main link
  const alignRight = 10000 - root.offsetWidth / 2 - mainNodeHorizontalGap
  const alignLeft = 10000 + root.offsetWidth / 2 + mainNodeHorizontalGap
  for (let i = 0; i < mainNodeList.length; i++) {
    let x1 = 10000
    const y1 = 10000
    let x2, y2
    const el = mainNodeList[i] as Wrapper
    const palette = this.theme.palette
    const branchColor = el.querySelector<Topic>('me-tpc')!.nodeObj.branchColor || palette[i % palette.length]
    const elOffsetH = el.offsetHeight
    if (el.className === 'lhs') {
      el.style.top = base + currentOffsetL + 'px'
      el.style.left = alignRight - el.offsetWidth + 'px'
      x2 = alignRight - GAP
      y2 = base + currentOffsetL + elOffsetH / 2

      if (shortSide === 'l') {
        currentOffsetL += elOffsetH + shortSideGap
      } else {
        currentOffsetL += elOffsetH + mainNodeVerticalGap
      }
    } else {
      el.style.top = base + currentOffsetR + 'px'
      el.style.left = alignLeft + 'px'
      x2 = alignLeft + GAP
      y2 = base + currentOffsetR + elOffsetH / 2

      if (shortSide === 'r') {
        currentOffsetR += elOffsetH + shortSideGap
      } else {
        currentOffsetR += elOffsetH + mainNodeVerticalGap
      }
    }

    let mainPath = ''
    if (this.mainLinkStyle === 2) {
      if (this.direction === SIDE) {
        if (el.className === 'lhs') {
          x1 = 10000 - root.offsetWidth / 6
        } else {
          x1 = 10000 + root.offsetWidth / 6
        }
      }
      mainPath = generateMainLine2({ x1, y1, x2, y2 })
    } else {
      const pct = Math.abs(y2 - 10000) / (10000 - base)
      if (el.className === 'lhs') {
        x1 = 10000 - root.offsetWidth / 10 - (1 - pct) * 0.25 * (root.offsetWidth / 2)
      } else {
        x1 = 10000 + root.offsetWidth / 10 + (1 - pct) * 0.25 * (root.offsetWidth / 2)
      }
      mainPath = generateMainLine1({ x1, y1, x2, y2 })
    }
    this.lines.appendChild(createMainPath(mainPath, branchColor))

    // set position of expander
    const expander = el.children[0].children[1] as Expander
    if (expander) {
      expander.style.top = (expander.parentNode.offsetHeight - expander.offsetHeight) / 2 + 'px'
      if (el.className === 'lhs') {
        expander.style.left = -10 - GAP + 'px'
      } else {
        expander.style.right = -10 - GAP + 'px'
      }
    }

    // 3. generate link inside main node
    if (mainNode && mainNode !== mainNodeList[i]) {
      continue
    }
    if (el.childElementCount) {
      const svg = createLinkSvg('subLines')
      // svg tag name is lower case
      const svgLine = el.lastChild as SVGSVGElement
      if (svgLine.tagName === 'svg') svgLine.remove()
      el.appendChild(svg)
      const parent = el.children[0] as Parent
      const children = el.children[1].children
      const pathsMap = new Map<string, string[]>()
      traverseChildren(children, parent, pathsMap, true)

      for (const [nodeId, paths] of pathsMap.entries()) {
        paths.forEach(path => {
          svg.appendChild(createPath(path, branchColor, nodeId))
        })
      }
    }
  }

  // 4. generate custom link
  this.linkSvgGroup.innerHTML = ''
  for (const prop in this.linkData) {
    const link = this.linkData[prop]
    this.createLink(findEle(link.from), findEle(link.to), true, link)
  }
  console.timeEnd('linkDiv')
}

// core function of generate subLines
const traverseChildren: TraverseChildrenFunc = function (children, parent, pathmap: Map<string, string[]>, isFirst) {
  const path = ''

  const pT = parent.offsetTop
  const pL = parent.offsetLeft
  const pW = parent.offsetWidth
  const pH = parent.offsetHeight
  for (let i = 0; i < children.length; i++) {
    const child = children[i] as Wrapper
    const childT = child.children[0] as Parent
    const cT = childT.offsetTop
    const cL = childT.offsetLeft
    const cW = childT.offsetWidth
    const cH = childT.offsetHeight
    const direction = child.offsetParent.className
    const tpc = parent.querySelector<Topic>('me-tpc')

    if (pathmap.has(tpc!.nodeObj.id)) {
      pathmap.get(tpc!.nodeObj.id)?.push(genPath({ pT, pL, pW, pH, cT, cL, cW, cH, direction, isFirst }))
    } else {
      pathmap.set(tpc!.nodeObj.id, [genPath({ pT, pL, pW, pH, cT, cL, cW, cH, direction, isFirst })])
    }

    // path += genPath({ pT, pL, pW, pH, cT, cL, cW, cH, direction, isFirst })
    // paths.push(genPath({ pT, pL, pW, pH, cT, cL, cW, cH, direction, isFirst }))
    const expander = childT.children[1] as Expander
    if (expander) {
      expander.style.bottom = -(expander.offsetHeight / 2) + 'px'
      if (direction === 'lhs') {
        expander.style.left = 0 + 'px'
      } else if (direction === 'rhs') {
        expander.style.left = childT.offsetWidth + 'px'
      }
      // this property is added in the layout phase
      if (!expander.expanded) continue
    } else {
      // expander not exist
      continue
    }

    const nextChildren = child.children[1].children
    if (nextChildren.length > 0) {
      traverseChildren(nextChildren, childT, pathmap, false)
    }
  }
  return pathmap
}

// https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/d#path_commands
function generateMainLine2({ x1, y1, x2, y2 }: MainLineParams) {
  return `M ${x1} 10000 V ${y2 > y1 ? y2 - 20 : y2 + 20} C ${x1} ${y2} ${x1} ${y2} ${x2 > x1 ? x1 + 20 : x1 - 20} ${y2} H ${x2}`
}

function generateMainLine1({ x1, y1, x2, y2 }: MainLineParams) {
  return `M ${x1} ${y1} Q ${x1} ${y2} ${x2} ${y2}`
}

function generateSubLine2({ pT, pL, pW, pH, cT, cL, cW, cH, direction, isFirst }: SubLineParams) {
  let y1: number
  if (isFirst) {
    y1 = pT + pH / 2
  } else {
    y1 = pT + pH
  }
  const y2 = cT + cH
  let x1 = 0
  let x2 = 0
  let xMiddle = 0
  if (direction === 'lhs') {
    x1 = pL + GAP
    x2 = cL
    xMiddle = cL + cW
  } else if (direction === 'rhs') {
    x1 = pL + pW - GAP
    x2 = cL + cW
    xMiddle = cL
  }

  if (y2 < y1 + 50 && y2 > y1 - 50) {
    // draw straight line if the distance is between +-50
    return `M ${x1} ${y1} H ${xMiddle} V ${y2} H ${x2}`
  } else if (y2 >= y1) {
    // child bottom lower than parent
    return `M ${x1} ${y1} H ${xMiddle} V ${y2 - TURNPOINT_R} A ${TURNPOINT_R} ${TURNPOINT_R} 0 0 ${x1 > x2 ? 1 : 0} ${
      x1 > x2 ? xMiddle - TURNPOINT_R : xMiddle + TURNPOINT_R
    } ${y2} H ${x2}`
  } else {
    // child bottom higher than parent
    return `M ${x1} ${y1} H ${xMiddle} V ${y2 + TURNPOINT_R} A ${TURNPOINT_R} ${TURNPOINT_R} 0 0 ${x1 > x2 ? 0 : 1} ${
      x1 > x2 ? xMiddle - TURNPOINT_R : xMiddle + TURNPOINT_R
    } ${y2} H ${x2}`
  }
}

function generateSubLine1({ pT, pL, pW, pH, cT, cL, cW, cH, direction, isFirst }: SubLineParams) {
  let y1 = 0
  let end = 0
  if (isFirst) {
    y1 = pT + pH / 2
  } else {
    y1 = pT + pH
  }
  const y2 = cT + cH
  let x1 = 0
  let x2 = 0
  let xMid = 0
  const offset = Math.min(Math.abs(y1 - y2) / 800, 1.2) * GAP
  if (direction === 'lhs') {
    xMid = pL
    x1 = xMid + GAP
    x2 = xMid - GAP
    end = cL + GAP
    return `M ${x1} ${y1} C ${xMid} ${y1} ${xMid + offset} ${y2} ${x2} ${y2} H ${end}`
  } else {
    xMid = pL + pW
    x1 = xMid - GAP
    x2 = xMid + GAP
    end = cL + cW - GAP
    return `M ${x1} ${y1} C ${xMid} ${y1} ${xMid - offset} ${y2} ${x2} ${y2} H ${end}`
  }
}

// function generateSubLine3({ x1, y1, x2, y2, xMiddle }) {
//   return `M ${x1} ${y1} Q ${x1} ${y2} ${xMiddle} ${y2} H ${x2}`
// }

export default linkDiv
