import type { LinkControllerData } from '../types/function'
import type { GetObjById, FillParent, NodeObj, GenerateNewObj } from '../types/index'

export function encodeHTML(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;')
}

export const isMobile = (): boolean => /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)

export const getObjById: GetObjById = function (id, data) {
  if (data.id === id) {
    return data
  } else if (data.children && data.children.length) {
    for (let i = 0; i < data.children.length; i++) {
      const res = getObjById(id, data.children[i])
      if (res) return res
    }
    return null
  } else {
    return null
  }
}

export const fillParent: FillParent = (data: NodeObj, parent?: NodeObj) => {
  data.parent = parent
  if (data.children) {
    for (let i = 0; i < data.children.length; i++) {
      fillParent(data.children[i], data)
    }
  }
}

export function refreshIds(data: NodeObj) {
  data.id = generateUUID()
  if (data.children) {
    for (let i = 0; i < data.children.length; i++) {
      refreshIds(data.children[i])
    }
  }
}

export const throttle = (fn: (...args: any[]) => void, wait: number) => {
  let pre = Date.now()
  return function (...args: any[]) {
    const now = Date.now()
    if (now - pre >= wait) {
      fn(...args)
      pre = Date.now()
    }
  }
}

export function getArrowPoints(p3x: number, p3y: number, p4x: number, p4y: number) {
  const deltay = p4y - p3y
  const deltax = p3x - p4x
  let angle = (Math.atan(Math.abs(deltay) / Math.abs(deltax)) / 3.14) * 180
  if (deltax < 0 && deltay > 0) {
    angle = 180 - angle
  }
  if (deltax < 0 && deltay < 0) {
    angle = 180 + angle
  }
  if (deltax > 0 && deltay < 0) {
    angle = 360 - angle
  }
  const arrowLength = 20
  const arrowAngle = 30
  const a1 = angle + arrowAngle
  const a2 = angle - arrowAngle
  return {
    x1: p4x + Math.cos((Math.PI * a1) / 180) * arrowLength,
    y1: p4y - Math.sin((Math.PI * a1) / 180) * arrowLength,
    x2: p4x + Math.cos((Math.PI * a2) / 180) * arrowLength,
    y2: p4y - Math.sin((Math.PI * a2) / 180) * arrowLength,
  }
}

export function calcP1(fromData: LinkControllerData, p2x: number, p2y: number) {
  let x, y
  const k = (fromData.cy - p2y) / (p2x - fromData.cx)
  if (k > fromData.h / fromData.w || k < -fromData.h / fromData.w) {
    if (fromData.cy - p2y < 0) {
      x = fromData.cx - fromData.h / 2 / k
      y = fromData.cy + fromData.h / 2
    } else {
      x = fromData.cx + fromData.h / 2 / k
      y = fromData.cy - fromData.h / 2
    }
  } else {
    if (fromData.cx - p2x < 0) {
      x = fromData.cx + fromData.w / 2
      y = fromData.cy - (fromData.w * k) / 2
    } else {
      x = fromData.cx - fromData.w / 2
      y = fromData.cy + (fromData.w * k) / 2
    }
  }
  return {
    x,
    y,
  }
}

export function calcP4(toData: LinkControllerData, p3x: number, p3y: number) {
  let x, y
  const k = (toData.cy - p3y) / (p3x - toData.cx)
  if (k > toData.h / toData.w || k < -toData.h / toData.w) {
    if (toData.cy - p3y < 0) {
      x = toData.cx - toData.h / 2 / k
      y = toData.cy + toData.h / 2
    } else {
      x = toData.cx + toData.h / 2 / k
      y = toData.cy - toData.h / 2
    }
  } else {
    if (toData.cx - p3x < 0) {
      x = toData.cx + toData.w / 2
      y = toData.cy - (toData.w * k) / 2
    } else {
      x = toData.cx - toData.w / 2
      y = toData.cy + (toData.w * k) / 2
    }
  }
  return {
    x,
    y,
  }
}

export function generateUUID(): string {
  return (new Date().getTime().toString(16) + Math.random().toString(16).substr(2)).substr(2, 16)
}

export const generateNewObj: GenerateNewObj = function () {
  const id = generateUUID()
  return {
    topic: this.newTopicName,
    id,
  }
}

export function checkMoveValid(from: NodeObj, to: NodeObj) {
  let valid = true
  while (to.parent) {
    if (to.parent === from) {
      valid = false
      break
    }
    to = to.parent
  }
  return valid
}

const getSibling = (obj: NodeObj): { siblings: NodeObj[]; index: number } => {
  const siblings = obj.parent!.children as NodeObj[]
  const index = siblings.indexOf(obj)
  return { siblings, index }
}

export function getObjSibling(obj: NodeObj): NodeObj | null {
  const { siblings, index } = getSibling(obj)
  if (index + 1 >= siblings.length) {
    // 最后一个
    return null
  } else {
    return siblings[index + 1]
  }
}

export function moveUpObj(obj: NodeObj) {
  const { siblings, index } = getSibling(obj)
  const t = siblings[index]
  if (index === 0) {
    siblings[index] = siblings[siblings.length - 1]
    siblings[siblings.length - 1] = t
  } else {
    siblings[index] = siblings[index - 1]
    siblings[index - 1] = t
  }
}

export function moveDownObj(obj: NodeObj) {
  const { siblings, index } = getSibling(obj)
  const t = siblings[index]
  if (index === siblings.length - 1) {
    siblings[index] = siblings[0]
    siblings[0] = t
  } else {
    siblings[index] = siblings[index + 1]
    siblings[index + 1] = t
  }
}

export function removeNodeObj(obj: NodeObj) {
  const { siblings, index } = getSibling(obj)
  siblings.splice(index, 1)
  return siblings.length
}

export function insertNodeObj(obj: NodeObj, newObj: NodeObj) {
  const { siblings, index } = getSibling(obj)
  siblings.splice(index + 1, 0, newObj)
}

export function insertBeforeNodeObj(obj: NodeObj, newObj: NodeObj) {
  const { siblings, index } = getSibling(obj)
  siblings.splice(index, 0, newObj)
}

export function insertParentNodeObj(obj: NodeObj, newObj: NodeObj) {
  const { siblings, index } = getSibling(obj)
  siblings[index] = newObj
  newObj.children = [obj]
}

export function moveNodeObj(from: NodeObj, to: NodeObj) {
  removeNodeObj(from)
  if (to.children) to.children.push(from)
  else to.children = [from]
}

export function moveNodeBeforeObj(from: NodeObj, to: NodeObj) {
  removeNodeObj(from)
  const { siblings, index } = getSibling(to)
  siblings.splice(index, 0, from)
}

export function moveNodeAfterObj(from: NodeObj, to: NodeObj) {
  removeNodeObj(from)
  const { siblings, index } = getSibling(to)
  siblings.splice(index + 1, 0, from)
}

export function deepClone(obj: NodeObj) {
  const deepCloneObj = JSON.parse(
    JSON.stringify(obj, (k, v) => {
      if (k === 'parent') return undefined
      return v
    })
  )
  return deepCloneObj
}
