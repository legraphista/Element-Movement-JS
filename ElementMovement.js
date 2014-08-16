var Draggable = {
    options: {
        "onTopzIndex": 9000,
        "keepZindex": true,
        "inertiaDecelFactor": 0.97,
        "FPS": 60,
        "inertiaEnabled": true,
        "checkForElementInBounds": false,
        "decelForceBackInBounds": true,
        "enableTransforming": true
    },

    lastDraggedElement: undefined,

    setUpDraggableElements: function () {
        var _obj = {};

        var elements = document.querySelectorAll('[' + "canMove" + ']');
        _obj.elements = new Array();

        for (i = 0; i < elements.length; i++) {
            _obj.elements.push(Draggable.setupElement(elements[i]));
        }

        window.onmousemove = function (e) {
            if (Draggable.lastDraggedElement === undefined) return;
            if (Draggable.lastDraggedElement.isDown == false) return;

            var x = e.clientX;
            var y = e.clientY;
            var rect = Draggable.lastDraggedElement.obj.getBoundingClientRect();

            if (!(rect.left <= x && rect.right >= x)) {
                Draggable.lastDraggedElement.obj.onmouseup();
                return;
            }

            if (!(rect.top <= y && rect.bottom >= y)) {
                Draggable.lastDraggedElement.obj.onmouseup();
                return;
            }
        }

        return _obj;
    },

    setupElement: function (e) {
        var element = {};
        element.obj = e;
        element.isDown = false;
        element.originalZindex = 0;
        element.obj.ondragstart = function () { return false; };
        //mouse down
        element.obj.onmousedown = function (e) {
            element.isDown = true;
            var x = e.offsetX || e.layerX;
            var y = e.offsetY || e.layerY;
            var rect = element.obj.getBoundingClientRect();

            element.originalZindex = element.obj.style.zIndex;
            element.obj.style.zIndex = Draggable.options.onTopzIndex;

            element.offsetY = y;
            element.offsetX = x;

            element.X = rect.left;
            element.Y = rect.top;

            element.lastShiftY = 0;
            element.lastShiftX = 0;

            element.obj.style.position = "absolute";
            element.obj.style.top = element.Y + "px";
            element.obj.style.left = element.X + "px";
            return false;
        };
        //mouse up

        element.obj.onmouseup = function () {
            element.isDown = false;
            element.offsetX = 0;
            element.offsetY = 0;

            if (Draggable.options.inertiaEnabled) {
                Draggable.decelAnimation(element, element.lastShiftX, element.lastShiftY);
            }


            if (!Draggable.options.keepZindex) {
                element.obj.style.zIndex = element.originalZindex;
            } else {
                if (Draggable.lastDraggedElement !== undefined)
                    Draggable.lastDraggedElement.obj.style.zIndex = Draggable.lastDraggedElement.originalZindex;
                Draggable.lastDraggedElement = element;
            }

        };
        //mouse move
        element.obj.onmousemove = function (e) {
            if (element.isDown == false) return;

            var x = e.offsetX || e.layerX;
            var y = e.offsetY || e.layerY;

            var shiftY = element.offsetY - y;
            var shiftX = element.offsetX - x;

            element.lastShiftY = shiftY;
            element.lastShiftX = shiftX;

            if (Draggable.options.checkForElementInBounds) {
                if (Draggable.elementInBounds(element)) {
                    element.X -= shiftX;
                    element.Y -= shiftY;

                    element.obj.style.top = element.Y + "px";
                    element.obj.style.left = element.X + "px";
                }
            } else {
                element.X -= shiftX;
                element.Y -= shiftY;

                element.obj.style.top = element.Y + "px";
                element.obj.style.left = element.X + "px";
            }

            Draggable.applyTransform(element, shiftX, shiftY);

        }
        return element;
    },

    decelAnimation: function (element, xSpeed, ySpeed) {
        if (element.isDown) return;

        element.X -= xSpeed;
        element.Y -= ySpeed;

        if (element.X < 0)
            if (xSpeed > 0)
                xSpeed = -xSpeed;

        if (element.Y < 0)
            if (ySpeed > 0)
                ySpeed = -ySpeed;

        var screenSize = Draggable.getScreenSize();

        if (element.X + element.obj.offsetWidth > screenSize.w)
            if (xSpeed < 0)
                xSpeed = -xSpeed;

        if (element.Y + element.obj.offsetHeight > screenSize.h)
            if (ySpeed < 0)
                ySpeed = -ySpeed;

        element.obj.style.top = element.Y + "px";
        element.obj.style.left = element.X + "px";

        if (!(Draggable.options.decelForceBackInBounds && !Draggable.elementInBounds(element))) {
            xSpeed *= Draggable.options.inertiaDecelFactor;
            ySpeed *= Draggable.options.inertiaDecelFactor;
        } else {
            if (Math.abs(ySpeed) < 0.1)
                ySpeed = 1;
            if (Math.abs(xSpeed) < 0.1)
                xSpeed = 1;
        }

        Draggable.applyTransform(element, xSpeed, ySpeed);

        if (Math.abs(ySpeed) > 0.1 || Math.abs(xSpeed) > 0.1)
            setTimeout(function () { Draggable.decelAnimation(element, xSpeed, ySpeed); }, 1000.0 / Draggable.options.FPS);

    },

    getScreenSize: function () {
        var w = window,
        d = document,
        e = d.documentElement,
        g = d.getElementsByTagName('body')[0],
        x = w.innerWidth || e.clientWidth || g.clientWidth,
        y = w.innerHeight || e.clientHeight || g.clientHeight;

        return { "w": x, "h": y };
    },

    elementInBounds: function (element) {
        if (element.X < 0) return false;
        if (element.Y < 0) return false;
        var screenSize = Draggable.getScreenSize();
        if (element.X + element.obj.offsetWidth > screenSize.w) return false;
        if (element.Y + element.obj.offsetHeight > screenSize.h) return false;
        return true;
    },

    applyTransform: function (element, shiftX, shiftY) {
        if (Draggable.options.enableTransforming) {
            var rotateYAngle = shiftX * 1.5;
            var rotateXAngle = shiftY * 1.5;

            var th = 25;

            if (rotateYAngle < -th) rotateYAngle = -th;
            if (rotateXAngle < -th) rotateXAngle = -th;

            if (rotateYAngle > +th) rotateYAngle = +th;
            if (rotateXAngle > +th) rotateXAngle = +th;

            element.obj.style.transform = "perspective(500px) rotateY(" + rotateYAngle + "deg) rotateX(" + rotateXAngle + "deg)";
        }
    }
}