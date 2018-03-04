fabric.ElementsParser = function(elements, callback, options, reviver, parsingOptions) {
  this.elements = elements;
  this.callback = callback;
  this.options = options;
  this.reviver = reviver;
  this.svgUid = (options && options.svgUid) || 0;
  this.parsingOptions = parsingOptions;
};

fabric.ElementsParser.prototype.parse = function() {
  this.instances = new Array(this.elements.length);
  this.numElements = this.elements.length;

  this.createObjects();
};

fabric.ElementsParser.prototype.createObjects = function() {
  this.elements.forEach(function(element, i) {
    element.setAttribute('svgUid', this.svgUid);
    this.createObject(element, i);
  });
};

fabric.ElementsParser.prototype.createObject = function(el, index) {
  var klass = fabric[fabric.util.string.capitalize(el.tagName.replace('svg:', ''))];
  if (klass && klass.fromElement) {
    try {
      klass.fromElement(el, this.createCallback(index, el), this.options);
    }
    catch (err) {
      fabric.log(err);
    }
  }
  else {
    this.checkIfDone();
  }
};

fabric.ElementsParser.prototype.createCallback = function(index, el) {
  var _this = this;
  return function(obj) {
    var _options;
    _this.resolveGradient(obj, 'fill');
    _this.resolveGradient(obj, 'stroke');
    _this.resolveClipPath(obj);
    if (obj instanceof fabric.Image) {
      _options = obj.parsePreserveAspectRatioAttribute(el);
    }
    obj._removeTransformMatrix(_options);
    _this.reviver && _this.reviver(el, obj);
    _this.instances[index] = obj;
    _this.checkIfDone();
  };
};

fabric.ElementsParser.prototype.extractPropertyDefinition = function(obj, property, storage) {
  var value = obj.get(property);
  if (!(/^url\(/).test(value)) {
    return false;
  }
  var id = value.slice(5, value.length - 1);
  return fabric[storage][this.svgUid][id];
};

fabric.ElementsParser.prototype.resolveGradient = function(obj, property) {
  var gradientDef = this.extractPropertyDefinition(obj, property, 'gradientDefs');
  if (gradientDef) {
    obj.set(property, fabric.Gradient.fromElement(gradientDef, obj));
  }
};

fabric.ElementsParser.prototype.resolveClipPath = function(obj) {
  var clipPath = this.extractPropertyDefinition(obj, 'clipPath', 'clipPaths');
  if (clipPath) {
    obj.clipPath = clipPath.map(function(element) {
      var klass = fabric[fabric.util.string.capitalize(element.tagName.replace('svg:', ''))];
      return klass.fromElement(element, this.options);
    });
  }
};

fabric.ElementsParser.prototype.checkIfDone = function() {
  if (--this.numElements === 0) {
    this.instances = this.instances.filter(function(el) {
      // eslint-disable-next-line no-eq-null, eqeqeq
      return el != null;
    });
    this.callback(this.instances, this.elements);
  }
};
