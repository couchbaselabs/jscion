// Creates a jsion ctx around the data object.
function jsion(data) {
  var ctx = { "setObj": setObj,
              "getObj": getObj,
              "getClass": getClass,
              "getClassByName": getClassByName,
              "getTypeByName": getTypeByName,
              "newObj": newObj,
              "findObj": findObj,
              "filterObjs": filterObjs,
              "classSubs": classSubs,
              "classSupers": classSupers,
              "flattenType": flattenType,
              "flattenProperties": flattenProperties,
              "flattenHierarchy": flattenHierarchy,
              "visitHierarchy": visitHierarchy };
  return _.clone(ctx);

  function setObj(ident, obj) { data[ident] = obj; return {}; }
  function getObj(ident) { return { err: null, result: data[ident] }; }
  function getClass(obj) { return getClassByName(obj.class); }
  function getClassByName(className) { return getObj("class-" + className); }
  function getTypeByName(typeName) { return getObj("type-" + typeName); }

  function findObj(fn) { return { result: _.find(data, fn) }; }
  function filterObjs(fn) { return { result: _.filter(data, fn) }; }

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

  function classSubs(className) {
    return _.pluck(_.filter(filterObjs(function(o) { return o.class == "class"; }).result,
                            function(cls) {
                              return _.find(classSupers(cls.name),
                                            function(n) { return n == className; });
                            }),
                   "name");
  }

  function classSupers(className) {
    var res = []; // Returns array of className and super-classNames.
    visitHierarchy(ctx.getClassByName(className).result, "getClassByName", "super",
      function(cls) { res.push(cls.name); });
    return res; // The res[0] == className.
  }

  function flattenType(type) {
    var out = {};
    var err = visitHierarchy(type, "getTypeByName", "super", function(obj) {
        _.each(obj, function(v, k) { out[k] = _.isUndefined(out[k]) ? v : out[k]; });
      });
    return { err: err, result: out };
  }

  function flattenProperties(cls) {
    var out = {};
    var err = flattenHierarchy(cls, "getClassByName", "super", "properties", out);
    return { err: err, result: out };
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
}
