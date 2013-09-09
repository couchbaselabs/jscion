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

// Gather meta collection info from superclasses into the out dict,
// where subclass values override superclass values.  The metaName can
// be "properties", "methods", "validations", etc.
function collectMeta(ctx, cls, metaName, out) {
  if (!cls) {
    return null;
  }
  _.each(cls[metaName], function(x) {
      out[x.name] = _.defaults(out[x.name] || {}, x)
    });
  var s = ctx.getClassByName(cls.super);
  if (s.err) {
    return s.err;
  }
  return collectMeta(ctx, s.result, metaName, out); // Recurse on super.
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
      var v = obj[k];
      var pc = p.class || "property";
      var pt = p.propertyType || "string";
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
