function makeCtx(data) {
  function get(ident) { return { err: null, result: data[ident] }; }
  function getClass(dobj) { return getClassByName(dobj["class"]); }
  function getClassByName(name) { return get("class-" + name); }
  return { "get": get,
           "getClass": getClass,
           "getClassByName": getClassByName };
}

// Walk the superclasses, gathering properties into the out dict, with
// key of propertyName, val of array of properties, most specific
// subclassed property coming first.  For example:
// out == { "weight": [trollProperty, monsterProperty, actorProperty] };
function collectProperties(ctx, cls, out) {
  if (!cls) {
    return null;
  }
  var s = ctx.getClassByName(cls.super);
  if (s.err) {
    return s.err;
  }
  var err = collectProperties(ctx, s.result, out);
  if (err) {
    return err;
  }
  _.each(cls.properties, function(property) {
      var arr = out[property.name] || [];
      arr.unshift(property);
      out[property.name] = arr;
    });
}

function render(ctx, ident) {
  var o = ctx.get(ident);
  if (o.err || !o.result) {
    return { err: o.err || ("no object with ident: " + ident) };
  }
  var c = ctx.getClass(o.result);
  if (c.err || !c.result) {
    return { err: c.err || ("no class for obj with ident: " + ident) };
  }
  var properties = {};
  var err = collectProperties(ctx, c.result, properties);
  if (err) {
    return { err: err };
  }
  return { result: JSON.stringify(properties) + " " + JSON.stringify(o.result) };
}
