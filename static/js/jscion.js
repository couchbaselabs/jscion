function jsion(data) {
  var ctx = { "getObj": getObj,
              "getClass": getClass,
              "getClassByName": getClassByName,
              "renderIdent": renderIdent,
              "renderObj": renderObj,
              "renderObjWithClass": renderObjWithClass,
              "visitHierarchy": visitHierarchy,
              "flattenHierarchy": flattenHierarchy,
              "flattenProperties": flattenProperties };
  return ctx;

  function getObj(ident) { return { err: null, result: data[ident] }; }
  function getClass(obj, defaultClassName) {
    return getClassByName(obj["class"] || defaultClassName);
  }
  function getClassByName(name) { return getObj("class-" + name); }

  function renderIdent(ident) {
    var o = getObj(ident);
    if (o.err || !o.result) {
      return { err: o.err || ("no object with ident: " + ident) };
    }
    return renderObj(o.result);
  }

  function renderObj(obj) {
    var c = getClass(obj);
    if (c.err || !c.result) {
      return { err: c.err || ("no class for obj: " + JSON.stringify(obj)) };
    }
    return renderObjWithClass(obj, c.result);
  }

  function renderObjWithClass(obj, cls) {
    var f = flattenProperties(cls);
    if (f.err || !f.result) {
      return { err: f.err || ("no properties for cls: " + JSON.stringify(cls)) };
    }
    var s = _.map(f.result, function(p, k) {
        var v = obj[k];
        var pc = p.class || "property";
        var pt = p.propertyType || "string";
        var ptc = getClassByName(pt);
        if (!ptc.err && ptc.result) {
          if (pc == "propertyArray") {
            v = _.map(v, function(vx) {
                var r = renderObjWithClass(vx, ptc.result);
                return r.err || r.result;
              }).join("<hr/>");
          } else {
            var r = renderObjWithClass(v, ptc.result);
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

  function visitHierarchy(obj, upFuncName, parentName, visitorFunc) {
    while (obj) {
      visitorFunc(obj);
      var p = ctx[upFuncName](obj[parentName]);
      if (p.err) {
        return p.err;
      }
      obj = p.result;
    }
  }

  // Flatten collections from a object hierarchy into the out dict,
  // where child values override parent values.  For classes, the
  // collName can be "properties", "methods", "validations", etc., and
  // the parentName can be "super".
  function flattenHierarchy(obj, upFuncName, parentName, collName, out) {
    visitHierarchy(obj, upFuncName, parentName, function(obj) {
      _.each(obj[collName], function(x) {
        out[x.name] = _.defaults(out[x.name] || {}, x)
      });
    });
  }

  function flattenProperties(cls) {
    var out = {}
    var err = flattenHierarchy(cls, "getClassByName", "super", "properties", out);
    return { err: err, result: out };
  }
}
