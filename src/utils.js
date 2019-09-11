function eventListener(method, elements, events, fn, options = {}) {

    // Normalize array
    if (elements instanceof HTMLCollection || elements instanceof NodeList) {
        elements = Array.from(elements);
    } else if (!Array.isArray(elements)) {
        elements = [elements];
    }

    if (!Array.isArray(events)) events = [events];

    for (const element of elements) {
        for (const event of events) {
            element[method](event, fn, {capture: false, ...options});
        }
    }

    return Array.prototype.slice.call(arguments, 1);
}

/**
 * Add event(s) to element(s).
 * @param elements DOM-Elements
 * @param events Event names
 * @param fn Callback
 * @param options Optional options
 * @return Array passed arguments
 */
export const on = eventListener.bind(null, 'addEventListener');

/**
 * Remove event(s) from element(s).
 * @param elements DOM-Elements
 * @param events Event names
 * @param fn Callback
 * @param options Optional options
 * @return Array passed arguments
 */
export const off = eventListener.bind(null, 'removeEventListener');

const unitify = (val, unit = 'px') => typeof val === 'number' ? val + unit : '' + val;

/**
 * Add css to a DOM-Element or returns the current
 * value of a property.
 *
 * @param el The Element.
 * @param attr The attribute or a object which holds css key-properties.
 * @param val The value for a single attribute.
 * @returns {*}
 */
export function css(el, attr, val) {
    const style = el && el.style;
    if (!style) return;

    if (typeof attr === 'object') {

        for (const prop in attr) {
            style[prop] = unitify(attr[prop]);
        }

    } else if (val == null) {

        const dw = document.defaultView;
        if (dw && dw.getComputedStyle) {
            val = dw.getComputedStyle(el, null);
        } else if (el.currentStyle) {
            val = el.currentStyle;
        }

        return attr == null ? val : val[attr];
    } else {
        style[attr] = unitify(val);
    }
}

/**
 * Check if two DOM-Elements intersects each other.
 * @param a BoundingClientRect of the first element.
 * @param b BoundingClientRect of the second element.
 * @param mode Options are center, cover or touch.
 * @returns {boolean} If both elements intersects each other.
 */
export function intersects(a, b, mode = 'touch') {

    if (mode === 'center') {
        return doPolygonsIntersect(a, b);
    } else if (mode === 'cover') {
        return b.left >= a.left
            && b.top >= a.top
            && b.right <= a.right
            && b.bottom <= a.bottom;
    } else if (mode === 'touch') {
        return a.right >= b.left
            && a.left <= b.right
            && a.bottom >= b.top
            && a.top <= b.bottom;
    }
}

function isUndefined(a) {
    return a === undefined;
}

/**
 * Helper function to determine whether there is an intersection between the two polygons described
 * by the lists of vertices. Uses the Separating Axis Theorem
 *
 * @param a an array of connected points [{x:, y:}, {x:, y:},...] that form a closed polygon
 * @param b an array of connected points [{x:, y:}, {x:, y:},...] that form a closed polygon
 * @return true if there is any intersection between the 2 polygons, false otherwise
 */
function doPolygonsIntersect (rectA, rectB) {
    const a = mapRectToArrayCoordinate(rectA);
    const b = mapRectToArrayCoordinate(rectB);
    const polygons = [a, b];
    let minA, maxA, projected, minB, maxB;

    for (let i = 0; i < polygons.length; i++) {

        // for each polygon, look at each edge of the polygon, and determine if it separates
        // the two shapes
        let polygon = polygons[i];
        for (let i1 = 0; i1 < polygon.length; i1++) {

            // grab 2 vertices to create an edge
            let i2 = (i1 + 1) % polygon.length;
            let p1 = polygon[i1];
            let p2 = polygon[i2];

            // find the line perpendicular to this edge
            let normal = { x: p2.y - p1.y, y: p1.x - p2.x };

            minA = maxA = undefined;
            // for each vertex in the first shape, project it onto the line perpendicular to the edge
            // and keep track of the min and max of these values
            for (let j = 0; j < a.length; j++) {
                projected = normal.x * a[j].x + normal.y * a[j].y;
                if (isUndefined(minA) || projected < minA) {
                    minA = projected;
                }
                if (isUndefined(maxA) || projected > maxA) {
                    maxA = projected;
                }
            }

            // for each vertex in the second shape, project it onto the line perpendicular to the edge
            // and keep track of the min and max of these values
            minB = maxB = undefined;
            for (let j = 0; j < b.length; j++) {
                projected = normal.x * b[j].x + normal.y * b[j].y;
                if (isUndefined(minB) || projected < minB) {
                    minB = projected;
                }
                if (isUndefined(maxB) || projected > maxB) {
                    maxB = projected;
                }
            }

            // if there is no overlap between the projects, the edge we are looking at separates the two
            // polygons, and we know there is no overlap
            if (maxA < minB || maxB < minA) {
                return false;
            }
        }
    }
    return true;
}

function mapRectToArrayCoordinate(rect) {
    const { x , y, width, height } = rect.getBoundingClientRect()
    return [
        { x, y }, // left-top
        { x: x + width, y }, // right-top
        { x: x + width, y: y + height  }, // right-bottom
        { x, y: y + height  }, // left-bottom
    ];
}

/**
 * Takes a selector (or array of selectors) and returns the matched nodes.
 * @param selector The selector or an Array of selectors.
 * @returns {Array} Array of DOM-Nodes.
 */
export function selectAll(selector) {
    if (!Array.isArray(selector)) selector = [selector];

    const nodes = [];
    for (const sel of selector) {
        nodes.push(...document.querySelectorAll(sel));
    }

    return nodes;
}

/**
 * Polyfill for safari & firefox for the eventPath event property.
 * @param evt The event object.
 * @return [String] event path.
 */
export function eventPath(evt) {
    let path = evt.path || (evt.composedPath && evt.composedPath());
    if (path) return path;

    let el = evt.target.parentElement;
    path = [evt.target, el];
    while (el = el.parentElement) path.push(el);

    path.push(document, window);
    return path;
}

/**
 * Removes an element from an Array.
 */
export function removeElement(arr, el) {
    const index = arr.indexOf(el);
    if (~index) arr.splice(index, 1);
}

export function simplifyEvent(evt) {
    const tap = (evt.touches && evt.touches[0] || evt);
    return {
        tap,
        x: tap.clientX,
        y: tap.clientY,
        target: tap.target
    };
}