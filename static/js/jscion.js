function makeCtx(data) {
  function get(ident) { return { err: null, result: data[ident] }; }
  function getClass(dobj) { return getClassByName(dobj["class"]); }
  function getClassByName(name) { return get("class-" + name); }
  return { "get": get,
           "getClass": getClass,
           "getClassByName": getClassByName };
}

// Walk the superclasses, gathering meta info into the out dict.  For
// example, collectMeta(ctx, trollClass, "properties", out) would
// fill the out dict with {
//   "name": [actorProperty],
//   "age": [trollProperty, monsterProperty, actorProperty],
//   "pts": [trollProperty, monsterProperty]
// };
// Returns null or err.
function collectMeta(ctx, cls, metaName, out) {
  if (!cls) {
    return null;
  }
  var s = ctx.getClassByName(cls.super);
  if (s.err) {
    return s.err;
  }
  var err = collectMeta(ctx, s.result, metaName, out); // Recurse on super.
  if (err) {
    return err;
  }
  _.each(cls[metaName], function(x) {
      var arr = out[x.name] || [];
      arr.unshift(x);
      out[x.name] = arr;
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
  var err = collectMeta(ctx, c.result, "properties", properties);
  if (err) {
    return { err: err };
  }
  return { result: "<ul>" +
      _.map(properties, function(p) {
          return "<li>" + p[0].name + ":" + o.result[p[0].name] + "</li>";
        }).join("\n") + "</ul>" }
}
