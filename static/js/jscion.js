function makeCtx(data) {
  function get(ident) { return { err: null, result: data[ident] }; }
  function getClass(obj, defaultClassName) {
    return getClassByName(obj["class"] || defaultClassName);
  }
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
  return renderObj(ctx, o.result);
}

function renderObj(ctx, obj) {
  var c = ctx.getClass(obj);
  if (c.err || !c.result) {
    return { err: c.err || ("no class for obj: " + JSON.stringify(obj)) };
  }
  return renderObjWithClass(ctx, obj, c.result);
}

function renderObjWithClass(ctx, obj, cls) {
  var properties = {};
  var err = collectMeta(ctx, cls, "properties", properties);
  if (err) {
    return { err: err };
  }
  var s = _.map(properties, function(p, k) {
      // k is like "age".
      // p is like [dogAge, mammalAge, animalAge].
      var v = obj[k];
      var pc = findFirst(p, "class") || "property";
      var pt = findFirst(p, "propertyType") || "string";
      var ptc = ctx.getClassByName(pt);
      if (!ptc.err && ptc.result) {
        if (pc == "propertyArray") {
          v = _.map(v, function(vx) {
              var r = renderObjWithClass(ctx, vx, ptc.result);
              return r.err || r.result;
            }).join("<hr/>");
        } else {
          var r = renderObjWithClass(ctx, v, ptc.result);
          v = r.err || r.result;
        }
      }
      if (k == "class" && !v) {
        v = cls.name;
      }
      return "<li>" + k + ":" + v + "</li>";
    }).join("\n");
  return { result: "<ul>" + s + "</ul>" };
}

function findFirst(a, key) {
  return (_.find(a, function(x) { return _.has(x, key); }) || {})[key];
}
