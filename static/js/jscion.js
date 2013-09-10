function jsion(data) {
  var ctx = { "getObj": getObj,
              "getClass": getClass,
              "getClassByName": getClassByName,
              "classImplements": classImplements,
              "visitHierarchy": visitHierarchy,
              "flattenHierarchy": flattenHierarchy,
              "flattenProperties": flattenProperties,
              "renderIdent": renderIdent,
              "renderObj": renderObj,
              "renderObjWithClass": renderObjWithClass };
  return _.clone(ctx);

  function getObj(ident) { return { err: null, result: data[ident] }; }
  function getClass(obj) { return getClassByName(obj.class); }
  function getClassByName(className) { return getObj("class-" + className); }

  function classImplements(className) {
    var res = []; // Returns array of className and super-classNames.
    visitHierarchy(ctx.getClassByName(className).result, "getClassByName", "super",
      function(cls) { res.push(cls.name); });
    return res; // The res[0] == className.
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
    var keys = _.sortBy(_.keys(f.result), function(k) { return f.result[k].displayOrder; });
    var s = _.map(keys, function(k) {
        var p = f.result[k];
        var v = obj[k];
        var pc = p.class || "property";
        var pt = p.propertyType || "string";
        var ptc = getClassByName(pt);
        if (!ptc.err && ptc.result) {
          if (pc == "propertyArray") {
            v = _.map(v, function(vx) {
                var r = renderObjWithClass(vx, ptc.result);
                return r.err || r.result;
              }).join("</li><li>");
            v = "<ul class=\"propertyArray\">" + (v ? ("<li>" + v + "</li>") : "") + "</ul>";
          } else {
            var r = renderObjWithClass(v, ptc.result);
            v = r.err || r.result;
          }
        } else {
          v = (k == "class" && !v) ? cls.name : v;
          var t = ((getObj("type-" + pt) || {}).result || {}).template;
          if (t) {
            v = _.template(t, {ctx: ctx, property: p, v: v});
          } else {
            v = _.escape(v);
          }
        }
        return ("<li class=\"" + pt + " " + k + "\">" +
                "<label>" + k + "</label>" +
                "<span>" + v + "</span></li>");
      }).join("\n");
    return { result: "<ul class=\"" + classImplements(cls.name).join(" ") + "\">" + s + "</ul>" };
  }
}
