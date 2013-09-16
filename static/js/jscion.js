function jsion(data) {
  var ctx = { "getObj": getObj,
              "getClass": getClass,
              "getClassByName": getClassByName,
              "getTypeByName": getTypeByName,
              "newObj": newObj,
              "classImplements": classImplements,
              "visitHierarchy": visitHierarchy,
              "flattenHierarchy": flattenHierarchy,
              "flattenProperties": flattenProperties,
              "flattenType": flattenType,
              "renderIdent": renderIdent,
              "renderObj": renderObj,
              "renderObjWithClass": renderObjWithClass };
  return _.clone(ctx);

  function getObj(ident) { return { err: null, result: data[ident] }; }
  function getClass(obj) { return getClassByName(obj.class); }
  function getClassByName(className) { return getObj("class-" + className); }
  function getTypeByName(typeName) { return getObj("type-" + typeName); }

  function newObj(className) {
    var c = getClassByName(className);
    if (c.err || !c.result) {
      return { err: c.err || ("no class for className: " + className) };
    }
    var o = {};
    var f = flattenProperties(c.result);
    if (f.err) {
      return f;
    }
    _.each(f.result, function(p, k) { o[k] = propertyDefaultValue(p); });
    return { result: o };
  }

  function propertyDefaultValue(p) {
    var v = (newObj(p.propertyKind).result ||
             (getTypeByName(p.propertyKind).result || {}).defaultValue);
    return _.clone(p.defaultValue ||
                   (p.class == "propertyArray" ? [] : (_.isUndefined(v) ? null : v)));
  }

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
    return visitHierarchy(obj, upFuncName, parentName, function(obj) {
        _.each(obj[collName], function(x) {
            out[x.name] = _.defaults(out[x.name] || {}, x);
          });
      });
  }

  function flattenProperties(cls) {
    var out = {};
    var err = flattenHierarchy(cls, "getClassByName", "super", "properties", out);
    return { err: err, result: out };
  }

  function flattenType(type) {
    var out = {};
    var err = visitHierarchy(type, "getTypeByName", "super", function(obj) {
        _.each(obj, function(v, k) {
            out[k] = _.isUndefined(out[k]) ? v : out[k];
          });
      });
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
    if (obj == null) {
      return { result: null };
    }
    var f = flattenProperties(cls);
    if (f.err || !f.result) {
      return { err: f.err || ("no properties for cls: " + JSON.stringify(cls)) };
    }
    var keys = _.sortBy(_.keys(f.result), function(k) { return f.result[k].displayOrder; });
    var s = _.map(keys, function(k) {
        var p = f.result[k];
        var v = obj[k];

        function renderValue(vx) {
          var c = getClassByName(p.propertyKind).result;
          if (c) {
            var r = renderObjWithClass(vx, (getClass(vx) || {}).result || c);
            return r.err || r.result;
          }
          var t = getTypeByName(p.propertyKind).result;
          vx = (k == "class" && !vx) ? cls.name : vx;
          var vt = (flattenType(t || {}).result || {}).viewTemplate;
          if (vt) {
            return _.template(vt, { ctx: ctx, property: p, v: vx });
          }
          return _.escape(vx);
        }

        if (p.class == "propertyArray") {
          v = _.map(v, renderValue).join("</li><li>");
          v = v ? ("<li>" + v + "</li>") : "";
          v = '<ul class="propertyArray">' + v + "</ul>";
        } else {
          v = renderValue(v);
        }
        return ("<li class=\"" + p.propertyKind + " " + k + "\">" +
                "<label>" + k + "</label><span>" + v + "</span></li>");
      }).join("\n");
    var r = '<ul class="' + classImplements(cls.name).join(" ") + '">' + s + "</ul>";
    return { result: r };
  }
}
